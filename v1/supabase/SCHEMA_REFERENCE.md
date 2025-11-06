# Database Schema Reference

Quick reference guide for the Design Kit database schema.

## Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profile data | id, email, plan, stripe_customer_id |
| `subscriptions` | Stripe subscription info | user_id, status, plan, current_period_end |
| `tool_usage` | Usage tracking & analytics | user_id, tool_name, is_api_tool, created_at |
| `daily_limits` | Daily API quota tracking | user_id, date, api_tools_count |
| `email_preferences` | Email notification settings | user_id, marketing_emails, quota_warnings, subscription_updates |

## Table Details

### profiles

Stores user profile information linked to Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                    -- References auth.users(id)
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',               -- 'free', 'premium', 'pro'
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Plan Limits:**
- `free`: 10 daily API operations
- `premium`: 500 daily API operations ($9/mo)
- `pro`: 2000 daily API operations ($29/mo)

**RLS Policies:**
- Users can SELECT, UPDATE, INSERT their own profile
- No user can view other users' profiles

### subscriptions

Stores Stripe subscription data synced via webhooks.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,                    -- One subscription per user
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT,                            -- 'active', 'canceled', 'past_due', etc.
  plan TEXT,                              -- 'premium', 'pro'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Status Values:**
- `active`: Subscription is active
- `canceled`: Subscription canceled
- `past_due`: Payment failed
- `trialing`: In trial period
- `incomplete`: Initial payment pending
- `incomplete_expired`: Initial payment failed
- `unpaid`: Payment failed multiple times

**RLS Policies:**
- Users can SELECT their own subscription
- Service role can manage all subscriptions (for webhooks)

### tool_usage

Tracks all tool usage for analytics and debugging.

```sql
CREATE TABLE tool_usage (
  id UUID PRIMARY KEY,
  user_id UUID,                           -- NULL for anonymous users
  tool_name TEXT NOT NULL,
  is_api_tool BOOLEAN DEFAULT FALSE,      -- Counts against quota if true
  file_size_mb DECIMAL(10, 2),
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP
);
```

**Tool Names:**
- Client-side: `color-picker`, `image-cropper`, `image-resizer`, `format-converter`, `qr-generator`, `gradient-generator`
- API-powered: `image-compressor`, `background-remover`, `image-upscaler`, `mockup-generator`

**RLS Policies:**
- Users can SELECT their own usage
- Users can INSERT their own usage (or anonymous)
- Service role can SELECT all usage (for analytics)

### daily_limits

Tracks daily API usage per user for quota enforcement.

```sql
CREATE TABLE daily_limits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  api_tools_count INTEGER DEFAULT 0,      -- Number of API operations today
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, date)
);
```

**RLS Policies:**
- Users can SELECT, INSERT, UPDATE their own limits
- Enforced by database functions

### email_preferences

Stores user preferences for email notifications.

```sql
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,           -- One preference record per user
  marketing_emails BOOLEAN DEFAULT TRUE,
  quota_warnings BOOLEAN DEFAULT TRUE,
  subscription_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Preference Types:**
- `marketing_emails`: Promotional and feature announcement emails
- `quota_warnings`: Notifications when quota reaches 90%
- `subscription_updates`: Billing and subscription change notifications

**RLS Policies:**
- Users can SELECT, INSERT, UPDATE, DELETE their own preferences
- Service role can manage all preferences (for admin operations)

## Database Functions

### get_or_create_daily_limit(user_id UUID)

Gets or creates a daily limit record for the user.

```sql
SELECT * FROM get_or_create_daily_limit('user-uuid-here');
```

**Returns:** `daily_limits` record

**Use Case:** Called before checking quota or incrementing usage.

### can_use_api_tool(user_id UUID)

Checks if user has remaining API quota for today.

```sql
SELECT can_use_api_tool('user-uuid-here');
```

**Returns:** `BOOLEAN` (true if under quota, false if at/over limit)

**Logic:**
1. Gets user's plan from `profiles`
2. Determines quota limit (10/500/2000)
3. Gets current usage from `daily_limits`
4. Returns true if `current_usage < limit`

**Use Case:** Call before processing API tool request.

### increment_api_usage(user_id UUID)

Increments the API usage count for the user today.

```sql
SELECT * FROM increment_api_usage('user-uuid-here');
```

**Returns:** Updated `daily_limits` record

**Use Case:** Call after successfully processing API tool request.

### create_default_email_preferences(user_id UUID)

Creates default email preferences for a new user.

```sql
SELECT * FROM create_default_email_preferences('user-uuid-here');
```

**Returns:** `email_preferences` record

**Use Case:** Call during user signup to initialize email preferences.

### get_email_preferences(user_id UUID)

Gets email preferences for a user, creating defaults if they don't exist.

```sql
SELECT * FROM get_email_preferences('user-uuid-here');
```

**Returns:** `email_preferences` record

**Use Case:** Call before sending any email to check user preferences.

## Indexes

Performance indexes for common queries:

```sql
-- Profiles
idx_profiles_email
idx_profiles_stripe_customer

-- Subscriptions
idx_subscriptions_user_id
idx_subscriptions_stripe_id
idx_subscriptions_status

-- Tool Usage
idx_tool_usage_user_date
idx_tool_usage_tool_name
idx_tool_usage_api_tools
idx_tool_usage_created_at

-- Daily Limits
idx_daily_limits_user_date
idx_daily_limits_date

-- Email Preferences
idx_email_preferences_user_id
```

## Common Queries

### Get User Profile with Subscription

```sql
SELECT 
  p.*,
  s.plan as subscription_plan,
  s.status as subscription_status,
  s.current_period_end
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.id = 'user-uuid-here';
```

### Get User's Daily Usage

```sql
SELECT 
  p.plan,
  COALESCE(dl.api_tools_count, 0) as used,
  CASE p.plan
    WHEN 'free' THEN 10
    WHEN 'premium' THEN 500
    WHEN 'pro' THEN 2000
  END as limit
FROM profiles p
LEFT JOIN daily_limits dl ON dl.user_id = p.id AND dl.date = CURRENT_DATE
WHERE p.id = 'user-uuid-here';
```

### Get Tool Usage Statistics

```sql
SELECT 
  tool_name,
  COUNT(*) as total_uses,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  AVG(processing_time_ms) as avg_processing_time,
  AVG(file_size_mb) as avg_file_size
FROM tool_usage
WHERE user_id = 'user-uuid-here'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY tool_name
ORDER BY total_uses DESC;
```

### Get Active Subscriptions

```sql
SELECT 
  p.email,
  p.full_name,
  s.plan,
  s.status,
  s.current_period_end
FROM subscriptions s
JOIN profiles p ON p.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.current_period_end DESC;
```

### Check Quota Before API Call

```sql
-- Complete quota check workflow
DO $$
DECLARE
  v_user_id UUID := 'user-uuid-here';
  v_can_use BOOLEAN;
BEGIN
  -- Check if user can use API tool
  SELECT can_use_api_tool(v_user_id) INTO v_can_use;
  
  IF v_can_use THEN
    -- Process the API request here
    -- ...
    
    -- Increment usage after success
    PERFORM increment_api_usage(v_user_id);
    
    RAISE NOTICE 'API request processed successfully';
  ELSE
    RAISE EXCEPTION 'Daily quota exceeded';
  END IF;
END $$;
```

### Get Email Preferences Before Sending

```sql
-- Check if user wants to receive quota warnings
SELECT 
  p.email,
  ep.quota_warnings,
  ep.subscription_updates,
  ep.marketing_emails
FROM profiles p
LEFT JOIN email_preferences ep ON ep.user_id = p.id
WHERE p.id = 'user-uuid-here';
```

### Create Email Preferences for New User

```sql
-- Initialize preferences during signup
SELECT * FROM create_default_email_preferences('user-uuid-here');

-- Or use get_email_preferences which creates if not exists
SELECT * FROM get_email_preferences('user-uuid-here');
```

## Triggers

### update_updated_at_column()

Automatically updates `updated_at` timestamp on UPDATE.

**Applied to:**
- `profiles`
- `subscriptions`
- `daily_limits`
- `email_preferences`

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data.

**Testing RLS:**

```sql
-- Set user context
SET request.jwt.claims.sub = 'user-uuid-here';

-- This will only return the user's own data
SELECT * FROM profiles;
SELECT * FROM subscriptions;
SELECT * FROM tool_usage;
SELECT * FROM daily_limits;
```

### Service Role Access

The service role key bypasses RLS and should only be used:
- In server-side API routes
- For Stripe webhook handlers
- For admin operations
- Never in client-side code

## Maintenance

### Clean Old Usage Data

```sql
-- Delete tool usage older than 90 days
DELETE FROM tool_usage
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Clean Old Daily Limits

```sql
-- Delete daily limits older than 30 days
DELETE FROM daily_limits
WHERE date < CURRENT_DATE - INTERVAL '30 days';
```

### Reset Email Preferences to Defaults

```sql
-- Reset a user's email preferences to defaults
UPDATE email_preferences
SET 
  marketing_emails = true,
  quota_warnings = true,
  subscription_updates = true,
  updated_at = NOW()
WHERE user_id = 'user-uuid-here';
```

### Vacuum Tables

```sql
-- Reclaim storage and update statistics
VACUUM ANALYZE profiles;
VACUUM ANALYZE subscriptions;
VACUUM ANALYZE tool_usage;
VACUUM ANALYZE daily_limits;
VACUUM ANALYZE email_preferences;
```

## Monitoring

### Check Table Sizes

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Active Connections

```sql
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = current_database();
```

### Check Slow Queries

```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Backup and Restore

### Create Backup

```bash
# Using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql

# Or using pg_dump
pg_dump "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" > backup.sql
```

### Restore Backup

```bash
# Using psql
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" < backup.sql
```

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 001 | 2024-01-XX | Initial schema with profiles, subscriptions, tool_usage, daily_limits |
| 002 | 2024-01-XX | Avatar storage bucket and policies |
| 003 | 2024-01-XX | Email preferences table and additional indexes |

## Related Documentation

- [Supabase Setup Guide](./README.md)
- [RLS Policy Tests](./tests/test_rls_policies.sql)
- [Design Document](../.kiro/specs/design-kit-mvp/design.md)
- [Requirements Document](../.kiro/specs/design-kit-mvp/requirements.md)
