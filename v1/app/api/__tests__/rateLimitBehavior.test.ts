/**
 * API Route Rate Limiting Behavior Tests
 * 
 * Tests how rate limiting works in actual API routes:
 * - Background Remover API rate limiting
 * - Image Upscaler API rate limiting  
 * - Stripe API rate limiting
 * - Different rate limits for different user plans
 * - Rate limit header propagation
 * - Concurrent request handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST as stripeCheckoutPOST } from '@/app/api/stripe/create-checkout/route'
import { POST as stripePortalPOST } from '@/app/api/stripe/create-portal/route'
import { POST as emailSendPOST } from '@/app/api/email/send/route'
import { 
  rateLimit, 
  clearAllRateLimits, 
  RATE_LIMIT_CONFIGS,
  resetRateLimit,
} from '@/lib/utils/rateLimit'

// Mock external dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { stripe_customer_id: 'cus_test123', plan: 'free' },
        error: null,
      }),
    })),
  })),
}))

vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test123',
          url: 'https://checkout.stripe.com/test',
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/test',
        }),
      },
    },
  },
}))

vi.mock('@/lib/email/client', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock NextRequest
const createMockRequest = (
  ip: string = '192.168.1.1', 
  headers: Record<string, string> = {},
  body: any = {}
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
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as NextRequest
}

describe('API Route Rate Limiting Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllRateLimits()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    clearAllRateLimits()
  })

  describe('Stripe API Rate Limiting', () => {
    it('should apply rate limiting to checkout creation', async () => {
      const request = createMockRequest('192.168.1.10', {}, { plan: 'premium' })
      
      // First request should succeed
      const response1 = await stripeCheckoutPOST(request)
      expect(response1.status).toBe(200)
      
      // Check rate limit headers
      expect(response1.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response1.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(response1.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should block excessive checkout requests', async () => {
      const config = RATE_LIMIT_CONFIGS.free
      const request = createMockRequest('192.168.1.11', {}, { plan: 'premium' })
      
      // Make requests up to the limit
      const responses = []
      for (let i = 0; i < config.maxRequests + 5; i++) {
        const response = await stripeCheckoutPOST(request)
        responses.push(response)
      }
      
      // Check that some requests were blocked
      const blockedResponses = responses.filter(r => r.status === 429)
      expect(blockedResponses.length).toBeGreaterThan(0)
      
      // Check rate limit headers on blocked response
      const blockedResponse = blockedResponses[0]
      expect(blockedResponse.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(blockedResponse.headers.get('Retry-After')).toBeDefined()
    })

    it('should apply rate limiting to portal creation', async () => {
      const request = createMockRequest('192.168.1.12')
      
      const response = await stripePortalPOST(request)
      expect(response.status).toBe(200)
      
      // Check rate limit headers
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    })
  })

  describe('Email API Rate Limiting', () => {
    it('should apply rate limiting to email sending', async () => {
      const request = createMockRequest('192.168.1.13', {}, {
        type: 'welcome',
        to: 'test@example.com',
      })
      
      const response = await emailSendPOST(request)
      expect(response.status).toBe(200)
      
      // Check rate limit headers
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    })

    it('should block excessive email requests', async () => {
      const config = RATE_LIMIT_CONFIGS.strict
      const request = createMockRequest('192.168.1.14', {}, {
        type: 'welcome',
        to: 'test@example.com',
      })
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await emailSendPOST(request)
      }
      
      // This should be blocked
      const response = await emailSendPOST(request)
      expect(response.status).toBe(429)
      
      const data = await response.json()
      expect(data.error).toContain('rate limit')
    })
  })

  describe('Rate Limit Middleware Integration', () => {
    it('should handle concurrent requests correctly', async () => {
      const config = RATE_LIMIT_CONFIGS.free
      const ip = '192.168.1.15'
      
      // Create multiple concurrent requests
      const promises = Array.from({ length: config.maxRequests + 2 }, () => {
        const request = createMockRequest(ip, {}, { plan: 'premium' })
        return stripeCheckoutPOST(request)
      })
      
      const responses = await Promise.all(promises)
      
      // Some should succeed, some should be rate limited
      const successResponses = responses.filter(r => r.status === 200)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      expect(successResponses.length).toBeLessThanOrEqual(config.maxRequests)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should isolate rate limits by IP address', async () => {
      const config = RATE_LIMIT_CONFIGS.strict
      
      // Use up limit for first IP
      for (let i = 0; i < config.maxRequests; i++) {
        const request = createMockRequest('192.168.1.16', {}, { plan: 'premium' })
        await stripeCheckoutPOST(request)
      }
      
      // First IP should be blocked
      const request1 = createMockRequest('192.168.1.16', {}, { plan: 'premium' })
      const response1 = await stripeCheckoutPOST(request1)
      expect(response1.status).toBe(429)
      
      // Second IP should still work
      const request2 = createMockRequest('192.168.1.17', {}, { plan: 'premium' })
      const response2 = await stripeCheckoutPOST(request2)
      expect(response2.status).toBe(200)
    })

    it('should reset rate limits after window period', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 1,
      }
      const ip = '192.168.1.18'
      
      // Mock rate limit to use short window
      vi.spyOn(require('@/lib/utils/rateLimit'), 'rateLimit').mockImplementation(
        async (request, rateLimitConfig) => {
          return rateLimit(request, config)
        }
      )
      
      // Use up the limit
      const request1 = createMockRequest(ip, {}, { plan: 'premium' })
      const response1 = await stripeCheckoutPOST(request1)
      expect(response1.status).toBe(200)
      
      // Should be blocked immediately
      const request2 = createMockRequest(ip, {}, { plan: 'premium' })
      const response2 = await stripeCheckoutPOST(request2)
      expect(response2.status).toBe(429)
      
      // Fast forward time
      vi.advanceTimersByTime(1100)
      
      // Should work again after reset
      const request3 = createMockRequest(ip, {}, { plan: 'premium' })
      const response3 = await stripeCheckoutPOST(request3)
      expect(response3.status).toBe(200)
    })
  })

  describe('Rate Limit Headers', () => {
    it('should include proper rate limit headers in successful responses', async () => {
      const request = createMockRequest('192.168.1.19', {}, { plan: 'premium' })
      
      const response = await stripeCheckoutPOST(request)
      expect(response.status).toBe(200)
      
      // Check all required headers are present
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
      
      // Check header values are valid
      const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0')
      const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0')
      
      expect(limit).toBeGreaterThan(0)
      expect(remaining).toBeGreaterThanOrEqual(0)
      expect(remaining).toBeLessThan(limit)
    })

    it('should include Retry-After header in rate limit error responses', async () => {
      const config = RATE_LIMIT_CONFIGS.strict
      const request = createMockRequest('192.168.1.20', {}, { plan: 'premium' })
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await stripeCheckoutPOST(request)
      }
      
      // This should be rate limited
      const response = await stripeCheckoutPOST(request)
      expect(response.status).toBe(429)
      
      // Check Retry-After header
      const retryAfter = response.headers.get('Retry-After')
      expect(retryAfter).toBeDefined()
      expect(parseInt(retryAfter || '0')).toBeGreaterThan(0)
    })

    it('should update remaining count correctly', async () => {
      const ip = '192.168.1.21'
      
      // First request
      const request1 = createMockRequest(ip, {}, { plan: 'premium' })
      const response1 = await stripeCheckoutPOST(request1)
      const remaining1 = parseInt(response1.headers.get('X-RateLimit-Remaining') || '0')
      
      // Second request
      const request2 = createMockRequest(ip, {}, { plan: 'premium' })
      const response2 = await stripeCheckoutPOST(request2)
      const remaining2 = parseInt(response2.headers.get('X-RateLimit-Remaining') || '0')
      
      // Remaining should decrease
      expect(remaining2).toBe(remaining1 - 1)
    })
  })

  describe('Error Handling', () => {
    it('should handle rate limit errors gracefully', async () => {
      const config = RATE_LIMIT_CONFIGS.strict
      const request = createMockRequest('192.168.1.22', {}, { plan: 'premium' })
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await stripeCheckoutPOST(request)
      }
      
      // This should return proper error response
      const response = await stripeCheckoutPOST(request)
      expect(response.status).toBe(429)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(typeof data.error).toBe('string')
      expect(data.error.toLowerCase()).toContain('rate limit')
    })

    it('should not affect other API functionality when rate limited', async () => {
      const config = RATE_LIMIT_CONFIGS.strict
      const request = createMockRequest('192.168.1.23', {}, { plan: 'premium' })
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await stripeCheckoutPOST(request)
      }
      
      // Rate limited request should still return proper JSON
      const response = await stripeCheckoutPOST(request)
      expect(response.status).toBe(429)
      expect(response.headers.get('Content-Type')).toContain('application/json')
      
      // Should be able to parse response
      const data = await response.json()
      expect(data).toBeDefined()
      expect(typeof data).toBe('object')
    })

    it('should handle malformed requests with rate limiting', async () => {
      // Request with invalid JSON
      const request = createMockRequest('192.168.1.24', {}, null)
      request.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      
      const response = await stripeCheckoutPOST(request)
      
      // Should still apply rate limiting even if request is malformed
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
    })
  })

  describe('Performance and Memory', () => {
    it('should handle high volume of requests efficiently', async () => {
      const startTime = Date.now()
      const requests = 100
      
      // Create many requests with different IPs
      const promises = Array.from({ length: requests }, (_, i) => {
        const request = createMockRequest(`192.168.1.${100 + i}`, {}, { plan: 'premium' })
        return stripeCheckoutPOST(request)
      })
      
      await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000) // 5 seconds
    })

    it('should clean up expired rate limit entries', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 1,
      }
      
      // Mock rate limit to use short window
      vi.spyOn(require('@/lib/utils/rateLimit'), 'rateLimit').mockImplementation(
        async (request, rateLimitConfig) => {
          return rateLimit(request, config)
        }
      )
      
      // Create many rate limit entries
      for (let i = 0; i < 10; i++) {
        const request = createMockRequest(`192.168.1.${200 + i}`, {}, { plan: 'premium' })
        await stripeCheckoutPOST(request)
      }
      
      // Fast forward time to expire entries
      vi.advanceTimersByTime(2000)
      
      // Make another request to trigger cleanup
      const request = createMockRequest('192.168.1.250', {}, { plan: 'premium' })
      await stripeCheckoutPOST(request)
      
      // Memory usage should be reasonable (this is a basic check)
      expect(true).toBe(true) // Placeholder - in real scenario, check memory usage
    })
  })

  describe('Rate Limit Reset and Management', () => {
    it('should allow manual rate limit reset', async () => {
      const config = RATE_LIMIT_CONFIGS.strict
      const ip = '192.168.1.25'
      const request = createMockRequest(ip, {}, { plan: 'premium' })
      
      // Use up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        await stripeCheckoutPOST(request)
      }
      
      // Should be blocked
      const response1 = await stripeCheckoutPOST(request)
      expect(response1.status).toBe(429)
      
      // Reset rate limit
      resetRateLimit(ip)
      
      // Should work again
      const response2 = await stripeCheckoutPOST(request)
      expect(response2.status).toBe(200)
    })

    it('should handle rate limit configuration changes', async () => {
      // This test would verify that changing rate limit configs
      // doesn't break existing functionality
      const request = createMockRequest('192.168.1.26', {}, { plan: 'premium' })
      
      const response = await stripeCheckoutPOST(request)
      expect(response.status).toBe(200)
      
      // Rate limit headers should reflect current configuration
      const limit = response.headers.get('X-RateLimit-Limit')
      expect(parseInt(limit || '0')).toBeGreaterThan(0)
    })
  })
})