# Supabase Quick Start Guide

Get your Design Kit database up and running in 10 minutes.

## 🚀 5-Minute Setup

### Step 1: Create Project (2 minutes)

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in:
   - Name: `design-kit`
   - Password: Generate strong password (save it!)
   - Region: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### Step 2: Get Credentials (1 minute)

1. Go to **Settings** → **API**
2. Copy these three values:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# anon public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (⚠️ Keep secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Paste into your `.env.local` file

### Step 3: Run Migration (2 minutes)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open `supabase/migrations/001_initial_schema.sql` in your code editor
4. Copy **entire file** contents
5. Paste into SQL Editor
6. Click **"Run"** (or Ctrl/Cmd + Enter)
7. Wait for "Success. No rows returned" message

### Step 4: Verify Setup (1 minute)

1. In SQL Editor, click **"New Query"**
2. Open `supabase/verify_setup.sql`
3. Copy and paste contents
4. Click **"Run"**
5. Check all tests show **"✓ PASS"**

### Step 5: Configure Auth (1 minute)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URL**: `http://localhost:3000/auth/callback`
4. Click **"Save"**

## ✅ Done!

Your database is ready. Start your app:

```bash
npm run dev
```

Visit http://localhost:3000

## 🔍 Verify It Works

Test authentication:

1. Go to http://localhost:3000/signup
2. Create an account
3. Check email for verification
4. Log in

Check database:

1. Go to Supabase **Table Editor**
2. You should see: `profiles`, `subscriptions`, `tool_usage`, `daily_limits`
3. Click `profiles` - your user should be there

## 🆘 Troubleshooting

### Migration Failed

**Error: "relation already exists"**

Tables already exist. Either:
- Skip migration (already done)
- Or drop tables first:

```sql
DROP TABLE IF EXISTS profiles, subscriptions, tool_usage, daily_limits CASCADE;
```

Then run migration again.

### Can't Connect

**Error: "Invalid API key"**

1. Check `.env.local` has correct values
2. Restart dev server: `npm run dev`
3. Verify no extra spaces in `.env.local`

### Auth Not Working

**Error: "Invalid redirect URL"**

1. Go to **Authentication** → **URL Configuration**
2. Add: `http://localhost:3000/auth/callback`
3. Make sure no typos

## 📚 Next Steps

- [ ] Read [Full Setup Guide](./README.md) for production setup
- [ ] Follow [Setup Checklist](./SETUP_CHECKLIST.md) for complete configuration
- [ ] Review [Schema Reference](./SCHEMA_REFERENCE.md) for database details
- [ ] Test [RLS Policies](./tests/test_rls_policies.sql) for security

## 🎯 What You Just Created

### Tables
- **profiles**: User accounts and plan info
- **subscriptions**: Stripe payment tracking
- **tool_usage**: Analytics and logging
- **daily_limits**: API quota management

### Security
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only see their own data
- ✅ Secure authentication with Supabase Auth

### Functions
- `can_use_api_tool()` - Check quota
- `increment_api_usage()` - Track usage
- `get_or_create_daily_limit()` - Manage limits

## 💡 Pro Tips

1. **Generate TypeScript Types**
   ```bash
   npx supabase gen types typescript --project-id your-project-ref > lib/supabase/types.ts
   ```

2. **Test RLS Policies**
   - Create 2 test users
   - Try to access each other's data
   - Should be blocked by RLS

3. **Monitor Usage**
   - Go to **Database** → **Usage**
   - Check connection count
   - Review query performance

4. **Backup Database**
   - Go to **Settings** → **Database** → **Backups**
   - Automatic daily backups enabled
   - Create manual backup before major changes

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [SQL Editor](https://app.supabase.com/project/_/sql)
- [Table Editor](https://app.supabase.com/project/_/editor)
- [Auth Settings](https://app.supabase.com/project/_/auth/users)

## 🎉 You're Ready!

Database is set up and ready for development. Start building your tools!

Need help? Check:
- [Full Setup Guide](./README.md)
- [Setup Checklist](./SETUP_CHECKLIST.md)
- [Schema Reference](./SCHEMA_REFERENCE.md)
- [Supabase Discord](https://discord.supabase.com/)
