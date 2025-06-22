-- Update premium templates with correct Stripe price IDs
-- Run this after creating the Stripe products

-- Update E-commerce Pro Max template
UPDATE premium_templates 
SET stripe_price_id = 'price_1234567890abcdef' -- Replace with actual price ID from Stripe
WHERE name = 'E-commerce Pro Max';

-- Update Creative Agency Premium template
UPDATE premium_templates 
SET stripe_price_id = 'price_1234567890abcdef' -- Replace with actual price ID from Stripe
WHERE name = 'Creative Agency Premium';

-- Update SaaS Landing Pro template
UPDATE premium_templates 
SET stripe_price_id = 'price_1234567890abcdef' -- Replace with actual price ID from Stripe
WHERE name = 'SaaS Landing Pro';

-- Update Restaurant Deluxe Pro template
UPDATE premium_templates 
SET stripe_price_id = 'price_1234567890abcdef' -- Replace with actual price ID from Stripe
WHERE name = 'Restaurant Deluxe Pro';

-- Update Portfolio Master template
UPDATE premium_templates 
SET stripe_price_id = 'price_1234567890abcdef' -- Replace with actual price ID from Stripe
WHERE name = 'Portfolio Master';

-- Verify the updates
SELECT name, stripe_price_id, price, currency 
FROM premium_templates 
WHERE is_active = true;