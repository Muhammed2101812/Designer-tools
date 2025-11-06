/**
 * Stripe Webhook Handler Tests
 * 
 * Tests for the Stripe webhook endpoint that handles subscription lifecycle events.
 * Uses mocked Stripe responses to test webhook processing logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/webhook/route'

// Mock modules
vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({ error: null, eq: vi.fn(() => ({ error: null })) })),
      select: vi.fn(() => ({ 
        eq: vi.fn(() => ({ 
          single: vi.fn(() => ({ data: { user_id: 'test-user-id' }, error: null }))
        }))
      })),
      eq: vi.fn(() => ({ error: null })),
    })),
  })),
}))

vi.mock('@/lib/utils/error-logger', () => ({
  reportError: vi.fn(),
}))

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'stripe-signature') return 'test-signature'
      return null
    }),
  })),
}))

describe('Stripe Webhook Handler', () => {
  let mockStripe: any
  let mockSupabaseClient: any
  let mockReportError: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get mocked modules
    const stripeModule = await import('@/lib/stripe/server')
    const supabaseModule = await import('@/lib/supabase/server')
    const errorModule = await import('@/lib/utils/error-logger')
    
    mockStripe = stripeModule.stripe
    mockSupabaseClient = vi.mocked(supabaseModule.createClient)()
    mockReportError = errorModule.reportError
    
    // Reset mock implementations
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({ error: null, eq: vi.fn(() => ({ error: null })) })),
      select: vi.fn(() => ({ 
        eq: vi.fn(() => ({ 
          single: vi.fn(() => ({ data: { user_id: 'test-user-id' }, error: null }))
        }))
      })),
      eq: vi.fn(() => ({ error: null })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Webhook Signature Verification', () => {
    it('should return 400 when signature is missing', async () => {
      // Mock missing signature
      const headersModule = await import('next/headers')
      vi.mocked(headersModule.headers).mockReturnValue({
        get: vi.fn(() => null),
      } as any)

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing signature')
    })

    it('should return 400 when signature verification fails', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid signature')
      expect(mockReportError).toHaveBeenCalled()
    })

    it('should process valid webhook signature', async () => {
      const mockEvent = {
        id: 'evt_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            subscription: 'sub_test',
            metadata: {
              user_id: 'test-user-id',
              plan: 'premium',
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test',
        status: 'active',
        items: {
          data: [{ price: { id: 'price_premium' } }],
        },
        current_period_start: 1640995200, // 2022-01-01
        current_period_end: 1643673600,   // 2022-02-01
        cancel_at_period_end: false,
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })

  describe('checkout.session.completed Event', () => {
    beforeEach(() => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            subscription: 'sub_test',
            metadata: {
              user_id: 'test-user-id',
              plan: 'premium',
            },
          },
        },
      })

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test',
        status: 'active',
        items: {
          data: [{ price: { id: 'price_premium' } }],
        },
        current_period_start: 1640995200,
        current_period_end: 1643673600,
        cancel_at_period_end: false,
      })
    })

    it('should create subscription and update user plan', async () => {
      const mockInsert = vi.fn(() => ({ error: null }))
      const mockUpdate = vi.fn(() => ({ error: null }))
      
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return { insert: mockInsert }
        }
        if (table === 'profiles') {
          return { 
            update: mockUpdate,
            eq: vi.fn(() => ({ error: null }))
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        stripe_subscription_id: 'sub_test',
        stripe_price_id: 'price_premium',
        status: 'active',
        plan: 'premium',
        current_period_start: '2022-01-01T00:00:00.000Z',
        current_period_end: '2022-02-01T00:00:00.000Z',
        cancel_at_period_end: false,
      })
    })

    it('should handle missing metadata gracefully', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            subscription: 'sub_test',
            metadata: {}, // Missing user_id and plan
          },
        },
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled()
    })

    it('should handle invalid plan gracefully', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            subscription: 'sub_test',
            metadata: {
              user_id: 'test-user-id',
              plan: 'invalid-plan',
            },
          },
        },
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled()
    })

    it('should handle duplicate subscription insertion', async () => {
      const mockInsert = vi.fn(() => ({ error: { code: '23505' } })) // Duplicate key error
      const mockUpdate = vi.fn(() => ({ 
        error: null,
        eq: vi.fn(() => ({ error: null }))
      }))
      
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return { 
            insert: mockInsert,
            update: mockUpdate,
            eq: vi.fn(() => ({ error: null }))
          }
        }
        if (table === 'profiles') {
          return { 
            update: vi.fn(() => ({ error: null })),
            eq: vi.fn(() => ({ error: null }))
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockInsert).toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe('customer.subscription.updated Event', () => {
    beforeEach(() => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test',
            status: 'active',
            items: {
              data: [{ price: { id: 'price_premium' } }],
            },
            current_period_start: 1640995200,
            current_period_end: 1643673600,
            cancel_at_period_end: false,
            metadata: {
              plan: 'premium',
            },
          },
        },
      })
    })

    it('should update subscription and user plan', async () => {
      const mockUpdate = vi.fn(() => ({ 
        error: null,
        eq: vi.fn(() => ({ error: null }))
      }))
      
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return { 
            update: mockUpdate,
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: { user_id: 'test-user-id' }, error: null }))
              }))
            })),
            eq: vi.fn(() => ({ error: null }))
          }
        }
        if (table === 'profiles') {
          return { 
            update: vi.fn(() => ({ error: null })),
            eq: vi.fn(() => ({ error: null }))
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('should handle subscription not found', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return { 
            update: vi.fn(() => ({ 
              error: null,
              eq: vi.fn(() => ({ error: null }))
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: null, error: { message: 'Not found' } }))
              }))
            })),
            eq: vi.fn(() => ({ error: null }))
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
    })
  })

  describe('customer.subscription.deleted Event', () => {
    beforeEach(() => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test',
            status: 'canceled',
          },
        },
      })
    })

    it('should cancel subscription and downgrade user to free plan', async () => {
      const mockUpdate = vi.fn(() => ({ 
        error: null,
        eq: vi.fn(() => ({ error: null }))
      }))
      
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'subscriptions') {
          return { 
            update: mockUpdate,
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: { user_id: 'test-user-id' }, error: null }))
              }))
            })),
            eq: vi.fn(() => ({ error: null }))
          }
        }
        if (table === 'profiles') {
          return { 
            update: vi.fn(() => ({ error: null })),
            eq: vi.fn(() => ({ error: null }))
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'canceled',
        cancel_at_period_end: false,
      })
    })
  })

  describe('Error Handling', () => {
    it('should return 500 and log error when database operation fails', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            subscription: 'sub_test',
            metadata: {
              user_id: 'test-user-id',
              plan: 'premium',
            },
          },
        },
      })

      mockStripe.subscriptions.retrieve.mockRejectedValue(new Error('Stripe API error'))

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500)
      expect(mockReportError).toHaveBeenCalled()
    })

    it('should handle unhandled event types gracefully', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'invoice.payment_succeeded', // Unhandled event type
        data: {
          object: {},
        },
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })
})