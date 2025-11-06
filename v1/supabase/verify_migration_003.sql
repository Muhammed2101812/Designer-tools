-- ============================================
-- Verification Script for Migration 003
-- ============================================
-- This script verifies that migration 003 was applied successfully
-- Run this after applying the migration to ensure everything is set up correctly

-- ============================================
-- 1. Check if email_preferences table exists
-- ============================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'email_preferences'
    ) 
    THEN '✓ email_preferences table exists'
    ELSE '✗ email_preferences table NOT found'
  END AS table_check;

-- ============================================
-- 2. Check email_preferences table structure
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'email_preferences'
ORDER BY ordinal_position;

-- ============================================
-- 3. Check RLS is enabled
-- ============================================
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✓ RLS enabled'
    ELSE '✗ RLS NOT enabled'
  END AS rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'email_preferences';

-- ============================================
-- 4. Check RLS policies exist
-- ============================================
SELECT 
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'email_preferences'
ORDER BY policyname;

-- ============================================
-- 5. Check indexes exist
-- ============================================
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('email_preferences', 'subscriptions', 'tool_usage', 'daily_limits')
ORDER BY tablename, indexname;

-- ============================================
-- 6. Check functions exist
-- ============================================
SELECT 
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_default_email_preferences', 'get_email_preferences')
ORDER BY routine_name;

-- ============================================
-- 7. Check triggers exist
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'email_preferences'
ORDER BY trigger_name;

-- ============================================
-- 8. Check unique constraint on user_id
-- ============================================
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'email_preferences'
  AND constraint_type = 'UNIQUE';

-- ============================================
-- 9. Test function: create_default_email_preferences
-- ============================================
-- Note: This is a read-only check. Actual testing should be done in a test environment.
-- SELECT create_default_email_preferences('00000000-0000-0000-0000-000000000000');

-- ============================================
-- 10. Summary Report
-- ============================================
SELECT 
  '=== MIGRATION 003 VERIFICATION SUMMARY ===' AS summary;

SELECT 
  'Tables' AS category,
  COUNT(*) AS count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'email_preferences'
UNION ALL
SELECT 
  'Policies' AS category,
  COUNT(*) AS count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'email_preferences'
UNION ALL
SELECT 
  'Indexes' AS category,
  COUNT(*) AS count
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'email_preferences'
UNION ALL
SELECT 
  'Functions' AS category,
  COUNT(*) AS count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_default_email_preferences', 'get_email_preferences')
UNION ALL
SELECT 
  'Triggers' AS category,
  COUNT(*) AS count
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'email_preferences';

-- ============================================
-- Expected Results:
-- - Tables: 1 (email_preferences)
-- - Policies: 5 (view, insert, update, delete, service_role)
-- - Indexes: 1 (idx_email_preferences_user_id)
-- - Functions: 2 (create_default_email_preferences, get_email_preferences)
-- - Triggers: 1 (update_email_preferences_updated_at)
-- ============================================
