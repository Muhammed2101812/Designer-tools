# Rate Limiting Guide

This guide explains how to use the rate limiting infrastructure in Design Kit.

## Overview

The rate limiting system uses **Upstash Redis** for distributed rate limiting with automatic fallback to in-memory storage when Redis is not available. This ensures the application works in development without Redis while providing production-grade rate limiting when deployed.

## Features

- ✅ Upstash Redis integration with automatic fallback
- ✅ IP-based rate limiting for public endpoints
- ✅ User-based rate limiting for authenticated endpoints
- ✅ API tool rate limiting with stricter limits
- ✅ Configurable rate limit windows and thresholds
- ✅ Standard rate limit headers (X-RateLimit-*)
- ✅ Predefined configurations for different user tiers

## Setup

### 1. Install Dependencies

```bash
npm install @upstash/redis @upstash/ratelimit
```

### 2. Configure Environment Variables

Add to your `.env.local`:

```env
# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

Get these credentials from [Upstash Console](https://console.upstash.com/).

### 3. Verify Configuration

The rate limiting system will automatically:
- Use Upstash Redis if credentials are available
- Fall back to in-memory storage if Redis is not configured
- Log a warning if Redis initialization fails

## Usage Examples

### Basic Usage with Predefined Limiters

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ipRateLimiter, userRateLimiter, apiToolRateLimiter } from '@/lib/utils/rateLimit'

// Public endpoint with IP-based rate limiting (10 req/min)
export async function GET(request: NextRequest) {
  if (ipRateLimiter) {
    const identifier = request.ip || 'unknown'
    const { success, limit, remaining, reset } = await ipRateLimiter.limit(identifier)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }
  }
  
  // Process request...
  return NextResponse.json({ data: 'success' })
}
```

### Using the Rate Limit Middleware

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, userRateLimiter } from '@/lib/utils/rateLimit'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Apply rate limiting (30 req/min for authenticated users)
  const rateLimitResult = await rateLimit(
    request,
    {
      maxRequests: 30,
      windowSeconds: 60,
      identifier: async () => user.id, // Use user ID as identifier
      errorMessage: 'Too many requests. Please try again in a moment.',
    },
    userRateLimiter
  )
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }
  
  // Process request...
  return NextResponse.json({ data: 'success' })
}
```

### Using Predefined Configurations

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getRateLimitConfig, ipRateLimiter } from '@/lib/utils/rateLimit'

export async function POST(request: NextRequest) {
  // Use predefined config for guest users
  const config = getRateLimitConfig('guest')
  
  const rateLimitResult = await rateLimit(request, config, ipRateLimiter)
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }
  
  // Process request...
  return NextResponse.json({ data: 'success' })
}
```

### API Tool Rate Limiting

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, apiToolRateLimiter } from '@/lib/utils/rateLimit'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Strict rate limiting for API tools (5 req/min)
  const rateLimitResult = await rateLimit(
    request,
    {
      maxRequests: 5,
      windowSeconds: 60,
      identifier: async () => user.id,
      errorMessage: 'API rate limit exceeded. Please wait before processing more images.',
    },
    apiToolRateLimiter
  )
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }
  
  // Process API tool request...
  return NextResponse.json({ data: 'success' })
}
```

### Custom Rate Limit Configuration

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/utils/rateLimit'

export async function POST(request: NextRequest) {
  // Custom rate limit: 100 requests per 5 minutes
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 100,
    windowSeconds: 300,
    identifier: async (req) => {
      // Custom identifier logic
      const apiKey = req.headers.get('x-api-key')
      return apiKey || req.ip || 'unknown'
    },
    errorMessage: 'Custom rate limit exceeded.',
  })
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }
  
  // Process request...
  return NextResponse.json({ data: 'success' })
}
```

### Adding Rate Limit Headers to Successful Responses

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, addRateLimitHeaders, ipRateLimiter } from '@/lib/utils/rateLimit'

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(
    request,
    { maxRequests: 10, windowSeconds: 60 },
    ipRateLimiter
  )
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }
  
  // Create response
  const response = NextResponse.json({ data: 'success' })
  
  // Add rate limit headers to successful response
  return addRateLimitHeaders(response, rateLimitResult.result)
}
```

## Predefined Rate Limiters

### IP Rate Limiter
- **Limit**: 10 requests per minute
- **Use case**: Public endpoints, unauthenticated requests
- **Identifier**: IP address

```typescript
import { ipRateLimiter } from '@/lib/utils/rateLimit'
```

### User Rate Limiter
- **Limit**: 30 requests per minute
- **Use case**: Authenticated endpoints, user-specific actions
- **Identifier**: User ID

```typescript
import { userRateLimiter } from '@/lib/utils/rateLimit'
```

### API Tool Rate Limiter
- **Limit**: 5 requests per minute
- **Use case**: API-powered tools (background remover, upscaler)
- **Identifier**: User ID

```typescript
import { apiToolRateLimiter } from '@/lib/utils/rateLimit'
```

## Predefined Configurations

```typescript
import { getRateLimitConfig } from '@/lib/utils/rateLimit'

// Guest users (30 req/min)
const guestConfig = getRateLimitConfig('guest')

// Free plan users (60 req/min)
const freeConfig = getRateLimitConfig('free')

// Premium plan users (120 req/min)
const premiumConfig = getRateLimitConfig('premium')

// Pro plan users (300 req/min)
const proConfig = getRateLimitConfig('pro')

// Strict rate limiting (5 req/min)
const strictConfig = getRateLimitConfig('strict')
```

## Rate Limit Headers

All rate-limited responses include these headers:

- `X-RateLimit-Limit`: Maximum requests allowed in the window
- `X-RateLimit-Remaining`: Remaining requests in the current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets
- `Retry-After`: Seconds to wait before retrying (on 429 responses)

## Testing

### Check if Redis is Available

```typescript
import { isRedisAvailable } from '@/lib/utils/rateLimit'

if (isRedisAvailable()) {
  console.log('Using Upstash Redis for rate limiting')
} else {
  console.log('Using in-memory rate limiting')
}
```

### Reset Rate Limit (Testing Only)

```typescript
import { resetRateLimit } from '@/lib/utils/rateLimit'

// Reset rate limit for a specific identifier
resetRateLimit('user-123')
```

### Clear All Rate Limits (Testing Only)

```typescript
import { clearAllRateLimits } from '@/lib/utils/rateLimit'

// Clear all in-memory rate limit data
clearAllRateLimits()
```

## Best Practices

1. **Use appropriate limiters**: Choose the right limiter based on your endpoint's sensitivity
2. **Identify users properly**: Use user IDs for authenticated endpoints, IP for public ones
3. **Provide clear error messages**: Help users understand why they're being rate limited
4. **Add headers to all responses**: Include rate limit headers even on successful responses
5. **Monitor rate limit analytics**: Use Upstash dashboard to monitor rate limit patterns
6. **Test without Redis**: Ensure your application works with in-memory fallback

## Troubleshooting

### Redis Connection Issues

If you see warnings about Redis initialization:

1. Verify your Upstash credentials in `.env.local`
2. Check that `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` are set
3. Ensure your Upstash Redis database is active
4. The application will automatically fall back to in-memory storage

### Rate Limit Not Working

1. Check if the rate limit middleware is being called
2. Verify the identifier is unique per user/IP
3. Check Upstash dashboard for rate limit analytics
4. Ensure the limiter is passed to the `rateLimit` function

### In-Memory vs Redis

- **Development**: In-memory is fine for local development
- **Production**: Always use Redis for distributed rate limiting
- **Serverless**: Redis is required for serverless deployments (Vercel, Cloudflare)

## Migration from In-Memory

If you're migrating from the old in-memory implementation:

1. Install Upstash packages: `npm install @upstash/redis @upstash/ratelimit`
2. Add Upstash credentials to `.env.local`
3. Update imports to use the new limiters
4. Test thoroughly in development
5. Deploy to production

The system will automatically use Redis when available, so no code changes are required for the fallback behavior.

## Resources

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Upstash Ratelimit Documentation](https://github.com/upstash/ratelimit)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
