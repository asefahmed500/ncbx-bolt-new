/*
  # Database Constraints and Performance Optimizations

  1. Data Validation
    - Add length constraints for website names (3-50 characters)
    - Add description length limit (200 characters max)
    - Add template validation (non-empty)
    - Add domain format validation

  2. Performance Optimizations
    - Create comprehensive indexes for fast queries
    - Add composite indexes for common query patterns
    - Add full-text search index for website content

  3. Database Functions
    - Auto-update timestamp trigger
    - User statistics function
    - Domain validation function

  4. Analytics View
    - Aggregated user website statistics
    - Template usage tracking
    - Activity monitoring

  5. Security
    - Comprehensive RLS policies
    - Proper permission grants
    - Data access controls
*/

-- First, check if websites table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'websites') THEN
    RAISE EXCEPTION 'websites table does not exist. Please run the base migration first.';
  END IF;
END $$;

-- Add data validation constraints
DO $$ 
BEGIN
  -- Add check constraint for name length if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'websites_name_length_check'
    AND table_name = 'websites'
    AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE websites ADD CONSTRAINT websites_name_length_check 
    CHECK (char_length(name) >= 3 AND char_length(name) <= 50);
  END IF;

  -- Add check constraint for description length if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'websites_description_length_check'
    AND table_name = 'websites'
    AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE websites ADD CONSTRAINT websites_description_length_check 
    CHECK (description IS NULL OR char_length(description) <= 200);
  END IF;

  -- Add check constraint for template if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'websites_template_not_empty_check'
    AND table_name = 'websites'
    AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE websites ADD CONSTRAINT websites_template_not_empty_check 
    CHECK (char_length(trim(template)) > 0);
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for websites table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_websites_updated_at'
    AND event_object_table = 'websites'
  ) THEN
    CREATE TRIGGER update_websites_updated_at
      BEFORE UPDATE ON websites
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  ELSE
    -- Drop and recreate to ensure it's using the latest function
    DROP TRIGGER update_websites_updated_at ON websites;
    CREATE TRIGGER update_websites_updated_at
      BEFORE UPDATE ON websites
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to get website statistics for a user
CREATE OR REPLACE FUNCTION get_user_website_stats(user_uuid uuid)
RETURNS TABLE (
  total_websites bigint,
  published_websites bigint,
  draft_websites bigint,
  websites_this_month bigint,
  websites_this_week bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_websites,
    COUNT(*) FILTER (WHERE status = 'published') as published_websites,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_websites,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as websites_this_month,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as websites_this_week
  FROM websites
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate domain format
CREATE OR REPLACE FUNCTION is_valid_domain(domain_text text)
RETURNS boolean AS $$
BEGIN
  -- Basic domain validation regex
  RETURN domain_text ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$';
END;
$$ LANGUAGE plpgsql;

-- Add domain validation constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'websites_valid_domain_check'
    AND table_name = 'websites'
    AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE websites ADD CONSTRAINT websites_valid_domain_check 
    CHECK (domain IS NULL OR is_valid_domain(domain));
  END IF;
END $$;

-- Create indexes for optimal performance
DO $$
BEGIN
  -- Check and create indexes only if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'websites' AND indexname = 'websites_user_id_idx'
  ) THEN
    CREATE INDEX websites_user_id_idx ON websites(user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'websites' AND indexname = 'websites_status_idx'
  ) THEN
    CREATE INDEX websites_status_idx ON websites(status);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'websites' AND indexname = 'websites_created_at_idx'
  ) THEN
    CREATE INDEX websites_created_at_idx ON websites(created_at DESC);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'websites' AND indexname = 'websites_updated_at_idx'
  ) THEN
    CREATE INDEX websites_updated_at_idx ON websites(updated_at DESC);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'websites' AND indexname = 'websites_user_created_idx'
  ) THEN
    CREATE INDEX websites_user_created_idx ON websites(user_id, created_at DESC);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'websites' AND indexname = 'websites_user_status_idx'
  ) THEN
    CREATE INDEX websites_user_status_idx ON websites(user_id, status);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'websites' AND indexname = 'websites_user_updated_idx'
  ) THEN
    CREATE INDEX websites_user_updated_idx ON websites(user_id, updated_at DESC);
  END IF;
  
  -- Create composite index for search functionality
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'websites' AND indexname = 'websites_search_idx'
  ) THEN
    CREATE INDEX websites_search_idx ON websites 
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || template));
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own websites" ON websites;
DROP POLICY IF EXISTS "Users can create websites" ON websites;
DROP POLICY IF EXISTS "Users can update own websites" ON websites;
DROP POLICY IF EXISTS "Users can delete own websites" ON websites;

-- Create comprehensive RLS policies
CREATE POLICY "Users can read own websites"
  ON websites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create websites"
  ON websites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own websites"
  ON websites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites"
  ON websites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
DO $$
DECLARE
  seq_name text;
BEGIN
  -- Grant table permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON websites TO authenticated;
  
  -- Find and grant sequence permissions if sequence exists
  SELECT c.relname INTO seq_name
  FROM pg_class c
  JOIN pg_depend d ON d.objid = c.oid
  JOIN pg_class t ON d.refobjid = t.oid
  WHERE c.relkind = 'S'
    AND t.relname = 'websites'
    AND d.deptype = 'a'
  LIMIT 1;
  
  IF seq_name IS NOT NULL THEN
    EXECUTE format('GRANT USAGE ON SEQUENCE %I TO authenticated', seq_name);
  END IF;
  
  -- Grant function permissions
  GRANT EXECUTE ON FUNCTION get_user_website_stats(uuid) TO authenticated;
  GRANT EXECUTE ON FUNCTION is_valid_domain(text) TO authenticated;
  GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
END $$;

-- Create view for website analytics
CREATE OR REPLACE VIEW user_website_analytics AS
SELECT 
  w.user_id,
  COUNT(*) as total_websites,
  COUNT(*) FILTER (WHERE w.status = 'published') as published_count,
  COUNT(*) FILTER (WHERE w.status = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE w.created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_websites,
  MAX(w.updated_at) as last_activity,
  array_agg(DISTINCT w.template) as templates_used
FROM websites w
GROUP BY w.user_id;

-- Grant access to the view
GRANT SELECT ON user_website_analytics TO authenticated;

-- Create a security definer function to access analytics with RLS
CREATE OR REPLACE FUNCTION get_user_analytics(requesting_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  total_websites bigint,
  published_count bigint,
  draft_count bigint,
  recent_websites bigint,
  last_activity timestamptz,
  templates_used text[]
) AS $$
BEGIN
  -- Only return analytics for the requesting user
  RETURN QUERY
  SELECT 
    uwa.user_id,
    uwa.total_websites,
    uwa.published_count,
    uwa.draft_count,
    uwa.recent_websites,
    uwa.last_activity,
    uwa.templates_used
  FROM user_website_analytics uwa
  WHERE uwa.user_id = requesting_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the analytics function
GRANT EXECUTE ON FUNCTION get_user_analytics(uuid) TO authenticated;

-- Add comment to document the migration
COMMENT ON TABLE websites IS 'User-created websites with templates and content';
COMMENT ON COLUMN websites.user_id IS 'References the user who owns this website';
COMMENT ON COLUMN websites.name IS 'Website name (3-50 characters)';
COMMENT ON COLUMN websites.description IS 'Optional website description (max 200 characters)';
COMMENT ON COLUMN websites.domain IS 'Custom domain for the website (unique)';
COMMENT ON COLUMN websites.status IS 'Website status: draft or published';
COMMENT ON COLUMN websites.template IS 'Template used to create the website';
COMMENT ON COLUMN websites.thumbnail IS 'Preview image URL for the website';
COMMENT ON VIEW user_website_analytics IS 'Aggregated analytics for user websites';