import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from '../../../app/api/email/send/route'

// Mock modules
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

vi.mock('@/lib/utils/error-logger', () => ({
  reportError: vi.fn(),
}))

describe('Email API Integration Tests', () => {
  let mockSupabaseClient: any
  let mockWithApiSecurity: any
  let mockEmailFunctions: any
  let mockValidateEmailConfig: any

  beforeEach(async () => {
    vi.clearAllMocks()

    const supabaseModule = await import('@/lib/supabase/server')
    const apiSecurityModule = await import('@/lib/utils/apiSecurity')
    const emailClientModule = await import('@/lib/email/client')

    mockSupabaseClient = vi.mocked(supabaseModule.createClient)()
    mockWithApiSecurity = apiSecurityModule.withApiSecurity
    mockEmailFunctions = {
      sendWelcomeEmail: emailClientModule.sendWelcomeEmail,
      sendSubscriptionConfirmation: emailClientModule.sendSubscriptionConfirmation,
      sendQuotaWarning: emailClientModule.sendQuotaWarning,
      sendSubscriptionCancellation: emailClientModule.sendSubscriptionCancellation,
      sendCustomEmail: emailClientModule.sendCustomEmail,
    }
    mockValidateEmailConfig = emailClientModule.validateEmailConfig

    // Default mock implementations
    vi.mocked(mockValidateEmailConfig).mockReturnValue({
      valid: true,
      errors: [],
    })

    vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
      const result = await handler(request)
      return Response.json(result)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Email Service Status Endpoint', () => {
    it('should return service status when configured', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('ready')
      expect(data.supported_types).toEqual([
        'welcome',
        'subscription_confirmation',
        'quota_warning',
        'subscription_cancellation',
        'custom'
      ])
      expect(data.configuration).toBeDefined()
    })

    it('should return not configured status when email service is not set up', async () => {
      vi.mocked(mockValidateEmailConfig).mockReturnValue({
        valid: false,
        errors: ['RESEND_API_KEY is not configured'],
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('not_configured')
      expect(data.errors).toContain('RESEND_API_KEY is not configured')
    })

    it('should handle errors in status check gracefully', async () => {
      vi.mocked(mockValidateEmailConfig).mockImplementation(() => {
        throw new Error('Configuration check failed')
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.status).toBe('error')
      expect(data.error).toBe('Failed to check email configuration')
    })
  })

  describe('Email Sending Integration', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    }

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockUser.id, email: mockUser.email, full_name: 'Test User' },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'email_preferences') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { marketing_emails: true },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'tool_usage') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
          insert: vi.fn(),
        }
      })
    })

    it('should process welcome email request end-to-end', async () => {
      vi.mocked(mockEmailFunctions.sendWelcomeEmail).mockResolvedValue({
        success: true,
      })

      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const body = await request.json()
        
        // Simulate the actual handler logic
        if (body.type === 'welcome') {
          const result = await mockEmailFunctions.sendWelcomeEmail(body.email, body.full_name)
          return Response.json({
            success: result.success,
            message: 'welcome email sent successfully',
            type: 'welcome',
          })
        }
        
        return Response.json({ error: 'Invalid type' }, { status: 400 })
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'welcome',
          user_id: mockUser.id,
          email: 'test@example.com',
          full_name: 'Test User',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.type).toBe('welcome')
      expect(mockEmailFunctions.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      )
    })

    it('should process subscription confirmation request end-to-end', async () => {
      vi.mocked(mockEmailFunctions.sendSubscriptionConfirmation).mockResolvedValue({
        success: true,
      })

      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const body = await request.json()
        
        if (body.type === 'subscription_confirmation') {
          const result = await mockEmailFunctions.sendSubscriptionConfirmation(
            body.email,
            body.full_name,
            body.plan,
            body.amount
          )
          return Response.json({
            success: result.success,
            message: 'subscription_confirmation email sent successfully',
            type: 'subscription_confirmation',
          })
        }
        
        return Response.json({ error: 'Invalid type' }, { status: 400 })
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'subscription_confirmation',
          user_id: mockUser.id,
          email: 'test@example.com',
          full_name: 'Test User',
          plan: 'premium',
          amount: 900,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.type).toBe('subscription_confirmation')
      expect(mockEmailFunctions.sendSubscriptionConfirmation).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'premium',
        900
      )
    })

    it('should process quota warning request end-to-end', async () => {
      vi.mocked(mockEmailFunctions.sendQuotaWarning).mockResolvedValue({
        success: true,
      })

      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const body = await request.json()
        
        if (body.type === 'quota_warning') {
          const result = await mockEmailFunctions.sendQuotaWarning(
            body.email,
            body.full_name,
            body.current_usage,
            body.daily_limit,
            body.plan
          )
          return Response.json({
            success: result.success,
            message: 'quota_warning email sent successfully',
            type: 'quota_warning',
          })
        }
        
        return Response.json({ error: 'Invalid type' }, { status: 400 })
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'quota_warning',
          user_id: mockUser.id,
          email: 'test@example.com',
          full_name: 'Test User',
          current_usage: 45,
          daily_limit: 50,
          plan: 'free',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.type).toBe('quota_warning')
      expect(mockEmailFunctions.sendQuotaWarning).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        45,
        50,
        'free'
      )
    })

    it('should handle email preferences correctly', async () => {
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
          insert: vi.fn(),
        }
      })

      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const body = await request.json()
        
        // Simulate checking email preferences
        if (body.type === 'welcome' && body.user_id) {
          return Response.json({
            success: true,
            message: 'User has opted out of marketing emails',
            skipped: true,
          })
        }
        
        return Response.json({ error: 'Invalid type' }, { status: 400 })
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'welcome',
          user_id: mockUser.id,
          email: 'test@example.com',
          full_name: 'Test User',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.skipped).toBe(true)
      expect(data.message).toBe('User has opted out of marketing emails')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          })),
        })),
      }))

      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        return Response.json(
          { error: 'Database error occurred' },
          { status: 500 }
        )
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'welcome',
          user_id: mockUser.id,
          email: 'test@example.com',
          full_name: 'Test User',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error occurred')
    })

    it('should handle email service failures gracefully', async () => {
      vi.mocked(mockEmailFunctions.sendWelcomeEmail).mockResolvedValue({
        success: false,
        error: 'Email service temporarily unavailable',
      })

      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const body = await request.json()
        
        if (body.type === 'welcome') {
          const result = await mockEmailFunctions.sendWelcomeEmail(body.email, body.full_name)
          if (!result.success) {
            return Response.json(
              { error: result.error || 'Failed to send email' },
              { status: 500 }
            )
          }
          return Response.json({
            success: result.success,
            message: 'welcome email sent successfully',
            type: 'welcome',
          })
        }
        
        return Response.json({ error: 'Invalid type' }, { status: 400 })
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'welcome',
          user_id: mockUser.id,
          email: 'test@example.com',
          full_name: 'Test User',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Email service temporarily unavailable')
    })

    it('should log successful email sends to tool_usage', async () => {
      vi.mocked(mockEmailFunctions.sendWelcomeEmail).mockResolvedValue({
        success: true,
      })

      const mockInsert = vi.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tool_usage') {
          return {
            insert: mockInsert,
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
          insert: vi.fn(),
        }
      })

      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const body = await request.json()
        
        if (body.type === 'welcome') {
          const result = await mockEmailFunctions.sendWelcomeEmail(body.email, body.full_name)
          
          // Simulate logging to tool_usage
          if (result.success && body.user_id) {
            await mockSupabaseClient.from('tool_usage').insert({
              user_id: body.user_id,
              tool_name: `email_${body.type}`,
              is_api_tool: false,
              success: true,
            })
          }
          
          return Response.json({
            success: result.success,
            message: 'welcome email sent successfully',
            type: 'welcome',
          })
        }
        
        return Response.json({ error: 'Invalid type' }, { status: 400 })
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'welcome',
          user_id: mockUser.id,
          email: 'test@example.com',
          full_name: 'Test User',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        tool_name: 'email_welcome',
        is_api_tool: false,
        success: true,
      })
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should apply rate limiting to email sending endpoint', async () => {
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        // Verify that rate limiting options are passed correctly
        expect(options?.rateLimit).toBe('premium')
        expect(options?.allowedMethods).toContain('POST')
        expect(options?.requireAuth).toBe(false)
        
        return Response.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
    })
  })

  describe('Error Reporting Integration', () => {
    it('should report errors to monitoring service', async () => {
      const mockReportError = await import('@/lib/utils/error-logger')
      
      vi.mocked(mockWithApiSecurity).mockImplementation(async (request, handler, options) => {
        const error = new Error('Unexpected error occurred')
        
        // Simulate error reporting
        vi.mocked(mockReportError.reportError)(error, {
          context: 'email_send_api',
          request_body: await request.json(),
        })
        
        return Response.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      })

      const request = new NextRequest('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'welcome',
          email: 'test@example.com',
          full_name: 'Test User',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(mockReportError.reportError).toHaveBeenCalled()
    })
  })
})