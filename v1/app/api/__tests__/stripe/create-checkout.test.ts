/**
 * Stripe Checkout Session Creation Tests
 * 
 * Tests for the create-checkout API endpoint that creates Stripe checkout sessions.
 * Uses mocked Stripe responses and Supabase client.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/create-checkout/route'

// Mock modules
vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    customers: {
      create: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
  STRIPE_PLANS: {
    premium: {
      priceId: 'price_premium_test',
      amount: 900,
      name: 'Premium',
    },
    pro: {
      priceId: 'price_pro_test',
      amount: 2900,
      name: 'Pro',
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ 
            data: { stripe_customer_id: null, plan: 'free' }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
    })),
  })),
}))

vi.mock('@/lib/utils/apiSecurity', () => ({
  withApiSecurity: vi.fn(),
  validateRequestBody: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public type: string, message: string, public status: number, public context?: any) {
      super(message)
    }
  },
  ApiErrorType: {
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    VALIDATION: 'VALIDATION',
    CONFLICT: 'CONFLICT',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL: 'INTERNAL',
  },
}))

describe('Stripe Create Checkout API', () => {
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
            data: { stripe_customer_id: null, plan: 'free' }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Request Validation', () => {
    it('should reject request without plan', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      // Mock validation to throw error
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockImplementation(() => {
        throw new Error('Plan is required')
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Plan is required')
    })

    it('should reject invalid plan', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'invalid' }),
      })

      // Mock validation to throw error
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockImplementation(() => {
        throw new Error('Invalid plan. Must be "premium" or "pro"')
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Invalid plan. Must be "premium" or "pro"')
    })

    it('should accept valid premium plan', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock Stripe customer creation
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_test123',
      })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.sessionId).toBe('cs_test123')
      expect(data.url).toBe('https://checkout.stripe.com/test')
    })
  })

  describe('User Plan Validation', () => {
    it('should reject if user is already on the requested plan', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock user already on premium plan
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: 'cus_existing', plan: 'premium' }, 
              error: null 
            }))
          }))
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('already subscribed')
    })

    it('should allow upgrade from free to premium', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should allow upgrade from premium to pro', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'pro' })

      // Mock user on premium plan
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: 'cus_existing', plan: 'premium' }, 
              error: null 
            }))
          }))
        })),
      })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Stripe Customer Management', () => {
    it('should create new Stripe customer for new user', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock Stripe customer creation
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_new123',
      })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      const response = await POST(request)

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          supabase_user_id: 'test-user-id',
        },
      })

      expect(response.status).toBe(200)
    })

    it('should use existing Stripe customer', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock user with existing Stripe customer
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: 'cus_existing123', plan: 'free' }, 
              error: null 
            }))
          }))
        })),
      })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      const response = await POST(request)

      expect(mockStripe.customers.create).not.toHaveBeenCalled()
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing123',
        })
      )

      expect(response.status).toBe(200)
    })

    it('should handle Stripe customer creation failure', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock Stripe customer creation failure
      mockStripe.customers.create.mockRejectedValue(new Error('Stripe API error'))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create Stripe customer')
    })
  })

  describe('Checkout Session Creation', () => {
    beforeEach(() => {
      // Mock validation to return valid body
      const { validateRequestBody } = require('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock existing customer
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: 'cus_existing123', plan: 'free' }, 
              error: null 
            }))
          }))
        })),
      })
    })

    it('should create checkout session with correct parameters', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      const response = await POST(request)

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_existing123',
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_premium_test',
            quantity: 1,
          },
        ],
        success_url: expect.stringContaining('/dashboard?session_id='),
        cancel_url: expect.stringContaining('/pricing?canceled=true'),
        metadata: {
          user_id: 'test-user-id',
          plan: 'premium',
        },
        subscription_data: {
          metadata: {
            user_id: 'test-user-id',
            plan: 'premium',
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      })

      expect(response.status).toBe(200)
    })

    it('should create pro plan checkout session', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' }),
      })

      // Mock validation for pro plan
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'pro' })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_pro123',
        url: 'https://checkout.stripe.com/pro',
      })

      const response = await POST(request)

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_pro_test',
              quantity: 1,
            },
          ],
          metadata: {
            user_id: 'test-user-id',
            plan: 'pro',
          },
        })
      )

      expect(response.status).toBe(200)
    })

    it('should handle checkout session creation failure', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock Stripe checkout session creation failure
      mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe API error'))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create checkout session')
    })
  })

  describe('Database Error Handling', () => {
    it('should handle profile fetch error', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock profile fetch error
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: null, 
              error: { message: 'Database error' } 
            }))
          }))
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch user profile')
    })

    it('should continue if customer ID update fails', async () => {
      const request = new NextRequest('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock validation to return valid body
      const { validateRequestBody } = await import('@/lib/utils/apiSecurity')
      vi.mocked(validateRequestBody).mockReturnValue({ plan: 'premium' })

      // Mock customer creation
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_new123',
      })

      // Mock profile update error
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { stripe_customer_id: null, plan: 'free' }, 
              error: null 
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: { message: 'Update failed' } }))
        })),
      })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      const response = await POST(request)

      // Should still succeed even if customer ID update fails
      expect(response.status).toBe(200)
    })
  })
})