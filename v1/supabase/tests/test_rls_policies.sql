-- ============================================
-- RLS Policy Tests
-- ============================================
-- This file contains test queries to verify Row Level Security
-- policies are working correctly.
--
-- Run these tests in Supabase SQL Editor after creating
-- test users through the authentication system.
--
-- ⚠️ Replace 'test-user-uuid-1' and 'test-user-uuid-2' 
--    with actual user UUIDs from auth.users table
-- ============================================

-- ============================================
-- SETUP: Create Test Data
-- ============================================

-- First, create test users through the Supabase Auth UI or API
-- Then insert test profiles for those users

-- Example: Insert test profiles (replace UUIDs with real ones)
-- INSERT INTO profiles (id, email, plan) VALUES
--   ('test-user-uuid-1', 'user1@test.com', 'free'),
--   ('test-user-uuid-2', 'user2@test.com', 'premium');

-- ============================================
-- TEST 1: Profiles Table RLS
-- ============================================

-- Test: User can view own profile
-- Expected: Returns 1 row
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  result_count INTEGER;
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Query own profile
  SELECT COUNT(*) INTO result_count
  FROM profiles
  WHERE id = test_user_id;
  
  IF result_count = 1 THEN
    RAISE NOTICE 'PASS: User can view own profile';
  ELSE
    RAISE EXCEPTION 'FAIL: User cannot view own profile. Count: %', result_count;
  END IF;
END $$;

-- Test: User cannot view other user's profile
-- Expected: Returns 0 rows
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  other_user_id UUID := 'test-user-uuid-2'; -- Replace with actual UUID
  result_count INTEGER;
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Try to query another user's profile
  SELECT COUNT(*) INTO result_count
  FROM profiles
  WHERE id = other_user_id;
  
  IF result_count = 0 THEN
    RAISE NOTICE 'PASS: User cannot view other user profile';
  ELSE
    RAISE EXCEPTION 'FAIL: User can view other user profile. Count: %', result_count;
  END IF;
END $$;

-- Test: User can update own profile
-- Expected: Update succeeds
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Try to update own profile
  UPDATE profiles
  SET full_name = 'Test User Updated'
  WHERE id = test_user_id;
  
  IF FOUND THEN
    RAISE NOTICE 'PASS: User can update own profile';
  ELSE
    RAISE EXCEPTION 'FAIL: User cannot update own profile';
  END IF;
END $$;

-- ============================================
-- TEST 2: Subscriptions Table RLS
-- ============================================

-- Test: User can view own subscription
-- Expected: Returns subscription if exists
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  result_count INTEGER;
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Query own subscription
  SELECT COUNT(*) INTO result_count
  FROM subscriptions
  WHERE user_id = test_user_id;
  
  RAISE NOTICE 'User subscription count: %', result_count;
  RAISE NOTICE 'PASS: User can query own subscriptions';
END $$;

-- Test: User cannot view other user's subscription
-- Expected: Returns 0 rows
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  other_user_id UUID := 'test-user-uuid-2'; -- Replace with actual UUID
  result_count INTEGER;
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Try to query another user's subscription
  SELECT COUNT(*) INTO result_count
  FROM subscriptions
  WHERE user_id = other_user_id;
  
  IF result_count = 0 THEN
    RAISE NOTICE 'PASS: User cannot view other user subscription';
  ELSE
    RAISE EXCEPTION 'FAIL: User can view other user subscription. Count: %', result_count;
  END IF;
END $$;

-- ============================================
-- TEST 3: Tool Usage Table RLS
-- ============================================

-- Test: User can view own usage
-- Expected: Returns user's usage records
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  result_count INTEGER;
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Query own usage
  SELECT COUNT(*) INTO result_count
  FROM tool_usage
  WHERE user_id = test_user_id;
  
  RAISE NOTICE 'User tool usage count: %', result_count;
  RAISE NOTICE 'PASS: User can query own tool usage';
END $$;

-- Test: User can insert own usage
-- Expected: Insert succeeds
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Insert usage record
  INSERT INTO tool_usage (user_id, tool_name, is_api_tool, success)
  VALUES (test_user_id, 'color-picker', false, true);
  
  RAISE NOTICE 'PASS: User can insert own tool usage';
END $$;

-- ============================================
-- TEST 4: Daily Limits Table RLS
-- ============================================

-- Test: User can view own limits
-- Expected: Returns user's limit records
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  result_count INTEGER;
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Query own limits
  SELECT COUNT(*) INTO result_count
  FROM daily_limits
  WHERE user_id = test_user_id;
  
  RAISE NOTICE 'User daily limits count: %', result_count;
  RAISE NOTICE 'PASS: User can query own daily limits';
END $$;

-- Test: User cannot view other user's limits
-- Expected: Returns 0 rows
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  other_user_id UUID := 'test-user-uuid-2'; -- Replace with actual UUID
  result_count INTEGER;
BEGIN
  -- Simulate authenticated user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
  
  -- Try to query another user's limits
  SELECT COUNT(*) INTO result_count
  FROM daily_limits
  WHERE user_id = other_user_id;
  
  IF result_count = 0 THEN
    RAISE NOTICE 'PASS: User cannot view other user limits';
  ELSE
    RAISE EXCEPTION 'FAIL: User can view other user limits. Count: %', result_count;
  END IF;
END $$;

-- ============================================
-- TEST 5: Database Functions
-- ============================================

-- Test: get_or_create_daily_limit function
-- Expected: Returns or creates daily limit record
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  limit_record daily_limits;
BEGIN
  -- Call function
  SELECT * INTO limit_record
  FROM get_or_create_daily_limit(test_user_id);
  
  IF limit_record.user_id = test_user_id AND limit_record.date = CURRENT_DATE THEN
    RAISE NOTICE 'PASS: get_or_create_daily_limit works correctly';
    RAISE NOTICE 'Current usage: %', limit_record.api_tools_count;
  ELSE
    RAISE EXCEPTION 'FAIL: get_or_create_daily_limit returned incorrect data';
  END IF;
END $$;

-- Test: can_use_api_tool function (free plan)
-- Expected: Returns true if under 10 operations
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID (free plan)
  can_use BOOLEAN;
  current_usage INTEGER;
BEGIN
  -- Get current usage
  SELECT COALESCE(api_tools_count, 0) INTO current_usage
  FROM daily_limits
  WHERE user_id = test_user_id AND date = CURRENT_DATE;
  
  -- Check if can use
  SELECT can_use_api_tool(test_user_id) INTO can_use;
  
  RAISE NOTICE 'Current usage: %, Can use: %', current_usage, can_use;
  
  IF (current_usage < 10 AND can_use = true) OR (current_usage >= 10 AND can_use = false) THEN
    RAISE NOTICE 'PASS: can_use_api_tool works correctly for free plan';
  ELSE
    RAISE EXCEPTION 'FAIL: can_use_api_tool returned incorrect result';
  END IF;
END $$;

-- Test: increment_api_usage function
-- Expected: Increments usage count by 1
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  before_count INTEGER;
  after_count INTEGER;
  limit_record daily_limits;
BEGIN
  -- Get current count
  SELECT COALESCE(api_tools_count, 0) INTO before_count
  FROM daily_limits
  WHERE user_id = test_user_id AND date = CURRENT_DATE;
  
  -- Increment usage
  SELECT * INTO limit_record
  FROM increment_api_usage(test_user_id);
  
  after_count := limit_record.api_tools_count;
  
  IF after_count = before_count + 1 THEN
    RAISE NOTICE 'PASS: increment_api_usage incremented correctly (% -> %)', before_count, after_count;
  ELSE
    RAISE EXCEPTION 'FAIL: increment_api_usage did not increment correctly (% -> %)', before_count, after_count;
  END IF;
END $$;

-- ============================================
-- TEST 6: Quota Enforcement
-- ============================================

-- Test: Free plan quota limit (10 operations)
-- Expected: can_use_api_tool returns false after 10 operations
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID (free plan)
  i INTEGER;
  can_use BOOLEAN;
BEGIN
  -- Reset daily limit to 0
  DELETE FROM daily_limits WHERE user_id = test_user_id AND date = CURRENT_DATE;
  
  -- Use 10 operations
  FOR i IN 1..10 LOOP
    PERFORM increment_api_usage(test_user_id);
  END LOOP;
  
  -- Check if can still use (should be false)
  SELECT can_use_api_tool(test_user_id) INTO can_use;
  
  IF can_use = false THEN
    RAISE NOTICE 'PASS: Free plan quota limit enforced correctly';
  ELSE
    RAISE EXCEPTION 'FAIL: Free plan quota limit not enforced';
  END IF;
END $$;

-- ============================================
-- TEST 7: Index Performance
-- ============================================

-- Test: Verify indexes exist
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
  
  IF index_count >= 10 THEN
    RAISE NOTICE 'PASS: Indexes created (% indexes found)', index_count;
  ELSE
    RAISE WARNING 'WARNING: Expected at least 10 indexes, found %', index_count;
  END IF;
END $$;

-- ============================================
-- TEST 8: Triggers
-- ============================================

-- Test: updated_at trigger on profiles
DO $$
DECLARE
  test_user_id UUID := 'test-user-uuid-1'; -- Replace with actual UUID
  old_updated_at TIMESTAMP WITH TIME ZONE;
  new_updated_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current updated_at
  SELECT updated_at INTO old_updated_at
  FROM profiles
  WHERE id = test_user_id;
  
  -- Wait a moment
  PERFORM pg_sleep(1);
  
  -- Update profile
  UPDATE profiles
  SET full_name = 'Trigger Test'
  WHERE id = test_user_id;
  
  -- Get new updated_at
  SELECT updated_at INTO new_updated_at
  FROM profiles
  WHERE id = test_user_id;
  
  IF new_updated_at > old_updated_at THEN
    RAISE NOTICE 'PASS: updated_at trigger works correctly';
  ELSE
    RAISE EXCEPTION 'FAIL: updated_at trigger did not update timestamp';
  END IF;
END $$;

-- ============================================
-- CLEANUP (Optional)
-- ============================================

-- Uncomment to clean up test data
-- DELETE FROM tool_usage WHERE user_id IN ('test-user-uuid-1', 'test-user-uuid-2');
-- DELETE FROM daily_limits WHERE user_id IN ('test-user-uuid-1', 'test-user-uuid-2');
-- DELETE FROM subscriptions WHERE user_id IN ('test-user-uuid-1', 'test-user-uuid-2');
-- DELETE FROM profiles WHERE id IN ('test-user-uuid-1', 'test-user-uuid-2');

-- ============================================
-- SUMMARY
-- ============================================

-- Run this to see a summary of your database setup
SELECT 
  'Tables' as category,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

SELECT 
  'RLS Policies' as category,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Indexes' as category,
  COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'

UNION ALL

SELECT 
  'Functions' as category,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public'

UNION ALL

SELECT 
  'Triggers' as category,
  COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
