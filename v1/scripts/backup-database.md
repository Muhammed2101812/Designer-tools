# Database Backup Guide

This guide provides instructions for backing up your Supabase database before production deployment.

---

## 📋 Backup Methods

### Method 1: Supabase Dashboard (Recommended)

**Easiest method for most users:**

1. **Navigate to Supabase Dashboard**
   - Go to https://app.supabase.com/
   - Select your production project
   - Click "Database" → "Backups"

2. **View Existing Backups**
   - Supabase automatically creates daily backups
   - Free plan: 7 days retention
   - Pro plan: 30 days retention

3. **Create Manual Backup**
   - Click "Create backup" (if available on your plan)
   - Wait for backup to complete
   - Download backup if needed

### Method 2: Supabase CLI

**For developers who prefer command-line tools:**

#### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

#### Backup Schema

```bash
# Export database schema (tables, functions, policies)
supabase db dump --schema public > backup_schema_$(date +%Y%m%d).sql

# Or specify your project
supabase db dump --project-ref your-project-ref --schema public > backup_schema.sql
```

#### Backup Data

```bash
# Export all data from tables
supabase db dump --data-only > backup_data_$(date +%Y%m%d).sql

# Or specify your project
supabase db dump --project-ref your-project-ref --data-only > backup_data.sql
```

#### Full Backup (Schema + Data)

```bash
# Export everything
supabase db dump > backup_full_$(date +%Y%m%d).sql

# Or specify your project
supabase db dump --project-ref your-project-ref > backup_full.sql
```

### Method 3: pg_dump (Advanced)

**For advanced users with direct PostgreSQL access:**

#### Prerequisites

- PostgreSQL client tools installed
- Database connection string from Supabase

#### Get Connection String

1. Go to Supabase Dashboard → Settings → Database
2. Copy "Connection string" (Direct connection)
3. Replace `[YOUR-PASSWORD]` with your database password

#### Backup Commands

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# Backup schema only
pg_dump $DATABASE_URL --schema-only > backup_schema.sql

# Backup data only
pg_dump $DATABASE_URL --data-only > backup_data.sql

# Full backup
pg_dump $DATABASE_URL > backup_full.sql

# Backup specific tables
pg_dump $DATABASE_URL --table=profiles --table=subscriptions > backup_tables.sql
```

---

## 📦 What to Backup

### Essential Tables

Make sure your backup includes:

- `profiles` - User profile data
- `subscriptions` - Subscription information
- `tool_usage` - Usage tracking data
- `daily_limits` - Daily usage limits

### Database Objects

Your backup should include:

- **Tables:** All table structures and data
- **Functions:** Database functions (can_use_api_tool, increment_api_usage, etc.)
- **Policies:** Row Level Security policies
- **Indexes:** Performance indexes
- **Triggers:** Any database triggers

---

## 💾 Backup Storage

### Local Storage

```bash
# Create backups directory
mkdir -p backups

# Save backup with timestamp
supabase db dump > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Cloud Storage

**Upload to cloud storage for safety:**

```bash
# AWS S3
aws s3 cp backup_full.sql s3://your-bucket/backups/

# Google Cloud Storage
gsutil cp backup_full.sql gs://your-bucket/backups/

# Azure Blob Storage
az storage blob upload --file backup_full.sql --container backups
```

### Version Control (Schema Only)

```bash
# Add schema to git (NOT data for security)
git add supabase/migrations/
git commit -m "chore: backup database schema before deployment"
git push
```

⚠️ **NEVER commit sensitive data or credentials to git!**

---

## 🔄 Restore Procedures

### Restore from Supabase Dashboard

1. Go to Supabase Dashboard → Database → Backups
2. Find the backup you want to restore
3. Click "Restore" next to the backup
4. Confirm restoration
5. Wait for process to complete

### Restore from SQL File

```bash
# Using Supabase CLI
supabase db push --file backup_full.sql

# Using psql
psql $DATABASE_URL < backup_full.sql

# Restore specific tables
psql $DATABASE_URL < backup_tables.sql
```

---

## ✅ Pre-Deployment Backup Checklist

Before deploying to production:

- [ ] Create manual backup of production database
- [ ] Verify backup file is not empty
- [ ] Test backup file can be read
- [ ] Store backup in secure location
- [ ] Document backup date and version
- [ ] Keep backup accessible for 30 days minimum
- [ ] Verify all tables are included
- [ ] Verify all functions are included
- [ ] Verify all RLS policies are included

---

## 🔐 Backup Security

### Best Practices

1. **Encrypt Backups**
   ```bash
   # Encrypt backup file
   gpg --encrypt --recipient your@email.com backup_full.sql
   
   # Decrypt when needed
   gpg --decrypt backup_full.sql.gpg > backup_full.sql
   ```

2. **Secure Storage**
   - Store backups in encrypted storage
   - Use access controls
   - Limit who can access backups
   - Rotate backup encryption keys

3. **Retention Policy**
   - Keep daily backups for 7 days
   - Keep weekly backups for 4 weeks
   - Keep monthly backups for 12 months
   - Delete old backups securely

---

## 📅 Backup Schedule

### Recommended Schedule

**Development:**
- Manual backups before major changes
- Weekly automated backups

**Production:**
- Daily automated backups (Supabase handles this)
- Manual backup before deployments
- Manual backup before schema changes
- Manual backup before data migrations

---

## 🧪 Testing Backups

### Verify Backup Integrity

```bash
# Check backup file size
ls -lh backup_full.sql

# Check backup file content
head -n 20 backup_full.sql

# Verify SQL syntax
psql --dry-run < backup_full.sql
```

### Test Restore (Development Only)

```bash
# Create test database
createdb test_restore

# Restore to test database
psql test_restore < backup_full.sql

# Verify data
psql test_restore -c "SELECT COUNT(*) FROM profiles;"

# Clean up
dropdb test_restore
```

---

## 🚨 Emergency Recovery

### If Production Database is Lost

1. **Stop all services** to prevent data corruption
2. **Locate latest backup** from Supabase or your storage
3. **Create new database** if needed
4. **Restore from backup**
5. **Verify data integrity**
6. **Test critical functionality**
7. **Resume services**
8. **Document incident**

### Recovery Time Objective (RTO)

- Target: < 1 hour for critical data
- Depends on backup size and method
- Test recovery process regularly

---

## 📊 Backup Verification

### Post-Backup Checks

```sql
-- Verify table counts
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verify row counts
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'tool_usage', COUNT(*) FROM tool_usage
UNION ALL
SELECT 'daily_limits', COUNT(*) FROM daily_limits;

-- Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- Verify RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 📝 Backup Documentation

### Document Each Backup

Create a backup log with:

```
Backup Date: 2025-10-18
Backup Time: 14:30:00 UTC
Backup Method: Supabase CLI
Backup File: backup_20251018_143000.sql
Backup Size: 2.5 MB
Tables Included: profiles, subscriptions, tool_usage, daily_limits
Row Counts:
  - profiles: 150
  - subscriptions: 25
  - tool_usage: 1,250
  - daily_limits: 180
Backup Location: s3://backups/production/
Verified: Yes
Notes: Pre-deployment backup before v1.0 launch
```

---

## 🔗 Additional Resources

- **Supabase Backup Docs:** https://supabase.com/docs/guides/platform/backups
- **PostgreSQL Backup:** https://www.postgresql.org/docs/current/backup.html
- **Supabase CLI:** https://supabase.com/docs/guides/cli

---

## ⚠️ Important Notes

1. **Automated Backups:** Supabase provides automated daily backups. Manual backups are additional safety.

2. **Backup Frequency:** More frequent backups = less data loss in case of issues.

3. **Test Restores:** Regularly test your backup restoration process.

4. **Security:** Never commit backups with real data to version control.

5. **Compliance:** Ensure backups comply with data protection regulations (GDPR, etc.).

---

**Last Updated:** October 18, 2025  
**Version:** 1.0

---

<p align="center">
  <strong>💾 Always backup before major changes! 🔒</strong>
</p>
