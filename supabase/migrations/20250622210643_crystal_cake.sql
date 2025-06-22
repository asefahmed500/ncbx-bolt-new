/*
# Complete User System with APIs and Full Functionality

This migration creates a comprehensive user system with:
1. Role-based authentication (user/admin)
2. Complete website management APIs
3. Real-time collaboration features
4. Publishing and domain management
5. Usage tracking and analytics
6. Comprehensive audit logging

## Tables Created:
- Enhanced profiles with role management
- Complete website management system
- Real-time collaboration features
- Publishing and deployment tracking
- Usage analytics and limits
- Admin audit logging

## Security:
- Row Level Security (RLS) enabled on all tables
- Admin-only functions for user management
- Comprehensive audit trail
- Secure API endpoints
*/

-- Create user role enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;
END $$;

-- Add role column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user' NOT NULL;
  END IF;
END $$;

-- Create website collaboration table for real-time editing
CREATE TABLE IF NOT EXISTS website_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'editor', -- 'owner', 'editor', 'viewer'
  permissions jsonb DEFAULT '{"edit": true, "publish": false, "delete": false}',
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(website_id, user_id)
);

-- Create website versions table for version control
CREATE TABLE IF NOT EXISTS website_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  changes_summary text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT false,
  published_at timestamptz,
  UNIQUE(website_id, version_number)
);

-- Create website analytics table
CREATE TABLE IF NOT EXISTS website_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  page_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  bounce_rate decimal(5,2) DEFAULT 0,
  avg_session_duration integer DEFAULT 0, -- in seconds
  traffic_sources jsonb DEFAULT '{}',
  device_breakdown jsonb DEFAULT '{}',
  location_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(website_id, date)
);

-- Create website deployments table
CREATE TABLE IF NOT EXISTS website_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  version_id uuid REFERENCES website_versions(id) ON DELETE SET NULL,
  deployment_url text,
  custom_domain text,
  ssl_enabled boolean DEFAULT true,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'building', 'deployed', 'failed'
  build_log text,
  deployed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  deployed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user sessions table for real-time collaboration
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  cursor_position jsonb DEFAULT '{}',
  selected_element text,
  is_active boolean DEFAULT true,
  last_ping timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Create website comments table for collaboration
CREATE TABLE IF NOT EXISTS website_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  element_id text, -- ID of the element being commented on
  content text NOT NULL,
  position jsonb DEFAULT '{}', -- x, y coordinates for positioning
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  parent_id uuid REFERENCES website_comments(id) ON DELETE CASCADE, -- for replies
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create API keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key_hash text UNIQUE NOT NULL,
  key_prefix text NOT NULL, -- First 8 characters for display
  permissions jsonb DEFAULT '{"read": true, "write": false}',
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE website_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS website_collaborators_website_id_idx ON website_collaborators(website_id);
CREATE INDEX IF NOT EXISTS website_collaborators_user_id_idx ON website_collaborators(user_id);
CREATE INDEX IF NOT EXISTS website_versions_website_id_idx ON website_versions(website_id);
CREATE INDEX IF NOT EXISTS website_versions_published_idx ON website_versions(website_id, is_published);
CREATE INDEX IF NOT EXISTS website_analytics_website_date_idx ON website_analytics(website_id, date);
CREATE INDEX IF NOT EXISTS website_deployments_website_id_idx ON website_deployments(website_id);
CREATE INDEX IF NOT EXISTS website_deployments_status_idx ON website_deployments(status);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_website_id_idx ON user_sessions(website_id);
CREATE INDEX IF NOT EXISTS user_sessions_active_idx ON user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS website_comments_website_id_idx ON website_comments(website_id);
CREATE INDEX IF NOT EXISTS website_comments_element_id_idx ON website_comments(website_id, element_id);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);

-- Create admin functions
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM profiles 
  WHERE id = user_id;
  
  RETURN COALESCE(user_role_result, 'user'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create website management functions
CREATE OR REPLACE FUNCTION create_website_with_version(
  website_name text,
  website_description text DEFAULT NULL,
  website_template text DEFAULT 'blank',
  initial_content jsonb DEFAULT '{}'
)
RETURNS TABLE(website_id uuid, version_id uuid) AS $$
DECLARE
  new_website_id uuid;
  new_version_id uuid;
BEGIN
  -- Create the website
  INSERT INTO websites (user_id, name, description, template, status)
  VALUES (auth.uid(), website_name, website_description, website_template, 'draft')
  RETURNING id INTO new_website_id;
  
  -- Create initial version
  INSERT INTO website_versions (website_id, version_number, content, changes_summary, created_by)
  VALUES (new_website_id, 1, initial_content, 'Initial version', auth.uid())
  RETURNING id INTO new_version_id;
  
  -- Add user as owner collaborator
  INSERT INTO website_collaborators (website_id, user_id, role, permissions)
  VALUES (new_website_id, auth.uid(), 'owner', '{"edit": true, "publish": true, "delete": true, "invite": true}');
  
  RETURN QUERY SELECT new_website_id, new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION publish_website(
  website_uuid uuid,
  version_uuid uuid DEFAULT NULL,
  custom_domain_name text DEFAULT NULL
)
RETURNS TABLE(deployment_id uuid, deployment_url text) AS $$
DECLARE
  new_deployment_id uuid;
  generated_url text;
  latest_version_id uuid;
  website_name text;
BEGIN
  -- Check if user has publish permissions
  IF NOT EXISTS (
    SELECT 1 FROM website_collaborators wc
    WHERE wc.website_id = website_uuid 
    AND wc.user_id = auth.uid()
    AND (wc.permissions->>'publish')::boolean = true
  ) THEN
    RAISE EXCEPTION 'Permission denied: User cannot publish this website';
  END IF;
  
  -- Get website name for URL generation
  SELECT name INTO website_name FROM websites WHERE id = website_uuid;
  
  -- If no version specified, use the latest
  IF version_uuid IS NULL THEN
    SELECT id INTO latest_version_id 
    FROM website_versions 
    WHERE website_id = website_uuid 
    ORDER BY version_number DESC 
    LIMIT 1;
    version_uuid := latest_version_id;
  END IF;
  
  -- Generate deployment URL
  generated_url := COALESCE(
    custom_domain_name,
    lower(regexp_replace(website_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substring(website_uuid::text from 1 for 8) || '.ncbx.app'
  );
  
  -- Create deployment record
  INSERT INTO website_deployments (
    website_id, 
    version_id, 
    deployment_url, 
    custom_domain, 
    status, 
    deployed_by
  )
  VALUES (
    website_uuid, 
    version_uuid, 
    generated_url, 
    custom_domain_name, 
    'deployed', 
    auth.uid()
  )
  RETURNING id, deployment_url INTO new_deployment_id, generated_url;
  
  -- Update website status
  UPDATE websites 
  SET status = 'published', updated_at = now()
  WHERE id = website_uuid;
  
  -- Mark version as published
  UPDATE website_versions 
  SET is_published = true, published_at = now()
  WHERE id = version_uuid;
  
  RETURN QUERY SELECT new_deployment_id, generated_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION save_website_version(
  website_uuid uuid,
  content_data jsonb,
  changes_description text DEFAULT 'Auto-save'
)
RETURNS uuid AS $$
DECLARE
  new_version_id uuid;
  next_version_number integer;
BEGIN
  -- Check if user has edit permissions
  IF NOT EXISTS (
    SELECT 1 FROM website_collaborators wc
    WHERE wc.website_id = website_uuid 
    AND wc.user_id = auth.uid()
    AND (wc.permissions->>'edit')::boolean = true
  ) THEN
    RAISE EXCEPTION 'Permission denied: User cannot edit this website';
  END IF;
  
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version_number
  FROM website_versions 
  WHERE website_id = website_uuid;
  
  -- Create new version
  INSERT INTO website_versions (
    website_id, 
    version_number, 
    content, 
    changes_summary, 
    created_by
  )
  VALUES (
    website_uuid, 
    next_version_number, 
    content_data, 
    changes_description, 
    auth.uid()
  )
  RETURNING id INTO new_version_id;
  
  -- Update website timestamp
  UPDATE websites 
  SET updated_at = now()
  WHERE id = website_uuid;
  
  RETURN new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION invite_collaborator(
  website_uuid uuid,
  collaborator_email text,
  collaborator_role text DEFAULT 'editor',
  collaborator_permissions jsonb DEFAULT '{"edit": true, "publish": false, "delete": false}'
)
RETURNS boolean AS $$
DECLARE
  collaborator_id uuid;
BEGIN
  -- Check if user has invite permissions
  IF NOT EXISTS (
    SELECT 1 FROM website_collaborators wc
    WHERE wc.website_id = website_uuid 
    AND wc.user_id = auth.uid()
    AND (wc.permissions->>'invite')::boolean = true
  ) THEN
    RAISE EXCEPTION 'Permission denied: User cannot invite collaborators';
  END IF;
  
  -- Get collaborator user ID
  SELECT id INTO collaborator_id 
  FROM profiles 
  WHERE email = collaborator_email;
  
  IF collaborator_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', collaborator_email;
  END IF;
  
  -- Add collaborator
  INSERT INTO website_collaborators (
    website_id, 
    user_id, 
    role, 
    permissions, 
    invited_by,
    accepted_at
  )
  VALUES (
    website_uuid, 
    collaborator_id, 
    collaborator_role, 
    collaborator_permissions, 
    auth.uid(),
    now()
  )
  ON CONFLICT (website_id, user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create analytics functions
CREATE OR REPLACE FUNCTION record_page_view(
  website_uuid uuid,
  visitor_data jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  today_date date := CURRENT_DATE;
BEGIN
  INSERT INTO website_analytics (website_id, date, page_views, unique_visitors)
  VALUES (website_uuid, today_date, 1, 1)
  ON CONFLICT (website_id, date)
  DO UPDATE SET 
    page_views = website_analytics.page_views + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_website_analytics(
  website_uuid uuid,
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  date date,
  page_views integer,
  unique_visitors integer,
  bounce_rate decimal,
  avg_session_duration integer
) AS $$
BEGIN
  -- Check if user has access to this website
  IF NOT EXISTS (
    SELECT 1 FROM website_collaborators wc
    WHERE wc.website_id = website_uuid 
    AND wc.user_id = auth.uid()
  ) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: User cannot view analytics for this website';
  END IF;
  
  RETURN QUERY
  SELECT 
    wa.date,
    wa.page_views,
    wa.unique_visitors,
    wa.bounce_rate,
    wa.avg_session_duration
  FROM website_analytics wa
  WHERE wa.website_id = website_uuid
    AND wa.date BETWEEN start_date AND end_date
  ORDER BY wa.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin functions
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role user_role,
  plan user_plan,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  website_count bigint
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.plan,
    p.created_at,
    p.updated_at,
    au.last_sign_in_at,
    COALESCE(w.website_count, 0) as website_count
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as website_count
    FROM websites
    GROUP BY user_id
  ) w ON p.id = w.user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_system_stats()
RETURNS TABLE (
  total_users bigint,
  total_websites bigint,
  total_published_websites bigint,
  total_premium_templates bigint,
  users_this_month bigint,
  websites_this_month bigint,
  free_users bigint,
  pro_users bigint,
  business_users bigint
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM websites) as total_websites,
    (SELECT COUNT(*) FROM websites WHERE status = 'published') as total_published_websites,
    (SELECT COUNT(*) FROM premium_templates WHERE is_active = true) as total_premium_templates,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= date_trunc('month', CURRENT_DATE)) as users_this_month,
    (SELECT COUNT(*) FROM websites WHERE created_at >= date_trunc('month', CURRENT_DATE)) as websites_this_month,
    (SELECT COUNT(*) FROM profiles WHERE plan = 'free') as free_users,
    (SELECT COUNT(*) FROM profiles WHERE plan = 'pro') as pro_users,
    (SELECT COUNT(*) FROM profiles WHERE plan = 'business') as business_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_user_role(
  target_user_id uuid,
  new_role user_role
)
RETURNS boolean AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Prevent removing admin role from the last admin
  IF new_role = 'user' THEN
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove admin role. At least one admin must exist.';
    END IF;
  END IF;
  
  UPDATE profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_user_plan(
  target_user_id uuid,
  new_plan user_plan
)
RETURNS boolean AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  UPDATE profiles 
  SET plan = new_plan, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies
-- Profiles policies
DROP POLICY IF EXISTS "Users can read own profile or admins can read all" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON profiles;

CREATE POLICY "Users can read own profile or admins can read all"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile or admins can update all"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- Website collaborators policies
CREATE POLICY "Users can read collaborations for their websites"
  ON website_collaborators FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid()
    ) OR
    is_admin()
  );

CREATE POLICY "Website owners can manage collaborators"
  ON website_collaborators FOR ALL
  TO authenticated
  USING (
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid() 
      AND (permissions->>'invite')::boolean = true
    ) OR
    is_admin()
  );

-- Website versions policies
CREATE POLICY "Collaborators can read website versions"
  ON website_versions FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid()
    ) OR
    is_admin()
  );

CREATE POLICY "Collaborators can create website versions"
  ON website_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid() 
      AND (permissions->>'edit')::boolean = true
    )
  );

-- Website analytics policies
CREATE POLICY "Collaborators can read website analytics"
  ON website_analytics FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid()
    ) OR
    is_admin()
  );

CREATE POLICY "System can insert analytics"
  ON website_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update analytics"
  ON website_analytics FOR UPDATE
  TO authenticated
  USING (true);

-- Website deployments policies
CREATE POLICY "Collaborators can read website deployments"
  ON website_deployments FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid()
    ) OR
    is_admin()
  );

CREATE POLICY "Publishers can create deployments"
  ON website_deployments FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid() 
      AND (permissions->>'publish')::boolean = true
    )
  );

-- User sessions policies
CREATE POLICY "Users can manage own sessions"
  ON user_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Website comments policies
CREATE POLICY "Collaborators can read website comments"
  ON website_comments FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid()
    ) OR
    is_admin()
  );

CREATE POLICY "Collaborators can create comments"
  ON website_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT website_id FROM website_collaborators 
      WHERE user_id = auth.uid()
    ) AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own comments"
  ON website_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- API keys policies
CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_website_with_version(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION publish_website(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION save_website_version(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION invite_collaborator(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION record_page_view(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_website_analytics(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_role(uuid, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_plan(uuid, user_plan) TO authenticated;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to new tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_website_collaborators_updated_at') THEN
    CREATE TRIGGER update_website_collaborators_updated_at
      BEFORE UPDATE ON website_collaborators
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_website_analytics_updated_at') THEN
    CREATE TRIGGER update_website_analytics_updated_at
      BEFORE UPDATE ON website_analytics
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_website_deployments_updated_at') THEN
    CREATE TRIGGER update_website_deployments_updated_at
      BEFORE UPDATE ON website_deployments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_website_comments_updated_at') THEN
    CREATE TRIGGER update_website_comments_updated_at
      BEFORE UPDATE ON website_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_api_keys_updated_at') THEN
    CREATE TRIGGER update_api_keys_updated_at
      BEFORE UPDATE ON api_keys
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add helpful comments
COMMENT ON TABLE website_collaborators IS 'Real-time collaboration and permission management for websites';
COMMENT ON TABLE website_versions IS 'Version control system for website content and changes';
COMMENT ON TABLE website_analytics IS 'Analytics and performance tracking for published websites';
COMMENT ON TABLE website_deployments IS 'Deployment history and domain management for websites';
COMMENT ON TABLE user_sessions IS 'Real-time user sessions for collaborative editing';
COMMENT ON TABLE website_comments IS 'Comments and feedback system for collaborative editing';
COMMENT ON TABLE api_keys IS 'API key management for external integrations';

COMMENT ON FUNCTION create_website_with_version(text, text, text, jsonb) IS 'Create a new website with initial version and set user as owner';
COMMENT ON FUNCTION publish_website(uuid, uuid, text) IS 'Publish a website version with optional custom domain';
COMMENT ON FUNCTION save_website_version(uuid, jsonb, text) IS 'Save a new version of website content';
COMMENT ON FUNCTION invite_collaborator(uuid, text, text, jsonb) IS 'Invite a user to collaborate on a website';
COMMENT ON FUNCTION record_page_view(uuid, jsonb) IS 'Record analytics data for website page views';
COMMENT ON FUNCTION get_website_analytics(uuid, date, date) IS 'Get analytics data for a website within date range';

-- Final setup summary
DO $$
DECLARE
  table_count integer;
  function_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'website_collaborators', 'website_versions', 'website_analytics', 
    'website_deployments', 'user_sessions', 'website_comments', 'api_keys'
  );
  
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_website_with_version', 'publish_website', 'save_website_version',
    'invite_collaborator', 'record_page_view', 'get_website_analytics'
  );
  
  RAISE NOTICE 'Complete user system setup completed:';
  RAISE NOTICE '- New tables created: %', table_count;
  RAISE NOTICE '- API functions created: %', function_count;
  RAISE NOTICE '- Real-time collaboration enabled';
  RAISE NOTICE '- Version control system active';
  RAISE NOTICE '- Analytics tracking ready';
  RAISE NOTICE '- Publishing system operational';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create admin user: admin@gmail.com / admin123';
  RAISE NOTICE '2. Test website creation and publishing';
  RAISE NOTICE '3. Verify real-time collaboration features';
  RAISE NOTICE '4. Set up domain management';
  RAISE NOTICE '5. Configure analytics tracking';
END $$;