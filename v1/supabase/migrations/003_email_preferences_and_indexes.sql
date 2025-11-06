-- ============================================
-- Design Kit - Email Preferences and Additional Indexes
-- ============================================
-- This migration adds:
-- - email_preferences table for user notification settings
-- - Additional indexes for improved query performance
-- - RLS policies for email preferences
--
-- Requirements: 1.3, 1.4, 10.7
-- ============================================

-- ============================================
-- EMAIL_PREFERENCES TABLE
-- ============================================
-- Stores user preferences for email notifications

CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketing_emails BOOLEAN DEFAULT true NOT NULL,
  quota_warnings BOOLEAN DEFAULT true NOT NULL,
  subscription_updates BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Add comment for documentation
COMMENT ON TABLE email_preferences IS 'User email notification preferences';
COMMENT ON COLUMN email_preferences.marketing_emails IS 'Receive marketing and promotional emails';
COMMENT ON COLUMN email_preferences.quota_warnings IS 'Receive warnings when quota is running low';
COMMENT ON COLUMN email_preferences.subscription_updates IS 'Receive subscription and billing updates';

-- ============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================

-- Email preferences indexes
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- Note: The following indexes already exist in 001_initial_schema.sql
-- but we include them here with IF NOT EXISTS for safety:

-- Subscriptions indexes (additional coverage)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Tool usage indexes (additional coverage)
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created_at ON tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_name ON tool_usage(tool_name);

-- Daily limits indexes (additional coverage)
CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date ON daily_limits(user_id, date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on email_preferences table
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - EMAIL_PREFERENCES
-- ============================================

-- Users can view their own email preferences
CREATE POLICY "Users can view own email preferences"
  ON email_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own email preferences
CREATE POLICY "Users can insert own email preferences"
  ON email_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own email preferences
CREATE POLICY "Users can update own email preferences"
  ON email_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own email preferences
CREATE POLICY "Users can delete own email preferences"
  ON email_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all email preferences (for admin operations)
CREATE POLICY "Service role can manage email preferences"
  ON email_preferences
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update email_preferences.updated_at
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Create default email preferences
-- ============================================
-- This function creates default email preferences for a user

CREATE OR REPLACE FUNCTION create_default_email_preferences(p_user_id UUID)
RETURNS email_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_preferences email_preferences;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  -- Insert default preferences
  INSERT INTO email_preferences (
    user_id,
    marketing_emails,
    quota_warnings,
    subscription_updates
  )
  VALUES (
    p_user_id,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING * INTO v_preferences;

  -- If conflict occurred, fetch existing preferences
  IF v_preferences IS NULL THEN
    SELECT * INTO v_preferences
    FROM email_preferences
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_preferences;
END;
$;

COMMENT ON FUNCTION create_default_email_preferences IS 'Creates default email preferences for a user';

-- ============================================
-- FUNCTION: Get email preferences with defaults
-- ============================================
-- This function gets email preferences or creates them if they don't exist

CREATE OR REPLACE FUNCTION get_email_preferences(p_user_id UUID)
RETURNS email_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_preferences email_preferences;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM email_preferences
  WHERE user_id = p_user_id;

  -- If not found, create default preferences
  IF NOT FOUND THEN
    v_preferences := create_default_email_preferences(p_user_id);
  END IF;

  RETURN v_preferences;
END;
$;

COMMENT ON FUNCTION get_email_preferences IS 'Gets email preferences for user, creating defaults if needed';

-- ============================================
-- GRANTS (Security)
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON email_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_email_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_preferences TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify the migration is successful

-- Check email_preferences table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'email_preferences';

-- Check RLS is enabled on email_preferences
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'email_preferences';

-- Check policies exist for email_preferences
-- SELECT policyname FROM pg_policies WHERE tablename = 'email_preferences';

-- Check indexes exist
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('email_preferences', 'subscriptions', 'tool_usage', 'daily_limits');

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('create_default_email_preferences', 'get_email_preferences');

-- ============================================
-- END OF MIGRATION
-- ============================================
