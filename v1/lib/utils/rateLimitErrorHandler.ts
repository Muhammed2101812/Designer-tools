import { NextResponse } from 'next/server'

/**
 * Rate limit error response data
 */
export interface RateLimitErrorData {
  error: string
  limit: number
  remaining: number
  reset: number
  retryAfter: number
}

/**
 * Creates a standardized 429 rate limit error response
 */
export function createRateLimitErrorResponse(
  limit: number,
  remaining: number,
  reset: number,
  message?: string
): NextResponse<RateLimitErrorData> {
  const now = Math.floor(Date.now() / 1000)
  const retryAfter = Math.max(1, reset - now)
  
  const errorData: RateLimitErrorData = {
    error: message || 'Rate limit exceeded. Please try again later.',
    limit,
    remaining,
    reset,
    retryAfter,
  }

  return NextResponse.json(errorData, {
    status: 429,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
      'Retry-After': retryAfter.toString(),
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Creates a rate limit error response with user-friendly messages based on plan
 */
export function createUserFriendlyRateLimitError(
  limit: number,
  remaining: number,
  reset: number,
  userPlan: 'free' | 'premium' | 'pro' | 'guest' = 'guest'
): NextResponse<RateLimitErrorData> {
  let message: string

  switch (userPlan) {
    case 'free':
      message = 'Ücretsiz plan limitinizi aştınız. Premium plana geçerek daha yüksek limitlerden yararlanabilirsiniz.'
      break
    case 'premium':
      message = 'Premium plan limitinizi aştınız. Pro plana geçerek daha yüksek limitlerden yararlanabilirsiniz.'
      break
    case 'pro':
      message = 'Pro plan limitinizi aştınız. Lütfen bir süre bekleyip tekrar deneyin.'
      break
    default:
      message = 'Giriş yapmadan kullanım limitinizi aştınız. Hesap oluşturarak daha yüksek limitlerden yararlanabilirsiniz.'
  }

  return createRateLimitErrorResponse(limit, remaining, reset, message)
}

/**
 * Extracts rate limit information from Upstash rate limit result
 */
export function extractRateLimitInfo(rateLimitResult: {
  success: boolean
  limit: number
  remaining: number
  reset: number
}) {
  return {
    limit: rateLimitResult.limit,
    remaining: rateLimitResult.remaining,
    reset: rateLimitResult.reset,
  }
}

/**
 * Formats time remaining for user display
 */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} saniye`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes} dakika ${remainingSeconds} saniye`
      : `${minutes} dakika`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0
    ? `${hours} saat ${remainingMinutes} dakika`
    : `${hours} saat`
}

/**
 * Checks if a response is a rate limit error
 */
export function isRateLimitResponse(response: Response): boolean {
  return response.status === 429
}

/**
 * Parses rate limit headers from a response
 */
export function parseRateLimitHeaders(response: Response): {
  limit: number
  remaining: number
  reset: number
  retryAfter: number
} | null {
  if (!isRateLimitResponse(response)) {
    return null
  }

  const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0')
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0')
  const resetHeader = response.headers.get('X-RateLimit-Reset')
  const retryAfterHeader = response.headers.get('Retry-After')
  
  let reset = 0
  if (resetHeader) {
    const resetValue = parseInt(resetHeader)
    // If it's a timestamp (large number), use as-is
    // If it's seconds (small number), add to current time
    reset = resetValue > 1000000000 
      ? resetValue 
      : Math.floor(Date.now() / 1000) + resetValue
  }

  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader) : 60

  return {
    limit,
    remaining,
    reset,
    retryAfter,
  }
}

/**
 * Creates a rate limit middleware wrapper for API routes
 */
export function withRateLimitErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  rateLimitCheck: (...args: T) => Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  } | null>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const rateLimitResult = await rateLimitCheck(...args)
      
      if (rateLimitResult && !rateLimitResult.success) {
        return createRateLimitErrorResponse(
          rateLimitResult.limit,
          rateLimitResult.remaining,
          rateLimitResult.reset
        )
      }
      
      return await handler(...args)
    } catch (error) {
      console.error('Rate limit error handling failed:', error)
      return await handler(...args)
    }
  }
}