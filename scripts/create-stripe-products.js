const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe('sk_test_51•••••diI', {
  apiVersion: '2023-10-16',
});

async function createStripeProducts() {
  try {
    console.log('Creating Stripe products and prices...\n');

    // 1. Create Pro Plan Product
    const proProduct = await stripe.products.create({
      name: 'NCBX Pro Plan',
      description: 'Perfect for creators and small businesses. Unlimited websites, premium templates, and priority support.',
      metadata: {
        plan_id: 'pro',
        features: JSON.stringify([
          'Unlimited websites',
          'Premium templates',
          'Custom domains',
          '100GB storage',
          'Priority support',
          'Advanced analytics',
          'Team collaboration'
        ])
      }
    });

    console.log('✅ Created Pro Product:', proProduct.id);

    // Create Pro Monthly Price
    const proMonthlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1200, // $12.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'pro',
        interval: 'monthly'
      }
    });

    console.log('✅ Created Pro Monthly Price:', proMonthlyPrice.id);

    // Create Pro Yearly Price (with discount)
    const proYearlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 12000, // $120.00 in cents (2 months free)
      currency: 'usd',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan_id: 'pro',
        interval: 'yearly'
      }
    });

    console.log('✅ Created Pro Yearly Price:', proYearlyPrice.id);

    // 2. Create Business Plan Product
    const businessProduct = await stripe.products.create({
      name: 'NCBX Business Plan',
      description: 'For growing businesses. Everything in Pro plus white-label solution, advanced integrations, and 24/7 support.',
      metadata: {
        plan_id: 'business',
        features: JSON.stringify([
          'Everything in Pro',
          'White-label solution',
          'Advanced integrations',
          '500GB storage',
          '24/7 phone support',
          'Custom templates',
          'API access'
        ])
      }
    });

    console.log('✅ Created Business Product:', businessProduct.id);

    // Create Business Monthly Price
    const businessMonthlyPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 3900, // $39.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_id: 'business',
        interval: 'monthly'
      }
    });

    console.log('✅ Created Business Monthly Price:', businessMonthlyPrice.id);

    // Create Business Yearly Price (with discount)
    const businessYearlyPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 39000, // $390.00 in cents (2 months free)
      currency: 'usd',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan_id: 'business',
        interval: 'yearly'
      }
    });

    console.log('✅ Created Business Yearly Price:', businessYearlyPrice.id);

    // 3. Create Premium Template Products
    console.log('\n📋 Creating Premium Template Products...\n');

    // E-commerce Pro Max Template
    const ecommerceTemplate = await stripe.products.create({
      name: 'E-commerce Pro Max Template',
      description: 'Advanced e-commerce template with cart, checkout, and inventory management',
      type: 'good',
      metadata: {
        template_id: 'ecommerce_pro_max',
        category: 'ecommerce'
      }
    });

    const ecommercePrice = await stripe.prices.create({
      product: ecommerceTemplate.id,
      unit_amount: 2999, // $29.99
      currency: 'usd'
    });

    console.log('✅ Created E-commerce Template:', ecommerceTemplate.id, '- Price:', ecommercePrice.id);

    // Creative Agency Premium Template
    const creativeTemplate = await stripe.products.create({
      name: 'Creative Agency Premium Template',
      description: 'Stunning agency template with advanced animations and portfolio showcase',
      type: 'good',
      metadata: {
        template_id: 'creative_agency_premium',
        category: 'creative'
      }
    });

    const creativePrice = await stripe.prices.create({
      product: creativeTemplate.id,
      unit_amount: 1999, // $19.99
      currency: 'usd'
    });

    console.log('✅ Created Creative Agency Template:', creativeTemplate.id, '- Price:', creativePrice.id);

    // SaaS Landing Pro Template
    const saasTemplate = await stripe.products.create({
      name: 'SaaS Landing Pro Template',
      description: 'High-converting SaaS landing page with A/B testing and analytics',
      type: 'good',
      metadata: {
        template_id: 'saas_landing_pro',
        category: 'business'
      }
    });

    const saasPrice = await stripe.prices.create({
      product: saasTemplate.id,
      unit_amount: 2499, // $24.99
      currency: 'usd'
    });

    console.log('✅ Created SaaS Landing Template:', saasTemplate.id, '- Price:', saasPrice.id);

    // Restaurant Deluxe Pro Template
    const restaurantTemplate = await stripe.products.create({
      name: 'Restaurant Deluxe Pro Template',
      description: 'Premium restaurant template with reservation system and menu management',
      type: 'good',
      metadata: {
        template_id: 'restaurant_deluxe_pro',
        category: 'restaurant'
      }
    });

    const restaurantPrice = await stripe.prices.create({
      product: restaurantTemplate.id,
      unit_amount: 1799, // $17.99
      currency: 'usd'
    });

    console.log('✅ Created Restaurant Template:', restaurantTemplate.id, '- Price:', restaurantPrice.id);

    // Portfolio Master Template
    const portfolioTemplate = await stripe.products.create({
      name: 'Portfolio Master Template',
      description: 'Professional portfolio template for designers and artists',
      type: 'good',
      metadata: {
        template_id: 'portfolio_master',
        category: 'portfolio'
      }
    });

    const portfolioPrice = await stripe.prices.create({
      product: portfolioTemplate.id,
      unit_amount: 1499, // $14.99
      currency: 'usd'
    });

    console.log('✅ Created Portfolio Template:', portfolioTemplate.id, '- Price:', portfolioPrice.id);

    // Summary
    console.log('\n🎉 All Stripe products and prices created successfully!\n');
    console.log('📋 SUMMARY:');
    console.log('='.repeat(50));
    console.log('SUBSCRIPTION PLANS:');
    console.log(`Pro Monthly: ${proMonthlyPrice.id} ($12/month)`);
    console.log(`Pro Yearly: ${proYearlyPrice.id} ($120/year)`);
    console.log(`Business Monthly: ${businessMonthlyPrice.id} ($39/month)`);
    console.log(`Business Yearly: ${businessYearlyPrice.id} ($390/year)`);
    console.log('\nPREMIUM TEMPLATES:');
    console.log(`E-commerce Pro Max: ${ecommercePrice.id} ($29.99)`);
    console.log(`Creative Agency Premium: ${creativePrice.id} ($19.99)`);
    console.log(`SaaS Landing Pro: ${saasPrice.id} ($24.99)`);
    console.log(`Restaurant Deluxe Pro: ${restaurantPrice.id} ($17.99)`);
    console.log(`Portfolio Master: ${portfolioPrice.id} ($14.99)`);
    console.log('='.repeat(50));
    console.log('\n💡 Next Steps:');
    console.log('1. Update your database with the correct Stripe price IDs');
    console.log('2. Update your application code to use these price IDs');
    console.log('3. Test the checkout flow with these products');
    console.log('4. Set up webhooks to handle subscription events');

  } catch (error) {
    console.error('❌ Error creating Stripe products:', error.message);
    process.exit(1);
  }
}

// Run the script
createStripeProducts();