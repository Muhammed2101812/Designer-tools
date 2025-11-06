-- ============================================
-- Auto Profile Creation Migration
-- ============================================
-- This migration creates a trigger that automatically creates
-- a profile record when a new user signs up via Supabase Auth.
-- It also sets up the foundation for welcome email sending.
-- ============================================

-- ============================================
-- FUNCTION: Handle new user signup
-- ============================================
-- This function is triggered when a new user is created in auth.users
-- It automatically creates a profile record with default values

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
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

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$;

-- Add comment for documentation
COMMENT ON FUNCTION handle_new_user IS 'Automatically creates profile, daily limits, and email preferences for new users';

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
-- This trigger fires after a new user is inserted into auth.users

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add comment for documentation
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers profile creation when new user signs up';

-- ============================================
-- FUNCTION: Queue welcome email
-- ============================================
-- This function queues a welcome email by inserting a record
-- that can be processed by a background job or webhook

CREATE OR REPLACE FUNCTION queue_welcome_email(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_email IS NULL THEN
    RAISE EXCEPTION 'user_id and email are required';
  END IF;

  -- Log the welcome email request in tool_usage for tracking
  INSERT INTO tool_usage (
    user_id,
    tool_name,
    is_api_tool,
    success,
    created_at
  ) VALUES (
    p_user_id,
    'welcome_email_queued',
    false,
    true,
    NOW()
  );

  -- Note: In a production environment, you might want to:
  -- 1. Insert into a dedicated email_queue table
  -- 2. Use a background job processor (like pg_cron)
  -- 3. Call an HTTP webhook using http extension
  -- 
  -- For now, we'll rely on the application to send emails
  -- when users first access the dashboard or through a separate process

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to queue welcome email for user %: %', p_user_id, SQLERRM;
END;
$;

-- Add comment for documentation
COMMENT ON FUNCTION queue_welcome_email IS 'Queues a welcome email to be sent to new users';

-- ============================================
-- ENHANCED PROFILE CREATION FUNCTION
-- ============================================
-- Update the handle_new_user function to also trigger welcome email

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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

  -- Queue welcome email (only if email is confirmed or we're in development)
  IF NEW.email_confirmed_at IS NOT NULL OR current_setting('app.environment', true) = 'development' THEN
    PERFORM queue_welcome_email(NEW.id, NEW.email, v_full_name);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$;

-- ============================================
-- FUNCTION: Handle email confirmation
-- ============================================
-- This function triggers welcome email when user confirms their email
-- (for cases where email wasn't sent during initial signup)

CREATE OR REPLACE FUNCTION handle_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  -- Only proceed if email was just confirmed
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Get user profile
    SELECT * INTO v_profile
    FROM profiles
    WHERE id = NEW.id;
    
    -- Send welcome email if profile exists
    IF FOUND THEN
      PERFORM queue_welcome_email(
        NEW.id,
        NEW.email,
        v_profile.full_name
      );
    END IF;
    
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to handle email confirmation for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$;

-- Add comment for documentation
COMMENT ON FUNCTION handle_email_confirmation IS 'Sends welcome email when user confirms their email address';

-- ============================================
-- TRIGGER: Send welcome email on confirmation
-- ============================================

DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;

CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation();

-- Add comment for documentation
COMMENT ON TRIGGER on_email_confirmed ON auth.users IS 'Triggers welcome email when user confirms email';

-- ============================================
-- GRANTS AND PERMISSIONS
-- ============================================

-- Grant necessary permissions for the new functions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_email_confirmation() TO authenticated;
GRANT EXECUTE ON FUNCTION queue_welcome_email(UUID, TEXT, TEXT) TO authenticated;

-- Grant service role access for webhook/admin operations
GRANT EXECUTE ON FUNCTION queue_welcome_email(UUID, TEXT, TEXT) TO service_role;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Uncomment these to test the migration

-- Test profile creation (run after creating a test user)
-- SELECT * FROM profiles WHERE email = 'test@example.com';
-- SELECT * FROM daily_limits WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@example.com');
-- SELECT * FROM email_preferences WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@example.com');

-- Check triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' OR event_object_schema = 'auth';

-- ============================================
-- END OF MIGRATION
-- ============================================