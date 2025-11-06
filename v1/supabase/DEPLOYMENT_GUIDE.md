# Supabase Deployment Guide

## Task 2: Database Schema and Supabase Setup

This guide walks you through deploying the database schema to your Supabase project.

## Prerequisites

- [ ] Supabase account created at https://supabase.com
- [ ] Node.js 18+ installed
- [ ] Project cloned and dependencies installed (`npm install`)

## Step 1: Create Supabase Project (5 minutes)

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in project details:
   - **Organization**: Select or create one
   - **Name**: `design-kit` (or your preferred name)
   - **Database Password**: Click "Generate a password" and **SAVE IT SECURELY**
   - **Region**: Choose closest to your target users (e.g., `us-east-1`, `eu-west-1`)
   - **Pricing Plan**: Free (sufficient for development)
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning to complete

## Step 2: Get API Credentials (2 minutes)

1. In your Supabase project dashboard, click **Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following values:

   **Project URL** (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **service_role key** (also starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **IMPORTANT**: The service_role key bypasses Row Level Security. Never expose it to the client!

## Step 3: Configure Environment Variables (2 minutes)

1. Create `.env.local` file in project root:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and update these values:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Verify environment variables:
   ```bash
   npm run check-env
   ```

   Expected output:
   ```
   ✅ All required environment variables are set
   ```

## Step 4: Deploy Database Schema (5 minutes)

### Option A: Using Supabase Dashboard (Recommended)

1. In Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **"New Query"** button
3. Open `supabase/migrations/001_initial_schema.sql` in your code editor
4. Copy the **entire contents** of the file (Ctrl+A, Ctrl+C)
5. Paste into the SQL Editor in Supabase
6. Click **"Run"** button (or press Ctrl/Cmd + Enter)
7. Wait for execution to complete (10-15 seconds)
8. You should see: **"Success. No rows returned"**

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migration
supabase db push --file supabase/migrations/001_initial_schema.sql
```

## Step 5: Verify Database Setup (3 minutes)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open `supabase/verify_setup.sql` in your code editor
4. Copy and paste the entire contents
5. Click **"Run"**
6. Check the output - all checks should show **"✓ PASS"**

Expected output:
```
=== Checking Tables ===
✓ PASS: All required tables exist

=== Checking Row Level Security ===
✓ PASS: RLS enabled on all tables

=== Checking RLS Policies ===
✓ PASS: RLS policies exist (12 policies found)

=== Checking Indexes ===
✓ PASS: All required indexes exist

=== Checking Functions ===
✓ PASS: All required functions exist

=== Checking Triggers ===
✓ PASS: All required triggers exist

... (more checks)

✓ ALL CHECKS PASSED!
```

## Step 6: Verify Tables Created (1 minute)

1. In Supabase dashboard, click **Table Editor** in sidebar
2. You should see 4 tables:
   - ✅ `profiles` - User profile information
   - ✅ `subscriptions` - Stripe subscription data
   - ✅ `tool_usage` - Tool usage tracking
   - ✅ `daily_limits` - Daily API quota tracking

3. Click on each table to inspect the columns

## Step 7: Configure Authentication (3 minutes)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Verify **Email** provider is enabled (should be by default)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL**: `http://localhost:3000` (for development)
5. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/confirm`
   - Add your production URLs when deploying

6. (Optional) Configure email templates:
   - Go to **Authentication** → **Email Templates**
   - Customize "Confirm signup" and "Reset password" templates

## Step 8: Test Database Connection (2 minutes)

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/api/test-supabase
   ```

3. You should see a JSON response like:
   ```json
   {
     "success": true,
     "message": "Supabase connection successful",
     "tables": {
       "profiles": true,
       "subscriptions": true,
       "tool_usage": true,
       "daily_limits": true
     },
     "functions": {
       "can_use_api_tool": true,
       "get_or_create_daily_limit": true,
       "increment_api_usage": true
     }
   }
   ```

## Step 9: Test RLS Policies (Optional, 5 minutes)

To thoroughly test Row Level Security:

1. Create a test user through the signup page (once implemented)
2. In Supabase dashboard, go to **SQL Editor**
3. Open `supabase/tests/test_rls_policies.sql`
4. Replace `'test-user-uuid-1'` with your actual user UUID
5. Run the tests
6. All tests should pass

## Troubleshooting

### "Missing or invalid environment variables"

**Solution**:
- Ensure `.env.local` exists in project root
- Verify all three Supabase variables are set
- Run `npm run check-env` to diagnose
- Restart dev server after updating `.env.local`

### "Database connection failed"

**Solution**:
- Check that Supabase project is active (not paused)
- Verify Project URL is correct (no trailing slash)
- Ensure anon key is correct (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
- Check internet connection
- Try accessing Supabase dashboard to confirm project is running

### "Tables not found"

**Solution**:
- Ensure migration SQL was executed successfully
- Check for SQL errors in the Supabase SQL Editor
- Verify you're looking at the correct project
- Try running the migration again (it's idempotent with `IF NOT EXISTS`)

### "RLS policy errors"

**Solution**:
- Ensure complete migration was run (not partial)
- Check that RLS is enabled: Go to **Database** → **Tables** → Check "RLS enabled" column
- Verify policies exist: Go to **Authentication** → **Policies**
- Re-run the migration if policies are missing

### "Function does not exist"

**Solution**:
- Verify functions were created: Go to **Database** → **Functions**
- Check function names match exactly (case-sensitive)
- Re-run migration if functions are missing
- Ensure you're using the correct schema (public)

## Verification Checklist

Before proceeding to Task 3, ensure:

- [x] Supabase project created and active
- [x] API credentials copied to `.env.local`
- [x] Environment variables validated (`npm run check-env` passes)
- [x] Migration script executed successfully
- [x] All 4 tables exist in Table Editor
- [x] Verification script shows all checks passing
- [x] Database functions exist (can_use_api_tool, etc.)
- [x] RLS enabled on all tables
- [x] Authentication providers configured
- [x] Redirect URLs set up
- [x] Test API route returns success

## What Was Created

### Database Tables

1. **profiles** - User profile and plan information
   - Links to Supabase Auth users
   - Stores plan type (free/premium/pro)
   - Tracks Stripe customer ID

2. **subscriptions** - Stripe subscription data
   - Synced via Stripe webhooks
   - Tracks billing periods and status
   - One subscription per user

3. **tool_usage** - Usage analytics
   - Logs all tool operations
   - Tracks API vs client-side tools
   - Supports anonymous users

4. **daily_limits** - Quota enforcement
   - One record per user per day
   - Tracks API operation count
   - Automatically managed by functions

### Database Functions

1. **get_or_create_daily_limit(user_id)** - Gets or creates daily limit record
2. **can_use_api_tool(user_id)** - Checks if user has remaining quota
3. **increment_api_usage(user_id)** - Increments usage counter

### Security Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Service role can manage all data (for webhooks)
- ✅ Database functions use SECURITY DEFINER
- ✅ Input validation in all functions

### Performance Optimizations

- ✅ 10+ indexes for common queries
- ✅ Composite indexes for multi-column queries
- ✅ Partial indexes for filtered queries
- ✅ Foreign key indexes for joins

## Next Steps

Once Task 2 is complete:

1. **Task 3**: Supabase Client Configuration
   - Already complete! (`lib/supabase/client.ts` and `lib/supabase/server.ts`)
   - TypeScript types generated

2. **Task 4**: Authentication System Implementation
   - Build signup/login pages
   - Implement OAuth flows
   - Test authentication end-to-end

3. **Task 5**: State Management with Zustand
   - Create auth store
   - Implement session persistence

## Support Resources

### Documentation
- [Supabase Setup Guide](./README.md) - Complete setup guide
- [Quick Start Guide](./QUICK_START.md) - 10-minute quick start
- [Schema Reference](./SCHEMA_REFERENCE.md) - Database reference
- [Setup Checklist](./SETUP_CHECKLIST.md) - Detailed checklist

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase Discord](https://discord.supabase.com/)

## Security Reminders

⚠️ **NEVER commit `.env.local` to git**
⚠️ **Keep service role key secret** (server-side only)
⚠️ **Rotate keys if accidentally exposed**
⚠️ **Use different keys for development/production**
⚠️ **Add `.env.local` to `.gitignore`** (already done)

## Estimated Time

- **Total**: ~20-25 minutes
- **Supabase project creation**: 5 minutes
- **Get credentials**: 2 minutes
- **Configure environment**: 2 minutes
- **Deploy schema**: 5 minutes
- **Verify setup**: 3 minutes
- **Configure auth**: 3 minutes
- **Test connection**: 2 minutes

## Status

- [x] Migration file created (`001_initial_schema.sql`)
- [x] Verification script created (`verify_setup.sql`)
- [x] Test scripts created (`test_rls_policies.sql`)
- [x] Documentation created (README, guides, etc.)
- [ ] **Supabase project created** ← YOU ARE HERE
- [ ] **Migration deployed to Supabase**
- [ ] **Environment variables configured**
- [ ] **Connection tested**

---

**Ready to proceed?** Follow the steps above to complete Task 2!
