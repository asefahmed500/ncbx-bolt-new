# 👨‍💼 Administrator Guide

This guide covers administrative tasks, monitoring, and maintenance for the NCBX Website Builder.

## 📊 Admin Dashboard Overview

### Key Metrics to Monitor
- **User Growth**: New registrations per day/week/month
- **Website Creation**: Websites created and published
- **Plan Distribution**: Free vs Pro vs Business users
- **System Performance**: Response times, error rates
- **Storage Usage**: Database size, file storage

## 👥 User Management

### User Analytics Queries

```sql
-- Total users by plan
SELECT 
  plan,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM profiles
GROUP BY plan
ORDER BY user_count DESC;

-- User growth over time
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_users
FROM profiles
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month;

-- Active users (created website in last 30 days)
SELECT COUNT(DISTINCT user_id) as active_users
FROM websites
WHERE created_at >= NOW() - INTERVAL '30 days';

-- User engagement metrics
SELECT 
  p.plan,
  COUNT(w.id) as total_websites,
  AVG(CASE WHEN w.status = 'published' THEN 1.0 ELSE 0.0 END) as publish_rate
FROM profiles p
LEFT JOIN websites w ON p.id = w.user_id
GROUP BY p.plan;
```

### User Support Tasks

#### Common Support Scenarios

**1. Password Reset Issues**
```sql
-- Check user's last login
SELECT 
  email,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'user@example.com';
```

**2. Account Verification Problems**
```sql
-- Check email confirmation status
SELECT 
  email,
  email_confirmed_at,
  confirmation_sent_at
FROM auth.users
WHERE email = 'user@example.com';
```

**3. Plan Upgrade Issues**
```sql
-- Update user plan
UPDATE profiles
SET plan = 'pro'
WHERE email = 'user@example.com';
```

#### User Data Export
```sql
-- Export user's complete data
SELECT 
  p.*,
  json_agg(
    json_build_object(
      'id', w.id,
      'name', w.name,
      'status', w.status,
      'created_at', w.created_at
    )
  ) as websites
FROM profiles p
LEFT JOIN websites w ON p.id = w.user_id
WHERE p.email = 'user@example.com'
GROUP BY p.id;
```

## 🌐 Website Management

### Website Analytics

```sql
-- Website statistics
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600), 2) as avg_edit_hours
FROM websites
GROUP BY status;

-- Popular templates
SELECT 
  template,
  COUNT(*) as usage_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM websites
GROUP BY template
ORDER BY usage_count DESC
LIMIT 10;

-- Website creation trends
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as websites_created
FROM websites
WHERE created_at >= NOW() - INTERVAL '12 weeks'
GROUP BY week
ORDER BY week;
```

### Content Moderation

#### Review Published Websites
```sql
-- Recently published websites
SELECT 
  w.name,
  w.domain,
  p.email as owner_email,
  w.updated_at as published_at
FROM websites w
JOIN profiles p ON w.user_id = p.id
WHERE w.status = 'published'
  AND w.updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY w.updated_at DESC;
```

#### Bulk Operations
```sql
-- Unpublish websites (if needed)
UPDATE websites
SET status = 'draft'
WHERE domain LIKE '%inappropriate-content%';

-- Delete spam websites
DELETE FROM websites
WHERE name ILIKE '%spam%'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

## 🔧 System Maintenance

### Database Maintenance

#### Performance Monitoring
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Cleanup Tasks
```sql
-- Remove old deleted websites (soft delete implementation)
DELETE FROM websites
WHERE status = 'deleted'
  AND updated_at < NOW() - INTERVAL '30 days';

-- Clean up orphaned profiles
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users);
```

### Backup Procedures

#### Daily Backup Script
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_URL="your-supabase-db-url"

# Create backup
pg_dump $DB_URL > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

#### Backup Verification
```sql
-- Verify backup integrity
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_users
FROM profiles;

SELECT 
  COUNT(*) as total_websites,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_websites
FROM websites;
```

## 🔒 Security Management

### Security Monitoring

#### Failed Login Attempts
```sql
-- Monitor authentication failures
SELECT 
  email,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM auth.audit_log_entries
WHERE event_type = 'user_signinup_failed'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY email
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

#### Suspicious Activity
```sql
-- Multiple accounts from same IP (requires custom logging)
-- Users with unusual website creation patterns
SELECT 
  user_id,
  COUNT(*) as websites_created,
  MIN(created_at) as first_website,
  MAX(created_at) as last_website
FROM websites
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY websites_created DESC;
```

### Security Policies

#### Update RLS Policies
```sql
-- Ensure strict user isolation
DROP POLICY IF EXISTS "Users can read own websites" ON websites;
CREATE POLICY "Users can read own websites"
  ON websites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add audit logging
CREATE OR REPLACE FUNCTION log_website_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    operation,
    user_id,
    old_data,
    new_data,
    timestamp
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    row_to_json(OLD),
    row_to_json(NEW),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## 📈 Analytics and Reporting

### Business Intelligence Queries

#### Revenue Analytics (if applicable)
```sql
-- Revenue by plan
SELECT 
  plan,
  COUNT(*) as subscribers,
  CASE 
    WHEN plan = 'pro' THEN COUNT(*) * 12
    WHEN plan = 'business' THEN COUNT(*) * 39
    ELSE 0
  END as monthly_revenue
FROM profiles
WHERE plan != 'free'
GROUP BY plan;
```

#### User Engagement
```sql
-- User engagement score
WITH user_activity AS (
  SELECT 
    p.id,
    p.email,
    p.plan,
    COUNT(w.id) as website_count,
    COUNT(CASE WHEN w.status = 'published' THEN 1 END) as published_count,
    MAX(w.updated_at) as last_activity
  FROM profiles p
  LEFT JOIN websites w ON p.id = w.user_id
  GROUP BY p.id, p.email, p.plan
)
SELECT 
  plan,
  AVG(website_count) as avg_websites,
  AVG(published_count) as avg_published,
  COUNT(CASE WHEN last_activity >= NOW() - INTERVAL '7 days' THEN 1 END) as active_last_week
FROM user_activity
GROUP BY plan;
```

### Automated Reports

#### Daily Report Script
```bash
#!/bin/bash
# daily-report.sh

DATE=$(date +%Y-%m-%d)
REPORT_FILE="/reports/daily_report_$DATE.txt"

echo "NCBX Daily Report - $DATE" > $REPORT_FILE
echo "================================" >> $REPORT_FILE

# User statistics
psql $DB_URL -c "
SELECT 
  'New Users Today: ' || COUNT(*)
FROM profiles
WHERE DATE(created_at) = CURRENT_DATE;
" >> $REPORT_FILE

# Website statistics
psql $DB_URL -c "
SELECT 
  'Websites Created Today: ' || COUNT(*)
FROM websites
WHERE DATE(created_at) = CURRENT_DATE;
" >> $REPORT_FILE

# Email report
mail -s "NCBX Daily Report - $DATE" admin@ncbx.com < $REPORT_FILE
```

## 🚨 Incident Response

### Common Issues and Solutions

#### High Database Load
1. **Identify slow queries**
2. **Add missing indexes**
3. **Optimize query patterns**
4. **Scale database resources**

#### Authentication Issues
1. **Check Supabase status**
2. **Verify JWT configuration**
3. **Review RLS policies**
4. **Check rate limiting**

#### Storage Issues
1. **Monitor disk usage**
2. **Clean up old backups**
3. **Archive inactive data**
4. **Optimize file storage**

### Emergency Procedures

#### System Outage
1. **Check system status**
2. **Identify root cause**
3. **Implement temporary fix**
4. **Communicate with users**
5. **Deploy permanent solution**
6. **Post-incident review**

#### Data Breach Response
1. **Isolate affected systems**
2. **Assess breach scope**
3. **Notify stakeholders**
4. **Implement security fixes**
5. **Monitor for further issues**
6. **Update security policies**

## 📞 Support Escalation

### Support Tiers

**Tier 1: General Support**
- Account issues
- Basic troubleshooting
- Feature questions

**Tier 2: Technical Support**
- Database issues
- Integration problems
- Performance issues

**Tier 3: Engineering**
- System outages
- Security incidents
- Complex technical issues

### Contact Information
- **Emergency**: emergency@ncbx.com
- **Technical**: tech-support@ncbx.com
- **Business**: business@ncbx.com

---

*This guide should be reviewed and updated quarterly to ensure accuracy and completeness.*