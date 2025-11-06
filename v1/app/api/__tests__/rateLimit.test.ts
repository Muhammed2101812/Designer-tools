import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateLimit, checkRateLimit, getRateLimitConfig, RATE_LIMIT_CONFIGS } from '@/lib/utils/rateLimit'
import { NextRequest } from 'next/server'

// Mock NextRequest
const createMockRequest = (ip: string = '192.168.1.1') => {
  return {
    headers: new Headers({
      'x-forwarded-for': ip,
    }),
    ip: ip,
  } as unknown as NextRequest
}

describe('Rate Limiting Tests', () => {
  beforeEach(() => {
    // Clear any rate limit state before each test
    const { clearAllRateLimits } = require('@/lib/utils/rateLimit')
    clearAllRateLimits()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }

      const result = await checkRateLimit('test-user-1', config)
      
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should block requests after exceeding limit', async () => {
      const config = {
        maxRequests: 2,
        windowSeconds: 60,
      }

      // Use up the limit
      await checkRateLimit('test-user-2', config) // 1st request
      await checkRateLimit('test-user-2', config) // 2nd request
      
      // This should exceed the limit
      const result = await checkRateLimit('test-user-2', config)
      
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window period', async () => {
      vi.useFakeTimers()
      
      const config = {
        maxRequests: 1,
        windowSeconds: 1, // 1 second window
      }

      // Use the limit
      let result = await checkRateLimit('test-user-3', config)
      expect(result.success).toBe(true)
      
      // Try again immediately - should fail
      result = await checkRateLimit('test-user-3', config)
      expect(result.success).toBe(false)
      
      // Fast forward time past the window
      vi.advanceTimersByTime(1100)
      
      // Should work again after window reset
      result = await checkRateLimit('test-user-3', config)
      expect(result.success).toBe(true)
      
      vi.useRealTimers()
    })
  })

  describe('rateLimit middleware', () => {
    it('should allow requests within rate limit', async () => {
      const request = createMockRequest('192.168.1.2')
      const config = RATE_LIMIT_CONFIGS.free

      const result = await rateLimit(request, config)
      
      expect(result.success).toBe(true)
      expect(result.response).toBeUndefined()
    })

    it('should block requests exceeding rate limit', async () => {
      const request = createMockRequest('192.168.1.3')
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // First request should succeed
      let result = await rateLimit(request, config)
      expect(result.success).toBe(true)

      // Second request should fail
      result = await rateLimit(request, config)
      expect(result.success).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(429)
    })

    it('should return proper rate limit headers', async () => {
      const request = createMockRequest('192.168.1.4')
      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }

      const result = await rateLimit(request, config)
      
      if (result.response) {
        expect(result.response.headers.get('X-RateLimit-Limit')).toBe('5')
        expect(result.response.headers.get('X-RateLimit-Remaining')).toBe('4')
      }
    })
  })

  describe('Rate limit configurations', () => {
    it('should have predefined configurations', () => {
      expect(RATE_LIMIT_CONFIGS.guest).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.free).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.premium).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.pro).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.strict).toBeDefined()
      
      expect(RATE_LIMIT_CONFIGS.guest.maxRequests).toBe(30)
      expect(RATE_LIMIT_CONFIGS.free.maxRequests).toBe(60)
      expect(RATE_LIMIT_CONFIGS.premium.maxRequests).toBe(120)
      expect(RATE_LIMIT_CONFIGS.pro.maxRequests).toBe(300)
      expect(RATE_LIMIT_CONFIGS.strict.maxRequests).toBe(5)
    })

    it('should return correct config based on plan', () => {
      const guestConfig = getRateLimitConfig('guest')
      const freeConfig = getRateLimitConfig('free')
      const premiumConfig = getRateLimitConfig('premium')
      const proConfig = getRateLimitConfig('pro')
      const strictConfig = getRateLimitConfig('strict')
      
      expect(guestConfig).toEqual(RATE_LIMIT_CONFIGS.guest)
      expect(freeConfig).toEqual(RATE_LIMIT_CONFIGS.free)
      expect(premiumConfig).toEqual(RATE_LIMIT_CONFIGS.premium)
      expect(proConfig).toEqual(RATE_LIMIT_CONFIGS.pro)
      expect(strictConfig).toEqual(RATE_LIMIT_CONFIGS.strict)
    })
  })

  describe('API Security with rate limiting', () => {
    it('should apply rate limiting when using withApiSecurity', async () => {
      const { withApiSecurity, ApiError, ApiErrorType } = await import('@/lib/utils/apiSecurity')
      
      // Mock a request that exceeds rate limit
      const request = createMockRequest('192.168.1.5')
      
      // First, create a strict rate limit config
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }
      
      // Try to make a request with rate limiting - first should pass
      let response = await withApiSecurity(
        request,
        async (req, user) => {
          return { success: true, message: 'Hello' }
        },
        {
          requireAuth: false,
          rateLimit: config,
        }
      )
      
      expect(response.status).toBe(200)
      
      // Second request should be rate limited
      const rateLimitedResponse = await withApiSecurity(
        request,
        async (req, user) => {
          return { success: true, message: 'Hello' }
        },
        {
          requireAuth: false,
          rateLimit: config,
        }
      )
      
      expect(rateLimitedResponse.status).toBe(429)
    })
  })
})