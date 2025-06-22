/*
  # Premium Templates Setup with Stripe Integration

  1. Premium Templates
    - Insert premium templates with placeholder Stripe price IDs
    - Update existing templates safely
    - Set up pricing structure

  2. Helper Functions
    - Safe price ID update function
    - Duplicate prevention logic

  3. Monitoring
    - Template pricing info view
    - Status tracking
*/

-- First, let's check what premium templates already exist and update them
UPDATE premium_templates 
SET stripe_price_id = 'price_ecommerce_pro_max_placeholder'
WHERE name = 'E-commerce Pro Max' 
  AND (stripe_price_id IS NULL OR stripe_price_id = '');

UPDATE premium_templates 
SET stripe_price_id = 'price_creative_agency_premium_placeholder'
WHERE name = 'Creative Agency Premium'
  AND (stripe_price_id IS NULL OR stripe_price_id = '');

UPDATE premium_templates 
SET stripe_price_id = 'price_saas_landing_pro_placeholder'
WHERE name = 'SaaS Landing Pro'
  AND (stripe_price_id IS NULL OR stripe_price_id = '');

UPDATE premium_templates 
SET stripe_price_id = 'price_restaurant_deluxe_pro_placeholder'
WHERE name = 'Restaurant Deluxe Pro'
  AND (stripe_price_id IS NULL OR stripe_price_id = '');

UPDATE premium_templates 
SET stripe_price_id = 'price_portfolio_master_placeholder'
WHERE name = 'Portfolio Master'
  AND (stripe_price_id IS NULL OR stripe_price_id = '');

-- Insert premium templates that don't exist yet
INSERT INTO premium_templates (
  name, 
  description, 
  category, 
  price, 
  currency, 
  stripe_price_id, 
  preview_url, 
  thumbnail_url, 
  features, 
  tags, 
  is_active
)
SELECT 
  template_data.name,
  template_data.description,
  template_data.category,
  template_data.price,
  template_data.currency,
  template_data.stripe_price_id,
  template_data.preview_url,
  template_data.thumbnail_url,
  template_data.features,
  template_data.tags,
  template_data.is_active
FROM (
  VALUES 
    (
      'E-commerce Pro Max',
      'Advanced e-commerce template with complete shopping cart, payment integration, and inventory management',
      'ecommerce',
      2999, -- $29.99 in cents
      'usd',
      'price_ecommerce_pro_max_placeholder',
      'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=400',
      ARRAY['Advanced product catalog', 'Shopping cart & checkout', 'Payment processing', 'Inventory management', 'Order tracking', 'Customer accounts', 'Admin dashboard', 'Mobile responsive'],
      ARRAY['ecommerce', 'shop', 'premium', 'advanced', 'payment'],
      true
    ),
    (
      'Creative Agency Premium',
      'Stunning creative agency template with portfolio showcase, team profiles, and client testimonials',
      'creative',
      1999, -- $19.99 in cents
      'usd',
      'price_creative_agency_premium_placeholder',
      'https://images.pexels.com/photos/196667/pexels-photo-196667.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/196667/pexels-photo-196667.jpeg?auto=compress&cs=tinysrgb&w=400',
      ARRAY['Portfolio showcase', 'Team profiles', 'Client testimonials', 'Service pages', 'Contact forms', 'Blog integration', 'Animation effects', 'SEO optimized'],
      ARRAY['creative', 'agency', 'portfolio', 'premium', 'animated'],
      true
    ),
    (
      'SaaS Landing Pro',
      'High-converting SaaS landing page with pricing tables, feature comparisons, and lead capture',
      'business',
      2499, -- $24.99 in cents
      'usd',
      'price_saas_landing_pro_placeholder',
      'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=400',
      ARRAY['Hero section', 'Feature highlights', 'Pricing tables', 'Testimonials', 'FAQ section', 'Lead capture forms', 'Integration demos', 'Conversion optimized'],
      ARRAY['saas', 'landing', 'business', 'premium', 'conversion'],
      true
    ),
    (
      'Restaurant Deluxe Pro',
      'Premium restaurant template with online reservations, menu management, and delivery integration',
      'restaurant',
      1799, -- $17.99 in cents
      'usd',
      'price_restaurant_deluxe_pro_placeholder',
      'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=400',
      ARRAY['Online reservations', 'Digital menu', 'Photo gallery', 'Chef profiles', 'Event booking', 'Delivery integration', 'Reviews system', 'Location maps'],
      ARRAY['restaurant', 'food', 'premium', 'reservations', 'menu'],
      true
    ),
    (
      'Portfolio Master',
      'Professional portfolio template for designers, photographers, and creative professionals',
      'portfolio',
      1499, -- $14.99 in cents
      'usd',
      'price_portfolio_master_placeholder',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400',
      ARRAY['Project galleries', 'About section', 'Skills showcase', 'Contact form', 'Blog integration', 'Client testimonials', 'Resume/CV section', 'Social links'],
      ARRAY['portfolio', 'creative', 'premium', 'professional', 'gallery'],
      true
    )
) AS template_data(name, description, category, price, currency, stripe_price_id, preview_url, thumbnail_url, features, tags, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM premium_templates pt 
  WHERE pt.name = template_data.name
);

-- Create a function to update Stripe price IDs safely
CREATE OR REPLACE FUNCTION update_stripe_price_id(
  template_name text,
  new_price_id text
) RETURNS void AS $$
BEGIN
  -- Check if the price ID is already in use by another template
  IF EXISTS (
    SELECT 1 FROM premium_templates 
    WHERE stripe_price_id = new_price_id 
    AND name != template_name
  ) THEN
    RAISE EXCEPTION 'Price ID % is already in use by another template', new_price_id;
  END IF;
  
  -- Update the template with the new price ID
  UPDATE premium_templates 
  SET stripe_price_id = new_price_id,
      updated_at = now()
  WHERE name = template_name;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template % not found', template_name;
  END IF;
  
  RAISE NOTICE 'Successfully updated % with price ID %', template_name, new_price_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_stripe_price_id(text, text) TO authenticated;

-- Create a view to show template pricing information
CREATE OR REPLACE VIEW template_pricing_info AS
SELECT 
  name,
  description,
  category,
  CASE 
    WHEN price >= 1000 THEN '$' || (price / 100.0)::text
    ELSE '$' || (price / 100.0)::text
  END as display_price,
  price as price_cents,
  currency,
  CASE 
    WHEN stripe_price_id LIKE '%placeholder%' THEN 'Needs Stripe Price ID'
    WHEN stripe_price_id IS NULL OR stripe_price_id = '' THEN 'Missing Price ID'
    ELSE 'Configured'
  END as stripe_status,
  stripe_price_id,
  is_active,
  array_length(features, 1) as feature_count,
  array_length(tags, 1) as tag_count,
  created_at,
  updated_at
FROM premium_templates
ORDER BY category, price;

-- Grant access to the view
GRANT SELECT ON template_pricing_info TO authenticated;

-- Create a function to get premium template by stripe price ID
CREATE OR REPLACE FUNCTION get_template_by_price_id(price_id text)
RETURNS TABLE(
  template_id uuid,
  template_name text,
  template_description text,
  template_category text,
  template_price integer,
  template_currency text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.name,
    pt.description,
    pt.category,
    pt.price,
    pt.currency
  FROM premium_templates pt
  WHERE pt.stripe_price_id = price_id
    AND pt.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_template_by_price_id(text) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION update_stripe_price_id(text, text) IS 'Safely update Stripe price ID for a premium template, preventing duplicates';
COMMENT ON VIEW template_pricing_info IS 'View showing pricing and Stripe configuration status for all premium templates';
COMMENT ON FUNCTION get_template_by_price_id(text) IS 'Get premium template details by Stripe price ID for webhook processing';

-- Log the completion
DO $$
DECLARE
  template_count integer;
  placeholder_count integer;
BEGIN
  SELECT COUNT(*) INTO template_count FROM premium_templates WHERE is_active = true;
  SELECT COUNT(*) INTO placeholder_count FROM premium_templates WHERE stripe_price_id LIKE '%placeholder%';
  
  RAISE NOTICE 'Premium templates setup completed:';
  RAISE NOTICE '- Total active templates: %', template_count;
  RAISE NOTICE '- Templates with placeholder price IDs: %', placeholder_count;
  RAISE NOTICE 'Next step: Create Stripe products and update price IDs using update_stripe_price_id() function';
END $$;