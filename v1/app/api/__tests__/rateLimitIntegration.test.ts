/**
 * Rate Limiting Integration Tests
 * 
 * Tests rate limiting integration with API security middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { 
  rateLimit, 
  clearAllRateLimits, 
  RATE_LIMIT_CONFIGS,
  checkRateLimit,
} from '@/lib/utils/rateLimit'

// Mock NextRequest
const createMockRequest = (
  ip: string = '192.168.1.1', 
  headers: Record<string, string> = {}
) => {
  return {
    headers: new Headers({
      'x-forwarded-for': ip,
      'content-type': 'application/json',
      ...headers,
    }),
    ip: ip,
    url: 'http://localhost:3000/api/test',
    method: 'POST',
  } as unknown as NextRequest
}

describe('Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllRateLimits()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    clearAllRateLimits()
  })

  describe('API Route Integration', () => {
    it('should integrate rate limiting with API middleware', async () => {
      const request = createMockRequest('192.168.1.10')
      const config = RATE_LIMIT_CONFIGS.free
      
      // First request should succeed
      const result1 = await rateLimit(request, config)
      expect(result1.success).toBe(true)
      expect(result1.result.remaining).toBe(config.maxRequests - 1)
      
      // Make requests up to the limit
      for (let i = 1; i < config.maxRequests; i++) {
        await rateLimit(request, config)
      }
      
      // Next request should fail
      const result2 = await rateLimit(request, config)
      expect(result2.success).toBe(false)
      expect(result2.response?.status).toBe(429)
    })

    it('should handle different rate limit tiers', async () => {
      const guestRequest = createMockRequest('192.168.1.11')
      const freeRequest = createMockRequest('192.168.1.12')
      const premiumRequest = createMockRequest('192.168.1.13')
      const proRequest = createMockRequest('192.168.1.14')
      
      // Test guest limits
      const guestResult = await rateLimit(guestRequest, RATE_LIMIT_CONFIGS.guest)
      expect(guestResult.success).toBe(true)
      expect(guestResult.result.limit).toBe(RATE_LIMIT_CONFIGS.guest.maxRequests)
      
      // Test free limits
      const freeResult = await rateLimit(freeRequest, RATE_LIMIT_CONFIGS.free)
      expect(freeResult.success).toBe(true)
      expect(freeResult.result.limit).toBe(RATE_LIMIT_CONFIGS.free.maxRequests)
      
      // Test premium limits
      const premiumResult = await rateLimit(premiumRequest, RATE_LIMIT_CONFIGS.premium)
      expect(premiumResult.success).toBe(true)
      expect(premiumResult.result.limit).toBe(RATE_LIMIT_CONFIGS.premium.maxRequests)
      
      // Test pro limits
      const proResult = await rateLimit(proRequest, RATE_LIMIT_CONFIGS.pro)
      expect(proResult.success).toBe(true)
      expect(proResult.result.limit).toBe(RATE_LIMIT_CONFIGS.pro.maxRequests)
    })

    it('should return proper error responses', async () => {
      const request = createMockRequest('192.168.1.15')
      const config = RATE_LIMIT_CONFIGS.strict
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await rateLimit(request, config)
      }
      
      // This should return error response
      const result = await rateLimit(request, config)
      expect(result.success).toBe(false)
      expect(result.response).toBeDefined()
      
      if (result.response) {
        expect(result.response.status).toBe(429)
        
        // Check headers
        expect(result.response.headers.get('X-RateLimit-Limit')).toBe(config.maxRequests.toString())
        expect(result.response.headers.get('X-RateLimit-Remaining')).toBe('0')
        expect(result.response.headers.get('Retry-After')).toBe(config.windowSeconds.toString())
        
        // Check error message
        const data = await result.response.json()
        expect(data.error).toBe(config.errorMessage)
      }
    })

    it('should handle concurrent API requests', async () => {
      const config = RATE_LIMIT_CONFIGS.strict
      const ip = '192.168.1.16'
      
      // Make concurrent requests
      const promises = Array.from({ length: config.maxRequests + 3 }, () => {
        const request = createMockRequest(ip)
        return rateLimit(request, config)
      })
      
      const results = await Promise.all(promises)
      
      // Some should succeed, some should fail
      const successes = results.filter(r => r.success).length
      const failures = results.filter(r => !r.success).length
      
      expect(successes).toBe(config.maxRequests)
      expect(failures).toBe(3)
      
      // Failed requests should have proper error responses
      const failedResults = results.filter(r => !r.success)
      failedResults.forEach(result => {
        expect(result.response?.status).toBe(429)
      })
    })
  })

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers in successful responses', async () => {
      const request = createMockRequest('192.168.1.17')
      const config = RATE_LIMIT_CONFIGS.free
      
      const result = await rateLimit(request, config)
      expect(result.success).toBe(true)
      
      // Headers should be available in the result
      expect(result.result.limit).toBe(config.maxRequests)
      expect(result.result.remaining).toBe(config.maxRequests - 1)
      expect(result.result.reset).toBeGreaterThan(Date.now() / 1000)
    })

    it('should include proper headers in error responses', async () => {
      const request = createMockRequest('192.168.1.18')
      const config = RATE_LIMIT_CONFIGS.strict
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await rateLimit(request, config)
      }
      
      // This should return error with headers
      const result = await rateLimit(request, config)
      expect(result.success).toBe(false)
      
      if (result.response) {
        const headers = result.response.headers
        expect(headers.get('X-RateLimit-Limit')).toBe(config.maxRequests.toString())
        expect(headers.get('X-RateLimit-Remaining')).toBe('0')
        expect(headers.get('X-RateLimit-Reset')).toBeDefined()
        expect(headers.get('Retry-After')).toBe(config.windowSeconds.toString())
      }
    })
  })

  describe('IP Address Handling', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const request = createMockRequest('127.0.0.1', {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      })
      const config = RATE_LIMIT_CONFIGS.strict
      
      // Use up limit for this IP
      for (let i = 0; i < config.maxRequests; i++) {
        await rateLimit(request, config)
      }
      
      // Should be blocked
      const result = await rateLimit(request, config)
      expect(result.success).toBe(false)
      
      // Different forwarded IP should work
      const request2 = createMockRequest('127.0.0.1', {
        'x-forwarded-for': '203.0.113.2, 198.51.100.1',
      })
      const result2 = await rateLimit(request2, config)
      expect(result2.success).toBe(true)
    })

    it('should handle missing IP gracefully', async () => {
      const request = {
        headers: new Headers(),
        ip: undefined,
        url: 'http://localhost:3000/api/test',
        method: 'POST',
      } as unknown as NextRequest
      
      const config = RATE_LIMIT_CONFIGS.free
      
      // Should not throw error
      const result = await rateLimit(request, config)
      expect(result.success).toBe(true)
    })
  })

  describe('Performance and Reliability', () => {
    it('should handle high volume requests efficiently', async () => {
      const config = RATE_LIMIT_CONFIGS.free
      const startTime = Date.now()
      
      // Create many requests with different IPs
      const promises = Array.from({ length: 100 }, (_, i) => {
        const request = createMockRequest(`192.168.${Math.floor(i / 254)}.${i % 254 + 1}`)
        return rateLimit(request, config)
      })
      
      const results = await Promise.all(promises)
      const endTime = Date.now()
      
      // All should succeed (different IPs)
      expect(results.every(r => r.success)).toBe(true)
      
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000) // 1 second
    })

    it('should maintain accuracy under load', async () => {
      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }
      const ip = '192.168.1.19'
      
      // Make many concurrent requests
      const promises = Array.from({ length: 20 }, () => {
        const request = createMockRequest(ip)
        return rateLimit(request, config)
      })
      
      const results = await Promise.all(promises)
      
      // Exactly 5 should succeed
      const successes = results.filter(r => r.success).length
      expect(successes).toBe(5)
    })

    it('should handle window reset correctly', async () => {
      const config = {
        maxRequests: 2,
        windowSeconds: 1,
      }
      const request = createMockRequest('192.168.1.20')
      
      // Use up the limit
      const result1 = await rateLimit(request, config)
      const result2 = await rateLimit(request, config)
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      
      // Should be blocked
      const result3 = await rateLimit(request, config)
      expect(result3.success).toBe(false)
      
      // Fast forward time
      vi.advanceTimersByTime(1100)
      
      // Should work again
      const result4 = await rateLimit(request, config)
      expect(result4.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid configurations gracefully', async () => {
      const request = createMockRequest('192.168.1.21')
      const invalidConfig = {
        maxRequests: -1,
        windowSeconds: 0,
      }
      
      // Should not throw error
      const result = await rateLimit(request, invalidConfig)
      expect(result).toBeDefined()
    })

    it('should handle malformed requests', async () => {
      const malformedRequest = {
        headers: new Headers(),
        // Missing required properties
      } as unknown as NextRequest
      
      const config = RATE_LIMIT_CONFIGS.free
      
      // Should handle gracefully
      const result = await rateLimit(malformedRequest, config)
      expect(result).toBeDefined()
    })
  })
})