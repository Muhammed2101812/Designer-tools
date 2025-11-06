# Supabase Setup Checklist

Complete this checklist to set up your Supabase database for Design Kit.

## Prerequisites

- [ ] Supabase account created at https://supabase.com
- [ ] Node.js 18+ installed
- [ ] Git repository cloned
- [ ] `.env.local` file created from `.env.example`

## Step 1: Create Supabase Project

- [ ] Log in to Supabase dashboard
- [ ] Click "New Project"
- [ ] Enter project details:
  - [ ] Project name: `design-kit` (or your choice)
  - [ ] Database password: (generate strong password and save securely)
  - [ ] Region: (choose closest to your users)
- [ ] Click "Create new project"
- [ ] Wait for project provisioning (~2 minutes)

## Step 2: Get API Credentials

- [ ] Navigate to **Settings** → **API** in Supabase dashboard
- [ ] Copy **Project URL** to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy **anon public** key to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy **service_role** key to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Verify all three values are in `.env.local`

## Step 3: Run Database Migration

- [ ] Navigate to **SQL Editor** in Supabase dashboard
- [ ] Click "New Query"
- [ ] Open `supabase/migrations/001_initial_schema.sql` in your code editor
- [ ] Copy entire contents of the file
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" (or press Ctrl/Cmd + Enter)
- [ ] Verify success message: "Success. No rows returned"

## Step 4: Verify Database Setup

- [ ] In SQL Editor, click "New Query"
- [ ] Open `supabase/verify_setup.sql` in your code editor
- [ ] Copy entire contents
- [ ] Paste into SQL Editor and run
- [ ] Verify all checks show "✓ PASS"
- [ ] Review the setup summary at the end

## Step 5: Configure Authentication

### Email Authentication

- [ ] Navigate to **Authentication** → **Providers**
- [ ] Verify **Email** provider is enabled (should be by default)
- [ ] Configure email settings:
  - [ ] Enable "Confirm email" (recommended)
  - [ ] Set "Minimum password length" to 8
  - [ ] Enable "Secure password" requirements

### OAuth Providers (Optional)

#### Google OAuth

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [ ] Create OAuth 2.0 Client ID
- [ ] Add authorized redirect URIs:
  - [ ] `https://[your-project-ref].supabase.co/auth/v1/callback`
- [ ] Copy Client ID and Client Secret
- [ ] In Supabase, go to **Authentication** → **Providers**
- [ ] Enable **Google** provider
- [ ] Paste Client ID and Client Secret
- [ ] Save changes

#### GitHub OAuth (Optional)

- [ ] Go to [GitHub Developer Settings](https://github.com/settings/developers)
- [ ] Create new OAuth App
- [ ] Add callback URL: `https://[your-project-ref].supabase.co/auth/v1/callback`
- [ ] Copy Client ID and Client Secret
- [ ] In Supabase, enable **GitHub** provider
- [ ] Paste credentials and save

### URL Configuration

- [ ] Navigate to **Authentication** → **URL Configuration**
- [ ] Set **Site URL**:
  - [ ] Development: `http://localhost:3000`
  - [ ] Production: `https://yourdomain.com`
- [ ] Add **Redirect URLs**:
  - [ ] `http://localhost:3000/auth/callback`
  - [ ] `https://yourdomain.com/auth/callback`
  - [ ] Any other redirect URLs your app uses

## Step 6: Test Database Functions

- [ ] In SQL Editor, run test queries:

```sql
-- Test 1: Create a test profile (replace UUID with actual auth user ID)
-- You'll need to create a test user first through Auth UI

-- Test 2: Test get_or_create_daily_limit
SELECT * FROM get_or_create_daily_limit('test-user-uuid');

-- Test 3: Test can_use_api_tool
SELECT can_use_api_tool('test-user-uuid');

-- Test 4: Test increment_api_usage
SELECT * FROM increment_api_usage('test-user-uuid');
```

- [ ] Verify all functions return expected results
- [ ] Check for any errors in the output

## Step 7: Test RLS Policies

- [ ] Create two test users through Supabase Auth UI:
  - [ ] User 1: `test1@example.com`
  - [ ] User 2: `test2@example.com`
- [ ] Note their UUIDs from **Authentication** → **Users**
- [ ] Open `supabase/tests/test_rls_policies.sql`
- [ ] Replace placeholder UUIDs with actual test user UUIDs
- [ ] Run the test file in SQL Editor
- [ ] Verify all tests show "PASS"
- [ ] Delete test users after verification (optional)

## Step 8: Configure Email Templates (Optional)

- [ ] Navigate to **Authentication** → **Email Templates**
- [ ] Customize **Confirm signup** template:
  - [ ] Update subject line
  - [ ] Customize email body
  - [ ] Test with a real email
- [ ] Customize **Magic Link** template (if using)
- [ ] Customize **Reset Password** template:
  - [ ] Update subject and body
  - [ ] Test password reset flow
- [ ] Customize **Change Email** template

## Step 9: Set Up Database Backups

- [ ] Navigate to **Settings** → **Database**
- [ ] Scroll to **Backups** section
- [ ] Verify automatic backups are enabled
- [ ] Note backup schedule (daily by default)
- [ ] (Optional) Create manual backup:
  - [ ] Click "Create backup"
  - [ ] Wait for completion
  - [ ] Verify backup appears in list

## Step 10: Configure Security Settings

- [ ] Navigate to **Settings** → **API**
- [ ] Review **API Settings**:
  - [ ] Verify JWT expiry (default: 3600 seconds)
  - [ ] Check rate limiting settings
- [ ] Navigate to **Settings** → **Database**
- [ ] Review **Connection Pooling**:
  - [ ] Note connection string for production
  - [ ] Configure pool size if needed

## Step 11: Set Up Monitoring (Optional)

- [ ] Navigate to **Logs** → **Database**
- [ ] Review recent database logs
- [ ] Set up log retention period
- [ ] Navigate to **Logs** → **Auth**
- [ ] Review authentication logs
- [ ] Check for any suspicious activity

## Step 12: Local Development Setup

- [ ] Install Supabase CLI (optional):
  ```bash
  npm install -g supabase
  ```
- [ ] Login to Supabase:
  ```bash
  supabase login
  ```
- [ ] Link to your project:
  ```bash
  supabase link --project-ref your-project-ref
  ```
- [ ] Generate TypeScript types:
  ```bash
  supabase gen types typescript --project-id your-project-ref > lib/supabase/types.ts
  ```

## Step 13: Test Application Integration

- [ ] Start your Next.js development server:
  ```bash
  npm run dev
  ```
- [ ] Test authentication:
  - [ ] Sign up with new account
  - [ ] Verify email (check inbox)
  - [ ] Log in with credentials
  - [ ] Log out
  - [ ] Test password reset
- [ ] Test database operations:
  - [ ] View profile page
  - [ ] Update profile information
  - [ ] Check usage statistics
- [ ] Test RLS in application:
  - [ ] Create two accounts
  - [ ] Verify users can't see each other's data

## Step 14: Production Preparation

- [ ] Update production environment variables:
  - [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
  - [ ] Verify all Supabase credentials are correct
  - [ ] Add production redirect URLs to Supabase
- [ ] Configure custom domain (optional):
  - [ ] Navigate to **Settings** → **Custom Domains**
  - [ ] Add your domain
  - [ ] Configure DNS records
  - [ ] Verify SSL certificate
- [ ] Review security settings:
  - [ ] Ensure service role key is never exposed
  - [ ] Verify RLS policies are comprehensive
  - [ ] Check rate limiting configuration
  - [ ] Review CORS settings

## Step 15: Documentation and Handoff

- [ ] Document your Supabase project details:
  - [ ] Project name and reference ID
  - [ ] Region
  - [ ] Database password location
  - [ ] Backup schedule
- [ ] Save important links:
  - [ ] Supabase dashboard URL
  - [ ] Database connection strings
  - [ ] API documentation
- [ ] Share access with team members:
  - [ ] Navigate to **Settings** → **Team**
  - [ ] Invite team members
  - [ ] Set appropriate roles

## Troubleshooting

### Common Issues

**Issue: Migration fails with "relation already exists"**
- Solution: Tables already exist. Drop them first or skip migration.

**Issue: RLS policies blocking legitimate queries**
- Solution: Check that `auth.uid()` is returning correct user ID. Test with SQL Editor.

**Issue: Functions not found**
- Solution: Verify functions were created. Check `information_schema.routines`.

**Issue: Authentication not working**
- Solution: Verify redirect URLs are correct. Check Auth logs for errors.

**Issue: Can't connect to database**
- Solution: Verify credentials in `.env.local`. Check Supabase project status.

### Getting Help

- [ ] Check [Supabase Documentation](https://supabase.com/docs)
- [ ] Search [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [ ] Join [Supabase Discord](https://discord.supabase.com/)
- [ ] Review [Supabase Status](https://status.supabase.com/)

## Completion

- [ ] All checklist items completed
- [ ] Database schema verified
- [ ] Authentication tested
- [ ] RLS policies working
- [ ] Application connected successfully
- [ ] Team members have access
- [ ] Documentation updated

**Congratulations! Your Supabase database is ready for Design Kit! 🎉**

## Next Steps

1. Proceed to Task 3: Supabase Client Configuration
2. Set up Stripe integration (Task 4+)
3. Begin implementing authentication UI
4. Start building the Color Picker tool

---

**Last Updated:** 2024-01-XX  
**Version:** 1.0  
**Maintained by:** Design Kit Team
