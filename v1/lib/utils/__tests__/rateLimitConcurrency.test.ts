/**
 * Rate Limiting Concurrency Tests
 * 
 * Focused tests for concurrent request handling:
 * - Race conditions in rate limiting
 * - Concurrent requests with same identifier
 * - Concurrent requests with different identifiers
 * - Thread safety and atomicity
 * - Performance under load
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  checkRateLimit,
  rateLimit,
  clearAllRateLimits,
  getRateLimitStoreSize,
  RATE_LIMIT_CONFIGS,
} from '../rateLimit'

// Mock NextRequest
const createMockRequest = (ip: string = '192.168.1.1') => {
  return {
    headers: new Headers({
      'x-forwarded-for': ip,
    }),
    ip: ip,
    url: 'http://localhost:3000/api/test',
    method: 'POST',
  } as unknown as NextRequest
}

describe('Rate Limiting Concurrency Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllRateLimits()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    clearAllRateLimits()
  })

  describe('Concurrent Requests with Same Identifier', () => {
    it('should handle race conditions correctly', async () => {
      const config = {
        maxRequests: 3,
        windowSeconds: 60,
      }
      const identifier = 'race-test-user'

      // Make 10 concurrent requests with same identifier
      const promises = Array.from({ length: 10 }, () => 
        checkRateLimit(identifier, config)
      )
      
      const results = await Promise.all(promises)
      
      // Exactly 3 should succeed, 7 should fail
      const successes = results.filter(r => r.success).length
      const failures = results.filter(r => !r.success).length
      
      expect(successes).toBe(3)
      expect(failures).toBe(7)
      
      // Check remaining counts are consistent
      const successResults = results.filter(r => r.success)
      const remainingCounts = successResults.map(r => r.remaining)
      
      // Should have decreasing remaining counts: 2, 1, 0
      expect(remainingCounts.sort((a, b) => b - a)).toEqual([2, 1, 0])
    })

    it('should handle high concurrency with same identifier', async () => {
      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }
      const identifier = 'high-concurrency-test'

      // Make 100 concurrent requests
      const promises = Array.from({ length: 100 }, () => 
        checkRateLimit(identifier, config)
      )
      
      const results = await Promise.all(promises)
      
      // Exactly 5 should succeed
      const successes = results.filter(r => r.success).length
      expect(successes).toBe(5)
      
      // All failures should have remaining = 0
      const failures = results.filter(r => !r.success)
      failures.forEach(result => {
        expect(result.remaining).toBe(0)
      })
    })

    it('should maintain atomicity under concurrent access', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }
      const identifier = 'atomicity-test'

      // Make many concurrent requests
      const promises = Array.from({ length: 50 }, () => 
        checkRateLimit(identifier, config)
      )
      
      const results = await Promise.all(promises)
      
      // Only one should succeed
      const successes = results.filter(r => r.success).length
      expect(successes).toBe(1)
      
      // The successful request should have remaining = 0
      const successResult = results.find(r => r.success)
      expect(successResult?.remaining).toBe(0)
    })

    it('should handle concurrent middleware requests', async () => {
      const config = {
        maxRequests: 2,
        windowSeconds: 60,
      }
      const ip = '192.168.1.100'

      // Make concurrent middleware requests
      const promises = Array.from({ length: 6 }, () => {
        const request = createMockRequest(ip)
        return rateLimit(request, config)
      })
      
      const results = await Promise.all(promises)
      
      // 2 should succeed, 4 should fail
      const successes = results.filter(r => r.success).length
      const failures = results.filter(r => !r.success).length
      
      expect(successes).toBe(2)
      expect(failures).toBe(4)
      
      // Failed requests should have error responses
      const failedResults = results.filter(r => !r.success)
      failedResults.forEach(result => {
        expect(result.response).toBeDefined()
        expect(result.response?.status).toBe(429)
      })
    })
  })

  describe('Concurrent Requests with Different Identifiers', () => {
    it('should isolate rate limits between identifiers', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Make concurrent requests with different identifiers
      const promises = Array.from({ length: 10 }, (_, i) => 
        checkRateLimit(`user-${i}`, config)
      )
      
      const results = await Promise.all(promises)
      
      // All should succeed since they have different identifiers
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(0) // Each used their single request
      })
    })

    it('should handle mixed concurrent requests', async () => {
      const config = {
        maxRequests: 2,
        windowSeconds: 60,
      }

      // Mix of same and different identifiers
      const promises = [
        // 4 requests from user-1 (2 should succeed)
        ...Array.from({ length: 4 }, () => checkRateLimit('user-1', config)),
        // 4 requests from user-2 (2 should succeed)
        ...Array.from({ length: 4 }, () => checkRateLimit('user-2', config)),
        // 2 requests from unique users (both should succeed)
        checkRateLimit('user-3', config),
        checkRateLimit('user-4', config),
      ]
      
      const results = await Promise.all(promises)
      
      // Total successes should be 6 (2 + 2 + 1 + 1)
      const successes = results.filter(r => r.success).length
      expect(successes).toBe(6)
    })

    it('should scale with many different identifiers', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Create requests for 1000 different users
      const promises = Array.from({ length: 1000 }, (_, i) => 
        checkRateLimit(`user-${i}`, config)
      )
      
      const startTime = Date.now()
      const results = await Promise.all(promises)
      const endTime = Date.now()
      
      // All should succeed
      expect(results.every(r => r.success)).toBe(true)
      
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000) // 1 second
      
      // Memory usage should be reasonable
      expect(getRateLimitStoreSize()).toBe(1000)
    })
  })

  describe('Performance Under Load', () => {
    it('should handle burst traffic efficiently', async () => {
      const config = RATE_LIMIT_CONFIGS.free

      // Simulate burst of traffic from many IPs
      const promises = Array.from({ length: 200 }, (_, i) => {
        const request = createMockRequest(`192.168.${Math.floor(i / 254)}.${i % 254 + 1}`)
        return rateLimit(request, config)
      })
      
      const startTime = Date.now()
      const results = await Promise.all(promises)
      const endTime = Date.now()
      
      // All should succeed (different IPs)
      expect(results.every(r => r.success)).toBe(true)
      
      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(2000) // 2 seconds
    })

    it('should handle sustained load', async () => {
      const config = {
        maxRequests: 10,
        windowSeconds: 60,
      }

      // Simulate sustained load over time
      const batches = 5
      const requestsPerBatch = 20
      
      for (let batch = 0; batch < batches; batch++) {
        const promises = Array.from({ length: requestsPerBatch }, (_, i) => {
          const identifier = `sustained-user-${i % 5}` // 5 users making requests
          return checkRateLimit(identifier, config)
        })
        
        const results = await Promise.all(promises)
        
        // Each user should be limited to their quota
        const userResults = new Map<string, any[]>()
        results.forEach((result, i) => {
          const userId = `sustained-user-${i % 5}`
          if (!userResults.has(userId)) {
            userResults.set(userId, [])
          }
          userResults.get(userId)!.push(result)
        })
        
        // Each user should have at most 10 successful requests
        userResults.forEach((userResultList, userId) => {
          const successes = userResultList.filter(r => r.success).length
          expect(successes).toBeLessThanOrEqual(config.maxRequests)
        })
        
        // Small delay between batches
        vi.advanceTimersByTime(100)
      }
    })

    it('should maintain accuracy under extreme concurrency', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }
      const identifier = 'extreme-concurrency-test'

      // Extreme concurrency test
      const promises = Array.from({ length: 1000 }, () => 
        checkRateLimit(identifier, config)
      )
      
      const results = await Promise.all(promises)
      
      // Exactly 1 should succeed
      const successes = results.filter(r => r.success).length
      expect(successes).toBe(1)
      
      // All others should fail with remaining = 0
      const failures = results.filter(r => !r.success)
      expect(failures.length).toBe(999)
      failures.forEach(result => {
        expect(result.remaining).toBe(0)
      })
    })
  })

  describe('Memory and Resource Management', () => {
    it('should not leak memory with many concurrent requests', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 1, // Short window for quick cleanup
      }

      // Create many entries
      const promises1 = Array.from({ length: 100 }, (_, i) => 
        checkRateLimit(`memory-test-${i}`, config)
      )
      
      await Promise.all(promises1)
      
      const initialSize = getRateLimitStoreSize()
      expect(initialSize).toBe(100)
      
      // Fast forward to expire entries
      vi.advanceTimersByTime(1100)
      
      // Create new entries to trigger cleanup
      const promises2 = Array.from({ length: 10 }, (_, i) => 
        checkRateLimit(`cleanup-test-${i}`, config)
      )
      
      await Promise.all(promises2)
      
      // Size should be managed (cleanup may not be immediate)
      const finalSize = getRateLimitStoreSize()
      expect(finalSize).toBeGreaterThanOrEqual(10) // At least the new entries
      expect(finalSize).toBeLessThanOrEqual(110) // Not significantly more than initial + new
    })

    it('should handle cleanup during concurrent access', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 1,
      }

      // Create entries that will expire
      const promises1 = Array.from({ length: 50 }, (_, i) => 
        checkRateLimit(`expire-test-${i}`, config)
      )
      
      await Promise.all(promises1)
      
      // Fast forward to expire some entries
      vi.advanceTimersByTime(600) // Halfway through window
      
      // Create more entries while cleanup might be happening
      const promises2 = Array.from({ length: 50 }, async (_, i) => {
        // Some requests to existing identifiers, some to new ones
        const identifier = i < 25 ? `expire-test-${i}` : `new-test-${i}`
        return checkRateLimit(identifier, config)
      })
      
      const results = await Promise.all(promises2)
      
      // Should handle concurrent access during cleanup without errors
      expect(results.length).toBe(50)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(typeof result.success).toBe('boolean')
      })
    })

    it('should handle resource exhaustion gracefully', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 3600, // Long window to prevent cleanup
      }

      // Create many rate limit entries
      const promises = Array.from({ length: 10000 }, (_, i) => 
        checkRateLimit(`resource-test-${i}`, config)
      )
      
      // Should not throw errors even with many entries
      const results = await Promise.all(promises)
      
      expect(results.length).toBe(10000)
      expect(results.every(r => r.success)).toBe(true)
      
      // Clean up to prevent memory issues in other tests
      clearAllRateLimits()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent requests with invalid configurations', async () => {
      const invalidConfig = {
        maxRequests: -1,
        windowSeconds: 0,
      }

      const promises = Array.from({ length: 10 }, () => 
        checkRateLimit('invalid-config-test', invalidConfig)
      )
      
      // Should not throw errors
      const results = await Promise.all(promises)
      
      expect(results.length).toBe(10)
      results.forEach(result => {
        expect(result).toBeDefined()
      })
    })

    it('should handle concurrent requests with extreme values', async () => {
      const extremeConfig = {
        maxRequests: Number.MAX_SAFE_INTEGER,
        windowSeconds: Number.MAX_SAFE_INTEGER,
      }

      const promises = Array.from({ length: 5 }, () => 
        checkRateLimit('extreme-values-test', extremeConfig)
      )
      
      const results = await Promise.all(promises)
      
      // Should handle extreme values gracefully
      expect(results.every(r => r.success)).toBe(true)
    })

    it('should handle concurrent requests with special characters in identifiers', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      const specialIdentifiers = [
        'user@domain.com',
        'user#123',
        'user$%^&*()',
        'user\n\t\r',
        '用户123', // Unicode
        '', // Empty string
      ]

      const promises = specialIdentifiers.map(id => 
        checkRateLimit(id, config)
      )
      
      const results = await Promise.all(promises)
      
      // Should handle special characters without errors
      expect(results.every(r => r.success)).toBe(true)
    })
  })
})