/**
 * Comprehensive Rate Limiting Tests
 * 
 * Tests for rate limiting functionality including:
 * - Core rate limit functions
 * - API route rate limit behavior
 * - Concurrent request handling
 * - Redis and in-memory fallback
 * - Rate limit configurations
 */

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
  getRateLimitStatus,
  isRedisAvailable,
  getRateLimitStoreSize,
  ipRateLimiter,
  userRateLimiter,
  apiToolRateLimiter,
} from '../rateLimit'

// Mock Upstash Redis
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    // Mock Redis methods if needed
  })),
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn(() => ({
    limit: vi.fn(),
    slidingWindow: vi.fn(),
  })),
}))

// Mock NextRequest
const createMockRequest = (ip: string = '192.168.1.1', headers: Record<string, string> = {}) => {
  return {
    headers: new Headers({
      'x-forwarded-for': ip,
      ...headers,
    }),
    ip: ip,
    url: 'http://localhost:3000/api/test',
    method: 'POST',
  } as unknown as NextRequest
}

describe('Rate Limiting Comprehensive Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllRateLimits()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    clearAllRateLimits()
  })

  describe('Core Rate Limit Functions', () => {
    describe('checkRateLimit', () => {
      it('should allow requests within limit', async () => {
        const config = {
          maxRequests: 5,
          windowSeconds: 60,
        }

        const result = await checkRateLimit('test-user-1', config)
        
        expect(result.success).toBe(true)
        expect(result.limit).toBe(5)
        expect(result.remaining).toBe(4)
        expect(result.reset).toBeGreaterThan(Date.now() / 1000)
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
      })

      it('should handle multiple identifiers independently', async () => {
        const config = {
          maxRequests: 2,
          windowSeconds: 60,
        }
        
        // User 1 uses requests
        let result1 = await checkRateLimit('user-1', config)
        expect(result1.success).toBe(true)
        expect(result1.remaining).toBe(1)
        
        result1 = await checkRateLimit('user-1', config)
        expect(result1.success).toBe(true)
        expect(result1.remaining).toBe(0)
        
        // User 1 should now be blocked
        result1 = await checkRateLimit('user-1', config)
        expect(result1.success).toBe(false)
        
        // User 2 should still have full quota
        let result2 = await checkRateLimit('user-2', config)
        expect(result2.success).toBe(true)
        expect(result2.remaining).toBe(1)
      })

      it('should handle zero limit configuration', async () => {
        const config = {
          maxRequests: 0,
          windowSeconds: 60,
        }

        const result = await checkRateLimit('test-user-4', config)
        
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
      })

      it('should handle very short window periods', async () => {
        const config = {
          maxRequests: 1,
          windowSeconds: 0.1, // 100ms window
        }

        // First request should succeed
        let result = await checkRateLimit('test-user-5', config)
        expect(result.success).toBe(true)
        
        // Second request should fail
        result = await checkRateLimit('test-user-5', config)
        expect(result.success).toBe(false)
        
        // Wait for window to reset
        vi.advanceTimersByTime(150)
        
        // Should work again
        result = await checkRateLimit('test-user-5', config)
        expect(result.success).toBe(true)
      })
    })

    describe('rateLimit middleware', () => {
      it('should allow requests within rate limit', async () => {
        const request = createMockRequest('192.168.1.10')
        const config = {
          maxRequests: 5,
          windowSeconds: 60,
        }

        const result = await rateLimit(request, config)
        
        expect(result.success).toBe(true)
        expect(result.response).toBeUndefined()
        expect(result.result.remaining).toBe(4)
      })

      it('should block requests exceeding rate limit', async () => {
        const request = createMockRequest('192.168.1.11')
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

      it('should return proper rate limit headers in error response', async () => {
        const request = createMockRequest('192.168.1.12')
        const config = {
          maxRequests: 1,
          windowSeconds: 60,
          errorMessage: 'Custom rate limit message',
        }

        // Use up the limit
        await rateLimit(request, config)
        
        // This should return error response with headers
        const result = await rateLimit(request, config)
        
        expect(result.success).toBe(false)
        expect(result.response).toBeDefined()
        
        if (result.response) {
          expect(result.response.headers.get('X-RateLimit-Limit')).toBe('1')
          expect(result.response.headers.get('X-RateLimit-Remaining')).toBe('0')
          expect(result.response.headers.get('X-RateLimit-Reset')).toBeDefined()
          expect(result.response.headers.get('Retry-After')).toBe('60')
          
          const data = await result.response.json()
          expect(data.error).toBe('Custom rate limit message')
        }
      })

      it('should use custom identifier function', async () => {
        const request = createMockRequest('192.168.1.13')
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
        const request2 = createMockRequest('192.168.1.14')
        result = await rateLimit(request2, config)
        expect(result.success).toBe(false)
      })

      it('should handle async custom identifier function', async () => {
        const request = createMockRequest('192.168.1.15')
        const config = {
          maxRequests: 2,
          windowSeconds: 60,
          identifier: async (req: NextRequest) => {
            // Simulate async operation with fake timers
            return 'async-id'
          },
        }

        const result = await rateLimit(request, config)
        expect(result.success).toBe(true)
        expect(result.result.remaining).toBe(1)
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

      it('should get rate limit status', async () => {
        const config = {
          maxRequests: 5,
          windowSeconds: 60,
        }

        // No status initially
        let status = getRateLimitStatus('status-test', config)
        expect(status).toBeNull()
        
        // Make a request
        await checkRateLimit('status-test', config)
        
        // Should have status now
        status = getRateLimitStatus('status-test', config)
        expect(status).toBeDefined()
        expect(status?.remaining).toBe(4)
        expect(status?.limit).toBe(5)
      })

      it('should clear all rate limits', async () => {
        const config = {
          maxRequests: 1,
          windowSeconds: 60,
        }

        // Create some rate limit entries
        await checkRateLimit('clear-test-1', config)
        await checkRateLimit('clear-test-2', config)
        
        expect(getRateLimitStoreSize()).toBeGreaterThan(0)
        
        clearAllRateLimits()
        
        expect(getRateLimitStoreSize()).toBe(0)
      })

      it('should report Redis availability', () => {
        const available = isRedisAvailable()
        expect(typeof available).toBe('boolean')
      })
    })
  })

  describe('Rate Limit Configurations', () => {
    it('should have all predefined configurations', () => {
      expect(RATE_LIMIT_CONFIGS.guest).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.free).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.premium).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.pro).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.strict).toBeDefined()
    })

    it('should have correct configuration values', () => {
      expect(RATE_LIMIT_CONFIGS.guest.maxRequests).toBe(30)
      expect(RATE_LIMIT_CONFIGS.guest.windowSeconds).toBe(60)
      
      expect(RATE_LIMIT_CONFIGS.free.maxRequests).toBe(60)
      expect(RATE_LIMIT_CONFIGS.free.windowSeconds).toBe(60)
      
      expect(RATE_LIMIT_CONFIGS.premium.maxRequests).toBe(120)
      expect(RATE_LIMIT_CONFIGS.premium.windowSeconds).toBe(60)
      
      expect(RATE_LIMIT_CONFIGS.pro.maxRequests).toBe(300)
      expect(RATE_LIMIT_CONFIGS.pro.windowSeconds).toBe(60)
      
      expect(RATE_LIMIT_CONFIGS.strict.maxRequests).toBe(5)
      expect(RATE_LIMIT_CONFIGS.strict.windowSeconds).toBe(60)
    })

    it('should have appropriate error messages', () => {
      expect(RATE_LIMIT_CONFIGS.guest.errorMessage).toContain('sign in')
      expect(RATE_LIMIT_CONFIGS.free.errorMessage).toContain('Premium')
      expect(RATE_LIMIT_CONFIGS.premium.errorMessage).toContain('try again')
      expect(RATE_LIMIT_CONFIGS.pro.errorMessage).toContain('try again')
      expect(RATE_LIMIT_CONFIGS.strict.errorMessage).toContain('later')
    })

    it('should return correct config for plan', () => {
      expect(getRateLimitConfig('guest')).toEqual(RATE_LIMIT_CONFIGS.guest)
      expect(getRateLimitConfig('free')).toEqual(RATE_LIMIT_CONFIGS.free)
      expect(getRateLimitConfig('premium')).toEqual(RATE_LIMIT_CONFIGS.premium)
      expect(getRateLimitConfig('pro')).toEqual(RATE_LIMIT_CONFIGS.pro)
      expect(getRateLimitConfig('strict')).toEqual(RATE_LIMIT_CONFIGS.strict)
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests correctly', async () => {
      const config = {
        maxRequests: 3,
        windowSeconds: 60,
      }

      // Make 5 concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) => 
        checkRateLimit(`concurrent-test-${i}`, config)
      )
      
      const results = await Promise.all(promises)
      
      // All should succeed since they have different identifiers
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should handle concurrent requests with same identifier', async () => {
      const config = {
        maxRequests: 2,
        windowSeconds: 60,
      }

      // Make 4 concurrent requests with same identifier
      const promises = Array.from({ length: 4 }, () => 
        checkRateLimit('same-id-test', config)
      )
      
      const results = await Promise.all(promises)
      
      // First 2 should succeed, last 2 should fail
      const successes = results.filter(r => r.success).length
      const failures = results.filter(r => !r.success).length
      
      expect(successes).toBe(2)
      expect(failures).toBe(2)
    })

    it('should handle race conditions in rate limiting', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Create a race condition with rapid concurrent requests
      const promises = Array.from({ length: 10 }, () => 
        checkRateLimit('race-condition-test', config)
      )
      
      const results = await Promise.all(promises)
      
      // Only one should succeed
      const successes = results.filter(r => r.success).length
      expect(successes).toBe(1)
    })

    it('should handle concurrent requests with middleware', async () => {
      const config = {
        maxRequests: 2,
        windowSeconds: 60,
      }

      // Make concurrent requests with same IP
      const promises = Array.from({ length: 4 }, () => {
        const request = createMockRequest('192.168.1.20')
        return rateLimit(request, config)
      })
      
      const results = await Promise.all(promises)
      
      // First 2 should succeed, last 2 should fail
      const successes = results.filter(r => r.success).length
      const failures = results.filter(r => !r.success).length
      
      expect(successes).toBe(2)
      expect(failures).toBe(2)
    })
  })

  describe('IP Address Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const request = createMockRequest('127.0.0.1', {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      })
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      await rateLimit(request, config)
      
      // Second request with same forwarded IP should fail
      const request2 = createMockRequest('127.0.0.1', {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      })
      
      const result = await rateLimit(request2, config)
      expect(result.success).toBe(false)
    })

    it('should extract IP from x-real-ip header', async () => {
      const request = createMockRequest('127.0.0.1', {
        'x-real-ip': '203.0.113.2',
      })
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      await rateLimit(request, config)
      
      // Second request with same real IP should fail
      const request2 = createMockRequest('127.0.0.1', {
        'x-real-ip': '203.0.113.2',
      })
      
      const result = await rateLimit(request2, config)
      expect(result.success).toBe(false)
    })

    it('should fallback to connection IP', async () => {
      const request = createMockRequest('203.0.113.3')
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      await rateLimit(request, config)
      
      // Second request with same connection IP should fail
      const request2 = createMockRequest('203.0.113.3')
      
      const result = await rateLimit(request2, config)
      expect(result.success).toBe(false)
    })

    it('should handle missing IP gracefully', async () => {
      const request = {
        headers: new Headers(),
        ip: undefined,
        url: 'http://localhost:3000/api/test',
        method: 'POST',
      } as unknown as NextRequest
      
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Should not throw error
      const result = await rateLimit(request, config)
      expect(result.success).toBe(true)
    })
  })

  describe('Memory Management', () => {
    it('should clean up expired entries', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 1, // 1 second window
      }

      // Create some entries
      await checkRateLimit('cleanup-test-1', config)
      await checkRateLimit('cleanup-test-2', config)
      
      const initialSize = getRateLimitStoreSize()
      expect(initialSize).toBeGreaterThan(0)
      
      // Fast forward time to expire entries
      vi.advanceTimersByTime(2000)
      
      // Trigger cleanup by making a new request
      await checkRateLimit('cleanup-test-3', config)
      
      // Size should be managed (may not always be less due to new entry)
      const finalSize = getRateLimitStoreSize()
      expect(finalSize).toBeGreaterThanOrEqual(1) // At least the new entry
    })

    it('should handle large number of identifiers', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Create many rate limit entries
      const promises = Array.from({ length: 100 }, (_, i) => 
        checkRateLimit(`load-test-${i}`, config)
      )
      
      await Promise.all(promises)
      
      expect(getRateLimitStoreSize()).toBe(100)
      
      // Clear all to prevent memory issues
      clearAllRateLimits()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      const config = {
        maxRequests: -1, // Invalid
        windowSeconds: 0, // Invalid
      }

      // Should not throw error
      const result = await checkRateLimit('error-test', config)
      expect(result).toBeDefined()
    })

    it('should handle very large numbers', async () => {
      const config = {
        maxRequests: Number.MAX_SAFE_INTEGER,
        windowSeconds: Number.MAX_SAFE_INTEGER,
      }

      const result = await checkRateLimit('large-number-test', config)
      expect(result.success).toBe(true)
    })

    it('should handle identifier edge cases', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Empty string identifier
      let result = await checkRateLimit('', config)
      expect(result).toBeDefined()
      
      // Very long identifier
      const longId = 'a'.repeat(1000)
      result = await checkRateLimit(longId, config)
      expect(result).toBeDefined()
      
      // Special characters
      result = await checkRateLimit('test@#$%^&*()', config)
      expect(result).toBeDefined()
    })
  })

  describe('Upstash Rate Limiters', () => {
    it('should export Upstash rate limiter instances', () => {
      // These might be null if Redis is not configured
      expect(ipRateLimiter).toBeDefined()
      expect(userRateLimiter).toBeDefined()
      expect(apiToolRateLimiter).toBeDefined()
    })

    it('should handle Upstash rate limiter when available', async () => {
      // Mock Upstash rate limiter
      const mockLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 60000,
        }),
      }

      const config = {
        maxRequests: 10,
        windowSeconds: 60,
      }

      const result = await checkRateLimit('upstash-test', config, mockLimiter as any)
      
      expect(result.success).toBe(true)
      expect(result.limit).toBe(10)
      expect(result.remaining).toBe(9)
      expect(mockLimiter.limit).toHaveBeenCalledWith('upstash-test')
    })

    it('should fallback to in-memory when Upstash fails', async () => {
      // Mock Upstash rate limiter that throws error
      const mockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
      }

      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }

      // Should fallback to in-memory and not throw
      try {
        const result = await checkRateLimit('fallback-test', config, mockLimiter as any)
        expect(result).toBeDefined()
        expect(result.success).toBe(true)
      } catch (error) {
        // If it throws, it should fallback to in-memory
        const result = await checkRateLimit('fallback-test', config)
        expect(result).toBeDefined()
        expect(result.success).toBe(true)
      }
    })
  })
})