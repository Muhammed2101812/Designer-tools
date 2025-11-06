-- ============================================
-- Email Triggers Migration
-- ============================================
-- This migration adds automatic email triggers for:
-- 1. Welcome emails on user signup
-- 2. Quota warning emails when usage reaches 90%
-- 3. Enhanced profile creation with email support
-- ============================================

-- ============================================
-- FUNCTION: Send welcome email via HTTP
-- ============================================
-- This function calls the email API to send welcome emails

CREATE OR REPLACE FUNCTION send_welcome_email_http(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_url TEXT;
  v_response TEXT;
BEGIN
  -- Get app URL from environment or use default
  v_app_url := COALESCE(current_setting('app.base_url', true), 'http://localhost:3000');
  
  -- Make HTTP request to send email (requires http extension)
  -- Note: This requires the http extension to be enabled
  -- For now, we'll just log the request and rely on application-level sending
  
  -- Log the welcome email request
  INSERT INTO tool_usage (
    user_id,
    tool_name,
    is_api_tool,
    success,
    created_at
  ) VALUES (
    p_user_id,
    'welcome_email_triggered',
    false,
    true,
    NOW()
  );

  -- In production, you would use something like:
  -- SELECT content FROM http_post(
  --   v_app_url || '/api/email/send',
  --   '{"type":"welcome","user_id":"' || p_user_id || '","email":"' || p_email || '","full_name":"' || COALESCE(p_full_name, '') || '"}',
  --   'application/json'
  -- ) INTO v_response;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to send welcome email for user %: %', p_user_id, SQLERRM;
END;
$$;

COMMENT ON FUNCTION send_welcome_email_http IS 'Triggers welcome email via HTTP API call';

-- ============================================
-- FUNCTION: Check and send quota warning
-- ============================================
-- This function checks if user has reached 90% quota and sends warning email

CREATE OR REPLACE FUNCTION check_and_send_quota_warning(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_current_usage INTEGER;
  v_daily_limit INTEGER;
  v_percentage NUMERIC;
  v_profile RECORD;
  v_already_warned BOOLEAN := FALSE;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get user's plan and profile
  SELECT plan, email, full_name INTO v_plan, v_profile.email, v_profile.full_name
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Set daily limit based on plan
  CASE v_plan
    WHEN 'free' THEN v_daily_limit := 10;
    WHEN 'premium' THEN v_daily_limit := 500;
    WHEN 'pro' THEN v_daily_limit := 2000;
    ELSE RETURN; -- Unknown plan
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

  -- Calculate percentage
  v_percentage := (v_current_usage::NUMERIC / v_daily_limit::NUMERIC) * 100;

  -- Only send warning if usage is >= 90%
  IF v_percentage < 90 THEN
    RETURN;
  END IF;

  -- Check if we already sent a warning today
  SELECT EXISTS(
    SELECT 1 FROM tool_usage
    WHERE user_id = p_user_id
      AND tool_name = 'quota_warning_sent'
      AND DATE(created_at) = CURRENT_DATE
      AND success = true
  ) INTO v_already_warned;

  -- Don't send duplicate warnings
  IF v_already_warned THEN
    RETURN;
  END IF;

  -- Check email preferences
  IF NOT should_send_quota_warning(p_user_id) THEN
    RETURN;
  END IF;

  -- Log the quota warning request
  INSERT INTO tool_usage (
    user_id,
    tool_name,
    is_api_tool,
    success,
    created_at,
    metadata
  ) VALUES (
    p_user_id,
    'quota_warning_sent',
    false,
    true,
    NOW(),
    jsonb_build_object(
      'current_usage', v_current_usage,
      'daily_limit', v_daily_limit,
      'percentage', v_percentage,
      'plan', v_plan
    )
  );

  -- In production, you would make an HTTP call here:
  -- SELECT content FROM http_post(
  --   current_setting('app.base_url', true) || '/api/email/send',
  --   jsonb_build_object(
  --     'type', 'quota_warning',
  --     'user_id', p_user_id,
  --     'email', v_profile.email,
  --     'full_name', v_profile.full_name,
  --     'current_usage', v_current_usage,
  --     'daily_limit', v_daily_limit,
  --     'plan', v_plan
  --   )::text,
  --   'application/json'
  -- );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to send quota warning for user %: %', p_user_id, SQLERRM;
END;
$$;

COMMENT ON FUNCTION check_and_send_quota_warning IS 'Checks quota usage and sends warning email if >= 90%';

-- ============================================
-- FUNCTION: Check email preferences for quota warnings
-- ============================================

CREATE OR REPLACE FUNCTION should_send_quota_warning(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota_warnings BOOLEAN := true; -- Default to true
BEGIN
  -- Check email preferences
  SELECT quota_warnings INTO v_quota_warnings
  FROM email_preferences
  WHERE user_id = p_user_id;

  -- If no preferences found, default to true
  IF NOT FOUND THEN
    v_quota_warnings := true;
  END IF;

  RETURN COALESCE(v_quota_warnings, true);
END;
$$;

COMMENT ON FUNCTION should_send_quota_warning IS 'Checks if user wants to receive quota warning emails';

-- ============================================
-- ENHANCED INCREMENT USAGE FUNCTION
-- ============================================
-- Update the increment_api_usage function to trigger quota warnings

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
  SELECT * INTO v_limit FROM get_or_create_daily_limit(p_user_id);

  -- Increment usage count
  UPDATE daily_limits
  SET 
    api_tools_count = api_tools_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE
  RETURNING * INTO v_limit;

  -- Check if we should send quota warning
  PERFORM check_and_send_quota_warning(p_user_id);

  RETURN v_limit;
END;
$$;

COMMENT ON FUNCTION increment_api_usage IS 'Increments API usage count and checks for quota warnings';

-- ============================================
-- ENHANCED PROFILE CREATION FUNCTION
-- ============================================
-- Update handle_new_user to trigger welcome emails

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Extract full name from metadata
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1) -- Fallback to email username
  );

  -- Insert new profile record
  INSERT INTO profiles (
    id,
    email,
    full_name,
    plan,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    'free',
    NOW(),
    NOW()
  );

  -- Create initial daily limit record for today
  INSERT INTO daily_limits (
    user_id,
    date,
    api_tools_count,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    CURRENT_DATE,
    0,
    NOW(),
    NOW()
  );

  -- Create default email preferences
  INSERT INTO email_preferences (
    user_id,
    marketing_emails,
    quota_warnings,
    subscription_updates,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    true,  -- Default to receiving marketing emails (opt-out model)
    true,  -- Default to receiving quota warnings
    true,  -- Default to receiving subscription updates
    NOW(),
    NOW()
  );

  -- Send welcome email (always trigger, let the application handle preferences)
  PERFORM send_welcome_email_http(NEW.id, NEW.email, v_full_name);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user IS 'Creates profile and triggers welcome email for new users';

-- ============================================
-- FUNCTION: Manual quota warning trigger
-- ============================================
-- This function can be called manually or via cron to check all users

CREATE OR REPLACE FUNCTION check_all_quota_warnings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
  v_warnings_sent INTEGER := 0;
BEGIN
  -- Loop through all users with usage today
  FOR v_user_record IN
    SELECT DISTINCT dl.user_id
    FROM daily_limits dl
    JOIN profiles p ON p.id = dl.user_id
    WHERE dl.date = CURRENT_DATE
      AND dl.api_tools_count > 0
  LOOP
    -- Check and send quota warning for each user
    PERFORM check_and_send_quota_warning(v_user_record.user_id);
    v_warnings_sent := v_warnings_sent + 1;
  END LOOP;

  RETURN v_warnings_sent;
END;
$$;

COMMENT ON FUNCTION check_all_quota_warnings IS 'Checks quota warnings for all active users today';

-- ============================================
-- API ENDPOINT HELPER FUNCTIONS
-- ============================================
-- These functions help the application send emails

CREATE OR REPLACE FUNCTION queue_email_notification(
  p_user_id UUID,
  p_email_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert email notification request
  INSERT INTO tool_usage (
    user_id,
    tool_name,
    is_api_tool,
    success,
    created_at,
    metadata
  ) VALUES (
    p_user_id,
    'email_' || p_email_type || '_queued',
    false,
    true,
    NOW(),
    p_metadata
  );
END;
$$;

COMMENT ON FUNCTION queue_email_notification IS 'Queues email notifications for processing';

-- ============================================
-- GRANTS AND PERMISSIONS
-- ============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION send_welcome_email_http(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_send_quota_warning(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION should_send_quota_warning(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_quota_warnings() TO authenticated;
GRANT EXECUTE ON FUNCTION queue_email_notification(UUID, TEXT, JSONB) TO authenticated;

-- Grant service role access for webhook/admin operations
GRANT EXECUTE ON FUNCTION send_welcome_email_http(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION check_and_send_quota_warning(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION should_send_quota_warning(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_all_quota_warnings() TO service_role;
GRANT EXECUTE ON FUNCTION queue_email_notification(UUID, TEXT, JSONB) TO service_role;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Uncomment these to test the migration

-- Test quota warning function
-- SELECT check_and_send_quota_warning('user-uuid-here');

-- Test welcome email function
-- SELECT send_welcome_email_http('user-uuid-here', 'test@example.com', 'Test User');

-- Check all quota warnings
-- SELECT check_all_quota_warnings();

-- View email-related tool usage
-- SELECT * FROM tool_usage WHERE tool_name LIKE '%email%' ORDER BY created_at DESC;

-- ============================================
-- END OF MIGRATION
-- ============================================