# Sentry Integration Guide

This guide explains how to use Sentry for error tracking and monitoring in the Design Kit application.

## Overview

Sentry is integrated into the application to provide:
- **Error Tracking**: Automatic capture of client and server-side errors
- **Performance Monitoring**: Track slow operations and API calls
- **Session Replay**: Record user sessions when errors occur (production only)
- **User Context**: Associate errors with specific users
- **Breadcrumbs**: Track user actions leading up to errors

## Configuration Files

### Client Configuration (`sentry.client.config.ts`)
- Handles browser-side error tracking
- Includes Session Replay for debugging
- Filters sensitive data before sending to Sentry

### Server Configuration (`sentry.server.config.ts`)
- Handles server-side error tracking
- Monitors API routes and server functions
- Removes sensitive environment variables from error reports

## Environment Variables

Add these to your `.env.local` file:

```bash
# Sentry DSN (safe for client-side)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Sentry Auth Token (SERVER-SIDE ONLY)
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxx

# Sentry Organization Slug
SENTRY_ORG=your-org-slug

# Sentry Project Name
SENTRY_PROJECT=design-kit

# Optional: Enable Sentry in development
# SENTRY_DEBUG=true
```

## Usage

### 1. Reporting Errors

Use `reportError()` to report errors throughout the application:

```typescript
import { reportError } from '@/lib/utils/error-logger'

try {
  // Your code here
  await processImage(file)
} catch (error) {
  reportError(error as Error, {
    toolName: 'image-compressor',
    fileSize: file.size,
    fileType: file.type,
  })
  
  // Show user-friendly error message
  toast.error('Failed to process image')
}
```

### 2. Setting User Context

Set user context after login to associate errors with specific users:

```typescript
import { setSentryUser } from '@/lib/utils/error-logger'

// After successful login
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.full_name,
  plan: user.plan,
})
```

Clear user context after logout:

```typescript
import { clearSentryUser } from '@/lib/utils/error-logger'

// After logout
clearSentryUser()
```

### 3. Adding Breadcrumbs

Add breadcrumbs to track user actions leading to errors:

```typescript
import { addBreadcrumb } from '@/lib/utils/error-logger'

// Track important user actions
addBreadcrumb(
  'User uploaded file',
  'user-action',
  'info',
  {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  }
)

addBreadcrumb(
  'Started image processing',
  'processing',
  'info',
  {
    toolName: 'background-remover',
    processingTime: Date.now(),
  }
)
```

### 4. Setting Custom Context

Add custom context that will be included with all errors:

```typescript
import { setSentryContext } from '@/lib/utils/error-logger'

// Set tool-specific context
setSentryContext('tool', {
  name: 'image-compressor',
  version: '1.0.0',
  settings: {
    quality: 0.8,
    format: 'jpeg',
  },
})
```

### 5. Capturing Messages

Capture important non-error events:

```typescript
import { captureMessage } from '@/lib/utils/error-logger'

// Track important events
captureMessage(
  'User exceeded daily quota',
  'warning',
  {
    userId: user.id,
    plan: user.plan,
    currentUsage: usage.count,
    limit: usage.limit,
  }
)
```

## Best Practices

### 1. Always Sanitize Sensitive Data

The Sentry configuration automatically removes:
- Authorization headers
- Cookies
- API keys
- File data (blobs, buffers, image data)
- Large data payloads

But you should still be careful not to include sensitive data in context:

```typescript
// ❌ Bad - includes sensitive data
reportError(error, {
  apiKey: process.env.REMOVE_BG_API_KEY,
  userPassword: password,
})

// ✅ Good - no sensitive data
reportError(error, {
  toolName: 'background-remover',
  fileSize: file.size,
})
```

### 2. Add Meaningful Context

Include context that helps debug the issue:

```typescript
// ❌ Bad - not enough context
reportError(error)

// ✅ Good - helpful context
reportError(error, {
  toolName: 'image-upscaler',
  fileSize: file.size,
  fileType: file.type,
  scale: 2,
  model: 'esrgan',
  userId: user.id,
  plan: user.plan,
})
```

### 3. Use Breadcrumbs for User Flow

Add breadcrumbs at key points in the user journey:

```typescript
// User starts using a tool
addBreadcrumb('Opened image compressor', 'navigation', 'info')

// User uploads file
addBreadcrumb('File uploaded', 'user-action', 'info', {
  fileName: file.name,
  fileSize: file.size,
})

// Processing starts
addBreadcrumb('Started compression', 'processing', 'info')

// Processing completes
addBreadcrumb('Compression completed', 'processing', 'info', {
  originalSize: originalSize,
  compressedSize: compressedSize,
  compressionRatio: ratio,
})
```

### 4. Set User Context Early

Set user context as soon as the user logs in:

```typescript
// In your auth store or login handler
const handleLogin = async (user: User) => {
  // Set user in Sentry
  setSentryUser({
    id: user.id,
    email: user.email,
    username: user.full_name,
    plan: user.plan,
  })
  
  // Rest of login logic
}
```

### 5. Clear User Context on Logout

Always clear user context when the user logs out:

```typescript
// In your auth store or logout handler
const handleLogout = async () => {
  // Clear user from Sentry
  clearSentryUser()
  
  // Rest of logout logic
}
```

## API Route Error Handling

For API routes, wrap your handlers with error reporting:

```typescript
// app/api/tools/background-remover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { reportError } from '@/lib/utils/error-logger'

export async function POST(request: NextRequest) {
  try {
    // Your API logic here
    const result = await processImage(data)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    // Report error to Sentry
    reportError(error as Error, {
      endpoint: '/api/tools/background-remover',
      method: 'POST',
      userId: user?.id,
    })
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}
```

## Testing Sentry Integration

### Development Testing

Enable Sentry in development by setting:

```bash
SENTRY_DEBUG=true
```

Then trigger an error to test:

```typescript
// Add a test button in development
if (process.env.NODE_ENV === 'development') {
  <button onClick={() => {
    throw new Error('Test Sentry error')
  }}>
    Test Sentry
  </button>
}
```

### Production Testing

After deploying to production:

1. Check Sentry dashboard for incoming events
2. Verify user context is being set correctly
3. Check that sensitive data is being filtered
4. Verify breadcrumbs are being captured

## Monitoring and Alerts

### Setting Up Alerts

In Sentry dashboard:

1. Go to **Alerts** → **Create Alert**
2. Set up alerts for:
   - Error rate exceeds threshold
   - New error types
   - Performance degradation
   - Quota warnings

### Key Metrics to Monitor

- **Error Rate**: Percentage of requests that result in errors
- **Affected Users**: Number of unique users experiencing errors
- **Error Frequency**: How often specific errors occur
- **Performance**: API response times and slow operations

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify Sentry is initialized (check browser console for Sentry logs)
3. Make sure you're not in development mode (unless `SENTRY_DEBUG=true`)
4. Check that errors aren't being filtered by `ignoreErrors` config

### Too Many Events

If you're hitting Sentry quota limits:

1. Lower `tracesSampleRate` in config files
2. Lower `replaysSessionSampleRate` for Session Replay
3. Add more errors to `ignoreErrors` list
4. Filter out noisy errors in Sentry dashboard

### Sensitive Data Leaking

If sensitive data is appearing in Sentry:

1. Check `beforeSend` hooks in config files
2. Add more filters for sensitive fields
3. Review context data being passed to `reportError()`
4. Use Sentry's data scrubbing rules in dashboard

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md)
- [Security Guidelines](../../docs/security-guidelines.md)
