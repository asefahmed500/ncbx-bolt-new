/*
  # Complete Admin Features System

  1. New Tables
    - `admin_audit_log` - Track all admin actions
    - `support_tickets` - User support system
    - `user_activity_log` - Track user activities
    - `system_notifications` - Admin notifications
    - `bulk_operations` - Track bulk operations
    - `user_communications` - Admin-user communications
    - `behavioral_analytics` - User behavior tracking

  2. Security
    - Enable RLS on all new tables
    - Add policies for admin-only access
    - Add audit logging functions

  3. Functions
    - Admin user management functions
    - Bulk operation functions
    - Analytics functions
    - Communication functions
*/

-- Admin Audit Log (Enhanced)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_resource text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Support Tickets System
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug_report')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  tags text[] DEFAULT '{}',
  attachments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz
);

-- Support Ticket Messages
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- User Activity Log
CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  session_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- System Notifications for Admins
CREATE TABLE IF NOT EXISTS system_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('user_signup', 'payment_failed', 'high_usage', 'security_alert', 'system_error')),
  title text NOT NULL,
  message text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Bulk Operations Tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  operation_type text NOT NULL,
  target_count integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  parameters jsonb DEFAULT '{}',
  results jsonb DEFAULT '{}',
  error_log text[],
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User Communications
CREATE TABLE IF NOT EXISTS user_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_user_ids uuid[],
  target_criteria jsonb, -- For bulk communications
  type text NOT NULL CHECK (type IN ('email', 'notification', 'announcement')),
  subject text,
  content text NOT NULL,
  template_id text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivery_stats jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Behavioral Analytics
CREATE TABLE IF NOT EXISTS behavioral_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  page_url text,
  referrer text,
  user_agent text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- User Segments for targeting
CREATE TABLE IF NOT EXISTS user_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  criteria jsonb NOT NULL,
  user_count integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admin Tables
CREATE POLICY "Admins can read audit logs" ON admin_audit_log FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "System can insert audit logs" ON admin_audit_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can read own tickets" ON support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage tickets" ON support_tickets FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Users can read own ticket messages" ON support_ticket_messages FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR is_admin() OR ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()));
CREATE POLICY "Users can create ticket messages" ON support_ticket_messages FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can read activity logs" ON user_activity_log FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "System can insert activity logs" ON user_activity_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage notifications" ON system_notifications FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Admins can manage bulk operations" ON bulk_operations FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Admins can manage communications" ON user_communications FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Admins can read behavioral analytics" ON behavioral_analytics FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "System can insert behavioral analytics" ON behavioral_analytics FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage user segments" ON user_segments FOR ALL TO authenticated USING (is_admin());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_user_id_idx ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_user_id_idx ON admin_audit_log(target_user_id);

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_priority_idx ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_assigned_admin_id_idx ON support_tickets(assigned_admin_id);

CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_id_idx ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS support_ticket_messages_created_at_idx ON support_ticket_messages(created_at);

CREATE INDEX IF NOT EXISTS user_activity_log_user_id_idx ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS user_activity_log_created_at_idx ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS user_activity_log_action_idx ON user_activity_log(action);

CREATE INDEX IF NOT EXISTS system_notifications_created_at_idx ON system_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS system_notifications_is_read_idx ON system_notifications(is_read);
CREATE INDEX IF NOT EXISTS system_notifications_type_idx ON system_notifications(type);

CREATE INDEX IF NOT EXISTS bulk_operations_admin_user_id_idx ON bulk_operations(admin_user_id);
CREATE INDEX IF NOT EXISTS bulk_operations_status_idx ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS bulk_operations_created_at_idx ON bulk_operations(created_at DESC);

CREATE INDEX IF NOT EXISTS user_communications_admin_user_id_idx ON user_communications(admin_user_id);
CREATE INDEX IF NOT EXISTS user_communications_status_idx ON user_communications(status);
CREATE INDEX IF NOT EXISTS user_communications_created_at_idx ON user_communications(created_at DESC);

CREATE INDEX IF NOT EXISTS behavioral_analytics_user_id_idx ON behavioral_analytics(user_id);
CREATE INDEX IF NOT EXISTS behavioral_analytics_event_type_idx ON behavioral_analytics(event_type);
CREATE INDEX IF NOT EXISTS behavioral_analytics_created_at_idx ON behavioral_analytics(created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_segments_updated_at BEFORE UPDATE ON user_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin Functions

-- Get comprehensive user statistics
CREATE OR REPLACE FUNCTION admin_get_user_stats()
RETURNS TABLE (
  total_users bigint,
  active_users_today bigint,
  active_users_week bigint,
  active_users_month bigint,
  new_users_today bigint,
  new_users_week bigint,
  new_users_month bigint,
  users_by_plan jsonb,
  users_by_role jsonb,
  top_activities jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles)::bigint as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at >= CURRENT_DATE)::bigint as active_users_today,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::bigint as active_users_week,
    (SELECT COUNT(DISTINCT user_id) FROM user_activity_log WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::bigint as active_users_month,
    (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = CURRENT_DATE)::bigint as new_users_today,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::bigint as new_users_week,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::bigint as new_users_month,
    (SELECT jsonb_object_agg(plan, count) FROM (SELECT plan, COUNT(*) as count FROM profiles GROUP BY plan) t) as users_by_plan,
    (SELECT jsonb_object_agg(role, count) FROM (SELECT role, COUNT(*) as count FROM profiles GROUP BY role) t) as users_by_role,
    (SELECT jsonb_agg(jsonb_build_object('action', action, 'count', count)) FROM (
      SELECT action, COUNT(*) as count FROM user_activity_log 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' 
      GROUP BY action ORDER BY count DESC LIMIT 10
    ) t) as top_activities;
END;
$$;

-- Get user activity timeline
CREATE OR REPLACE FUNCTION admin_get_user_activity(target_user_id uuid, days_back integer DEFAULT 30)
RETURNS TABLE (
  date date,
  activity_count bigint,
  activities jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ual.created_at) as date,
    COUNT(*)::bigint as activity_count,
    jsonb_agg(
      jsonb_build_object(
        'action', ual.action,
        'resource_type', ual.resource_type,
        'created_at', ual.created_at,
        'metadata', ual.metadata
      ) ORDER BY ual.created_at DESC
    ) as activities
  FROM user_activity_log ual
  WHERE ual.user_id = target_user_id
    AND ual.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY DATE(ual.created_at)
  ORDER BY date DESC;
END;
$$;

-- Bulk user operations
CREATE OR REPLACE FUNCTION admin_bulk_update_users(
  user_ids uuid[],
  updates jsonb,
  admin_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  operation_id uuid;
  user_id uuid;
  success_count integer := 0;
  error_count integer := 0;
  errors text[] := '{}';
BEGIN
  -- Create bulk operation record
  INSERT INTO bulk_operations (admin_user_id, operation_type, target_count, status)
  VALUES (admin_id, 'bulk_user_update', array_length(user_ids, 1), 'running')
  RETURNING id INTO operation_id;

  -- Update operation start time
  UPDATE bulk_operations SET started_at = now() WHERE id = operation_id;

  -- Process each user
  FOREACH user_id IN ARRAY user_ids
  LOOP
    BEGIN
      -- Update user profile
      IF updates ? 'plan' THEN
        UPDATE profiles SET plan = (updates->>'plan')::user_plan WHERE id = user_id;
      END IF;
      
      IF updates ? 'role' THEN
        UPDATE profiles SET role = (updates->>'role')::user_role WHERE id = user_id;
      END IF;

      -- Log the action
      INSERT INTO admin_audit_log (admin_user_id, action, target_user_id, new_values)
      VALUES (admin_id, 'bulk_user_update', user_id, updates);

      success_count := success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      errors := array_append(errors, 'User ' || user_id || ': ' || SQLERRM);
    END;
  END LOOP;

  -- Update operation results
  UPDATE bulk_operations 
  SET 
    processed_count = array_length(user_ids, 1),
    success_count = success_count,
    error_count = error_count,
    error_log = errors,
    status = CASE WHEN error_count = 0 THEN 'completed' ELSE 'completed' END,
    completed_at = now()
  WHERE id = operation_id;

  RETURN operation_id;
END;
$$;

-- Create user segment
CREATE OR REPLACE FUNCTION admin_create_user_segment(
  segment_name text,
  segment_description text,
  criteria jsonb,
  admin_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  segment_id uuid;
  user_count integer;
BEGIN
  -- Calculate user count based on criteria
  -- This is a simplified version - in practice you'd have more complex criteria evaluation
  SELECT COUNT(*) INTO user_count FROM profiles 
  WHERE (criteria ? 'plan' AND plan = (criteria->>'plan')::user_plan)
     OR (criteria ? 'role' AND role = (criteria->>'role')::user_role)
     OR (criteria ? 'created_after' AND created_at >= (criteria->>'created_after')::timestamptz);

  -- Create segment
  INSERT INTO user_segments (name, description, criteria, user_count, created_by)
  VALUES (segment_name, segment_description, criteria, user_count, admin_id)
  RETURNING id INTO segment_id;

  RETURN segment_id;
END;
$$;

-- Send communication to users
CREATE OR REPLACE FUNCTION admin_send_communication(
  target_user_ids uuid[],
  communication_type text,
  subject text,
  content text,
  admin_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  communication_id uuid;
BEGIN
  INSERT INTO user_communications (
    admin_user_id, 
    target_user_ids, 
    type, 
    subject, 
    content, 
    status,
    sent_at
  )
  VALUES (
    admin_id, 
    target_user_ids, 
    communication_type, 
    subject, 
    content, 
    'sent',
    now()
  )
  RETURNING id INTO communication_id;

  -- Log the action
  INSERT INTO admin_audit_log (admin_user_id, action, metadata)
  VALUES (admin_id, 'send_communication', jsonb_build_object(
    'communication_id', communication_id,
    'type', communication_type,
    'target_count', array_length(target_user_ids, 1)
  ));

  RETURN communication_id;
END;
$$;

-- Log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  user_id uuid,
  action text,
  resource_type text DEFAULT NULL,
  resource_id uuid DEFAULT NULL,
  metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_activity_log (user_id, action, resource_type, resource_id, metadata)
  VALUES (user_id, action, resource_type, resource_id, metadata);
END;
$$;

-- Track behavioral event
CREATE OR REPLACE FUNCTION track_behavioral_event(
  user_id uuid,
  event_type text,
  event_data jsonb DEFAULT '{}',
  session_id text DEFAULT NULL,
  page_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO behavioral_analytics (user_id, event_type, event_data, session_id, page_url)
  VALUES (user_id, event_type, event_data, session_id, page_url);
END;
$$;

-- Get support ticket statistics
CREATE OR REPLACE FUNCTION admin_get_support_stats()
RETURNS TABLE (
  total_tickets bigint,
  open_tickets bigint,
  in_progress_tickets bigint,
  resolved_today bigint,
  avg_resolution_time interval,
  tickets_by_category jsonb,
  tickets_by_priority jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM support_tickets)::bigint as total_tickets,
    (SELECT COUNT(*) FROM support_tickets WHERE status = 'open')::bigint as open_tickets,
    (SELECT COUNT(*) FROM support_tickets WHERE status = 'in_progress')::bigint as in_progress_tickets,
    (SELECT COUNT(*) FROM support_tickets WHERE DATE(resolved_at) = CURRENT_DATE)::bigint as resolved_today,
    (SELECT AVG(resolved_at - created_at) FROM support_tickets WHERE resolved_at IS NOT NULL) as avg_resolution_time,
    (SELECT jsonb_object_agg(category, count) FROM (SELECT category, COUNT(*) as count FROM support_tickets GROUP BY category) t) as tickets_by_category,
    (SELECT jsonb_object_agg(priority, count) FROM (SELECT priority, COUNT(*) as count FROM support_tickets GROUP BY priority) t) as tickets_by_priority;
END;
$$;