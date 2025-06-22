/*
  # Role-Based Authentication System

  1. Database Schema
    - Add user_role enum (user, admin)
    - Add role column to profiles table
    - Create admin functions and policies
    - Set up audit logging

  2. Security
    - Update RLS policies for admin access
    - Create admin-only functions
    - Implement audit trail

  3. Admin Functions
    - System statistics
    - User management
    - Role and plan updates
*/

-- Create user role enum
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

-- Create index on role for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'profiles_role_idx'
  ) THEN
    CREATE INDEX profiles_role_idx ON profiles(role);
  END IF;
END $$;

-- Update existing users to have 'user' role if they don't have one
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user role
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

-- Create admin dashboard functions
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
  -- Check if user is admin
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

-- Create function to get system statistics for admin
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
  -- Check if user is admin
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

-- Create function to update user role (admin only)
CREATE OR REPLACE FUNCTION admin_update_user_role(
  target_user_id uuid,
  new_role user_role
)
RETURNS boolean AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Prevent removing admin role from the last admin
  IF new_role = 'user' THEN
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove admin role. At least one admin must exist.';
    END IF;
  END IF;
  
  -- Log the action
  PERFORM log_admin_action(
    'UPDATE_USER_ROLE',
    target_user_id,
    'profiles',
    json_build_object('role', (SELECT role FROM profiles WHERE id = target_user_id)),
    json_build_object('role', new_role)
  );
  
  UPDATE profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user plan (admin only)
CREATE OR REPLACE FUNCTION admin_update_user_plan(
  target_user_id uuid,
  new_plan user_plan
)
RETURNS boolean AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Log the action
  PERFORM log_admin_action(
    'UPDATE_USER_PLAN',
    target_user_id,
    'profiles',
    json_build_object('plan', (SELECT plan FROM profiles WHERE id = target_user_id)),
    json_build_object('plan', new_plan)
  );
  
  UPDATE profiles 
  SET plan = new_plan, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_resource text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (is_admin());

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action_type text,
  target_user_id uuid DEFAULT NULL,
  target_resource text DEFAULT NULL,
  old_values jsonb DEFAULT NULL,
  new_values jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    target_user_id,
    target_resource,
    old_values,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    action_type,
    target_user_id,
    target_resource,
    old_values,
    new_values,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new RLS policies with admin access
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

-- Admin can delete profiles (except their own if they're the last admin)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_admin() AND id != auth.uid());

-- Update RLS policies for websites table
DROP POLICY IF EXISTS "Users can read own websites" ON websites;
DROP POLICY IF EXISTS "Users can create websites" ON websites;
DROP POLICY IF EXISTS "Users can update own websites" ON websites;
DROP POLICY IF EXISTS "Users can delete own websites" ON websites;

CREATE POLICY "Users can read own websites or admins can read all"
  ON websites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create websites"
  ON websites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own websites or admins can update all"
  ON websites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete own websites or admins can delete all"
  ON websites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Update RLS policies for billing tables to allow admin access
-- Subscriptions
DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;
CREATE POLICY "Users can read own subscriptions or admins can read all"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Payment methods
DROP POLICY IF EXISTS "Users can read own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;

CREATE POLICY "Users can read own payment methods or admins can read all"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete own payment methods or admins can delete all"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Invoices
DROP POLICY IF EXISTS "Users can read own invoices" ON invoices;
CREATE POLICY "Users can read own invoices or admins can read all"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Usage tracking
DROP POLICY IF EXISTS "Users can read own usage" ON usage_tracking;
CREATE POLICY "Users can read own usage or admins can read all"
  ON usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Template purchases
DROP POLICY IF EXISTS "Users can read own template purchases" ON template_purchases;
DROP POLICY IF EXISTS "Users can create template purchases" ON template_purchases;

CREATE POLICY "Users can read own template purchases or admins can read all"
  ON template_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create template purchases"
  ON template_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Premium templates - admins can manage, everyone can read active ones
DROP POLICY IF EXISTS "Everyone can read active premium templates" ON premium_templates;
DROP POLICY IF EXISTS "Service role can manage premium templates" ON premium_templates;

CREATE POLICY "Everyone can read active premium templates"
  ON premium_templates FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage premium templates"
  ON premium_templates FOR ALL
  TO authenticated
  USING (is_admin());

-- Grant permissions to admin functions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_role(uuid, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_plan(uuid, user_plan) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(text, uuid, text, jsonb, jsonb) TO authenticated;

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_user_id_idx ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_user_id_idx ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log(created_at DESC);

-- Add comments
COMMENT ON TABLE admin_audit_log IS 'Audit log for admin actions';
COMMENT ON FUNCTION is_admin(uuid) IS 'Check if user has admin role';
COMMENT ON FUNCTION get_user_role(uuid) IS 'Get user role';
COMMENT ON FUNCTION admin_get_all_users() IS 'Get all users (admin only)';
COMMENT ON FUNCTION admin_get_system_stats() IS 'Get system statistics (admin only)';
COMMENT ON FUNCTION admin_update_user_role(uuid, user_role) IS 'Update user role (admin only)';
COMMENT ON FUNCTION admin_update_user_plan(uuid, user_plan) IS 'Update user plan (admin only)';
COMMENT ON FUNCTION log_admin_action(text, uuid, text, jsonb, jsonb) IS 'Log admin actions for audit trail';

-- Final summary
DO $$
DECLARE
  admin_count integer;
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  SELECT COUNT(*) INTO user_count FROM profiles WHERE role = 'user';
  
  RAISE NOTICE 'Role-based authentication setup completed:';
  RAISE NOTICE '- Admin users: %', admin_count;
  RAISE NOTICE '- Regular users: %', user_count;
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Go to Supabase Auth > Users';
  RAISE NOTICE '2. Click "Add user"';
  RAISE NOTICE '3. Email: admin@gmail.com';
  RAISE NOTICE '4. Password: admin123';
  RAISE NOTICE '5. Confirm the user immediately';
  RAISE NOTICE '6. The profile will be created automatically on first login';
  RAISE NOTICE '7. Update the profile role to admin manually if needed';
END $$;