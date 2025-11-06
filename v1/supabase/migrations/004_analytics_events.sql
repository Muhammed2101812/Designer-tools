-- ============================================
-- Design Kit - Analytics Events
-- ============================================
-- This migration adds:
-- - analytics_events table for detailed event tracking
-- - Indexes for performance
-- - RLS policies
-- - Analytics query functions
-- ============================================

-- ============================================
-- ANALYTICS_EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('user', 'tool', 'subscription', 'engagement', 'error')),
  properties JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE analytics_events IS 'Stores all analytics events for tracking user behavior and tool usage';
COMMENT ON COLUMN analytics_events.event_name IS 'The name of the event (e.g., tool_opened, user_signup)';
COMMENT ON COLUMN analytics_events.event_category IS 'Category of the event for grouping';
COMMENT ON COLUMN analytics_events.properties IS 'Additional event properties as JSON';
COMMENT ON COLUMN analytics_events.session_id IS 'Session identifier for tracking user sessions';

-- ============================================
-- INDEXES
-- ============================================

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- Index for querying by event name
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);

-- Index for querying by category
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

-- Composite index for user events over time
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time ON analytics_events(user_id, timestamp DESC);

-- Index for session tracking
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id) WHERE session_id IS NOT NULL;

-- GIN index for properties JSONB queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN (properties);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Users can view own analytics events"
  ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all events
CREATE POLICY "Service role can manage analytics events"
  ON analytics_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Allow insert for authenticated users (for their own events)
CREATE POLICY "Users can insert own analytics events"
  ON analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- ANALYTICS QUERY FUNCTIONS
-- ============================================

/**
 * Get event counts by category for a user
 */
CREATE OR REPLACE FUNCTION get_user_event_counts(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  event_category TEXT,
  event_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.event_category,
    COUNT(*)::BIGINT as event_count
  FROM analytics_events ae
  WHERE ae.user_id = p_user_id
    AND ae.timestamp >= p_start_date
    AND ae.timestamp <= p_end_date
  GROUP BY ae.event_category
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_event_counts IS 'Get event counts by category for a specific user';

/**
 * Get most used tools by user
 */
CREATE OR REPLACE FUNCTION get_user_top_tools(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  tool_name TEXT,
  usage_count BIGINT,
  last_used TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.properties->>'tool_name' as tool_name,
    COUNT(*)::BIGINT as usage_count,
    MAX(ae.timestamp) as last_used
  FROM analytics_events ae
  WHERE ae.user_id = p_user_id
    AND ae.event_name IN ('tool_opened', 'tool_processing_completed')
    AND ae.properties ? 'tool_name'
  GROUP BY ae.properties->>'tool_name'
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_top_tools IS 'Get most frequently used tools by user';

/**
 * Get daily active users count
 */
CREATE OR REPLACE FUNCTION get_daily_active_users(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(ae.timestamp) as date,
    COUNT(DISTINCT ae.user_id)::BIGINT as active_users
  FROM analytics_events ae
  WHERE DATE(ae.timestamp) >= p_start_date
    AND DATE(ae.timestamp) <= p_end_date
    AND ae.user_id IS NOT NULL
  GROUP BY DATE(ae.timestamp)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_daily_active_users IS 'Get daily active users count';

/**
 * Get conversion funnel stats
 */
CREATE OR REPLACE FUNCTION get_conversion_funnel(
  p_funnel_steps TEXT[],
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  step_name TEXT,
  step_number INTEGER,
  users_count BIGINT,
  conversion_rate NUMERIC
) AS $$
DECLARE
  v_total_users BIGINT;
  v_step TEXT;
  v_step_num INTEGER := 1;
  v_users_at_step BIGINT;
  v_conversion_rate NUMERIC;
BEGIN
  -- Get total users who started the funnel (first step)
  SELECT COUNT(DISTINCT user_id) INTO v_total_users
  FROM analytics_events
  WHERE event_name = p_funnel_steps[1]
    AND timestamp >= p_start_date
    AND timestamp <= p_end_date
    AND user_id IS NOT NULL;

  -- If no users, return empty
  IF v_total_users = 0 THEN
    RETURN;
  END IF;

  -- For each step in the funnel
  FOREACH v_step IN ARRAY p_funnel_steps
  LOOP
    -- Count users who reached this step
    SELECT COUNT(DISTINCT user_id) INTO v_users_at_step
    FROM analytics_events
    WHERE event_name = v_step
      AND timestamp >= p_start_date
      AND timestamp <= p_end_date
      AND user_id IS NOT NULL
      -- Must have completed previous steps
      AND user_id IN (
        SELECT DISTINCT user_id
        FROM analytics_events
        WHERE event_name = ANY(p_funnel_steps[1:v_step_num])
          AND timestamp >= p_start_date
          AND timestamp <= p_end_date
      );

    -- Calculate conversion rate
    v_conversion_rate := (v_users_at_step::NUMERIC / v_total_users::NUMERIC) * 100;

    -- Return this step's stats
    step_name := v_step;
    step_number := v_step_num;
    users_count := v_users_at_step;
    conversion_rate := ROUND(v_conversion_rate, 2);
    RETURN NEXT;

    v_step_num := v_step_num + 1;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_conversion_funnel IS 'Calculate conversion rates for a multi-step funnel';

/**
 * Get tool performance metrics
 */
CREATE OR REPLACE FUNCTION get_tool_performance_metrics(
  p_tool_name TEXT,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days'
)
RETURNS TABLE (
  metric TEXT,
  value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  -- Total uses
  SELECT 'total_uses'::TEXT, COUNT(*)::NUMERIC
  FROM analytics_events
  WHERE event_name = 'tool_processing_completed'
    AND properties->>'tool_name' = p_tool_name
    AND timestamp >= p_start_date

  UNION ALL

  -- Success rate
  SELECT 'success_rate'::TEXT,
    ROUND((COUNT(*) FILTER (WHERE properties->>'success' = 'true')::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100), 2)
  FROM analytics_events
  WHERE event_name IN ('tool_processing_completed', 'tool_processing_failed')
    AND properties->>'tool_name' = p_tool_name
    AND timestamp >= p_start_date

  UNION ALL

  -- Average processing time (ms)
  SELECT 'avg_processing_time_ms'::TEXT,
    ROUND(AVG((properties->>'processing_time_ms')::NUMERIC), 2)
  FROM analytics_events
  WHERE event_name = 'tool_processing_completed'
    AND properties->>'tool_name' = p_tool_name
    AND properties ? 'processing_time_ms'
    AND timestamp >= p_start_date

  UNION ALL

  -- Unique users
  SELECT 'unique_users'::TEXT, COUNT(DISTINCT user_id)::NUMERIC
  FROM analytics_events
  WHERE event_name IN ('tool_opened', 'tool_processing_completed')
    AND properties->>'tool_name' = p_tool_name
    AND timestamp >= p_start_date
    AND user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tool_performance_metrics IS 'Get performance metrics for a specific tool';

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT, INSERT ON analytics_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_event_counts TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_top_tools TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_active_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_funnel TO authenticated;
GRANT EXECUTE ON FUNCTION get_tool_performance_metrics TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'analytics_events';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'analytics_events';

-- Check indexes exist
-- SELECT indexname FROM pg_indexes WHERE tablename = 'analytics_events';

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name LIKE 'get_%' AND routine_schema = 'public';
