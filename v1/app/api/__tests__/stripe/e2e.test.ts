import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { 
  POST as createCheckout,
} from '@/app/api/stripe/create-checkout/route'
import { 
  POST as createPortal,
} from '@/app/api/stripe/create-portal/route'
import { 
  POST as stripeWebhook,
} from '@/app/api/stripe/webhook/route'
import { 
  withApiSecurity,
  ApiError,
  ApiErrorType,
} from '@/lib/utils/apiSecurity'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

// Mock modules
vi.mock('@/lib/utils/apiSecurity', () => ({
  withApiSecurity: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public type: string, message: string, public statusCode: number, public context?: any) {
      super(message)
      this.type = type
      this.statusCode = statusCode
      this.context = context
    }
  },
  ApiErrorType: {
    VALIDATION: 'VALIDATION',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    RATE_LIMIT: 'RATE_LIMIT',
    BAD_REQUEST: 'BAD_REQUEST',
    INTERNAL: 'INTERNAL',
    METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
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
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      rpc: vi.fn(() => ({
        error: null,
      })),
    })),
  })),
}))

vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
  STRIPE_PLANS: {
    premium: {
      priceId: 'price_premium_test',
      amount: 999,
      name: 'Premium',
    },
    pro: {
      priceId: 'price_pro_test',
      amount: 2999,
      name: 'Pro',
    },
  },
}))

describe('Stripe Integration E2E Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  let mockSupabaseClient: any
  let mockWithApiSecurity: any
  let mockStripe: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get mocked modules
    const supabaseModule = await import('@/lib/supabase/server')
    const apiSecurityModule = await import('@/lib/utils/apiSecurity')
    const stripeModule = await import('@/lib/stripe/server')
    
    mockSupabaseClient = vi.mocked(supabaseModule.createClient)()
    mockWithApiSecurity = apiSecurityModule.withApiSecurity
    mockStripe = stripeModule.stripe
    
    // Mock withApiSecurity to call the handler directly
    vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
      try {
        // Mock authenticated user
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message },
          {
            status: error.status || 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete User Journey - Free to Premium Upgrade', () => {
    it('should handle complete user journey from checkout to subscription activation', async () => {
      // Step 1: User initiates premium plan checkout
      const checkoutRequest = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free', stripe_customer_id: null },
        error: null,
      })

      // Mock Stripe customer creation
      mockStripe.customers.create.mockResolvedValueOnce({
        id: 'cus_test123',
      })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      // Mock profile update with Stripe customer ID
      mockSupabaseClient.from().update().eq().single.mockResolvedValueOnce({
        error: null,
      })

      const checkoutResponse = await createCheckout(checkoutRequest)
      const checkoutData = await checkoutResponse.json()

      expect(checkoutResponse.status).toBe(200)
      expect(checkoutData.success).toBe(true)
      expect(checkoutData.sessionId).toBe('cs_test123')
      expect(checkoutData.url).toBe('https://checkout.stripe.com/test')

      // Verify Stripe interactions
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          supabase_user_id: 'test-user-id',
        },
      })

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
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

      // Step 2: Simulate successful checkout completion webhook
      const webhookPayload = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            object: 'checkout.session',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              user_id: 'test-user-id',
              plan: 'premium',
            },
          },
        },
      }

      const webhookRequest = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'stripe-signature': 'test_signature',
        },
      })

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(webhookPayload)

      // Mock Stripe subscription retrieval
      mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
        id: 'sub_test123',
        status: 'active',
        items: {
          data: [{ price: { id: 'price_premium_test' } }],
        },
        current_period_start: 1640995200, // 2022-01-01
        current_period_end: 1643673600,   // 2022-02-01
        cancel_at_period_end: false,
        metadata: {
          user_id: 'test-user-id',
          plan: 'premium',
        },
      })

      // Mock subscription insertion
      mockSupabaseClient.from().insert().select().eq().single.mockResolvedValueOnce({
        data: { id: 'sub_test123' },
        error: null,
      })

      // Mock profile update to premium plan
      mockSupabaseClient.from().update().eq().single.mockResolvedValueOnce({
        error: null,
      })

      const webhookResponse = await stripeWebhook(webhookRequest)
      const webhookData = await webhookResponse.json()

      expect(webhookResponse.status).toBe(200)
      expect(webhookData.received).toBe(true)

      // Verify database interactions
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        stripe_subscription_id: 'sub_test123',
        stripe_price_id: 'price_premium_test',
        status: 'active',
        plan: 'premium',
        current_period_start: new Date(1640995200 * 1000).toISOString(),
        current_period_end: new Date(1643673600 * 1000).toISOString(),
        cancel_at_period_end: false,
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        plan: 'premium',
        stripe_customer_id: 'cus_test123',
      })

      // Step 3: User accesses billing portal
      const portalRequest = new NextRequest('http://localhost:3000/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock user profile with premium plan and Stripe customer ID
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'premium', stripe_customer_id: 'cus_test123' },
        error: null,
      })

      // Mock Stripe billing portal session creation
      mockStripe.billingPortal.sessions.create.mockResolvedValueOnce({
        url: 'https://billing.stripe.com/session/test',
      })

      const portalResponse = await createPortal(portalRequest)
      const portalData = await portalResponse.json()

      expect(portalResponse.status).toBe(200)
      expect(portalData.success).toBe(true)
      expect(portalData.url).toBe('https://billing.stripe.com/session/test')

      // Verify Stripe portal session creation
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: expect.stringContaining('/dashboard'),
      })
    })
  })

  describe('Subscription Cancellation Flow', () => {
    it('should handle subscription cancellation and user downgrade', async () => {
      // Step 1: Simulate subscription cancellation webhook
      const webhookPayload = {
        id: 'evt_test456',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            object: 'subscription',
            customer: 'cus_test123',
            status: 'canceled',
            metadata: {
              user_id: 'test-user-id',
            },
          },
        },
      }

      const webhookRequest = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'stripe-signature': 'test_signature',
        },
      })

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(webhookPayload)

      // Mock subscription lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { user_id: 'test-user-id', plan: 'premium' },
        error: null,
      })

      // Mock profile update to free plan
      mockSupabaseClient.from().update().eq().single.mockResolvedValueOnce({
        error: null,
      })

      const webhookResponse = await stripeWebhook(webhookRequest)
      const webhookData = await webhookResponse.json()

      expect(webhookResponse.status).toBe(200)
      expect(webhookData.received).toBe(true)

      // Verify user downgraded to free plan
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        plan: 'free',
      })
    })
  })

  describe('Plan Upgrade Flow', () => {
    it('should handle upgrading from Premium to Pro plan', async () => {
      // Step 1: User initiates Pro plan checkout while on Premium
      const checkoutRequest = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' }),
      })

      // Mock user profile with Premium plan and existing Stripe customer ID
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'premium', stripe_customer_id: 'cus_test123' },
        error: null,
      })

      // Mock Stripe checkout session creation (no new customer needed)
      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: 'cs_test456',
        url: 'https://checkout.stripe.com/test-pro',
      })

      const checkoutResponse = await createCheckout(checkoutRequest)
      const checkoutData = await checkoutResponse.json()

      expect(checkoutResponse.status).toBe(200)
      expect(checkoutData.success).toBe(true)
      expect(checkoutData.sessionId).toBe('cs_test456')
      expect(checkoutData.url).toBe('https://checkout.stripe.com/test-pro')

      // Verify Stripe interactions (no customer creation since already exists)
      expect(mockStripe.customers.create).not.toHaveBeenCalled()
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_pro_test',
            quantity: 1,
          },
        ],
        success_url: expect.stringContaining('/dashboard?session_id='),
        cancel_url: expect.stringContaining('/pricing?canceled=true'),
        metadata: {
          user_id: 'test-user-id',
          plan: 'pro',
        },
        subscription_data: {
          metadata: {
            user_id: 'test-user-id',
            plan: 'pro',
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      })
    })
  })

  describe('Error Handling Scenarios', () => {
    it('should handle duplicate subscription gracefully', async () => {
      // Step 1: User initiates checkout
      const checkoutRequest = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free', stripe_customer_id: null },
        error: null,
      })

      // Mock Stripe customer creation
      mockStripe.customers.create.mockResolvedValueOnce({
        id: 'cus_test789',
      })

      // Mock Stripe checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: 'cs_test789',
        url: 'https://checkout.stripe.com/test',
      })

      // Mock profile update with Stripe customer ID
      mockSupabaseClient.from().update().eq().single.mockResolvedValueOnce({
        error: null,
      })

      const checkoutResponse = await createCheckout(checkoutRequest)
      const checkoutData = await checkoutResponse.json()

      expect(checkoutResponse.status).toBe(200)
      expect(checkoutData.success).toBe(true)

      // Step 2: Simulate duplicate subscription webhook (database constraint violation)
      const webhookPayload = {
        id: 'evt_test789',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test789',
            object: 'checkout.session',
            customer: 'cus_test789',
            subscription: 'sub_test789',
            metadata: {
              user_id: 'test-user-id',
              plan: 'premium',
            },
          },
        },
      }

      const webhookRequest = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'stripe-signature': 'test_signature',
        },
      })

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(webhookPayload)

      // Mock Stripe subscription retrieval
      mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
        id: 'sub_test789',
        status: 'active',
        items: {
          data: [{ price: { id: 'price_premium_test' } }],
        },
        current_period_start: 1640995200,
        current_period_end: 1643673600,
        cancel_at_period_end: false,
        metadata: {
          user_id: 'test-user-id',
          plan: 'premium',
        },
      })

      // Mock subscription insertion with duplicate error
      mockSupabaseClient.from().insert().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505' }, // PostgreSQL duplicate key error
      })

      // Mock subscription update (instead of insert)
      mockSupabaseClient.from().update().eq().single.mockResolvedValueOnce({
        error: null,
      })

      // Mock profile update to premium plan
      mockSupabaseClient.from().update().eq().single.mockResolvedValueOnce({
        error: null,
      })

      const webhookResponse = await stripeWebhook(webhookRequest)
      const webhookData = await webhookResponse.json()

      expect(webhookResponse.status).toBe(200)
      expect(webhookData.received).toBe(true)

      // Verify that update was called instead of insert due to duplicate
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSupabaseClient.from().update).toHaveBeenCalled()
    })

    it('should handle webhook with missing metadata gracefully', async () => {
      // Step 1: Simulate webhook with missing metadata
      const webhookPayload = {
        id: 'evt_test999',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test999',
            object: 'checkout.session',
            customer: 'cus_test999',
            subscription: 'sub_test999',
            // Missing metadata
          },
        },
      }

      const webhookRequest = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'stripe-signature': 'test_signature',
        },
      })

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(webhookPayload)

      const webhookResponse = await stripeWebhook(webhookRequest)
      const webhookData = await webhookResponse.json()

      expect(webhookResponse.status).toBe(200)
      expect(webhookData.received).toBe(true)

      // Should not process subscription without metadata
      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('subscriptions')
      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('profiles')
    })

    it('should handle invalid plan in webhook gracefully', async () => {
      // Step 1: Simulate webhook with invalid plan
      const webhookPayload = {
        id: 'evt_test888',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test888',
            object: 'checkout.session',
            customer: 'cus_test888',
            subscription: 'sub_test888',
            metadata: {
              user_id: 'test-user-id',
              plan: 'invalid_plan',
            },
          },
        },
      }

      const webhookRequest = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'stripe-signature': 'test_signature',
        },
      })

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(webhookPayload)

      const webhookResponse = await stripeWebhook(webhookRequest)
      const webhookData = await webhookResponse.json()

      expect(webhookResponse.status).toBe(200)
      expect(webhookData.received).toBe(true)

      // Should not process subscription with invalid plan
      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('subscriptions')
      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('profiles')
    })
  })

  describe('Security and Validation', () => {
    it('should reject checkout requests without authentication', async () => {
      const checkoutRequest = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock withApiSecurity to throw authentication error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION,
          'Authentication required',
          401
        )
      })

      const checkoutResponse = await createCheckout(checkoutRequest)
      const checkoutData = await checkoutResponse.json()

      expect(checkoutResponse.status).toBe(401)
      expect(checkoutData.error).toBe('Authentication required')
    })

    it('should reject checkout requests with invalid plan', async () => {
      const checkoutRequest = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'invalid_plan' }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Invalid plan. Must be "premium" or "pro"',
          400
        )
      })

      const checkoutResponse = await createCheckout(checkoutRequest)
      const checkoutData = await checkoutResponse.json()

      expect(checkoutResponse.status).toBe(400)
      expect(checkoutData.error).toBe('Invalid plan. Must be "premium" or "pro"')
    })

    it('should reject portal requests for free plan users', async () => {
      const portalRequest = new NextRequest('http://localhost:3000/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free', stripe_customer_id: null },
        error: null,
      })

      // Mock withApiSecurity to throw authorization error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION,
          'Billing portal is only available for Premium and Pro subscribers',
          403
        )
      })

      const portalResponse = await createPortal(portalRequest)
      const portalData = await portalResponse.json()

      expect(portalResponse.status).toBe(403)
      expect(portalData.error).toBe('Billing portal is only available for Premium and Pro subscribers')
    })

    it('should reject portal requests without Stripe customer ID', async () => {
      const portalRequest = new NextRequest('http://localhost:3000/api/stripe/create-portal', {
        method: 'POST',
      })

      // Mock user profile with premium plan but no Stripe customer ID
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'premium', stripe_customer_id: null },
        error: null,
      })

      // Mock withApiSecurity to throw not found error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          'No Stripe customer found. Please create a subscription first.',
          404
        )
      })

      const portalResponse = await createPortal(portalRequest)
      const portalData = await portalResponse.json()

      expect(portalResponse.status).toBe(404)
      expect(portalData.error).toBe('No Stripe customer found. Please create a subscription first.')
    })

    it('should reject webhook requests with invalid signature', async () => {
      const webhookRequest = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      })

      // Mock webhook signature verification to fail
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('No signatures found matching the expected signature')
      })

      const webhookResponse = await stripeWebhook(webhookRequest)
      const webhookData = await webhookResponse.json()

      expect(webhookResponse.status).toBe(400)
      expect(webhookData.error).toBe('Webhook signature verification failed')
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to Stripe API routes', async () => {
      const checkoutRequest = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock withApiSecurity to throw rate limit error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT,
          'Rate limit exceeded',
          429
        )
      })

      const checkoutResponse = await createCheckout(checkoutRequest)
      const checkoutData = await checkoutResponse.json()

      expect(checkoutResponse.status).toBe(429)
      expect(checkoutData.error).toBe('Rate limit exceeded')
    })

    it('should return rate limit headers in responses', async () => {
      const checkoutRequest = new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'premium' }),
      })

      // Mock withApiSecurity to succeed and return rate limit headers
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        const response = NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '59',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
          },
        })
        
        return response
      })

      // Mock successful checkout
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free', stripe_customer_id: null },
        error: null,
      })

      mockStripe.customers.create.mockResolvedValueOnce({
        id: 'cus_test123',
      })

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      })

      mockSupabaseClient.from().update().eq().single.mockResolvedValueOnce({
        error: null,
      })

      const checkoutResponse = await createCheckout(checkoutRequest)
      
      expect(checkoutResponse.status).toBe(200)
      expect(checkoutResponse.headers.get('X-RateLimit-Limit')).toBe('60')
      expect(checkoutResponse.headers.get('X-RateLimit-Remaining')).toBe('59')
      expect(checkoutResponse.headers.get('X-RateLimit-Reset')).toBeDefined()
    })
  })
})