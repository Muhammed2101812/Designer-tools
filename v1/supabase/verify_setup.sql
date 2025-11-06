-- ============================================
-- Database Setup Verification Script
-- ============================================
-- Run this script in Supabase SQL Editor to verify
-- that the database schema is set up correctly.
--
-- Expected output: All checks should show "✓ PASS"
-- ============================================

-- ============================================
-- CHECK 1: Tables Exist
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
  expected_tables TEXT[] := ARRAY['profiles', 'subscriptions', 'tool_usage', 'daily_limits'];
  missing_tables TEXT[];
BEGIN
  RAISE NOTICE '=== Checking Tables ===';
  
  -- Check each expected table
  SELECT array_agg(t)
  INTO missing_tables
  FROM unnest(expected_tables) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );
  
  IF missing_tables IS NULL THEN
    RAISE NOTICE '✓ PASS: All required tables exist';
  ELSE
    RAISE EXCEPTION '✗ FAIL: Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- ============================================
-- CHECK 2: RLS Enabled
-- ============================================

DO $$
DECLARE
  tables_without_rls TEXT[];
BEGIN
  RAISE NOTICE '=== Checking Row Level Security ===';
  
  SELECT array_agg(tablename)
  INTO tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'subscriptions', 'tool_usage', 'daily_limits')
    AND rowsecurity = false;
  
  IF tables_without_rls IS NULL THEN
    RAISE NOTICE '✓ PASS: RLS enabled on all tables';
  ELSE
    RAISE EXCEPTION '✗ FAIL: RLS not enabled on: %', array_to_string(tables_without_rls, ', ');
  END IF;
END $$;

-- ============================================
-- CHECK 3: RLS Policies Exist
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== Checking RLS Policies ===';
  
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  IF policy_count >= 10 THEN
    RAISE NOTICE '✓ PASS: RLS policies exist (% policies found)', policy_count;
  ELSE
    RAISE EXCEPTION '✗ FAIL: Expected at least 10 policies, found %', policy_count;
  END IF;
END $$;

-- ============================================
-- CHECK 4: Indexes Exist
-- ============================================

DO $$
DECLARE
  index_count INTEGER;
  expected_indexes TEXT[] := ARRAY[
    'idx_profiles_email',
    'idx_subscriptions_user_id',
    'idx_tool_usage_user_date',
    'idx_tool_usage_tool_name',
    'idx_daily_limits_user_date'
  ];
  missing_indexes TEXT[];
BEGIN
  RAISE NOTICE '=== Checking Indexes ===';
  
  SELECT array_agg(idx)
  INTO missing_indexes
  FROM unnest(expected_indexes) AS idx
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = idx
  );
  
  IF missing_indexes IS NULL THEN
    RAISE NOTICE '✓ PASS: All required indexes exist';
  ELSE
    RAISE EXCEPTION '✗ FAIL: Missing indexes: %', array_to_string(missing_indexes, ', ');
  END IF;
END $$;

-- ============================================
-- CHECK 5: Functions Exist
-- ============================================

DO $$
DECLARE
  expected_functions TEXT[] := ARRAY[
    'get_or_create_daily_limit',
    'can_use_api_tool',
    'increment_api_usage',
    'update_updated_at_column'
  ];
  missing_functions TEXT[];
BEGIN
  RAISE NOTICE '=== Checking Functions ===';
  
  SELECT array_agg(func)
  INTO missing_functions
  FROM unnest(expected_functions) AS func
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = func
  );
  
  IF missing_functions IS NULL THEN
    RAISE NOTICE '✓ PASS: All required functions exist';
  ELSE
    RAISE EXCEPTION '✗ FAIL: Missing functions: %', array_to_string(missing_functions, ', ');
  END IF;
END $$;

-- ============================================
-- CHECK 6: Triggers Exist
-- ============================================

DO $$
DECLARE
  trigger_count INTEGER;
  expected_triggers TEXT[] := ARRAY[
    'update_profiles_updated_at',
    'update_subscriptions_updated_at',
    'update_daily_limits_updated_at'
  ];
  missing_triggers TEXT[];
BEGIN
  RAISE NOTICE '=== Checking Triggers ===';
  
  SELECT array_agg(trig)
  INTO missing_triggers
  FROM unnest(expected_triggers) AS trig
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND trigger_name = trig
  );
  
  IF missing_triggers IS NULL THEN
    RAISE NOTICE '✓ PASS: All required triggers exist';
  ELSE
    RAISE EXCEPTION '✗ FAIL: Missing triggers: %', array_to_string(missing_triggers, ', ');
  END IF;
END $$;

-- ============================================
-- CHECK 7: Column Constraints
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== Checking Column Constraints ===';
  
  -- Check profiles.plan constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE '%profiles%plan%'
  ) THEN
    RAISE NOTICE '✓ PASS: profiles.plan constraint exists';
  ELSE
    RAISE EXCEPTION '✗ FAIL: profiles.plan constraint missing';
  END IF;
  
  -- Check subscriptions.status constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE '%subscriptions%status%'
  ) THEN
    RAISE NOTICE '✓ PASS: subscriptions.status constraint exists';
  ELSE
    RAISE EXCEPTION '✗ FAIL: subscriptions.status constraint missing';
  END IF;
END $$;

-- ============================================
-- CHECK 8: Foreign Key Relationships
-- ============================================

DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  RAISE NOTICE '=== Checking Foreign Keys ===';
  
  SELECT COUNT(*)
  INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_schema = 'public'
    AND constraint_type = 'FOREIGN KEY';
  
  IF fk_count >= 4 THEN
    RAISE NOTICE '✓ PASS: Foreign key relationships exist (% found)', fk_count;
  ELSE
    RAISE EXCEPTION '✗ FAIL: Expected at least 4 foreign keys, found %', fk_count;
  END IF;
END $$;

-- ============================================
-- CHECK 9: Unique Constraints
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== Checking Unique Constraints ===';
  
  -- Check profiles.stripe_customer_id unique
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_type = 'UNIQUE'
  ) THEN
    RAISE NOTICE '✓ PASS: Unique constraints exist on profiles';
  ELSE
    RAISE EXCEPTION '✗ FAIL: Unique constraints missing on profiles';
  END IF;
  
  -- Check subscriptions unique constraints
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'subscriptions'
      AND constraint_type = 'UNIQUE'
  ) THEN
    RAISE NOTICE '✓ PASS: Unique constraints exist on subscriptions';
  ELSE
    RAISE EXCEPTION '✗ FAIL: Unique constraints missing on subscriptions';
  END IF;
  
  -- Check daily_limits unique constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'daily_limits'
      AND constraint_type = 'UNIQUE'
  ) THEN
    RAISE NOTICE '✓ PASS: Unique constraints exist on daily_limits';
  ELSE
    RAISE EXCEPTION '✗ FAIL: Unique constraints missing on daily_limits';
  END IF;
END $$;

-- ============================================
-- CHECK 10: Default Values
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== Checking Default Values ===';
  
  -- Check profiles.plan default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'plan'
      AND column_default IS NOT NULL
  ) THEN
    RAISE NOTICE '✓ PASS: profiles.plan has default value';
  ELSE
    RAISE EXCEPTION '✗ FAIL: profiles.plan missing default value';
  END IF;
  
  -- Check created_at defaults
  IF (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'created_at'
      AND column_default LIKE '%now()%'
  ) >= 4 THEN
    RAISE NOTICE '✓ PASS: created_at columns have default values';
  ELSE
    RAISE EXCEPTION '✗ FAIL: Some created_at columns missing default values';
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  '=== SETUP SUMMARY ===' as summary;

SELECT 
  'Tables' as component,
  COUNT(*) as count,
  '✓' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'subscriptions', 'tool_usage', 'daily_limits')

UNION ALL

SELECT 
  'RLS Policies' as component,
  COUNT(*) as count,
  '✓' as status
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Indexes' as component,
  COUNT(*) as count,
  '✓' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'

UNION ALL

SELECT 
  'Functions' as component,
  COUNT(*) as count,
  '✓' as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('get_or_create_daily_limit', 'can_use_api_tool', 'increment_api_usage', 'update_updated_at_column')

UNION ALL

SELECT 
  'Triggers' as component,
  COUNT(*) as count,
  '✓' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'

UNION ALL

SELECT 
  'Foreign Keys' as component,
  COUNT(*) as count,
  '✓' as status
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';

-- ============================================
-- FINAL MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✓ ALL CHECKS PASSED!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Your database schema is set up correctly.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update .env.local with Supabase credentials';
  RAISE NOTICE '2. Configure authentication providers';
  RAISE NOTICE '3. Test authentication flow';
  RAISE NOTICE '4. Run RLS policy tests (see tests/test_rls_policies.sql)';
  RAISE NOTICE '';
END $$;
