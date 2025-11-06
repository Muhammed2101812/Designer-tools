/**
 * Rate limiting utilities for API routes
 * Implements Upstash Redis rate limiting with in-memory fallback
 */

import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number
  
  /**
   * Time window in seconds
   */
  windowSeconds: number
  
  /**
   * Optional identifier function (defaults to IP address)
   */
  identifier?: (request: NextRequest) => string | Promise<string>
  
  /**
   * Optional custom error message
   */
  errorMessage?: string
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Initialize Redis client if credentials are available
 * For now, we'll use in-memory rate limiting for testing
 */
let redis: Redis | null = null

// Disable Redis for testing - use in-memory rate limiting
console.log('Using in-memory rate limiting for development/testing')

/**
 * Upstash rate limiters for different use cases
 */
let ipRateLimiter: Ratelimit | null = null
let userRateLimiter: Ratelimit | null = null
let apiToolRateLimiter: Ratelimit | null = null

if (redis) {
  // IP-based rate limiter for public endpoints (10 requests per minute)
  ipRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:ip',
  })

  // User-based rate limiter for authenticated endpoints (30 requests per minute)
  userRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:user',
  })

  // API tool rate limiter with stricter limits (5 requests per minute)
  apiToolRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api-tool',
  })
}

/**
 * In-memory rate limit store (fallback when Redis is not available)
 * Maps identifier -> { count, resetTime }
 */
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>()

/**
 * Cleanup interval for expired entries (runs every minute)
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000)
}

/**
 * Gets client identifier from request (IP address or custom identifier)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Fallback to connection IP
  return request.ip || 'unknown'
}

/**
 * Checks rate limit for a request using Upstash Redis
 * 
 * @param identifier - Unique identifier for the client
 * @param limiter - Upstash Ratelimit instance
 * @returns Rate limit result
 */
async function checkRateLimitWithUpstash(
  identifier: string,
  limiter: Ratelimit
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  
  return {
    success,
    limit,
    remaining,
    reset,
  }
}

/**
 * Checks rate limit for a request using in-memory storage (fallback)
 * 
 * @param identifier - Unique identifier for the client
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
function checkRateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  
  // Get or create entry
  let entry = rateLimitStore.get(identifier)
  
  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(identifier, entry)
  }
  
  // Increment count
  entry.count++
  
  // Check if limit exceeded
  const success = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)
  
  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: Math.ceil(entry.resetTime / 1000),
  }
}

/**
 * Checks rate limit for a request
 * Uses Upstash Redis if available, falls back to in-memory storage
 * 
 * @param identifier - Unique identifier for the client
 * @param config - Rate limit configuration
 * @param limiter - Optional Upstash Ratelimit instance
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  limiter?: Ratelimit | null
): Promise<RateLimitResult> {
  // Use provided limiter or fall back to in-memory
  if (limiter) {
    return await checkRateLimitWithUpstash(identifier, limiter)
  }
  
  return checkRateLimitInMemory(identifier, config)
}

/**
 * Rate limit middleware for API routes
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @param limiter - Optional Upstash Ratelimit instance
 * @returns Middleware result with success status and optional error response
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, {
 *     maxRequests: 10,
 *     windowSeconds: 60,
 *   })
 *   
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response
 *   }
 *   
 *   // Process request...
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  limiter?: Ratelimit | null
): Promise<{
  success: boolean
  result: RateLimitResult
  response?: NextResponse
}> {
  // Get identifier
  const identifier = config.identifier
    ? await config.identifier(request)
    : getClientIdentifier(request)
  
  // Check rate limit
  const result = await checkRateLimit(identifier, config, limiter)
  
  // Return error response if limit exceeded
  if (!result.success) {
    const response = NextResponse.json(
      {
        error: config.errorMessage || 'Too many requests',
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': config.windowSeconds.toString(),
        },
      }
    )
    
    return {
      success: false,
      result,
      response,
    }
  }
  
  return {
    success: true,
    result,
  }
}

/**
 * Adds rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  
  return response
}

/**
 * Gets rate limit headers as an object
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  }
}

/**
 * Export Upstash rate limiters for direct use
 */
export { ipRateLimiter, userRateLimiter, apiToolRateLimiter }

/**
 * Predefined rate limit configurations for different user tiers
 */
export const RATE_LIMIT_CONFIGS = {
  /**
   * Guest/unauthenticated users
   */
  guest: {
    maxRequests: 30,
    windowSeconds: 60,
    errorMessage: 'Rate limit exceeded. Please sign in for higher limits.',
  },
  
  /**
   * Free plan users
   */
  free: {
    maxRequests: 60,
    windowSeconds: 60,
    errorMessage: 'Rate limit exceeded. Upgrade to Premium for higher limits.',
  },
  
  /**
   * Premium plan users
   */
  premium: {
    maxRequests: 120,
    windowSeconds: 60,
    errorMessage: 'Rate limit exceeded. Please try again in a moment.',
  },
  
  /**
   * Pro plan users
   */
  pro: {
    maxRequests: 300,
    windowSeconds: 60,
    errorMessage: 'Rate limit exceeded. Please try again in a moment.',
  },
  
  /**
   * Strict rate limit for sensitive operations
   */
  strict: {
    maxRequests: 5,
    windowSeconds: 60,
    errorMessage: 'Too many attempts. Please try again later.',
  },
} as const

/**
 * Gets rate limit config based on user plan
 */
export function getRateLimitConfig(
  plan: 'guest' | 'free' | 'premium' | 'pro' | 'strict'
): RateLimitConfig {
  return RATE_LIMIT_CONFIGS[plan]
}

/**
 * Resets rate limit for an identifier (useful for testing or admin actions)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Gets current rate limit status for an identifier (in-memory only)
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult | null {
  const entry = rateLimitStore.get(identifier)
  
  if (!entry) {
    return null
  }
  
  const now = Date.now()
  
  if (entry.resetTime < now) {
    return null
  }
  
  const remaining = Math.max(0, config.maxRequests - entry.count)
  
  return {
    success: entry.count <= config.maxRequests,
    limit: config.maxRequests,
    remaining,
    reset: Math.ceil(entry.resetTime / 1000),
  }
}

/**
 * Checks if Upstash Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null
}

/**
 * Clears all rate limit data (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}

/**
 * Gets rate limit store size (for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size
}
