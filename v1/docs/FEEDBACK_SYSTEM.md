# 💬 User Feedback System

Complete feedback collection and management system for Design Kit.

## Overview

The feedback system allows users to:
- Submit bug reports
- Request new features
- Suggest improvements
- Ask questions
- Share general feedback

Features:
- ✅ **Anonymous & Authenticated** - Both types of feedback supported
- ✅ **5-Star Rating** - Optional satisfaction rating
- ✅ **Categories** - Bug, Feature, Improvement, Question, General
- ✅ **Screenshot Upload** - Visual bug reports
- ✅ **Status Tracking** - Open, In Progress, Resolved, etc.
- ✅ **Admin Dashboard** - Review and respond to feedback
- ✅ **Email Integration** - Ready for notifications

## Architecture

```
Feedback System Components:

Database:
├── feedback table          # Main feedback data
├── feedback_attachments    # Screenshots/files
└── Functions              # Helper functions

Components:
├── FeedbackButton         # Floating feedback button
├── FeedbackDialog         # Feedback submission form
└── FeedbackHistory        # User's feedback history

API:
└── /api/feedback          # CRUD operations
```

## Quick Start

### 1. Run Migration

```bash
# In Supabase dashboard, run:
supabase/migrations/005_feedback_system.sql
```

### 2. Create Storage Bucket

```sql
-- In Supabase Storage, create:
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-attachments', 'feedback-attachments', true);

-- Set policies to allow authenticated users to upload
CREATE POLICY "Users can upload feedback attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback-attachments');

CREATE POLICY "Anyone can view feedback attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feedback-attachments');
```

### 3. Add Feedback Button to Layout

```tsx
// app/layout.tsx or any page
import { FeedbackButton } from '@/components/shared/FeedbackButton'

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <FeedbackButton variant="floating" />
    </div>
  )
}
```

## Usage

### Basic Feedback Button

```tsx
import { FeedbackButton } from '@/components/shared/FeedbackButton'

// Floating button (bottom-right corner)
<FeedbackButton variant="floating" />

// Regular button
<FeedbackButton variant="default" />

// Outline button
<FeedbackButton variant="outline" />

// Ghost button
<FeedbackButton variant="ghost" />
```

### Show Feedback History

```tsx
// In profile page
import { FeedbackHistory } from '@/app/(dashboard)/profile/components/FeedbackHistory'

<FeedbackHistory />
```

### Programmatic Feedback Submission

```tsx
import { createBrowserClient } from '@/lib/supabase/client'

const supabase = createBrowserClient()

const { data, error } = await supabase.from('feedback').insert({
  category: 'bug',
  rating: 4,
  subject: 'Button not working',
  message: 'The download button on color picker is not responding',
  page_url: window.location.href,
  user_agent: navigator.userAgent
})
```

## Feedback Categories

| Category | Icon | Description | Use When |
|----------|------|-------------|----------|
| `bug` | 🐛 | Bug Report | Something is broken or not working |
| `feature_request` | ✨ | Feature Request | You want a new feature |
| `improvement` | 🚀 | Improvement | Existing feature can be better |
| `question` | ❓ | Question | You need help or clarification |
| `general` | 💬 | General Feedback | General thoughts/opinions |

## Feedback Statuses

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| `open` | New, not reviewed yet | System (default) |
| `in_progress` | Being worked on | Admin |
| `resolved` | Fixed/implemented | Admin |
| `closed` | Completed, no further action | Admin |
| `wont_fix` | Won't be addressed | Admin |

## Priority Levels

| Priority | Description |
|----------|-------------|
| `low` | Nice to have, not urgent |
| `medium` | Should be addressed (default) |
| `high` | Important, affects users |
| `urgent` | Critical, needs immediate attention |

## Database Schema

### feedback Table

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  user_id UUID,                    -- NULL for anonymous
  category TEXT,                   -- bug, feature_request, etc.
  rating INTEGER,                  -- 1-5 stars (optional)
  subject TEXT,                    -- Brief summary
  message TEXT,                    -- Detailed feedback
  page_url TEXT,                   -- Where feedback was submitted
  user_agent TEXT,                 -- Browser info
  status TEXT DEFAULT 'open',      -- open, in_progress, resolved, etc.
  priority TEXT DEFAULT 'medium',  -- low, medium, high, urgent
  admin_notes TEXT,                -- Internal notes
  resolved_at TIMESTAMP,           -- When marked resolved
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### feedback_attachments Table

```sql
CREATE TABLE feedback_attachments (
  id UUID PRIMARY KEY,
  feedback_id UUID,
  file_name TEXT,
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP
);
```

## Helper Functions

### Get Feedback Statistics

```sql
SELECT * FROM get_feedback_stats();

-- Returns:
-- total_feedback, open_feedback, resolved_feedback,
-- avg_rating, bug_reports, feature_requests
```

### Get User Feedback Summary

```sql
SELECT * FROM get_user_feedback_summary('user-uuid');

-- Returns:
-- total_submissions, open_count, resolved_count,
-- avg_rating, last_submission
```

### Get Recent Feedback

```sql
-- All recent feedback
SELECT * FROM get_recent_feedback(10);

-- Only open feedback
SELECT * FROM get_recent_feedback(10, 'open');
```

### Update Feedback Status

```sql
SELECT * FROM update_feedback_status(
  'feedback-uuid',
  'resolved',
  'Fixed in version 2.1.0'
);
```

## API Endpoints

### GET /api/feedback

Get current user's feedback.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "uuid",
    "category": "bug",
    "rating": 4,
    "subject": "Button issue",
    "message": "Download button not working",
    "status": "resolved",
    "created_at": "2025-01-01T00:00:00Z",
    "admin_notes": "Fixed in v2.1.0",
    "feedback_attachments": [...]
  }
]
```

### POST /api/feedback

Submit new feedback.

**Authentication:** Optional (anonymous allowed)

**Request:**
```json
{
  "category": "bug",
  "rating": 4,
  "subject": "Button not working",
  "message": "The download button freezes",
  "page_url": "https://app.com/color-picker",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "id": "uuid",
  "category": "bug",
  ...
}
```

### PATCH /api/feedback

Update feedback status (admin only).

**Authentication:** Required (admin)

**Request:**
```json
{
  "feedback_id": "uuid",
  "status": "resolved",
  "admin_notes": "Fixed in version 2.1.0"
}
```

## Admin Features

### Viewing Feedback

```tsx
// Get all feedback (admin only)
const { data } = await supabase
  .from('feedback')
  .select('*, feedback_attachments(*), profiles(email, full_name)')
  .order('created_at', { ascending: false })
```

### Updating Status

```tsx
await supabase.rpc('update_feedback_status', {
  p_feedback_id: 'uuid',
  p_status: 'resolved',
  p_admin_notes: 'Fixed in version 2.1.0'
})
```

### Filtering

```tsx
// Get only bugs
const { data } = await supabase
  .from('feedback')
  .select('*')
  .eq('category', 'bug')
  .eq('status', 'open')

// Get high priority
const { data } = await supabase
  .from('feedback')
  .select('*')
  .eq('priority', 'high')

// Get recent week
const { data } = await supabase
  .from('feedback')
  .select('*')
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
```

## Email Notifications (Future)

You can integrate with the email system to notify:

### User Notifications
- Feedback received confirmation
- Status update (resolved, in progress)
- Admin response added

### Admin Notifications
- New feedback submitted
- High priority feedback
- Daily/weekly digest

**Example:**
```typescript
// After feedback submission
await sendFeedbackConfirmationEmail(user.id, user.email, feedback)

// After status update
await sendFeedbackStatusUpdateEmail(user.id, user.email, feedback, 'resolved')
```

## Analytics Integration

Track feedback events:

```typescript
import { trackFeedbackSubmit } from '@/lib/analytics/track'

// After submission
trackFeedbackSubmit(rating, category)
```

## Best Practices

### For Users

1. **Be Specific** - Provide clear, detailed descriptions
2. **One Issue Per Feedback** - Don't combine multiple issues
3. **Include Steps** - For bugs, explain how to reproduce
4. **Add Screenshots** - Visual context helps immensely
5. **Rate Appropriately** - Honest ratings help prioritization

### For Admins

1. **Respond Promptly** - Acknowledge feedback within 24-48h
2. **Categorize Correctly** - Helps with filtering and prioritization
3. **Set Realistic Priorities** - Not everything can be urgent
4. **Close Loop** - Update status when resolved
5. **Thank Users** - Show appreciation for feedback

## Security & Privacy

### Anonymous Feedback

- Allowed by default
- No email or personal info required
- IP address not stored
- Can be disabled if needed

### Data Protection

- User data follows RLS policies
- Attachments stored in secure bucket
- Admin access is controlled
- Data can be deleted on request

### Spam Prevention

- Rate limiting (can be added)
- Honeypot fields (can be added)
- User authentication encouraged
- Manual admin review

## Customization

### Custom Categories

Edit migration to add categories:

```sql
ALTER TABLE feedback
DROP CONSTRAINT feedback_category_check;

ALTER TABLE feedback
ADD CONSTRAINT feedback_category_check
CHECK (category IN ('bug', 'feature_request', 'improvement', 'question', 'general', 'pricing'));
```

### Custom Statuses

```sql
ALTER TABLE feedback
DROP CONSTRAINT feedback_status_check;

ALTER TABLE feedback
ADD CONSTRAINT feedback_status_check
CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix', 'duplicate'));
```

## Future Enhancements

- [ ] Admin dashboard UI
- [ ] Email notifications
- [ ] Feedback voting (upvotes)
- [ ] Public roadmap
- [ ] Feedback tagging
- [ ] Auto-categorization (AI)
- [ ] Sentiment analysis
- [ ] Integration with issue trackers (GitHub, Linear)
- [ ] Multi-language support
- [ ] Voice feedback

## Troubleshooting

### Feedback not submitting

1. Check Supabase connection
2. Check RLS policies
3. Check console for errors
4. Verify migration ran successfully

### Attachments not uploading

1. Check storage bucket exists
2. Check bucket policies allow upload
3. Check file size < 5MB
4. Check file type is image

### Can't see feedback history

1. Check user is authenticated
2. Check RLS policies
3. Check user_id matches

## Related Documentation

- [Database Schema](../supabase/migrations/005_feedback_system.sql)
- [Email System](../lib/email/README.md)
- [Analytics](../lib/analytics/README.md)
