# 🚀 Complete Setup Guide

This guide will walk you through setting up the NCBX Website Builder from scratch.

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Stripe account (for payment features)
- Git installed
- Code editor (VS Code recommended)

## 🔧 Step-by-Step Setup

### 1. Project Setup

```bash
# Clone the repository
git clone <your-repository-url>
cd ncbx-website-builder

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Supabase Configuration

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be created (2-3 minutes)

#### Get Project Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon public** key
4. Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

#### Run Migration
1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Copy the contents of each migration file in `supabase/migrations/` (in order)
4. Paste into the SQL editor
5. Click **Run** to execute

#### Verify Tables Created
Check that these tables exist:
- `profiles`
- `websites`
- `website_versions`
- `website_collaborators`
- `subscriptions`
- `premium_templates`
- `template_purchases`
- `website_analytics`

### 4. Stripe Integration

#### Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and sign up
2. Switch to test mode for development

#### Configure Stripe Products
1. Follow the instructions in `README_STRIPE_SETUP.md`
2. Create subscription plans and premium templates
3. Get your Stripe publishable key
4. Update your `.env` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

#### Set Up Webhooks
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://your-project-id.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Get the webhook signing secret
5. Add it to your Supabase Edge Function environment variables

### 5. Supabase Edge Functions

#### Deploy Edge Functions
1. Install Supabase CLI
2. Login to Supabase CLI
3. Link your project
4. Deploy functions:

```bash
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy purchase-template
supabase functions deploy deploy-website
```

#### Set Environment Variables
In Supabase Dashboard:
1. Go to **Settings** → **API**
2. Scroll to **Edge Functions**
3. Add environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### 6. Authentication Setup

#### Enable Email Authentication
1. Go to **Authentication** → **Settings**
2. Configure **Site URL** to `http://localhost:5173` (for development)
3. Choose whether to enable email confirmations

#### Setup Google OAuth (Optional)

**Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set application type to **Web application**
6. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for development)

**Supabase Configuration:**
1. Go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Enter your Google **Client ID** and **Client Secret**
4. Save configuration

### 7. Development Server

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### 8. Production Deployment

#### Environment Setup
```env
# Production environment variables
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=your-production-stripe-key
VITE_APP_URL=https://your-production-domain.com
VITE_DEFAULT_DOMAIN=ncbx.app
```

#### Build and Deploy
```bash
# Build for production
npm run build

# Deploy to your hosting provider
# (Netlify, Vercel, etc.)
```

### 9. Post-Deployment Tasks

1. Update Site URL in Supabase Authentication settings
2. Update Google OAuth redirect URLs (if using)
3. Update Stripe webhook endpoints to production URLs
4. Test the complete user flow in production

## 🔍 Troubleshooting

### Common Issues

#### "Supabase request failed"
- Check your `.env` file has correct URL and key
- Restart development server after changing `.env`
- Verify Supabase project is active

#### "Permission denied for table"
- Ensure migration was run successfully
- Check RLS policies are created
- Verify user is authenticated

#### Google OAuth not working
- Check redirect URLs match exactly
- Ensure Google OAuth is enabled in Supabase
- Verify Google Cloud Console configuration

#### Stripe integration issues
- Verify Stripe keys are correct
- Check webhook configuration
- Ensure products and prices are set up correctly

### Verification Checklist

- [ ] Environment variables set correctly
- [ ] Database migration completed
- [ ] Tables created with proper structure
- [ ] RLS policies enabled
- [ ] Email authentication working
- [ ] Google OAuth configured (optional)
- [ ] Stripe integration working
- [ ] Edge functions deployed
- [ ] Development server running
- [ ] Can create user account
- [ ] Can create website
- [ ] Can publish website
- [ ] Can process payments

## 📞 Need Help?

If you encounter issues:

1. **Check the console** for error messages
2. **Review this guide** step by step
3. **Check Supabase logs** in the dashboard
4. **Verify environment variables** are correct
5. **Test database connection** manually

### Support Resources
- **Documentation**: See `DOCUMENTATION.md`
- **GitHub Issues**: Report bugs and issues
- **Community**: Join our Discord/Slack
- **Email**: technical-support@ncbx.com

---

*Setup complete! You now have a fully functional website builder.* 🎉