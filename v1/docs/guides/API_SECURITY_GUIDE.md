# API Security Guide

This guide explains how to use the API security utilities to create secure API routes with authentication, rate limiting, and error handling.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Functions](#core-functions)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Quick Start

The simplest way to create a secure API route is using `withApiSecurity`:

```typescript
import { NextRequest } from 'next/server'
import { withApiSecurity } from '@/lib/utils/apiSecurity'

export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Your handler logic here
      const body = await req.json()
      
      return {
        success: true,
        message: 'Hello ' + user?.email,
      }
    },
    {
      requireAuth: true,
      rateLimit: 'free',
    }
  )
}
```

## Core Functions

### `withApiSecurity`

Complete API route wrapper that handles all security checks and error handling.

**Parameters:**
- `request: NextRequest` - The incoming request
- `handler: (request, user?) => Promise<T>` - Your handler function
- `config: ApiRouteConfig` - Security configuration

**Returns:** `NextResponse` with proper error handling and rate limit headers

**Example:**
```typescript
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Process request
      return { success: true }
    },
    {
      requireAuth: true,
      allowedMethods: ['POST'],
      rateLimit: 'free',
    }
  )
}
```

### `secureApiRoute`

Lower-level function for manual security checks. Use this when you need more control.

**Parameters:**
- `request: NextRequest` - The incoming request
- `config: ApiRouteConfig` - Security configuration

**Returns:** `ApiSecurityResult` with success status and user info

**Example:**
```typescript
export async function POST(request: NextRequest) {
  const security = await secureApiRoute(request, {
    requireAuth: true,
    rateLimit: 'free',
  })
  
  if (!security.success) {
    return security.response
  }
  
  const user = security.user!
  
  // Your logic here...
  
  return createSuccessResponse({ success: true })
}
```

### `handleApiError`

Handles errors with proper logging and sanitization.

**Parameters:**
- `error: unknown` - The error to handle
- `context?: Record<string, any>` - Additional context for logging

**Returns:** `NextResponse` with formatted error

**Example:**
```typescript
try {
  // Process request
} catch (error) {
  return handleApiError(error, {
    toolName: 'background-remover',
    userId: user.id,
  })
}
```

### `checkUserQuota`

Checks if user has available API quota.

**Parameters:**
- `userId: string` - User ID to check

**Returns:** `Promise<boolean>` - True if quota available

**Throws:** `ApiError` if quota exceeded

**Example:**
```typescript
await checkUserQuota(user.id)
```

### `incrementUserUsage`

Increments user's API usage after successful operation.

**Parameters:**
- `userId: string` - User ID
- `toolName: string` - Name of the tool used

**Returns:** `Promise<boolean>` - True if successful

**Example:**
```typescript
await incrementUserUsage(user.id, 'background-remover')
```

### `validateRequestBody`

Validates request body with custom validator.

**Parameters:**
- `request: NextRequest` - The request
- `validator?: (data: any) => true | string` - Validation function

**Returns:** `Promise<T>` - Parsed body

**Throws:** `ApiError` if validation fails

**Example:**
```typescript
const body = await validateRequestBody(request, (data) => {
  if (!data.plan || !['premium', 'pro'].includes(data.plan)) {
    return 'Invalid plan'
  }
  return true
})
```

### `validateQueryParams`

Validates required query parameters.

**Parameters:**
- `request: NextRequest` - The request
- `requiredParams: string[]` - Required parameter names

**Returns:** `Record<string, string>` - Query parameters

**Throws:** `ApiError` if parameters missing

**Example:**
```typescript
const params = validateQueryParams(request, ['userId', 'toolName'])
```

### `createSuccessResponse`

Creates formatted success response with rate limit headers.

**Parameters:**
- `data: T` - Response data
- `options?: { status?, headers?, rateLimit? }` - Response options

**Returns:** `NextResponse`

**Example:**
```typescript
return createSuccessResponse(
  { message: 'Success', data: result },
  { status: 200, rateLimit: security.rateLimit }
)
```

## Configuration Options

### `ApiRouteConfig`

```typescript
interface ApiRouteConfig {
  // Require authentication (default: true)
  requireAuth?: boolean
  
  // Allowed HTTP methods (default: ['POST'])
  allowedMethods?: string[]
  
  // Rate limit tier or custom config (default: 'free')
  rateLimit?: 'guest' | 'free' | 'premium' | 'pro' | 'strict' | RateLimitConfig | false
  
  // Custom rate limit identifier
  rateLimitIdentifier?: (request: NextRequest, user?: User) => string | Promise<string>
  
  // Additional error context
  errorContext?: Record<string, any>
}
```

### Rate Limit Tiers

- **guest**: 30 requests/minute (unauthenticated)
- **free**: 60 requests/minute
- **premium**: 120 requests/minute
- **pro**: 300 requests/minute
- **strict**: 5 requests/minute (sensitive operations)

## Usage Examples

### Example 1: Simple Protected Route

```typescript
// app/api/user/profile/route.ts
import { NextRequest } from 'next/server'
import { withApiSecurity } from '@/lib/utils/apiSecurity'

export async function GET(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      return {
        id: user!.id,
        email: user!.email,
      }
    },
    {
      requireAuth: true,
      allowedMethods: ['GET'],
      rateLimit: 'free',
    }
  )
}
```

### Example 2: API Tool with Quota Check

```typescript
// app/api/tools/background-remover/route.ts
import { NextRequest } from 'next/server'
import {
  withApiSecurity,
  checkUserQuota,
  incrementUserUsage,
  validateRequestBody,
} from '@/lib/utils/apiSecurity'

export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Validate request body
      const body = await validateRequestBody(req, (data) => {
        if (!data.imageUrl) {
          return 'imageUrl is required'
        }
        return true
      })
      
      // Check quota
      await checkUserQuota(user!.id)
      
      // Process image
      const result = await removeBackground(body.imageUrl)
      
      // Increment usage
      await incrementUserUsage(user!.id, 'background-remover')
      
      return {
        success: true,
        result,
      }
    },
    {
      requireAuth: true,
      rateLimit: 'strict', // Stricter limit for API tools
      errorContext: { toolName: 'background-remover' },
    }
  )
}
```

### Example 3: Public Route with IP Rate Limiting

```typescript
// app/api/public/contact/route.ts
import { NextRequest } from 'next/server'
import { withApiSecurity, validateRequestBody } from '@/lib/utils/apiSecurity'

export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req) => {
      const body = await validateRequestBody(req, (data) => {
        if (!data.email || !data.message) {
          return 'Email and message are required'
        }
        return true
      })
      
      // Send email
      await sendContactEmail(body)
      
      return { success: true }
    },
    {
      requireAuth: false,
      rateLimit: 'guest', // IP-based rate limiting
      errorContext: { endpoint: 'contact' },
    }
  )
}
```

### Example 4: Stripe Webhook (No Auth, Custom Rate Limit)

```typescript
// app/api/stripe/webhook/route.ts
import { NextRequest } from 'next/server'
import { withApiSecurity } from '@/lib/utils/apiSecurity'

export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req) => {
      const body = await req.text()
      const signature = req.headers.get('stripe-signature')!
      
      // Verify webhook
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
      
      // Process event
      await handleStripeEvent(event)
      
      return { received: true }
    },
    {
      requireAuth: false,
      rateLimit: {
        maxRequests: 100,
        windowSeconds: 60,
        identifier: () => 'stripe-webhook', // Single identifier for all webhook requests
      },
      errorContext: { endpoint: 'stripe-webhook' },
    }
  )
}
```

### Example 5: Manual Security Checks

```typescript
// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  secureApiRoute,
  createSuccessResponse,
  handleApiError,
  ApiError,
  ApiErrorType,
} from '@/lib/utils/apiSecurity'

export async function GET(request: NextRequest) {
  try {
    // Run security checks
    const security = await secureApiRoute(request, {
      requireAuth: true,
      allowedMethods: ['GET'],
      rateLimit: 'premium',
    })
    
    if (!security.success) {
      return security.response
    }
    
    const user = security.user!
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      throw new ApiError(
        ApiErrorType.AUTHORIZATION,
        'Admin access required',
        403
      )
    }
    
    // Get analytics data
    const analytics = await getAnalytics()
    
    return createSuccessResponse(analytics, {
      rateLimit: security.rateLimit,
    })
  } catch (error) {
    return handleApiError(error, { endpoint: 'admin-analytics' })
  }
}
```

### Example 6: Custom Rate Limit Identifier

```typescript
// app/api/tools/batch-process/route.ts
import { NextRequest } from 'next/server'
import { withApiSecurity } from '@/lib/utils/apiSecurity'

export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Process batch
      return { success: true }
    },
    {
      requireAuth: true,
      rateLimit: {
        maxRequests: 10,
        windowSeconds: 3600, // 10 requests per hour
        errorMessage: 'Batch processing limit reached. Try again in an hour.',
      },
      rateLimitIdentifier: async (req, user) => {
        // Use combination of user ID and tool name for rate limiting
        return `batch:${user!.id}:background-remover`
      },
    }
  )
}
```

## Error Handling

### ApiError Class

Use `ApiError` for throwing specific error types:

```typescript
import { ApiError, ApiErrorType } from '@/lib/utils/apiSecurity'

// Validation error
throw new ApiError(
  ApiErrorType.VALIDATION,
  'Invalid input',
  400,
  { field: 'email' }
)

// Quota exceeded
throw new ApiError(
  ApiErrorType.QUOTA_EXCEEDED,
  'Daily quota exceeded',
  429
)

// Authorization error
throw new ApiError(
  ApiErrorType.AUTHORIZATION,
  'Admin access required',
  403
)
```

### Error Types

- `VALIDATION` - Input validation errors (400)
- `AUTHENTICATION` - Authentication failures (401)
- `AUTHORIZATION` - Permission denied (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource conflict (409)
- `QUOTA_EXCEEDED` - API quota exceeded (429)
- `RATE_LIMIT` - Rate limit exceeded (429)
- `BAD_REQUEST` - Malformed request (400)
- `INTERNAL` - Internal server error (500)

## Best Practices

### 1. Always Use Security Wrapper

Use `withApiSecurity` for all API routes:

```typescript
// ✅ Good
export async function POST(request: NextRequest) {
  return withApiSecurity(request, handler, config)
}

// ❌ Bad - no security checks
export async function POST(request: NextRequest) {
  const body = await request.json()
  // Process...
}
```

### 2. Check Quota Before Processing

Always check quota before expensive operations:

```typescript
// ✅ Good
await checkUserQuota(user.id)
const result = await expensiveOperation()
await incrementUserUsage(user.id, 'tool-name')

// ❌ Bad - process first, check later
const result = await expensiveOperation()
await checkUserQuota(user.id) // Too late!
```

### 3. Use Appropriate Rate Limits

Choose rate limits based on operation cost:

```typescript
// Expensive API operations
rateLimit: 'strict' // 5/min

// Regular API tools
rateLimit: 'free' // 60/min

// Read-only operations
rateLimit: 'premium' // 120/min

// Public endpoints
rateLimit: 'guest' // 30/min
```

### 4. Add Context to Errors

Always provide context for better debugging:

```typescript
return withApiSecurity(
  request,
  handler,
  {
    errorContext: {
      toolName: 'background-remover',
      endpoint: '/api/tools/background-remover',
      version: '1.0',
    },
  }
)
```

### 5. Validate Input

Always validate request data:

```typescript
const body = await validateRequestBody(request, (data) => {
  if (!data.imageUrl) return 'imageUrl is required'
  if (!isValidUrl(data.imageUrl)) return 'Invalid URL'
  return true
})
```

### 6. Handle Errors Gracefully

Use try-catch for operations that might fail:

```typescript
try {
  const result = await externalApiCall()
  return createSuccessResponse(result)
} catch (error) {
  return handleApiError(error, { operation: 'external-api' })
}
```

### 7. Don't Expose Sensitive Data

Never include sensitive data in error responses:

```typescript
// ✅ Good
throw new ApiError(
  ApiErrorType.INTERNAL,
  'Operation failed',
  500
)

// ❌ Bad - exposes internal details
throw new Error(`Database connection failed: ${dbPassword}`)
```

### 8. Use Proper HTTP Methods

Specify allowed methods explicitly:

```typescript
{
  allowedMethods: ['POST'], // Only POST allowed
}
```

### 9. Increment Usage After Success

Only increment usage after successful processing:

```typescript
const result = await processImage()

// Only increment if successful
if (result.success) {
  await incrementUserUsage(user.id, 'tool-name')
}
```

### 10. Test Rate Limits

Test rate limiting in development:

```typescript
// Set UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN in .env.local
// Make multiple requests to test rate limiting
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'
import { ApiError, ApiErrorType } from '@/lib/utils/apiSecurity'

describe('ApiError', () => {
  it('should create error with correct properties', () => {
    const error = new ApiError(
      ApiErrorType.VALIDATION,
      'Invalid input',
      400
    )
    
    expect(error.type).toBe(ApiErrorType.VALIDATION)
    expect(error.message).toBe('Invalid input')
    expect(error.statusCode).toBe(400)
  })
})
```

### Integration Tests

```typescript
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('API Route', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/test')
    const response = await POST(request)
    
    expect(response.status).toBe(401)
  })
  
  it('should return 429 for rate limit exceeded', async () => {
    // Make multiple requests...
  })
})
```

## Troubleshooting

### Rate Limiting Not Working

1. Check if Upstash Redis is configured:
   ```bash
   echo $UPSTASH_REDIS_URL
   echo $UPSTASH_REDIS_TOKEN
   ```

2. Check if rate limiter is initialized:
   ```typescript
   import { isRedisAvailable } from '@/lib/utils/rateLimit'
   console.log('Redis available:', isRedisAvailable())
   ```

3. Falls back to in-memory rate limiting if Redis unavailable

### Authentication Failing

1. Check if Supabase is configured
2. Verify JWT token in request headers
3. Check if user session is valid

### Quota Check Failing

1. Verify database function exists: `can_use_api_tool`
2. Check if daily_limits table has data
3. Verify user's plan in profiles table

## Migration Guide

### From Manual Security Checks

**Before:**
```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Process...
}
```

**After:**
```typescript
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Process...
    },
    { requireAuth: true }
  )
}
```

## Additional Resources

- [Rate Limiting Guide](./RATE_LIMITING_GUIDE.md)
- [Error Handling Guide](../../docs/ERROR_HANDLING.md)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
