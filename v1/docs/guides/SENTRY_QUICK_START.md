# Sentry Quick Start Guide

## Setup (5 minutes)

### 1. Create Sentry Account
1. Go to https://sentry.io and sign up
2. Create a new project (select "Next.js")
3. Copy your DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 2. Configure Environment Variables
Add to your `.env.local`:

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional (for source maps in production)
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=design-kit
```

### 3. Test It Works
```bash
# Enable Sentry in development
SENTRY_DEBUG=true npm run dev
```

Then trigger a test error in your browser console:
```javascript
throw new Error('Test Sentry error')
```

Check your Sentry dashboard - you should see the error!

## Common Usage Patterns

### 1. Report Errors in Try-Catch
```typescript
import { reportError } from '@/lib/utils/error-logger'

try {
  await riskyOperation()
} catch (error) {
  reportError(error as Error, {
    toolName: 'image-compressor',
    operation: 'compress',
  })
  toast.error('Operation failed')
}
```

### 2. Set User Context After Login
```typescript
import { setSentryUser } from '@/lib/utils/error-logger'

// In your login handler
const handleLogin = async (user) => {
  setSentryUser({
    id: user.id,
    email: user.email,
    username: user.full_name,
    plan: user.plan,
  })
}
```

### 3. Clear User Context After Logout
```typescript
import { clearSentryUser } from '@/lib/utils/error-logger'

// In your logout handler
const handleLogout = async () => {
  clearSentryUser()
  // ... rest of logout logic
}
```

### 4. Add Breadcrumbs for Context
```typescript
import { addBreadcrumb } from '@/lib/utils/error-logger'

// Track user actions
addBreadcrumb('File uploaded', 'user-action', 'info', {
  fileName: file.name,
  fileSize: file.size,
})

// Track processing steps
addBreadcrumb('Started compression', 'processing', 'info')
```

### 5. API Route Error Handling
```typescript
import { reportError } from '@/lib/utils/error-logger'

export async function POST(request: NextRequest) {
  try {
    const result = await processImage(data)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    reportError(error as Error, {
      endpoint: '/api/tools/background-remover',
      method: 'POST',
    })
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
```

## What Gets Tracked Automatically?

✅ **Client-side errors** - Unhandled exceptions in browser
✅ **Server-side errors** - API route errors, server crashes
✅ **Performance** - Slow API calls, page loads (10% sample)
✅ **Session Replay** - User sessions when errors occur (production only)
✅ **Breadcrumbs** - Navigation, console logs, API calls

## What Gets Filtered Out?

🔒 **Authorization headers** - Removed automatically
🔒 **Cookies** - Removed automatically
🔒 **API keys** - Removed automatically
🔒 **File data** - Blobs, buffers, image data removed
🔒 **Large payloads** - Data >1000 chars redacted
🔒 **Sensitive params** - token, key, secret, password

## Production Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in production environment
- [ ] Set `SENTRY_AUTH_TOKEN` for source map uploads
- [ ] Add `setSentryUser()` to login handler
- [ ] Add `clearSentryUser()` to logout handler
- [ ] Add `reportError()` to all API routes
- [ ] Test error reporting in staging
- [ ] Configure alerts in Sentry dashboard
- [ ] Set up notification channels (Slack, email)

## Troubleshooting

**Errors not showing in Sentry?**
- Check `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Make sure you're in production mode (or set `SENTRY_DEBUG=true`)
- Check browser console for Sentry initialization logs

**Too many events?**
- Lower `tracesSampleRate` in config files (default: 10%)
- Lower `replaysSessionSampleRate` (default: 10%)
- Add more errors to `ignoreErrors` list

**Sensitive data leaking?**
- Check `beforeSend` hooks in config files
- Review context data passed to `reportError()`
- Use Sentry's data scrubbing rules in dashboard

## Resources

- [Full Integration Guide](./SENTRY_INTEGRATION_GUIDE.md)
- [Sentry Dashboard](https://sentry.io)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
