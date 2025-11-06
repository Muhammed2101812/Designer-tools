# Supabase Setup Guide

This guide will help you set up Supabase for the Design Kit application.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- Git repository cloned

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the details:
   - **Name**: design-kit (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (for development)
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role** key (also starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Verify your environment setup:
   ```bash
   npm run check-env
   ```

## Step 4: Deploy Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl/Cmd + Enter)
6. Wait for the query to complete (should take a few seconds)
7. You should see "Success. No rows returned"

## Step 5: Verify Database Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see 4 tables:
   - `profiles`
   - `subscriptions`
   - `tool_usage`
   - `daily_limits`

3. Click on each table to verify the columns match the schema

4. Go to **Database** → **Functions** to verify these functions exist:
   - `can_use_api_tool`
   - `get_or_create_daily_limit`
   - `increment_api_usage`

## Step 6: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize signup confirmation, password reset emails

4. (Optional) Enable OAuth providers:
   - **Google**: Follow [Google OAuth setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
   - **GitHub**: Follow [GitHub OAuth setup guide](https://supabase.com/docs/guides/auth/social-login/auth-github)

## Step 7: Test Database Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000/api/test-db
   ```

3. You should see a JSON response like:
   ```json
   {
     "success": true,
     "message": "Supabase connection successful",
     "data": {
       "authenticated": false,
       "user": null,
       "tables": [
         { "table": "profiles", "exists": true },
         { "table": "subscriptions", "exists": true },
         { "table": "tool_usage", "exists": true },
         { "table": "daily_limits", "exists": true }
       ],
       "timestamp": "2024-01-01T00:00:00.000Z"
     }
   }
   ```

## Step 8: Verify Row Level Security

Run the RLS test queries to ensure security policies are working:

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/tests/test_rls_policies.sql`
3. Paste and run the query
4. All tests should pass

## Troubleshooting

### "Missing or invalid environment variables"

- Make sure `.env.local` exists in the project root
- Verify all required variables are set
- Run `npm run check-env` to diagnose

### "Database connection failed"

- Check that your Supabase project is active (not paused)
- Verify the Project URL is correct
- Ensure the anon key is correct
- Check your internet connection

### "Tables not found"

- Make sure you ran the migration SQL in Step 4
- Verify the SQL completed without errors
- Check the Table Editor to see if tables exist

### "RLS policy errors"

- Ensure you ran the complete migration SQL
- Check that RLS is enabled on all tables
- Verify policies exist in **Authentication** → **Policies**

### "Type errors in TypeScript"

- Run `npm run type-check` to see specific errors
- Ensure `@supabase/ssr` is installed: `npm install @supabase/ssr`
- Verify types match your database schema

## Next Steps

Once Supabase is set up, you can:

1. ✅ Implement authentication pages (Task 4)
2. ✅ Create user profile management (Task 6)
3. ✅ Build the Color Picker tool (Tasks 11-16)
4. ✅ Set up state management with Zustand (Task 5)

## Useful Commands

```bash
# Check environment variables
npm run check-env

# Run type checking
npm run type-check

# Start development server
npm run dev

# Generate TypeScript types from Supabase schema
npm run db:generate
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## Security Reminders

⚠️ **NEVER commit `.env.local` to git**
⚠️ **Keep service role key secret** (server-side only)
⚠️ **Rotate keys if accidentally exposed**
⚠️ **Use different keys for development/production**

## Support

If you encounter issues:

1. Check the [Supabase Discord](https://discord.supabase.com)
2. Review [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Check the project documentation in `project-docs/`
