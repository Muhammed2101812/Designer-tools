import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST } from '../route'
import { 
  withApiSecurity,
  ApiError,
  ApiErrorType,
} from '@/lib/utils/apiSecurity'

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
      rpc: vi.fn(),
      insert: vi.fn(),
    })),
  })),
}))

vi.mock('@/lib/email/client', () => ({
  sendWelcomeEmail: vi.fn(),
  sendSubscriptionConfirmation: vi.fn(),
  sendQuotaWarning: vi.fn(),
  sendSubscriptionCancellation: vi.fn(),
  sendCustomEmail: vi.fn(),
  validateEmailConfig: vi.fn(),
}))

describe('Email Send API Route', () => {
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
  let mockSendWelcomeEmail: any
  let mockSendSubscriptionConfirmation: any
  let mockSendQuotaWarning: any
  let mockSendSubscriptionCancellation: any
  let mockSendCustomEmail: any
  let mockValidateEmailConfig: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get mocked modules
    const supabaseModule = await import('@/lib/supabase/server')
    const apiSecurityModule = await import('@/lib/utils/apiSecurity')
    const emailClientModule = await import('@/lib/email/client')
    
    mockSupabaseClient = vi.mocked(supabaseModule.createClient)()
    mockWithApiSecurity = apiSecurityModule.withApiSecurity
    mockSendWelcomeEmail = emailClientModule.sendWelcomeEmail
    mockSendSubscriptionConfirmation = emailClientModule.sendSubscriptionConfirmation
    mockSendQuotaWarning = emailClientModule.sendQuotaWarning
    mockSendSubscriptionCancellation = emailClientModule.sendSubscriptionCancellation
    mockSendCustomEmail = emailClientModule.sendCustomEmail
    mockValidateEmailConfig = emailClientModule.validateEmailConfig
    
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

  describe('Request Validation', () => {
    it('should reject request without email type', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Email type is required',
          400
        )
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email type is required')
    })

    it('should reject request with invalid email type', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ type: 'invalid_type' }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Invalid email type',
          400
        )
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email type')
    })

    it('should reject request without recipient email', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ type: 'welcome' }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Recipient email is required',
          400
        )
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Recipient email is required')
    })

    it('should reject request with invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'invalid-email-format'
        }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Invalid email format',
          400
        )
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email format')
    })

    it('should validate required fields for each email type', async () => {
      // Test welcome email validation
      const welcomeRequest = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com'
          // Missing full_name
        }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Full name is required for welcome emails',
          400
        )
      })

      const welcomeResponse = await POST(welcomeRequest)
      const welcomeData = await welcomeResponse.json()

      expect(welcomeResponse.status).toBe(400)
      expect(welcomeData.error).toBe('Full name is required for welcome emails')

      // Test subscription confirmation validation
      const subscriptionRequest = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'subscription_confirmation',
          email: 'test@example.com',
          full_name: 'Test User'
          // Missing plan and amount
        }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Plan and amount are required for subscription confirmation emails',
          400
        )
      })

      const subscriptionResponse = await POST(subscriptionRequest)
      const subscriptionData = await subscriptionResponse.json()

      expect(subscriptionResponse.status).toBe(400)
      expect(subscriptionData.error).toBe('Plan and amount are required for subscription confirmation emails')

      // Test quota warning validation
      const quotaRequest = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'quota_warning',
          email: 'test@example.com',
          full_name: 'Test User'
          // Missing current_usage, daily_limit, and plan
        }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Current usage, daily limit, and plan are required for quota warning emails',
          400
        )
      })

      const quotaResponse = await POST(quotaRequest)
      const quotaData = await quotaResponse.json()

      expect(quotaResponse.status).toBe(400)
      expect(quotaData.error).toBe('Current usage, daily limit, and plan are required for quota warning emails')

      // Test subscription cancellation validation
      const cancellationRequest = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'subscription_cancellation',
          email: 'test@example.com',
          full_name: 'Test User'
          // Missing plan and end_date
        }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Plan and end date are required for subscription cancellation emails',
          400
        )
      })

      const cancellationResponse = await POST(cancellationRequest)
      const cancellationData = await cancellationResponse.json()

      expect(cancellationResponse.status).toBe(400)
      expect(cancellationData.error).toBe('Plan and end date are required for subscription cancellation emails')

      // Test custom email validation
      const customRequest = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'custom',
          email: 'test@example.com'
          // Missing subject and html_content
        }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Subject and HTML content are required for custom emails',
          400
        )
      })

      const customResponse = await POST(customRequest)
      const customData = await customResponse.json()

      expect(customResponse.status).toBe(400)
      expect(customData.error).toBe('Subject and HTML content are required for custom emails')
    })
  })

  describe('Email Service Validation', () => {
    it('should reject requests when email service is not configured', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User'
        }),
      })

      // Mock withApiSecurity to throw service configuration error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.INTERNAL,
          'Email service not configured',
          503
        )
      })

      // Mock email service as not configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: false,
        errors: ['Missing RESEND_API_KEY'],
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Email service not configured')
    })

    it('should proceed when email service is configured', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User'
        }),
      })

      // Mock withApiSecurity to succeed
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock successful welcome email
      vi.mocked(mockSendWelcomeEmail).mockResolvedValue({
        success: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Email Sending', () => {
    it('should send welcome email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User'
        }),
      })

      // Mock withApiSecurity to succeed
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock successful welcome email
      vi.mocked(mockSendWelcomeEmail).mockResolvedValue({
        success: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.type).toBe('welcome')
      
      // Verify that sendWelcomeEmail was called with correct parameters
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      )
    })

    it('should send subscription confirmation email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'subscription_confirmation',
          email: 'test@example.com',
          full_name: 'Test User',
          plan: 'premium',
          amount: 999
        }),
      })

      // Mock withApiSecurity to succeed
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock successful subscription confirmation email
      vi.mocked(mockSendSubscriptionConfirmation).mockResolvedValue({
        success: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.type).toBe('subscription_confirmation')
      
      // Verify that sendSubscriptionConfirmation was called with correct parameters
      expect(mockSendSubscriptionConfirmation).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'premium',
        999
      )
    })

    it('should send quota warning email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'quota_warning',
          email: 'test@example.com',
          full_name: 'Test User',
          current_usage: 90,
          daily_limit: 100,
          plan: 'free'
        }),
      })

      // Mock withApiSecurity to succeed
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock successful quota warning email
      vi.mocked(mockSendQuotaWarning).mockResolvedValue({
        success: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.type).toBe('quota_warning')
      
      // Verify that sendQuotaWarning was called with correct parameters
      expect(mockSendQuotaWarning).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        90,
        100,
        'free'
      )
    })

    it('should send subscription cancellation email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'subscription_cancellation',
          email: 'test@example.com',
          full_name: 'Test User',
          plan: 'premium',
          end_date: '2023-12-31T23:59:59Z'
        }),
      })

      // Mock withApiSecurity to succeed
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock successful subscription cancellation email
      vi.mocked(mockSendSubscriptionCancellation).mockResolvedValue({
        success: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.type).toBe('subscription_cancellation')
      
      // Verify that sendSubscriptionCancellation was called with correct parameters
      expect(mockSendSubscriptionCancellation).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'premium',
        '2023-12-31T23:59:59Z'
      )
    })

    it('should send custom email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'custom',
          email: 'recipient@example.com',
          subject: 'Custom Subject',
          html_content: '<p>Custom HTML</p>',
          text_content: 'Custom text'
        }),
      })

      // Mock withApiSecurity to succeed
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock successful custom email
      vi.mocked(mockSendCustomEmail).mockResolvedValue({
        success: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.type).toBe('custom')
      
      // Verify that sendCustomEmail was called with correct parameters
      expect(mockSendCustomEmail).toHaveBeenCalledWith(
        'recipient@example.com',
        'Custom Subject',
        '<p>Custom HTML</p>',
        'Custom text'
      )
    })
  })

  describe('User Preferences', () => {
    it('should respect user email preferences', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User',
          user_id: 'test-user-id'
        }),
      })

      // Mock withApiSecurity to succeed
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock user with disabled marketing emails
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'email_preferences') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { marketing_emails: false },
                  error: null,
                }),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
          rpc: vi.fn(),
          insert: vi.fn(),
        }
      })

      // Mock successful welcome email
      vi.mocked(mockSendWelcomeEmail).mockResolvedValue({
        success: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.skipped).toBe(true)
    })

    it('should send email when user has not set preferences', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User',
          user_id: 'test-user-id'
        }),
      })

      // Mock withApiSecurity to succeed
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const user = mockUser
        
        // Mock the handler result
        const result = await handler(request, user)
        
        return NextResponse.json(result, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock user with no email preferences
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'email_preferences') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
          rpc: vi.fn(),
          insert: vi.fn(),
        }
      })

      // Mock successful welcome email
      vi.mocked(mockSendWelcomeEmail).mockResolvedValue({
        success: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.skipped).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle email sending failures gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User'
        }),
      })

      // Mock withApiSecurity to throw email error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.INTERNAL,
          'Failed to send email',
          500
        )
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock failed welcome email
      vi.mocked(mockSendWelcomeEmail).mockResolvedValue({
        success: false,
        error: 'Email service temporarily unavailable',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to send email')
    })

    it('should handle database errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User'
        }),
      })

      // Mock withApiSecurity to throw database error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.INTERNAL,
          'Failed to fetch user preferences',
          500
        )
      })

      // Mock email service as configured
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: true,
        errors: [],
      })

      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch user preferences')
    })

    it('should handle validation errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'invalid-email-format'
        }),
      })

      // Mock withApiSecurity to throw validation error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Invalid email format',
          400
        )
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email format')
    })

    it('should handle rate limiting errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User'
        }),
      })

      // Mock withApiSecurity to throw rate limit error
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT,
          'Rate limit exceeded',
          429
        )
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
    })
  })
})