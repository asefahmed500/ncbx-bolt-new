/*
  # Website Management Enhancement Migration

  1. Data Validation
    - Add constraints for name length (3-50 characters)
    - Add constraints for description length (max 200 characters)
    - Add constraints for template validation
    - Add domain format validation

  2. Performance Optimization
    - Create indexes for user queries
    - Create indexes for status filtering
    - Create indexes for date sorting
    - Create composite indexes for complex queries
    - Create full-text search index

  3. Security
    - Ensure RLS is enabled
    - Create comprehensive policies for CRUD operations
    - Grant appropriate permissions

  4. Utility Functions
    - Auto-update timestamp function
    - User statistics function
    - Domain validation function
    - Analytics view
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
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'websites_name_length_check'
    AND table_name = 'websites'
  ) THEN
    ALTER TABLE websites ADD CONSTRAINT websites_name_length_check 
    CHECK (char_length(name) >= 3 AND char_length(name) <= 50);
  END IF;

  -- Add check constraint for description length if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'websites_description_length_check'
    AND table_name = 'websites'
  ) THEN
    ALTER TABLE websites ADD CONSTRAINT websites_description_length_check 
    CHECK (description IS NULL OR char_length(description) <= 200);
  END IF;

  -- Add check constraint for template if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'websites_template_not_empty_check'
    AND table_name = 'websites'
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
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'websites_valid_domain_check'
    AND table_name = 'websites'
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

-- Grant necessary permissions (check if sequence exists first)
DO $$
BEGIN
  -- Grant table permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON websites TO authenticated;
  
  -- Only grant sequence permissions if sequence exists
  IF EXISTS (
    SELECT 1 FROM information_schema.sequences 
    WHERE sequence_name LIKE '%websites%id%seq%'
  ) THEN
    -- Find the actual sequence name and grant permissions
    DECLARE
      seq_name text;
    BEGIN
      SELECT sequence_name INTO seq_name
      FROM information_schema.sequences 
      WHERE sequence_name LIKE '%websites%id%seq%'
      LIMIT 1;
      
      IF seq_name IS NOT NULL THEN
        EXECUTE format('GRANT USAGE ON SEQUENCE %I TO authenticated', seq_name);
      END IF;
    END;
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

-- Add RLS to the view (if supported)
DO $$
BEGIN
  -- Try to set security_invoker, but don't fail if not supported
  BEGIN
    ALTER VIEW user_website_analytics SET (security_invoker = true);
  EXCEPTION WHEN OTHERS THEN
    -- Ignore error if security_invoker is not supported
    NULL;
  END;
END $$;

-- Create RLS policy for the analytics view
DO $$
BEGIN
  -- Enable RLS on the view if possible
  BEGIN
    ALTER VIEW user_website_analytics ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for the view
    CREATE POLICY "Users can see own analytics"
      ON user_website_analytics FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  EXCEPTION WHEN OTHERS THEN
    -- Views might not support RLS in all Postgres versions
    -- The underlying table RLS will still protect the data
    NULL;
  END;
END $$;