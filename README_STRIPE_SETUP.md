# Stripe Integration Setup Guide

## 🚀 Quick Setup

### 1. Create Stripe Products

Run the product creation script to set up all subscription plans and premium templates:

```bash
cd scripts
node create-stripe-products.js
```

This will create:
- **Pro Plan**: $12/month or $120/year (2 months free)
- **Business Plan**: $39/month or $390/year (2 months free)
- **Premium Templates**: $14.99 - $29.99 each

### 2. Update Database

After running the script, you'll get the actual Stripe price IDs. Update your database:

1. Copy the price IDs from the script output
2. Update the `update-database-prices.sql` file with the actual IDs
3. Run the SQL in your Supabase SQL Editor

### 3. Update Application Code

Update the `stripePriceId` values in `src/hooks/useStripe.ts` with the actual price IDs from Stripe.

### 4. Configure Webhooks

Set up a webhook endpoint in your Stripe dashboard:
- **URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- **Events**: Select all subscription and invoice events
- **Secret**: Copy the webhook secret to your environment variables

## 📋 Products Created

### Subscription Plans

| Plan | Monthly | Yearly | Features |
|------|---------|--------|----------|
| Pro | $12/month | $120/year | Unlimited websites, premium templates, custom domains |
| Business | $39/month | $390/year | Everything in Pro + white-label, API access, 24/7 support |

### Premium Templates

| Template | Price | Category |
|----------|-------|----------|
| E-commerce Pro Max | $29.99 | E-commerce |
| Creative Agency Premium | $19.99 | Creative |
| SaaS Landing Pro | $24.99 | Business |
| Restaurant Deluxe Pro | $17.99 | Restaurant |
| Portfolio Master | $14.99 | Portfolio |

## 🔧 Features Implemented

### ✅ Subscription Management
- Monthly and yearly billing cycles
- Automatic plan upgrades/downgrades
- Proration handling
- Subscription cancellation and reactivation
- Free trial support

### ✅ Premium Templates
- Individual template purchases
- Plan-based access (Pro/Business get all templates)
- Template access verification
- Purchase history tracking

### ✅ Billing Dashboard
- Current subscription status
- Payment method management
- Invoice history with PDF downloads
- Usage tracking and limits
- Billing portal integration

### ✅ Payment Processing
- Secure Stripe Checkout
- Multiple payment methods
- Automatic invoice generation
- Failed payment handling
- Dunning management

### ✅ Webhooks & Automation
- Real-time subscription updates
- Automatic plan changes
- Payment confirmation
- Template access provisioning
- User plan synchronization

## 🎯 User Flow

### Subscription Flow
1. User selects a plan (Pro/Business)
2. Redirected to Stripe Checkout
3. Payment processed securely
4. Webhook updates user's plan
5. User gains access to premium features

### Template Purchase Flow
1. User browses premium templates
2. Clicks "Purchase" on desired template
3. Redirected to Stripe Checkout
4. Payment processed
5. Template access granted immediately
6. User can create websites with purchased template

### Billing Management
1. User accesses billing tab in profile
2. Views current subscription and usage
3. Can upgrade/downgrade plans
4. Manage payment methods
5. Download invoices
6. Cancel or reactivate subscription

## 🔒 Security Features

- Row Level Security (RLS) on all billing tables
- Webhook signature verification
- Secure customer data handling
- PCI compliance through Stripe
- Encrypted payment method storage

## 📊 Analytics & Reporting

- Subscription metrics tracking
- Revenue analytics
- Template purchase analytics
- User engagement metrics
- Churn analysis capabilities

## 🚨 Error Handling

- Graceful payment failures
- Subscription status monitoring
- Automatic retry logic
- User-friendly error messages
- Admin notification system

## 🧪 Testing

Use Stripe's test mode with test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## 📞 Support

For billing issues:
1. Users can access Stripe's billing portal
2. Download invoices and receipts
3. Update payment methods
4. View transaction history
5. Contact support through the dashboard

---

Your Stripe integration is now fully functional with subscription management, premium template purchases, and comprehensive billing features! 🎉