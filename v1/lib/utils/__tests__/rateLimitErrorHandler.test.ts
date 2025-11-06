import { NextRequest, NextResponse } from 'next/server'
import { vi } from 'vitest'
import {
  createRateLimitErrorResponse,
  createUserFriendlyRateLimitError,
  extractRateLimitInfo,
  formatRetryAfter,
  isRateLimitResponse,
  parseRateLimitHeaders,
  withRateLimitErrorHandling,
} from '../rateLimitErrorHandler'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { describe } from 'node:test'

describe('rateLimitErrorHandler', () => {
  describe('createRateLimitErrorResponse', () => {
    it('creates correct 429 response with headers', async () => {
      const limit = 10
      const remaining = 0
      const reset = Math.floor(Date.now() / 1000) + 60
      const message = 'Custom error message'
      
      const response = createRateLimitErrorResponse(limit, remaining, reset, message)
      
      expect(response.status).toBe(429)
      
      const data = await response.json()
      expect(data).toEqual({
        error: message,
        limit,
        remaining,
        reset,
        retryAfter: expect.any(Number),
      })
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBe(reset.toString())
      expect(response.headers.get('Retry-After')).toBeTruthy()
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('uses default message when none provided', async () => {
      const response = createRateLimitErrorResponse(10, 0, Date.now() + 60)
      const data = await response.json()
      
      expect(data.error).toBe('Rate limit exceeded. Please try again later.')
    })

    it('calculates retry after correctly', async () => {
      const now = Math.floor(Date.now() / 1000)
      const reset = now + 120 // 2 minutes from now
      
      const response = createRateLimitErrorResponse(10, 0, reset)
      const data = await response.json()
      
      expect(data.retryAfter).toBeCloseTo(120, 0)
    })
  })

  describe('createUserFriendlyRateLimitError', () => {
    it('creates appropriate message for free users', async () => {
      const response = createUserFriendlyRateLimitError(10, 0, Date.now() + 60, 'free')
      const data = await response.json()
      
      expect(data.error).toContain('Ücretsiz plan limitinizi aştınız')
      expect(data.error).toContain('Premium plana geçerek')
    })

    it('creates appropriate message for premium users', async () => {
      const response = createUserFriendlyRateLimitError(120, 0, Date.now() + 60, 'premium')
      const data = await response.json()
      
      expect(data.error).toContain('Premium plan limitinizi aştınız')
      expect(data.error).toContain('Pro plana geçerek')
    })

    it('creates appropriate message for pro users', async () => {
      const response = createUserFriendlyRateLimitError(300, 0, Date.now() + 60, 'pro')
      const data = await response.json()
      
      expect(data.error).toContain('Pro plan limitinizi aştınız')
      expect(data.error).toContain('bir süre bekleyip')
    })

    it('creates appropriate message for guest users', async () => {
      const response = createUserFriendlyRateLimitError(30, 0, Date.now() + 60, 'guest')
      const data = await response.json()
      
      expect(data.error).toContain('Giriş yapmadan kullanım limitinizi aştınız')
      expect(data.error).toContain('Hesap oluşturarak')
    })
  })

  describe('extractRateLimitInfo', () => {
    it('extracts rate limit information correctly', () => {
      const rateLimitResult = {
        success: false,
        limit: 10,
        remaining: 0,
        reset: 1234567890,
      }
      
      const info = extractRateLimitInfo(rateLimitResult)
      
      expect(info).toEqual({
        limit: 10,
        remaining: 0,
        reset: 1234567890,
      })
    })
  })

  describe('formatRetryAfter', () => {
    it('formats seconds correctly', () => {
      expect(formatRetryAfter(30)).toBe('30 saniye')
      expect(formatRetryAfter(1)).toBe('1 saniye')
    })

    it('formats minutes correctly', () => {
      expect(formatRetryAfter(60)).toBe('1 dakika')
      expect(formatRetryAfter(90)).toBe('1 dakika 30 saniye')
      expect(formatRetryAfter(120)).toBe('2 dakika')
    })

    it('formats hours correctly', () => {
      expect(formatRetryAfter(3600)).toBe('1 saat')
      expect(formatRetryAfter(3900)).toBe('1 saat 5 dakika')
      expect(formatRetryAfter(7200)).toBe('2 saat')
    })
  })

  describe('isRateLimitResponse', () => {
    it('returns true for 429 responses', () => {
      const response = { status: 429 } as Response
      expect(isRateLimitResponse(response)).toBe(true)
    })

    it('returns false for non-429 responses', () => {
      const response = { status: 200 } as Response
      expect(isRateLimitResponse(response)).toBe(false)
    })
  })

  describe('parseRateLimitHeaders', () => {
    it('parses rate limit headers correctly', () => {
      const response = {
        status: 429,
        headers: {
          get: vi.fn((header) => {
            switch (header) {
              case 'X-RateLimit-Limit':
                return '10'
              case 'X-RateLimit-Remaining':
                return '5'
              case 'X-RateLimit-Reset':
                return '1234567890'
              case 'Retry-After':
                return '60'
              default:
                return null
            }
          }),
        },
      } as unknown as Response
      
      const parsed = parseRateLimitHeaders(response)
      
      expect(parsed).toEqual({
        limit: 10,
        remaining: 5,
        reset: 1234567890,
        retryAfter: 60,
      })
    })

    it('handles missing headers gracefully', () => {
      const response = {
        status: 429,
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as unknown as Response
      
      const parsed = parseRateLimitHeaders(response)
      
      expect(parsed).toEqual({
        limit: 0,
        remaining: 0,
        reset: expect.any(Number),
        retryAfter: 60,
      })
    })

    it('returns null for non-429 responses', () => {
      const response = { status: 200 } as Response
      
      const parsed = parseRateLimitHeaders(response)
      
      expect(parsed).toBeNull()
    })

    it('handles reset time as seconds from now', () => {
      const response = {
        status: 429,
        headers: {
          get: vi.fn((header) => {
            switch (header) {
              case 'X-RateLimit-Reset':
                return '60' // 60 seconds from now
              default:
                return '0'
            }
          }),
        },
      } as unknown as Response
      
      const parsed = parseRateLimitHeaders(response)
      const expectedReset = Math.floor(Date.now() / 1000) + 60
      
      expect(parsed?.reset).toBeCloseTo(expectedReset, 0)
    })
  })

  describe('withRateLimitErrorHandling', () => {
    it('returns rate limit error when check fails', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const rateLimitCheck = vi.fn().mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      })
      
      const wrappedHandler = withRateLimitErrorHandling(handler, rateLimitCheck)
      const response = await wrappedHandler('test-arg')
      
      expect(response.status).toBe(429)
      expect(handler).not.toHaveBeenCalled()
      expect(rateLimitCheck).toHaveBeenCalledWith('test-arg')
    })

    it('calls original handler when rate limit check passes', async () => {
      const expectedResponse = NextResponse.json({ success: true })
      const handler = vi.fn().mockResolvedValue(expectedResponse)
      const rateLimitCheck = vi.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 5,
        reset: Math.floor(Date.now() / 1000) + 60,
      })
      
      const wrappedHandler = withRateLimitErrorHandling(handler, rateLimitCheck)
      const response = await wrappedHandler('test-arg')
      
      expect(response).toBe(expectedResponse)
      expect(handler).toHaveBeenCalledWith('test-arg')
      expect(rateLimitCheck).toHaveBeenCalledWith('test-arg')
    })

    it('calls original handler when rate limit check returns null', async () => {
      const expectedResponse = NextResponse.json({ success: true })
      const handler = vi.fn().mockResolvedValue(expectedResponse)
      const rateLimitCheck = vi.fn().mockResolvedValue(null)
      
      const wrappedHandler = withRateLimitErrorHandling(handler, rateLimitCheck)
      const response = await wrappedHandler('test-arg')
      
      expect(response).toBe(expectedResponse)
      expect(handler).toHaveBeenCalledWith('test-arg')
    })

    it('handles rate limit check errors gracefully', async () => {
      const expectedResponse = NextResponse.json({ success: true })
      const handler = vi.fn().mockResolvedValue(expectedResponse)
      const rateLimitCheck = vi.fn().mockRejectedValue(new Error('Redis error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const wrappedHandler = withRateLimitErrorHandling(handler, rateLimitCheck)
      const response = await wrappedHandler('test-arg')
      
      expect(response).toBe(expectedResponse)
      expect(handler).toHaveBeenCalledWith('test-arg')
      expect(consoleSpy).toHaveBeenCalledWith('Rate limit error handling failed:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})