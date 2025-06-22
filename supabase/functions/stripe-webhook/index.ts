import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  console.log('Received event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        await handleInvoiceChange(event.data.object as Stripe.Invoice)
        break
      
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod)
        break
      
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }

  return new Response('Webhook processed successfully', { status: 200 })
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  if (!userId) return

  if (session.mode === 'subscription') {
    // Handle subscription creation
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    await handleSubscriptionChange(subscription)
  } else if (session.mode === 'payment' && session.metadata?.type === 'template_purchase') {
    // Handle template purchase
    const templateId = session.metadata.template_id
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
    
    await supabaseClient
      .from('template_purchases')
      .insert({
        user_id: userId,
        template_id: templateId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_paid: paymentIntent.amount,
        currency: paymentIntent.currency,
      })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) return

  const planId = getPlanIdFromPriceId(subscription.items.data[0]?.price.id)
  
  await supabaseClient
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status as any,
      plan_id: planId,
      price_id: subscription.items.data[0]?.price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })

  // Update user's plan in profiles table
  await supabaseClient
    .from('profiles')
    .update({ plan: planId as any })
    .eq('id', userId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) return

  await supabaseClient
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  // Downgrade user to free plan
  await supabaseClient
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', userId)
}

async function handleInvoiceChange(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  // Get user ID from subscription
  const { data: subscription } = await supabaseClient
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!subscription) return

  await supabaseClient
    .from('invoices')
    .upsert({
      user_id: subscription.user_id,
      subscription_id: invoice.subscription ? 
        (await supabaseClient
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', invoice.subscription)
          .single()
        ).data?.id : null,
      stripe_invoice_id: invoice.id,
      stripe_customer_id: customerId,
      status: invoice.status as any,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      description: invoice.description,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      paid_at: invoice.status_transitions.paid_at ? 
        new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
    })
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string
  
  // Get user ID from customer
  const { data: subscription } = await supabaseClient
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!subscription) return

  // Check if this should be the default payment method
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const isDefault = customer.invoice_settings.default_payment_method === paymentMethod.id

  await supabaseClient
    .from('payment_methods')
    .upsert({
      user_id: subscription.user_id,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type as any,
      is_default: isDefault,
      last_four: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
      billing_details: paymentMethod.billing_details,
    })
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  await supabaseClient
    .from('payment_methods')
    .delete()
    .eq('stripe_payment_method_id', paymentMethod.id)
}

function getPlanIdFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    'price_pro_monthly': 'pro',
    'price_business_monthly': 'business',
    'price_pro_yearly': 'pro',
    'price_business_yearly': 'business',
  }
  
  return priceMap[priceId] || 'free'
}