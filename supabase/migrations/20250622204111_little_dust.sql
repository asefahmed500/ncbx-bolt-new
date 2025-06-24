/*
  # Stripe Billing and Subscription System

  1. New Tables
    - `subscriptions` - User subscription data
    - `payment_methods` - Stored payment methods
    - `invoices` - Invoice history
    - `usage_tracking` - Feature usage monitoring
    - `premium_templates` - Premium template definitions
    - `template_purchases` - One-time template purchases

  2. Security
    - Enable RLS on all new tables
    - Add policies for user data access/*
  # Stripe Billing and Subscription System

  1. New Tables
    - `subscriptions` - User subscription data
    - `payment_methods` - Stored payment methods
    - `invoices` - Invoice history
    - `usage_tracking` - Feature usage monitoring
    - `premium_templates` - Premium template definitions
    - `template_purchases` - One-time template purchases

  2. Security
    - Enable RLS on all new tables
    - Add policies for user data access
    - Secure functions for billing operations

  3. Features
    - Subscription management
    - Payment method storage
    - Invoice tracking
    - Usage limits enforcement
    - Premium template access control
*/

-- Create enums if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM (
      'active',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'past_due',
      'trialing',
      'unpaid'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
    CREATE TYPE payment_method_type AS ENUM (
      'card',
      'bank_account',
      'paypal'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM (
      'draft',
      'open',
      'paid',
      'uncollectible',
      'void'
    );
  END IF;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status subscription_status NOT NULL DEFAULT 'incomplete',
  plan_id text NOT NULL, -- 'free', 'pro', 'business'
  price_id text, -- Stripe price ID
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type payment_method_type NOT NULL,
  is_default boolean DEFAULT false,
  last_four text,
  brand text,
  exp_month integer,
  exp_year integer,
  billing_details jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status invoice_status NOT NULL,
  amount_due integer NOT NULL, -- in cents
  amount_paid integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  description text,
  invoice_pdf text, -- URL to PDF
  hosted_invoice_url text, -- Stripe hosted page
  due_date timestamptz,
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feature text NOT NULL, -- 'websites', 'storage', 'bandwidth', etc.
  usage_count integer NOT NULL DEFAULT 0,
  limit_count integer, -- NULL for unlimited
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature, period_start)
);

-- Create premium templates table
CREATE TABLE IF NOT EXISTS premium_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price integer NOT NULL, -- in cents
  currency text NOT NULL DEFAULT 'usd',
  stripe_price_id text UNIQUE NOT NULL,
  preview_url text,
  thumbnail_url text,
  features text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template purchases table
CREATE TABLE IF NOT EXISTS template_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES premium_templates(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  amount_paid integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  purchased_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, template_id)
);

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
  
  CREATE POLICY "Users can read own subscriptions"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    TO service_role
    USING (true);
END $$;

-- Create RLS policies for payment methods
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own payment methods" ON payment_methods;
  DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;
  DROP POLICY IF EXISTS "Service role can manage payment methods" ON payment_methods;
  
  CREATE POLICY "Users can read own payment methods"
    ON payment_methods FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete own payment methods"
    ON payment_methods FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Service role can manage payment methods"
    ON payment_methods FOR ALL
    TO service_role
    USING (true);
END $$;

-- Create RLS policies for invoices
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own invoices" ON invoices;
  DROP POLICY IF EXISTS "Service role can manage invoices" ON invoices;
  
  CREATE POLICY "Users can read own invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Service role can manage invoices"
    ON invoices FOR ALL
    TO service_role
    USING (true);
END $$;

-- Create RLS policies for usage tracking
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own usage" ON usage_tracking;
  DROP POLICY IF EXISTS "Service role can manage usage" ON usage_tracking;
  
  CREATE POLICY "Users can read own usage"
    ON usage_tracking FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Service role can manage usage"
    ON usage_tracking FOR ALL
    TO service_role
    USING (true);
END $$;

-- Create RLS policies for premium templates
DO $$
BEGIN
  DROP POLICY IF EXISTS "Everyone can read active premium templates" ON premium_templates;
  DROP POLICY IF EXISTS "Service role can manage premium templates" ON premium_templates;
  
  CREATE POLICY "Everyone can read active premium templates"
    ON premium_templates FOR SELECT
    TO authenticated
    USING (is_active = true);

  CREATE POLICY "Service role can manage premium templates"
    ON premium_templates FOR ALL
    TO service_role
    USING (true);
END $$;

-- Create RLS policies for template purchases
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own template purchases" ON template_purchases;
  DROP POLICY IF EXISTS "Users can create template purchases" ON template_purchases;
  DROP POLICY IF EXISTS "Service role can manage template purchases" ON template_purchases;
  
  CREATE POLICY "Users can read own template purchases"
    ON template_purchases FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create template purchases"
    ON template_purchases FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Service role can manage template purchases"
    ON template_purchases FOR ALL
    TO service_role
    USING (true);
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_current_period_end_idx ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS payment_methods_is_default_idx ON payment_methods(user_id, is_default);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_subscription_id_idx ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON invoices(due_date);

CREATE INDEX IF NOT EXISTS usage_tracking_user_id_idx ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS usage_tracking_feature_idx ON usage_tracking(user_id, feature);
CREATE INDEX IF NOT EXISTS usage_tracking_period_idx ON usage_tracking(period_start, period_end);

CREATE INDEX IF NOT EXISTS premium_templates_category_idx ON premium_templates(category);
CREATE INDEX IF NOT EXISTS premium_templates_is_active_idx ON premium_templates(is_active);

CREATE INDEX IF NOT EXISTS template_purchases_user_id_idx ON template_purchases(user_id);
CREATE INDEX IF NOT EXISTS template_purchases_template_id_idx ON template_purchases(template_id);

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
    CREATE TRIGGER update_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_methods_updated_at') THEN
    CREATE TRIGGER update_payment_methods_updated_at
      BEFORE UPDATE ON payment_methods
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
    CREATE TRIGGER update_invoices_updated_at
      BEFORE UPDATE ON invoices
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usage_tracking_updated_at') THEN
    CREATE TRIGGER update_usage_tracking_updated_at
      BEFORE UPDATE ON usage_tracking
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_premium_templates_updated_at') THEN
    CREATE TRIGGER update_premium_templates_updated_at
      BEFORE UPDATE ON premium_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create or replace functions with proper existence checks
CREATE OR REPLACE FUNCTION user_has_template_access(user_uuid uuid, template_uuid uuid)
RETURNS boolean AS $$
DECLARE
  user_plan text;
  template_price integer;
  has_purchased boolean;
BEGIN
  -- Get user's current plan
  SELECT plan INTO user_plan
  FROM profiles
  WHERE id = user_uuid;
  
  -- Get template price
  SELECT price INTO template_price
  FROM premium_templates
  WHERE id = template_uuid AND is_active = true;
  
  -- If template not found or free, allow access
  IF template_price IS NULL OR template_price = 0 THEN
    RETURN true;
  END IF;
  
  -- Pro and Business plans have access to all premium templates
  IF user_plan IN ('pro', 'business') THEN
    RETURN true;
  END IF;
  
  -- Check if user has purchased this specific template
  SELECT EXISTS(
    SELECT 1 FROM template_purchases
    WHERE user_id = user_uuid AND template_id = template_uuid
  ) INTO has_purchased;
  
  RETURN has_purchased;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_usage(user_uuid uuid, feature_name text)
RETURNS TABLE (
  current_usage integer,
  usage_limit integer,
  period_start timestamptz,
  period_end timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ut.usage_count,
    ut.limit_count,
    ut.period_start,
    ut.period_end
  FROM usage_tracking ut
  WHERE ut.user_id = user_uuid 
    AND ut.feature = feature_name
    AND ut.period_start <= now()
    AND ut.period_end > now()
  ORDER BY ut.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_usage(
  user_uuid uuid, 
  feature_name text, 
  increment_by integer DEFAULT 1
)
RETURNS boolean AS $$
DECLARE
  current_period_start timestamptz;
  current_period_end timestamptz;
  current_usage integer;
  usage_limit integer;
BEGIN
  -- Calculate current billing period (monthly)
  current_period_start := date_trunc('month', now());
  current_period_end := current_period_start + interval '1 month';
  
  -- Get or create usage record
  INSERT INTO usage_tracking (user_id, feature, usage_count, period_start, period_end)
  VALUES (user_uuid, feature_name, increment_by, current_period_start, current_period_end)
  ON CONFLICT (user_id, feature, period_start)
  DO UPDATE SET 
    usage_count = usage_tracking.usage_count + increment_by,
    updated_at = now()
  RETURNING usage_tracking.usage_count, usage_tracking.limit_count 
  INTO current_usage, usage_limit;
  
  -- Check if usage exceeds limit
  IF usage_limit IS NOT NULL AND current_usage > usage_limit THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_billing_summary(user_uuid uuid)
RETURNS TABLE (
  subscription_status subscription_status,
  plan_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  next_invoice_amount integer,
  payment_method_last_four text,
  payment_method_brand text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.status,
    s.plan_id,
    s.current_period_end,
    s.cancel_at_period_end,
    COALESCE(i.amount_due, 0) as next_invoice_amount,
    pm.last_four,
    pm.brand
  FROM subscriptions s
  LEFT JOIN invoices i ON s.id = i.subscription_id 
    AND i.status = 'open' 
    AND i.due_date > now()
  LEFT JOIN payment_methods pm ON pm.user_id = s.user_id 
    AND pm.is_default = true
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing', 'past_due')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default premium templates only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM premium_templates WHERE stripe_price_id = 'price_ecommerce_pro_max') THEN
    INSERT INTO premium_templates (name, description, category, price, stripe_price_id, preview_url, thumbnail_url, features, tags) VALUES
    ('E-commerce Pro Max', 'Advanced e-commerce template with cart, checkout, and inventory management', 'ecommerce', 2999, 'price_ecommerce_pro_max', 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['Advanced cart system', 'Inventory management', 'Payment integration', 'Order tracking'], ARRAY['ecommerce', 'premium', 'advanced']);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM premium_templates WHERE stripe_price_id = 'price_creative_agency_premium') THEN
    INSERT INTO premium_templates (name, description, category, price, stripe_price_id, preview_url, thumbnail_url, features, tags) VALUES
    ('Creative Agency Premium', 'Stunning agency template with advanced animations and portfolio showcase', 'creative', 1999, 'price_creative_agency_premium', 'https://images.pexels.com/photos/196667/pexels-photo-196667.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/196667/pexels-photo-196667.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['Advanced animations', 'Portfolio showcase', 'Team management', 'Case studies'], ARRAY['agency', 'creative', 'premium']);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM premium_templates WHERE stripe_price_id = 'price_saas_landing_pro') THEN
    INSERT INTO premium_templates (name, description, category, price, stripe_price_id, preview_url, thumbnail_url, features, tags) VALUES
    ('SaaS Landing Pro', 'High-converting SaaS landing page with A/B testing and analytics', 'business', 2499, 'price_saas_landing_pro', 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['A/B testing', 'Analytics integration', 'Conversion optimization', 'Lead capture'], ARRAY['saas', 'landing', 'premium']);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM premium_templates WHERE stripe_price_id = 'price_restaurant_deluxe_pro') THEN
    INSERT INTO premium_templates (name, description, category, price, stripe_price_id, preview_url, thumbnail_url, features, tags) VALUES
    ('Restaurant Deluxe Pro', 'Premium restaurant template with reservation system and menu management', 'restaurant', 1799, 'price_restaurant_deluxe_pro', 'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['Reservation system', 'Menu management', 'Online ordering', 'Table booking'], ARRAY['restaurant', 'premium', 'booking']);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM premium_templates WHERE stripe_price_id = 'price_portfolio_master') THEN
    INSERT INTO premium_templates (name, description, category, price, stripe_price_id, preview_url, thumbnail_url, features, tags) VALUES
    ('Portfolio Master', 'Professional portfolio template for designers and artists', 'portfolio', 1499, 'price_portfolio_master', 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['Gallery management', 'Client testimonials', 'Contact forms', 'Social integration'], ARRAY['portfolio', 'creative', 'premium']);
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;
GRANT SELECT ON invoices TO authenticated;
GRANT SELECT ON usage_tracking TO authenticated;
GRANT SELECT ON premium_templates TO authenticated;
GRANT SELECT, INSERT ON template_purchases TO authenticated;

GRANT EXECUTE ON FUNCTION user_has_template_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_billing_summary(uuid) TO authenticated;
    - Secure functions for billing operations

  3. Features
    - Subscription management
    - Payment method storage
    - Invoice tracking
    - Usage limits enforcement
    - Premium template access control
*/

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'trialing',
  'unpaid'
);

-- Create payment method type enum
CREATE TYPE payment_method_type AS ENUM (
  'card',
  'bank_account',
  'paypal'
);

-- Create invoice status enum
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'open',
  'paid',
  'uncollectible',
  'void'
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status subscription_status NOT NULL DEFAULT 'incomplete',
  plan_id text NOT NULL, -- 'free', 'pro', 'business'
  price_id text, -- Stripe price ID
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type payment_method_type NOT NULL,
  is_default boolean DEFAULT false,
  last_four text,
  brand text,
  exp_month integer,
  exp_year integer,
  billing_details jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status invoice_status NOT NULL,
  amount_due integer NOT NULL, -- in cents
  amount_paid integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  description text,
  invoice_pdf text, -- URL to PDF
  hosted_invoice_url text, -- Stripe hosted page
  due_date timestamptz,
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feature text NOT NULL, -- 'websites', 'storage', 'bandwidth', etc.
  usage_count integer NOT NULL DEFAULT 0,
  limit_count integer, -- NULL for unlimited
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature, period_start)
);

-- Create premium templates table
CREATE TABLE IF NOT EXISTS premium_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price integer NOT NULL, -- in cents
  currency text NOT NULL DEFAULT 'usd',
  stripe_price_id text UNIQUE NOT NULL,
  preview_url text,
  thumbnail_url text,
  features text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template purchases table
CREATE TABLE IF NOT EXISTS template_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES premium_templates(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  amount_paid integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  purchased_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, template_id)
);

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for payment methods
CREATE POLICY "Users can read own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment methods"
  ON payment_methods FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for invoices
CREATE POLICY "Users can read own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage invoices"
  ON invoices FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for usage tracking
CREATE POLICY "Users can read own usage"
  ON usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for premium templates
CREATE POLICY "Everyone can read active premium templates"
  ON premium_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can manage premium templates"
  ON premium_templates FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for template purchases
CREATE POLICY "Users can read own template purchases"
  ON template_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create template purchases"
  ON template_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage template purchases"
  ON template_purchases FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX subscriptions_current_period_end_idx ON subscriptions(current_period_end);

CREATE INDEX payment_methods_user_id_idx ON payment_methods(user_id);
CREATE INDEX payment_methods_is_default_idx ON payment_methods(user_id, is_default);

CREATE INDEX invoices_user_id_idx ON invoices(user_id);
CREATE INDEX invoices_subscription_id_idx ON invoices(subscription_id);
CREATE INDEX invoices_status_idx ON invoices(status);
CREATE INDEX invoices_due_date_idx ON invoices(due_date);

CREATE INDEX usage_tracking_user_id_idx ON usage_tracking(user_id);
CREATE INDEX usage_tracking_feature_idx ON usage_tracking(user_id, feature);
CREATE INDEX usage_tracking_period_idx ON usage_tracking(period_start, period_end);

CREATE INDEX premium_templates_category_idx ON premium_templates(category);
CREATE INDEX premium_templates_is_active_idx ON premium_templates(is_active);

CREATE INDEX template_purchases_user_id_idx ON template_purchases(user_id);
CREATE INDEX template_purchases_template_id_idx ON template_purchases(template_id);

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_templates_updated_at
  BEFORE UPDATE ON premium_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user has access to premium template
CREATE OR REPLACE FUNCTION user_has_template_access(user_uuid uuid, template_uuid uuid)
RETURNS boolean AS $$
DECLARE
  user_plan text;
  template_price integer;
  has_purchased boolean;
BEGIN
  -- Get user's current plan
  SELECT plan INTO user_plan
  FROM profiles
  WHERE id = user_uuid;
  
  -- Get template price
  SELECT price INTO template_price
  FROM premium_templates
  WHERE id = template_uuid AND is_active = true;
  
  -- If template not found or free, allow access
  IF template_price IS NULL OR template_price = 0 THEN
    RETURN true;
  END IF;
  
  -- Pro and Business plans have access to all premium templates
  IF user_plan IN ('pro', 'business') THEN
    RETURN true;
  END IF;
  
  -- Check if user has purchased this specific template
  SELECT EXISTS(
    SELECT 1 FROM template_purchases
    WHERE user_id = user_uuid AND template_id = template_uuid
  ) INTO has_purchased;
  
  RETURN has_purchased;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current usage
CREATE OR REPLACE FUNCTION get_user_usage(user_uuid uuid, feature_name text)
RETURNS TABLE (
  current_usage integer,
  usage_limit integer,
  period_start timestamptz,
  period_end timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ut.usage_count,
    ut.limit_count,
    ut.period_start,
    ut.period_end
  FROM usage_tracking ut
  WHERE ut.user_id = user_uuid 
    AND ut.feature = feature_name
    AND ut.period_start <= now()
    AND ut.period_end > now()
  ORDER BY ut.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  user_uuid uuid, 
  feature_name text, 
  increment_by integer DEFAULT 1
)
RETURNS boolean AS $$
DECLARE
  current_period_start timestamptz;
  current_period_end timestamptz;
  current_usage integer;
  usage_limit integer;
BEGIN
  -- Calculate current billing period (monthly)
  current_period_start := date_trunc('month', now());
  current_period_end := current_period_start + interval '1 month';
  
  -- Get or create usage record
  INSERT INTO usage_tracking (user_id, feature, usage_count, period_start, period_end)
  VALUES (user_uuid, feature_name, increment_by, current_period_start, current_period_end)
  ON CONFLICT (user_id, feature, period_start)
  DO UPDATE SET 
    usage_count = usage_tracking.usage_count + increment_by,
    updated_at = now()
  RETURNING usage_tracking.usage_count, usage_tracking.limit_count 
  INTO current_usage, usage_limit;
  
  -- Check if usage exceeds limit
  IF usage_limit IS NOT NULL AND current_usage > usage_limit THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's billing summary
CREATE OR REPLACE FUNCTION get_user_billing_summary(user_uuid uuid)
RETURNS TABLE (
  subscription_status subscription_status,
  plan_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  next_invoice_amount integer,
  payment_method_last_four text,
  payment_method_brand text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.status,
    s.plan_id,
    s.current_period_end,
    s.cancel_at_period_end,
    COALESCE(i.amount_due, 0) as next_invoice_amount,
    pm.last_four,
    pm.brand
  FROM subscriptions s
  LEFT JOIN invoices i ON s.id = i.subscription_id 
    AND i.status = 'open' 
    AND i.due_date > now()
  LEFT JOIN payment_methods pm ON pm.user_id = s.user_id 
    AND pm.is_default = true
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing', 'past_due')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default premium templates
INSERT INTO premium_templates (name, description, category, price, stripe_price_id, preview_url, thumbnail_url, features, tags) VALUES
('E-commerce Pro Max', 'Advanced e-commerce template with cart, checkout, and inventory management', 'ecommerce', 2999, 'price_ecommerce_pro_max', 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['Advanced cart system', 'Inventory management', 'Payment integration', 'Order tracking'], ARRAY['ecommerce', 'premium', 'advanced']),

('Creative Agency Premium', 'Stunning agency template with advanced animations and portfolio showcase', 'creative', 1999, 'price_creative_agency_premium', 'https://images.pexels.com/photos/196667/pexels-photo-196667.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/196667/pexels-photo-196667.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['Advanced animations', 'Portfolio showcase', 'Team management', 'Case studies'], ARRAY['agency', 'creative', 'premium']),

('SaaS Landing Pro', 'High-converting SaaS landing page with A/B testing and analytics', 'business', 2499, 'price_saas_landing_pro', 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['A/B testing', 'Analytics integration', 'Conversion optimization', 'Lead capture'], ARRAY['saas', 'landing', 'premium']),

('Restaurant Deluxe Pro', 'Premium restaurant template with reservation system and menu management', 'restaurant', 1799, 'price_restaurant_deluxe_pro', 'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['Reservation system', 'Menu management', 'Online ordering', 'Table booking'], ARRAY['restaurant', 'premium', 'booking']),

('Portfolio Master', 'Professional portfolio template for designers and artists', 'portfolio', 1499, 'price_portfolio_master', 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=500', 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=300', ARRAY['Gallery management', 'Client testimonials', 'Contact forms', 'Social integration'], ARRAY['portfolio', 'creative', 'premium']);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;
GRANT SELECT ON invoices TO authenticated;
GRANT SELECT ON usage_tracking TO authenticated;
GRANT SELECT ON premium_templates TO authenticated;
GRANT SELECT, INSERT ON template_purchases TO authenticated;

GRANT EXECUTE ON FUNCTION user_has_template_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_billing_summary(uuid) TO authenticated;