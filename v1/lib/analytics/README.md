# 📊 Analytics System

Comprehensive analytics tracking system for Design Kit with client-side (Plausible) and server-side (Database) tracking.

## Overview

The analytics system tracks:
- **User behavior** - Signups, logins, profile updates
- **Tool usage** - Opens, uploads, processing, downloads
- **Conversions** - Pricing views, upgrades, checkouts
- **Engagement** - Help clicks, feedback, sharing
- **Errors** - Quota exceeded, validation failures

## Architecture

```
lib/analytics/
├── events.ts          # Event definitions and metadata
├── track.ts           # Client-side tracking functions
├── useAnalytics.ts    # React hook for tracking
└── README.md          # This file

app/api/analytics/
└── track/route.ts     # Server-side tracking endpoint

supabase/migrations/
└── 004_analytics_events.sql  # Database schema

components/providers/
└── AnalyticsProvider.tsx  # Plausible integration
```

## Quick Start

### 1. Install Recharts (for charts)

```bash
npm install recharts
```

### 2. Add Plausible Domain

```bash
# .env.local
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=designkit.com
```

### 3. Add Analytics Provider

```tsx
// app/layout.tsx
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  )
}
```

### 4. Run Migration

```bash
# In Supabase dashboard, run:
supabase/migrations/004_analytics_events.sql
```

## Usage

### Basic Tracking

```tsx
'use client'

import { useAnalytics } from '@/lib/analytics/useAnalytics'

export function MyComponent() {
  const { track } = useAnalytics()

  function handleClick() {
    track('help_clicked', {
      location: 'toolbar',
      topic: 'getting-started'
    })
  }

  return <button onClick={handleClick}>Help</button>
}
```

### Tool Usage Tracking

```tsx
import {
  trackToolOpened,
  trackFileUpload,
  trackProcessingCompleted,
  trackDownload
} from '@/lib/analytics/track'

// When tool page loads
trackToolOpened('color-picker')

// When file is uploaded
trackFileUpload('color-picker', 2.5, 'image/png')

// When processing completes
trackProcessingCompleted('color-picker', 1234, true)

// When user downloads
trackDownload('color-picker', 'png')
```

### Subscription Tracking

```tsx
import {
  trackPricingPageView,
  trackUpgradeClick,
  trackCheckoutCompleted
} from '@/lib/analytics/track'

// On pricing page load
trackPricingPageView()

// When upgrade button clicked
trackUpgradeClick('premium', 'pricing_page')

// After successful checkout
trackCheckoutCompleted('premium', 19.99)
```

### Server-Side Tracking

For important events that need persistence:

```tsx
const { trackServer } = useAnalytics()

// Track with database storage
await trackServer('checkout_completed', {
  plan: 'premium',
  price: 19.99,
  revenue: 19.99
})
```

### Funnel Tracking

```tsx
import { funnelTracker } from '@/lib/analytics/track'

// Start funnel
funnelTracker.startFunnel('signup_to_first_tool', 'user_signup')

// Complete steps
funnelTracker.completeStep('signup_to_first_tool', 'tool_opened')
funnelTracker.completeStep('signup_to_first_tool', 'tool_file_uploaded')

// Complete funnel
funnelTracker.completeFunnel('signup_to_first_tool')

// Or abandon
funnelTracker.abandonFunnel('signup_to_first_tool', 'user_left_page')
```

## Events Reference

### User Events

| Event | Description | Properties |
|-------|-------------|------------|
| `user_signup` | User completed signup | `method` |
| `user_login` | User logged in | `method` |
| `user_logout` | User logged out | - |
| `profile_updated` | Profile updated | `fields_updated` |

### Tool Events

| Event | Description | Properties |
|-------|-------------|------------|
| `tool_opened` | Tool page opened | `tool_name` |
| `tool_file_uploaded` | File uploaded | `tool_name`, `file_size_mb`, `file_type` |
| `tool_processing_started` | Processing started | `tool_name` |
| `tool_processing_completed` | Processing completed | `tool_name`, `processing_time_ms`, `success` |
| `tool_download` | File downloaded | `tool_name`, `file_type` |

### Subscription Events

| Event | Description | Properties |
|-------|-------------|------------|
| `pricing_page_viewed` | Pricing page viewed | - |
| `upgrade_button_clicked` | Upgrade clicked | `plan`, `location` |
| `checkout_started` | Checkout started | `plan`, `price` |
| `checkout_completed` | Checkout completed | `plan`, `price`, `revenue` |
| `subscription_canceled` | Subscription canceled | - |

### Engagement Events

| Event | Description | Properties |
|-------|-------------|------------|
| `help_clicked` | Help/info clicked | `location`, `topic?` |
| `feedback_submitted` | Feedback submitted | `rating?`, `category?` |
| `share_clicked` | Share clicked | `platform`, `content_type` |

### Error Events

| Event | Description | Properties |
|-------|-------------|------------|
| `error_occurred` | Error happened | `error_type`, `error_message`, `component?` |
| `quota_exceeded` | Quota limit hit | `tool_name`, `current_usage`, `limit` |
| `file_validation_failed` | File validation failed | `reason`, `file_type?` |

## Analytics Dashboard

### Add to Dashboard Page

```tsx
// app/(dashboard)/dashboard/page.tsx
import { AnalyticsDashboard } from './components/AnalyticsDashboard'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  )
}
```

### Dashboard Features

- **Total Activity** - Event count in last 30 days
- **Tools Used** - Number of different tools accessed
- **Most Used** - Top tool by usage count
- **Last Activity** - Most recent tool usage
- **Activity by Category** - Pie chart of event categories
- **Most Used Tools** - Bar chart of top 5 tools
- **Tool Usage Details** - Detailed list with usage counts

## Database Queries

### Get User Event Counts

```sql
SELECT * FROM get_user_event_counts(
  'user-uuid',
  NOW() - INTERVAL '30 days',
  NOW()
);
```

### Get Top Tools

```sql
SELECT * FROM get_user_top_tools(
  'user-uuid',
  10  -- limit
);
```

### Get Daily Active Users

```sql
SELECT * FROM get_daily_active_users(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

### Get Conversion Funnel

```sql
SELECT * FROM get_conversion_funnel(
  ARRAY['user_signup', 'tool_opened', 'tool_download'],
  NOW() - INTERVAL '30 days',
  NOW()
);
```

### Get Tool Performance

```sql
SELECT * FROM get_tool_performance_metrics(
  'color-picker',
  NOW() - INTERVAL '7 days'
);
```

## Conversion Funnels

Pre-defined funnels in `events.ts`:

### Signup to First Tool

```typescript
['user_signup', 'tool_opened', 'tool_file_uploaded', 'tool_processing_completed', 'tool_download']
```

### Free to Premium

```typescript
['quota_exceeded', 'pricing_page_viewed', 'upgrade_button_clicked', 'checkout_started', 'checkout_completed']
```

### Tool Completion

```typescript
['tool_opened', 'tool_file_uploaded', 'tool_processing_started', 'tool_processing_completed', 'tool_download']
```

## Plausible Analytics

### Features

- ✅ Automatic pageview tracking
- ✅ Custom event tracking
- ✅ Privacy-friendly (GDPR compliant)
- ✅ No cookies
- ✅ Lightweight (<1KB)

### Setup

1. Create account at https://plausible.io
2. Add domain
3. Copy domain name
4. Add to `.env`:
   ```bash
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yoursite.com
   ```

### View Analytics

Go to https://plausible.io/yoursite.com

## Performance Considerations

### Client-Side Tracking

- Events are tracked asynchronously
- No impact on page load
- Failed tracking doesn't break UI

### Server-Side Tracking

- Use sparingly for critical events only
- Always async/non-blocking
- Errors are logged but not thrown

### Database Indexes

All queries are optimized with indexes:
- `user_id` - Fast user queries
- `event_name` - Fast event filtering
- `timestamp` - Fast time-range queries
- `properties` (GIN) - Fast JSON queries

## Privacy & Compliance

### Data Collection

- **Anonymous users** - Can be tracked (no PII)
- **Authenticated users** - User ID stored
- **No tracking** - Users can opt out via browser

### GDPR Compliance

- Plausible is GDPR compliant (no cookies)
- Database stores only non-PII by default
- User can request data deletion

### Data Retention

- Analytics events - 90 days (configurable)
- Plausible - 30 days (free plan)

## Troubleshooting

### Events Not Showing in Plausible

1. Check domain name matches exactly
2. Check Plausible script is loaded (Network tab)
3. Check ad blockers aren't blocking Plausible
4. Check console for errors

### Server-Side Tracking Failing

1. Check `/api/analytics/track` route exists
2. Check migration ran successfully
3. Check RLS policies allow insert
4. Check Sentry for errors

### Dashboard Not Loading

1. Check migration `004_analytics_events.sql` ran
2. Check functions exist in Supabase
3. Check user has permissions
4. Check console for errors

## Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] A/B testing framework
- [ ] Cohort analysis
- [ ] Revenue tracking
- [ ] User segmentation
- [ ] Email campaign tracking
- [ ] Attribution modeling
- [ ] Predictive analytics

## Related Documentation

- [Event Definitions](./events.ts)
- [Tracking Functions](./track.ts)
- [useAnalytics Hook](./useAnalytics.ts)
- [Database Schema](../../supabase/migrations/004_analytics_events.sql)
- [Plausible Docs](https://plausible.io/docs)
