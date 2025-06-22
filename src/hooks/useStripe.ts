import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export interface StripeResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  popular?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last_four: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  hosted_invoice_url: string;
  invoice_pdf: string;
}

export interface BillingSummary {
  subscription_status: string;
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  next_invoice_amount: number;
  payment_method_last_four: string;
  payment_method_brand: string;
}

export interface PremiumTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  stripe_price_id: string;
  preview_url: string;
  thumbnail_url: string;
  features: string[];
  tags: string[];
  has_access?: boolean;
}

export const useStripe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppStore();

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        '1 website',
        'Basic templates',
        'Subdomain hosting',
        '5GB storage',
        'Community support'
      ],
      stripePriceId: ''
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 12,
      interval: 'month',
      features: [
        'Unlimited websites',
        'Premium templates',
        'Custom domains',
        '100GB storage',
        'Priority support',
        'Advanced analytics',
        'Team collaboration'
      ],
      stripePriceId: 'price_pro_monthly', // Update with actual Stripe price ID
      popular: true
    },
    {
      id: 'pro_yearly',
      name: 'Pro',
      price: 120,
      interval: 'year',
      features: [
        'Unlimited websites',
        'Premium templates',
        'Custom domains',
        '100GB storage',
        'Priority support',
        'Advanced analytics',
        'Team collaboration',
        '2 months free!'
      ],
      stripePriceId: 'price_pro_yearly' // Update with actual Stripe price ID
    },
    {
      id: 'business',
      name: 'Business',
      price: 39,
      interval: 'month',
      features: [
        'Everything in Pro',
        'White-label solution',
        'Advanced integrations',
        '500GB storage',
        '24/7 phone support',
        'Custom templates',
        'API access'
      ],
      stripePriceId: 'price_business_monthly' // Update with actual Stripe price ID
    },
    {
      id: 'business_yearly',
      name: 'Business',
      price: 390,
      interval: 'year',
      features: [
        'Everything in Pro',
        'White-label solution',
        'Advanced integrations',
        '500GB storage',
        '24/7 phone support',
        'Custom templates',
        'API access',
        '2 months free!'
      ],
      stripePriceId: 'price_business_yearly' // Update with actual Stripe price ID
    }
  ];

  const createCheckoutSession = async (priceId: string, successUrl?: string, cancelUrl?: string): Promise<StripeResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl: successUrl || `${window.location.origin}/profile?success=true`,
          cancelUrl: cancelUrl || `${window.location.origin}/profile?canceled=true`,
          userId: user.id,
          userEmail: user.email
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.url) {
        window.location.href = data.url;
        return { success: true, data: { url: data.url } };
      }

      throw new Error('No checkout URL returned');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const createPortalSession = async (): Promise<StripeResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('create-portal-session', {
        body: {
          userId: user.id,
          returnUrl: `${window.location.origin}/profile`
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.url) {
        window.location.href = data.url;
        return { success: true, data: { url: data.url } };
      }

      throw new Error('No portal URL returned');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create portal session';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getBillingSummary = async (): Promise<BillingSummary | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_user_billing_summary', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error fetching billing summary:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (err) {
      console.error('Error in getBillingSummary:', err);
      return null;
    }
  };

  const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getPaymentMethods:', err);
      return [];
    }
  };

  const getInvoices = async (): Promise<Invoice[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getInvoices:', err);
      return [];
    }
  };

  const getPremiumTemplates = async (): Promise<PremiumTemplate[]> => {
    try {
      const { data, error } = await supabase
        .from('premium_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching premium templates:', error);
        return [];
      }

      // Check access for each template if user is logged in
      if (user && data) {
        const templatesWithAccess = await Promise.all(
          data.map(async (template) => {
            const { data: hasAccess } = await supabase.rpc('user_has_template_access', {
              user_uuid: user.id,
              template_uuid: template.id
            });
            
            return {
              ...template,
              has_access: hasAccess || false
            };
          })
        );
        
        return templatesWithAccess;
      }

      return data || [];
    } catch (err) {
      console.error('Error in getPremiumTemplates:', err);
      return [];
    }
  };

  const purchaseTemplate = async (templateId: string): Promise<StripeResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('purchase-template', {
        body: {
          templateId,
          userId: user.id,
          successUrl: `${window.location.origin}/templates?purchase=success`,
          cancelUrl: `${window.location.origin}/templates?purchase=canceled`
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.url) {
        window.location.href = data.url;
        return { success: true, data: { url: data.url } };
      }

      throw new Error('No checkout URL returned');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase template';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const checkTemplateAccess = async (templateId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('user_has_template_access', {
        user_uuid: user.id,
        template_uuid: templateId
      });

      if (error) {
        console.error('Error checking template access:', error);
        return false;
      }

      return data || false;
    } catch (err) {
      console.error('Error in checkTemplateAccess:', err);
      return false;
    }
  };

  const getUserUsage = async (feature: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_user_usage', {
        user_uuid: user.id,
        feature_name: feature
      });

      if (error) {
        console.error('Error fetching user usage:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (err) {
      console.error('Error in getUserUsage:', err);
      return null;
    }
  };

  const cancelSubscription = async (): Promise<StripeResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('cancel-subscription', {
        body: { userId: user.id }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const reactivateSubscription = async (): Promise<StripeResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('reactivate-subscription', {
        body: { userId: user.id }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reactivate subscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    plans,
    createCheckoutSession,
    createPortalSession,
    getBillingSummary,
    getPaymentMethods,
    getInvoices,
    getPremiumTemplates,
    purchaseTemplate,
    checkTemplateAccess,
    getUserUsage,
    cancelSubscription,
    reactivateSubscription
  };
};