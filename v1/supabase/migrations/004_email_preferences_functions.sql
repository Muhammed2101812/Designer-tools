-- ============================================
-- Email Preferences Functions
-- ============================================
-- Additional functions for email preferences management

-- Function to upsert email preferences
CREATE OR REPLACE FUNCTION upsert_email_preferences(
  p_user_id UUID,
  p_marketing_emails BOOLEAN,
  p_quota_warnings BOOLEAN,
  p_subscription_updates BOOLEAN
)
RETURNS email_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preferences email_preferences;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  -- Insert or update preferences
  INSERT INTO email_preferences (
    user_id,
    marketing_emails,
    quota_warnings,
    subscription_updates,
    updated_at
  )
  VALUES (
    p_user_id,
    p_marketing_emails,
    p_quota_warnings,
    p_subscription_updates,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    marketing_emails = EXCLUDED.marketing_emails,
    quota_warnings = EXCLUDED.quota_warnings,
    subscription_updates = EXCLUDED.subscription_updates,
    updated_at = NOW()
  RETURNING * INTO v_preferences;

  RETURN v_preferences;
END;
$$;

COMMENT ON FUNCTION upsert_email_preferences IS 'Upserts email preferences for a user';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_email_preferences TO authenticated;