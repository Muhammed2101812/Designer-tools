import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { 
  checkRateLimit,
  rateLimit,
  getRateLimitConfig,
  RATE_LIMIT_CONFIGS,
  addRateLimitHeaders,
  getRateLimitHeaders,
  resetRateLimit,
  clearAllRateLimits,
} from '../rateLimit'

// Mock NextRequest
const createMockRequest = (ip: string = '192.168.1.1', headers: Record<string, string> = {}) => {
  return {
    headers: new Headers(headers),
    ip: ip,
    url: 'http://localhost:3000/api/test',
    method: 'POST',
  } as unknown as NextRequest
}

describe('Rate Limiting Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllRateLimits()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    clearAllRateLimits()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const config = RATE_LIMIT_CONFIGS.free
      const result = await checkRateLimit('test-user-1', config)
      
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(config.maxRequests - 1)
    })

    it('should block requests after exceeding limit', async () => {
      const config = RATE_LIMIT_CONFIGS.strict
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await checkRateLimit('test-user-2', config)
      }
      
      // This should exceed the limit
      const result = await checkRateLimit('test-user-2', config)
      
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window period', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 1,
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
    })

    it('should handle multiple identifiers independently', async () => {
      const config = RATE_LIMIT_CONFIGS.free
      
      // User 1 uses a request
      let result1 = await checkRateLimit('user-1', config)
      expect(result1.success).toBe(true)
      
      // User 2 should still have full quota
      let result2 = await checkRateLimit('user-2', config)
      expect(result2.success).toBe(true)
      
      // User 1 uses more requests until limit
      for (let i = 1; i < config.maxRequests; i++) {
        await checkRateLimit('user-1', config)
      }
      
      // User 1 should now be blocked
      result1 = await checkRateLimit('user-1', config)
      expect(result1.success).toBe(false)
      
      // User 2 should still be allowed
      result2 = await checkRateLimit('user-2', config)
      expect(result2.success).toBe(true)
    })
  })

  describe('rateLimit middleware', () => {
    it('should allow requests within limit', async () => {
      const request = createMockRequest('192.168.1.10')
      const config = RATE_LIMIT_CONFIGS.free

      const result = await rateLimit(request, config)
      
      expect(result.success).toBe(true)
      expect(result.response).toBeUndefined()
      expect(result.result.remaining).toBe(config.maxRequests - 1)
    })

    it('should block requests exceeding rate limit', async () => {
      const request = createMockRequest('192.168.1.11')
      const config = RATE_LIMIT_CONFIGS.strict
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await rateLimit(request, config)
      }
      
      // This should exceed the limit
      const result = await rateLimit(request, config)
      
      expect(result.success).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(429)
      
      if (result.response) {
        const data = await result.response.json()
        expect(data.error).toBe(config.errorMessage)
        expect(result.response.headers.get('X-RateLimit-Limit')).toBe(config.maxRequests.toString())
        expect(result.response.headers.get('X-RateLimit-Remaining')).toBe('0')
        expect(result.response.headers.get('Retry-After')).toBe(config.windowSeconds.toString())
      }
    })

    it('should apply different rate limits based on plan', async () => {
      const request1 = createMockRequest('192.168.1.12')
      const request2 = createMockRequest('192.168.1.13')
      const request3 = createMockRequest('192.168.1.14')
      
      // Test free plan rate limit
      const freeResult = await rateLimit(request1, RATE_LIMIT_CONFIGS.free)
      expect(freeResult.success).toBe(true)
      expect(freeResult.result.limit).toBe(RATE_LIMIT_CONFIGS.free.maxRequests)
      
      // Test premium plan rate limit
      const premiumResult = await rateLimit(request2, RATE_LIMIT_CONFIGS.premium)
      expect(premiumResult.success).toBe(true)
      expect(premiumResult.result.limit).toBe(RATE_LIMIT_CONFIGS.premium.maxRequests)
      
      // Test pro plan rate limit
      const proResult = await rateLimit(request3, RATE_LIMIT_CONFIGS.pro)
      expect(proResult.success).toBe(true)
      expect(proResult.result.limit).toBe(RATE_LIMIT_CONFIGS.pro.maxRequests)
    })

    it('should handle custom identifier function', async () => {
      const request = createMockRequest('192.168.1.15')
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
        identifier: (req: NextRequest) => 'custom-id',
      }

      // First request should succeed
      let result = await rateLimit(request, config)
      expect(result.success).toBe(true)

      // Second request with same custom identifier should fail
      result = await rateLimit(request, config)
      expect(result.success).toBe(false)
      
      // Different IP but same custom identifier should still fail
      const request2 = createMockRequest('192.168.1.16')
      result = await rateLimit(request2, config)
      expect(result.success).toBe(false)
    })
  })

  describe('Rate limit configurations', () => {
    it('should have predefined rate limit configurations', () => {
      expect(RATE_LIMIT_CONFIGS.guest).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.free).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.premium).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.pro).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.strict).toBeDefined()
      
      // Check guest configuration
      expect(RATE_LIMIT_CONFIGS.guest.maxRequests).toBe(30)
      expect(RATE_LIMIT_CONFIGS.guest.windowSeconds).toBe(60)
      expect(RATE_LIMIT_CONFIGS.guest.errorMessage).toBe('Rate limit exceeded. Please sign in for higher limits.')
      
      // Check free configuration
      expect(RATE_LIMIT_CONFIGS.free.maxRequests).toBe(60)
      expect(RATE_LIMIT_CONFIGS.free.windowSeconds).toBe(60)
      expect(RATE_LIMIT_CONFIGS.free.errorMessage).toBe('Rate limit exceeded. Upgrade to Premium for higher limits.')
      
      // Check premium configuration
      expect(RATE_LIMIT_CONFIGS.premium.maxRequests).toBe(120)
      expect(RATE_LIMIT_CONFIGS.premium.windowSeconds).toBe(60)
      expect(RATE_LIMIT_CONFIGS.premium.errorMessage).toBe('Rate limit exceeded. Please try again in a moment.')
      
      // Check pro configuration
      expect(RATE_LIMIT_CONFIGS.pro.maxRequests).toBe(300)
      expect(RATE_LIMIT_CONFIGS.pro.windowSeconds).toBe(60)
      expect(RATE_LIMIT_CONFIGS.pro.errorMessage).toBe('Rate limit exceeded. Please try again in a moment.')
      
      // Check strict configuration
      expect(RATE_LIMIT_CONFIGS.strict.maxRequests).toBe(5)
      expect(RATE_LIMIT_CONFIGS.strict.windowSeconds).toBe(60)
      expect(RATE_LIMIT_CONFIGS.strict.errorMessage).toBe('Too many attempts. Please try again later.')
    })

    it('should validate rate limit configurations', () => {
      // Test valid configurations
      expect(() => {
        RATE_LIMIT_CONFIGS.guest
        RATE_LIMIT_CONFIGS.free
        RATE_LIMIT_CONFIGS.premium
        RATE_LIMIT_CONFIGS.pro
        RATE_LIMIT_CONFIGS.strict
      }).not.toThrow()
      
      // Test that all configurations have required properties
      Object.values(RATE_LIMIT_CONFIGS).forEach(config => {
        expect(config.maxRequests).toBeGreaterThanOrEqual(0)
        expect(config.windowSeconds).toBeGreaterThanOrEqual(1)
        expect(typeof config.errorMessage).toBe('string')
        expect(config.errorMessage.length).toBeGreaterThan(0)
      })
    })

    it('should return correct config for plan', () => {
      expect(getRateLimitConfig('guest')).toEqual(RATE_LIMIT_CONFIGS.guest)
      expect(getRateLimitConfig('free')).toEqual(RATE_LIMIT_CONFIGS.free)
      expect(getRateLimitConfig('premium')).toEqual(RATE_LIMIT_CONFIGS.premium)
      expect(getRateLimitConfig('pro')).toEqual(RATE_LIMIT_CONFIGS.pro)
      expect(getRateLimitConfig('strict')).toEqual(RATE_LIMIT_CONFIGS.strict)
    })
  })

  describe('Rate limit utility functions', () => {
    it('should add rate limit headers to response', () => {
      const response = NextResponse.json({ success: true })
      const result = {
        success: true,
        limit: 10,
        remaining: 5,
        reset: Math.floor(Date.now() / 1000) + 60,
      }

      const updatedResponse = addRateLimitHeaders(response, result)
      
      expect(updatedResponse.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(updatedResponse.headers.get('X-RateLimit-Remaining')).toBe('5')
      expect(updatedResponse.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should get rate limit headers as object', () => {
      const headers = getRateLimitHeaders(10, 5, 1234567890)
      
      expect(headers).toEqual({
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '5',
        'X-RateLimit-Reset': '1234567890',
      })
    })

    it('should reset rate limit for identifier', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Use up the limit
      await checkRateLimit('reset-test', config)
      let result = await checkRateLimit('reset-test', config)
      expect(result.success).toBe(false)
      
      // Reset the rate limit
      resetRateLimit('reset-test')
      
      // Should work again
      result = await checkRateLimit('reset-test', config)
      expect(result.success).toBe(true)
    })
  })
})