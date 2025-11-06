-- ============================================
-- Design Kit - User Feedback System
-- ============================================
-- This migration adds:
-- - feedback table for user feedback
-- - feedback_attachments table for screenshots
-- - Indexes for performance
-- - RLS policies
-- - Helper functions
-- ============================================

-- ============================================
-- FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature_request', 'improvement', 'question', 'general')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE feedback IS 'Stores user feedback, bug reports, and feature requests';
COMMENT ON COLUMN feedback.category IS 'Type of feedback: bug, feature_request, improvement, question, general';
COMMENT ON COLUMN feedback.rating IS 'User satisfaction rating (1-5 stars)';
COMMENT ON COLUMN feedback.status IS 'Current status of the feedback';
COMMENT ON COLUMN feedback.priority IS 'Priority level set by admin';
COMMENT ON COLUMN feedback.admin_notes IS 'Internal notes from administrators';

-- ============================================
-- FEEDBACK_ATTACHMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feedback_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE feedback_attachments IS 'Stores attachments (screenshots, files) for feedback';

-- ============================================
-- INDEXES
-- ============================================

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Index for querying by category
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Index for querying by priority
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Index for feedback attachments
CREATE INDEX IF NOT EXISTS idx_feedback_attachments_feedback_id ON feedback_attachments(feedback_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own attachments
CREATE POLICY "Users can view own attachments"
  ON feedback_attachments
  FOR SELECT
  USING (
    feedback_id IN (
      SELECT id FROM feedback WHERE user_id = auth.uid()
    )
  );

-- Users can insert attachments for their feedback
CREATE POLICY "Users can insert own attachments"
  ON feedback_attachments
  FOR INSERT
  WITH CHECK (
    feedback_id IN (
      SELECT id FROM feedback WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all feedback (admin access)
CREATE POLICY "Service role can manage feedback"
  ON feedback
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage attachments"
  ON feedback_attachments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on feedback
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

/**
 * Get feedback statistics
 */
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE (
  total_feedback BIGINT,
  open_feedback BIGINT,
  resolved_feedback BIGINT,
  avg_rating NUMERIC,
  bug_reports BIGINT,
  feature_requests BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_feedback,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_feedback,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_feedback,
    ROUND(AVG(rating), 2) as avg_rating,
    COUNT(*) FILTER (WHERE category = 'bug')::BIGINT as bug_reports,
    COUNT(*) FILTER (WHERE category = 'feature_request')::BIGINT as feature_requests
  FROM feedback;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_feedback_stats IS 'Get overall feedback statistics';

/**
 * Get user feedback summary
 */
CREATE OR REPLACE FUNCTION get_user_feedback_summary(p_user_id UUID)
RETURNS TABLE (
  total_submissions BIGINT,
  open_count BIGINT,
  resolved_count BIGINT,
  avg_rating NUMERIC,
  last_submission TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_submissions,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_count,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_count,
    ROUND(AVG(rating), 2) as avg_rating,
    MAX(created_at) as last_submission
  FROM feedback
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_feedback_summary IS 'Get feedback summary for a specific user';

/**
 * Get recent feedback
 */
CREATE OR REPLACE FUNCTION get_recent_feedback(
  p_limit INTEGER DEFAULT 10,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category TEXT,
  rating INTEGER,
  subject TEXT,
  message TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF p_status IS NOT NULL THEN
    RETURN QUERY
    SELECT
      f.id,
      f.user_id,
      f.category,
      f.rating,
      f.subject,
      f.message,
      f.status,
      f.priority,
      f.created_at
    FROM feedback f
    WHERE f.status = p_status
    ORDER BY f.created_at DESC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT
      f.id,
      f.user_id,
      f.category,
      f.rating,
      f.subject,
      f.message,
      f.status,
      f.priority,
      f.created_at
    FROM feedback f
    ORDER BY f.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_recent_feedback IS 'Get recent feedback, optionally filtered by status';

/**
 * Update feedback status
 */
CREATE OR REPLACE FUNCTION update_feedback_status(
  p_feedback_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS feedback AS $$
DECLARE
  v_feedback feedback;
BEGIN
  -- Validate status
  IF p_status NOT IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Update feedback
  UPDATE feedback
  SET
    status = p_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    resolved_at = CASE WHEN p_status = 'resolved' THEN NOW() ELSE resolved_at END,
    updated_at = NOW()
  WHERE id = p_feedback_id
  RETURNING * INTO v_feedback;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feedback not found: %', p_feedback_id;
  END IF;

  RETURN v_feedback;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_feedback_status IS 'Update feedback status with optional admin notes';

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT, INSERT ON feedback TO authenticated;
GRANT SELECT, INSERT ON feedback_attachments TO authenticated;
GRANT EXECUTE ON FUNCTION get_feedback_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_feedback_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION update_feedback_status TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('feedback', 'feedback_attachments');

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('feedback', 'feedback_attachments');

-- Check indexes exist
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('feedback', 'feedback_attachments');

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name IN ('get_feedback_stats', 'get_user_feedback_summary', 'get_recent_feedback', 'update_feedback_status');

-- ============================================
-- END OF MIGRATION
-- ============================================
