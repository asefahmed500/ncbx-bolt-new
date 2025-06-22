/*
  # Complete Website Creation System

  1. Database Schema
    - Ensure websites table exists with proper structure
    - Add proper indexes for performance
    - Set up RLS policies for security

  2. Security
    - Enable RLS on websites table
    - Add policies for CRUD operations
    - Ensure users can only access their own websites

  3. Performance
    - Add indexes for common queries
    - Optimize for user-based filtering
*/

-- Ensure websites table exists with correct structure
CREATE TABLE IF NOT EXISTS websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) >= 3 AND length(trim(name)) <= 50),
  description text CHECK (length(description) <= 200),
  domain text UNIQUE,
  status website_status DEFAULT 'draft' NOT NULL,
  template text NOT NULL CHECK (length(trim(template)) > 0),
  thumbnail text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create websites" ON websites;
DROP POLICY IF EXISTS "Users can read own websites" ON websites;
DROP POLICY IF EXISTS "Users can update own websites" ON websites;
DROP POLICY IF EXISTS "Users can delete own websites" ON websites;

-- Create comprehensive RLS policies
CREATE POLICY "Users can create websites"
  ON websites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own websites"
  ON websites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own websites"
  ON websites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites"
  ON websites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS websites_user_id_idx ON websites(user_id);
CREATE INDEX IF NOT EXISTS websites_status_idx ON websites(status);
CREATE INDEX IF NOT EXISTS websites_created_at_idx ON websites(created_at DESC);
CREATE INDEX IF NOT EXISTS websites_updated_at_idx ON websites(updated_at DESC);
CREATE INDEX IF NOT EXISTS websites_user_status_idx ON websites(user_id, status);
CREATE INDEX IF NOT EXISTS websites_user_created_idx ON websites(user_id, created_at DESC);

-- Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for websites table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_websites_updated_at'
  ) THEN
    CREATE TRIGGER update_websites_updated_at
      BEFORE UPDATE ON websites
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add helpful comments
COMMENT ON TABLE websites IS 'User-created websites with templates and content';
COMMENT ON COLUMN websites.user_id IS 'References the user who owns this website';
COMMENT ON COLUMN websites.name IS 'Website name (3-50 characters)';
COMMENT ON COLUMN websites.description IS 'Optional website description (max 200 characters)';
COMMENT ON COLUMN websites.domain IS 'Custom domain for the website (unique)';
COMMENT ON COLUMN websites.status IS 'Website status: draft or published';
COMMENT ON COLUMN websites.template IS 'Template used to create the website';
COMMENT ON COLUMN websites.thumbnail IS 'Preview image URL for the website';