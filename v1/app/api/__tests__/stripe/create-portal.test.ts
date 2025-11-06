/**
 * Stripe Customer Portal Tests
 * 
 * Tests for the create-portal API endpoint that creates Stripe Customer Portal sessions.
 * Uses mocked Stripe responses and Supabase client.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/create-portal/route'

// Mock modules
vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ 
            data: { stripe_customer_id: 'cus_test123', plan: 'premium' }, 
            error: null 
          }))
        }))
      })),
    })),
  })),
}))

vi.mock('@/lib/utils/apiSecurity', () => ({
  withApiSecurity: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public type: string, message: string, public status: number, public context?: any) {
      super(message)
    }
  },
  ApiErrorType: {
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL: 'INTERNAL',
  },
}))

describe('Stripe Create Portal API', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  let mockStripe: any
  let mockSupabaseClient: any
  let mockWithApiSecurity: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get mocked modules
    const stripeModule = await import('@/lib/stripe/server')
    const supabaseModule = await import('@/lib/supabase/server')
    const apiSecurityModule = await import('@/lib/utils/apiSecurity')
    
    mockStripe = stripeModule.stripe
    mockSupabaseClient = vi.mocked(supabaseModule.createClient)()
    mockWithApiSecurity = apiSecurityModule.withApiSecurity
    
    // Mock withApiSecurity to call the handler directly
    vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
      try {
        const result = await handler(request, mockUser)
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.status || 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    })

    // Reset Supabase mocks
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ 
            data: { stripe_customer_id: 'cus_test123', plan: 'premium' }, 
            error: null 
          }))
        }))
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      // Mock withApiSecurity to simulate no user
      mockWithApiSecurity.mockImplementation(async (request, handler, options) => {
        try {
          const result = await handler(request, null) // No user
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.status || 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('not authenticated')
    })

    it('should accept authenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock Stripe portal session creation
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.url).toBe('https://billing.stripe.com/session/test')
    })
  })

  describe('Customer Validation', () => {
    it('should reject users without Stripe customer ID', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock user without Stripe customer ID
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: null, plan: 'free' }, 
              error: null 
            }))
          }))
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('No Stripe customer found')
    })

    it('should reject free plan users', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock free plan user with Stripe customer ID
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: 'cus_test123', plan: 'free' }, 
              error: null 
            }))
          }))
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('only available for Premium and Pro subscribers')
    })

    it('should accept premium plan users', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock Stripe portal session creation
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/premium',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.url).toBe('https://billing.stripe.com/session/premium')
    })

    it('should accept pro plan users', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock pro plan user
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: 'cus_test123', plan: 'pro' }, 
              error: null 
            }))
          }))
        })),
      })

      // Mock Stripe portal session creation
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/pro',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.url).toBe('https://billing.stripe.com/session/pro')
    })
  })

  describe('Portal Session Creation', () => {
    beforeEach(() => {
      // Mock premium user by default
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: 'cus_test123', plan: 'premium' }, 
              error: null 
            }))
          }))
        })),
      })
    })

    it('should create portal session with correct parameters', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock Stripe portal session creation
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test',
      })

      const response = await POST(request)

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: expect.stringContaining('/dashboard'),
      })

      expect(response.status).toBe(200)
    })

    it('should return portal URL on success', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      const expectedUrl = 'https://billing.stripe.com/session/success'

      // Mock Stripe portal session creation
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: expectedUrl,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.url).toBe(expectedUrl)
    })

    it('should handle invalid Stripe customer error', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock Stripe invalid customer error
      const stripeError = new Error('No such customer')
      stripeError.type = 'StripeInvalidRequestError'
      mockStripe.billingPortal.sessions.create.mockRejectedValue(stripeError)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Invalid Stripe customer')
    })

    it('should handle general Stripe API errors', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock general Stripe error
      mockStripe.billingPortal.sessions.create.mockRejectedValue(
        new Error('Stripe API temporarily unavailable')
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create billing portal session')
    })
  })

  describe('Database Error Handling', () => {
    it('should handle profile fetch error', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock profile fetch error
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: null, 
              error: { message: 'Database connection failed' } 
            }))
          }))
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch user profile')
    })

    it('should handle missing profile data', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock missing profile data
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: null, 
              error: null 
            }))
          }))
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('No Stripe customer found')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined stripe_customer_id', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock profile with undefined stripe_customer_id
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: undefined, plan: 'premium' }, 
              error: null 
            }))
          }))
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('No Stripe customer found')
    })

    it('should handle empty string stripe_customer_id', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock profile with empty stripe_customer_id
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: '', plan: 'premium' }, 
              error: null 
            }))
          }))
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('No Stripe customer found')
    })

    it('should handle network timeout errors', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock network timeout
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'ETIMEDOUT'
      mockStripe.billingPortal.sessions.create.mockRejectedValue(timeoutError)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create billing portal session')
    })
  })

  describe('Return URL Configuration', () => {
    it('should use correct return URL from environment', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock environment variable
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com'

      // Mock Stripe portal session creation
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/session/test',
      })

      const response = await POST(request)

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: 'https://myapp.com/dashboard',
      })

      // Restore environment
      process.env.NEXT_PUBLIC_APP_URL = originalEnv

      expect(response.status).toBe(200)
    })
  })
})