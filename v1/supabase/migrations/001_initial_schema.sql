-- ============================================
-- Design Kit - Initial Database Schema
-- ============================================
-- This migration creates the core tables, RLS policies, 
-- functions, and indexes for the Design Kit application.
--
-- Tables:
-- - profiles: User profile information
-- - subscriptions: Stripe subscription data
-- - tool_usage: Usage tracking for all tools
-- - daily_limits: Daily API usage limits per user
--
-- Security: All tables use Row Level Security (RLS)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Stores user profile information linked to Supabase Auth

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE profiles IS 'User profile information and plan details';
COMMENT ON COLUMN profiles.plan IS 'User subscription plan: free (10 daily ops), premium (500 ops), pro (2000 ops)';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
-- Stores Stripe subscription information

CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'pro')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Add comment for documentation
COMMENT ON TABLE subscriptions IS 'Stripe subscription data synced via webhooks';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';

-- ============================================
-- TOOL_USAGE TABLE
-- ============================================
-- Tracks all tool usage for analytics and quota enforcement

CREATE TABLE tool_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  is_api_tool BOOLEAN DEFAULT FALSE NOT NULL,
  file_size_mb DECIMAL(10, 2),
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE tool_usage IS 'Tracks all tool usage for analytics and debugging';
COMMENT ON COLUMN tool_usage.is_api_tool IS 'Whether tool counts against daily API quota';
COMMENT ON COLUMN tool_usage.user_id IS 'NULL for anonymous users using client-side tools';

-- ============================================
-- DAILY_LIMITS TABLE
-- ============================================
-- Tracks daily API usage per user for quota enforcement

CREATE TABLE daily_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  api_tools_count INTEGER DEFAULT 0 NOT NULL CHECK (api_tools_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

-- Add comment for documentation
COMMENT ON TABLE daily_limits IS 'Daily API usage tracking for quota enforcement';
COMMENT ON COLUMN daily_limits.api_tools_count IS 'Number of API tool operations used today';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';

-- Tool usage indexes
CREATE INDEX idx_tool_usage_user_date ON tool_usage(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_tool_usage_tool_name ON tool_usage(tool_name);
CREATE INDEX idx_tool_usage_api_tools ON tool_usage(user_id, created_at) WHERE is_api_tool = TRUE;
CREATE INDEX idx_tool_usage_created_at ON tool_usage(created_at DESC);

-- Daily limits indexes
CREATE INDEX idx_daily_limits_user_date ON daily_limits(user_id, date DESC);
CREATE INDEX idx_daily_limits_date ON daily_limits(date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - SUBSCRIPTIONS
-- ============================================

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- RLS POLICIES - TOOL_USAGE
-- ============================================

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON tool_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own usage
CREATE POLICY "Users can insert own usage"
  ON tool_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Service role can view all usage (for analytics)
CREATE POLICY "Service role can view all usage"
  ON tool_usage
  FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- RLS POLICIES - DAILY_LIMITS
-- ============================================

-- Users can view their own limits
CREATE POLICY "Users can view own limits"
  ON daily_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert/update their own limits
CREATE POLICY "Users can manage own limits"
  ON daily_limits
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get or create daily limit record
CREATE OR REPLACE FUNCTION get_or_create_daily_limit(p_user_id UUID)
RETURNS daily_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit daily_limits;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  -- Try to get existing record for today
  SELECT * INTO v_limit
  FROM daily_limits
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE;

  -- If not found, create new record
  IF NOT FOUND THEN
    INSERT INTO daily_limits (user_id, date, api_tools_count)
    VALUES (p_user_id, CURRENT_DATE, 0)
    RETURNING * INTO v_limit;
  END IF;

  RETURN v_limit;
END;
$$;

COMMENT ON FUNCTION get_or_create_daily_limit IS 'Gets or creates daily limit record for user';

-- Function: Check if user can use API tool
CREATE OR REPLACE FUNCTION can_use_api_tool(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_current_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  -- Get user's plan
  SELECT plan INTO v_plan
  FROM profiles
  WHERE id = p_user_id;

  -- If user not found, deny access
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Set limit based on plan
  CASE v_plan
    WHEN 'free' THEN v_limit := 10;
    WHEN 'premium' THEN v_limit := 500;
    WHEN 'pro' THEN v_limit := 2000;
    ELSE v_limit := 0;
  END CASE;

  -- Get current usage for today
  SELECT COALESCE(api_tools_count, 0) INTO v_current_usage
  FROM daily_limits
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE;

  -- If no record exists, usage is 0
  IF NOT FOUND THEN
    v_current_usage := 0;
  END IF;

  -- Check if under limit
  RETURN v_current_usage < v_limit;
END;
$$;

COMMENT ON FUNCTION can_use_api_tool IS 'Checks if user has remaining API quota for today';

-- Function: Increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID)
RETURNS daily_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit daily_limits;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  -- Get or create daily limit record
  v_limit := get_or_create_daily_limit(p_user_id);

  -- Increment usage count
  UPDATE daily_limits
  SET 
    api_tools_count = api_tools_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE
  RETURNING * INTO v_limit;

  RETURN v_limit;
END;
$$;

COMMENT ON FUNCTION increment_api_usage IS 'Increments API usage count for user today';

-- ============================================
-- TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger: Update profiles.updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update subscriptions.updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update daily_limits.updated_at
CREATE TRIGGER update_daily_limits_updated_at
  BEFORE UPDATE ON daily_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- You can add seed data here if needed
-- Example: INSERT INTO profiles (id, email, plan) VALUES (...);

-- ============================================
-- GRANTS (Security)
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anonymous users (for client-side tools)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON tool_usage TO anon;
GRANT INSERT ON tool_usage TO anon;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify the schema is set up correctly

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check indexes exist
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- ============================================
-- END OF MIGRATION
-- ============================================
