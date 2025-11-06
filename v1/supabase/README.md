# Supabase Setup Guide

This directory contains database migrations and setup instructions for the Design Kit application.

## Prerequisites

- Supabase account (sign up at https://supabase.com)
- Supabase CLI installed (optional, for local development)

## Quick Setup (Supabase Dashboard)

### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - **Name**: design-kit (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for provisioning (~2 minutes)

### 2. Get API Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values to your `.env.local` file:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### 3. Run Database Migration

1. In your project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl/Cmd + Enter)
6. Verify success: You should see "Success. No rows returned"

### 4. Verify Schema

Run this query in the SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `daily_limits`
- `profiles`
- `subscriptions`
- `tool_usage`

### 5. Test RLS Policies

Run this query to verify Row Level Security is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

### 6. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. (Optional) Enable **Google** OAuth:
   - Toggle "Google Enabled"
   - Add your Google OAuth credentials
   - Configure authorized redirect URIs
4. Go to **Authentication** → **URL Configuration**
5. Set **Site URL** to your app URL (e.g., `http://localhost:3000` for dev)
6. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### 7. Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

## Advanced Setup (Supabase CLI)

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### Initialize Local Development

```bash
# Initialize Supabase in your project
supabase init

# Start local Supabase (Docker required)
supabase start

# This will start:
# - PostgreSQL database
# - Supabase Studio (local dashboard)
# - Auth server
# - Storage server
# - Realtime server
```

### Link to Remote Project

```bash
# Login to Supabase
supabase login

# Link to your remote project
supabase link --project-ref your-project-ref

# Get project ref from: Settings → General → Reference ID
```

### Run Migrations

```bash
# Run all migrations
supabase db push

# Or run specific migration
supabase db push --file migrations/001_initial_schema.sql
```

### Generate TypeScript Types

```bash
# Generate types from your database schema
supabase gen types typescript --local > lib/supabase/types.ts

# Or from remote project
supabase gen types typescript --project-id your-project-ref > lib/supabase/types.ts
```

## Database Functions Reference

### `get_or_create_daily_limit(user_id UUID)`

Gets or creates a daily limit record for the specified user.

```sql
SELECT * FROM get_or_create_daily_limit('user-uuid-here');
```

### `can_use_api_tool(user_id UUID)`

Checks if user has remaining API quota for today.

```sql
SELECT can_use_api_tool('user-uuid-here');
-- Returns: true or false
```

### `increment_api_usage(user_id UUID)`

Increments the API usage count for the user today.

```sql
SELECT * FROM increment_api_usage('user-uuid-here');
-- Returns: updated daily_limits record
```

## Testing RLS Policies

### Test as Authenticated User

```sql
-- Set user context (replace with actual user UUID)
SET request.jwt.claims.sub = 'user-uuid-here';

-- Try to view own profile (should work)
SELECT * FROM profiles WHERE id = 'user-uuid-here';

-- Try to view another user's profile (should return empty)
SELECT * FROM profiles WHERE id = 'different-user-uuid';
```

### Test Quota System

```sql
-- Check current usage
SELECT * FROM daily_limits WHERE user_id = 'user-uuid-here' AND date = CURRENT_DATE;

-- Check if can use API tool
SELECT can_use_api_tool('user-uuid-here');

-- Increment usage
SELECT * FROM increment_api_usage('user-uuid-here');

-- Verify increment
SELECT * FROM daily_limits WHERE user_id = 'user-uuid-here' AND date = CURRENT_DATE;
```

## Troubleshooting

### Migration Fails

**Error: "relation already exists"**
- Tables already exist. Drop them first or modify migration.
- Run: `DROP TABLE IF EXISTS profiles, subscriptions, tool_usage, daily_limits CASCADE;`

**Error: "permission denied"**
- Make sure you're running as database owner
- Check that RLS policies aren't blocking the operation

### RLS Policies Not Working

**Users can see other users' data**
- Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- Check policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
- Ensure `auth.uid()` returns correct user ID

### Functions Not Working

**Error: "function does not exist"**
- Verify function was created: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';`
- Check function signature matches call
- Ensure `SECURITY DEFINER` is set

### Performance Issues

**Slow queries**
- Check indexes exist: `SELECT * FROM pg_indexes WHERE schemaname = 'public';`
- Run `EXPLAIN ANALYZE` on slow queries
- Consider adding more indexes for common query patterns

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key stored securely (never in client code)
- [ ] Anon key only used for client-side operations
- [ ] RLS policies tested for data isolation
- [ ] Database functions use `SECURITY DEFINER` with input validation
- [ ] Indexes created for performance
- [ ] Email verification enabled for signups
- [ ] Password strength requirements configured
- [ ] OAuth redirect URIs whitelisted

## Backup and Maintenance

### Create Backup

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or from dashboard: Settings → Database → Backups
```

### Restore Backup

```bash
# Using Supabase CLI
supabase db reset --db-url "postgresql://..."
psql -f backup.sql "postgresql://..."
```

### Monitor Usage

1. Go to **Database** → **Usage**
2. Monitor:
   - Database size
   - Active connections
   - Query performance
   - API requests

## Next Steps

After completing the database setup:

1. ✅ Update `.env.local` with Supabase credentials
2. ✅ Test authentication flow (signup/login)
3. ✅ Verify RLS policies work correctly
4. ✅ Test quota system with API tools
5. ✅ Generate TypeScript types for type safety
6. ✅ Set up Stripe webhooks to sync subscriptions

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

If you encounter issues:

1. Check [Supabase Status](https://status.supabase.com/)
2. Search [Supabase Discussions](https://github.com/supabase/supabase/discussions)
3. Join [Supabase Discord](https://discord.supabase.com/)
4. Review project logs in dashboard: **Logs** → **Database**
