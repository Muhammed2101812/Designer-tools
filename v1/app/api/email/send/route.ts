import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  sendWelcomeEmail, 
  sendSubscriptionConfirmation, 
  sendQuotaWarning, 
  sendSubscriptionCancellation,
  sendCustomEmail,
  validateEmailConfig 
} from '@/lib/email/client'
import { reportError } from '@/lib/utils/error-logger'
import { z } from 'zod'
import {
  withApiSecurity,
  ApiError,
  ApiErrorType,
} from '@/lib/utils/apiSecurity'

// Email type schemas for validation
const welcomeEmailSchema = z.object({
  type: z.literal('welcome'),
  user_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().optional(),
})

const subscriptionConfirmationSchema = z.object({
  type: z.literal('subscription_confirmation'),
  user_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().optional(),
  plan: z.enum(['premium', 'pro']),
  amount: z.number().positive(),
})

const quotaWarningSchema = z.object({
  type: z.literal('quota_warning'),
  user_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().optional(),
  current_usage: z.number().min(0),
  daily_limit: z.number().positive(),
  plan: z.enum(['free', 'premium', 'pro']),
})

const subscriptionCancellationSchema = z.object({
  type: z.literal('subscription_cancellation'),
  user_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().optional(),
  plan: z.enum(['premium', 'pro']),
  end_date: z.string().datetime(),
})

const customEmailSchema = z.object({
  type: z.literal('custom'),
  user_id: z.string().uuid().optional(),
  email: z.string().email(),
  subject: z.string().min(1),
  html_content: z.string().min(1),
  text_content: z.string().optional(),
})

const emailRequestSchema = z.discriminatedUnion('type', [
  welcomeEmailSchema,
  subscriptionConfirmationSchema,
  quotaWarningSchema,
  subscriptionCancellationSchema,
  customEmailSchema,
])

/**
 * API route to send different types of emails
 * Supports: welcome, subscription_confirmation, quota_warning, subscription_cancellation, custom
 */
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req) => {
      try {
        const supabase = await createClient()
        
        // Parse and validate request body
        const body = await req.json()
        const emailRequest = emailRequestSchema.parse(body)

        // Check email service configuration
        const emailConfig = validateEmailConfig()
        if (!emailConfig.valid) {
          throw new ApiError(
            ApiErrorType.INTERNAL,
            'Email service not configured',
            503,
            { errors: emailConfig.errors }
          )
        }

        // Verify user exists (except for custom emails without user_id)
        if (emailRequest.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', emailRequest.user_id)
            .single()

          if (profileError || !profile) {
            throw new ApiError(
              ApiErrorType.NOT_FOUND,
              'User not found',
              404
            )
          }

          // Check email preferences for marketing emails (welcome, quota warnings)
          if (emailRequest.type === 'welcome' || emailRequest.type === 'quota_warning') {
            try {
              const { data: emailPrefs } = await supabase
                .from('email_preferences' as any)
                .select('marketing_emails')
                .eq('user_id', emailRequest.user_id)
                .single()

              // Skip if user has opted out of marketing emails
              if (emailPrefs && (emailPrefs as any).marketing_emails === false) {
                return {
                  success: true,
                  message: 'User has opted out of marketing emails',
                  skipped: true,
                }
              }
            } catch (error) {
              // If email_preferences table doesn't exist or there's an error, continue with sending
              console.warn('Could not check email preferences:', error)
            }
          }
        }

        let result: { success: boolean; error?: string }

        // Route to appropriate email function based on type
        switch (emailRequest.type) {
          case 'welcome':
            result = await sendWelcomeEmail(
              emailRequest.email,
              emailRequest.full_name || ''
            )
            break

          case 'subscription_confirmation':
            result = await sendSubscriptionConfirmation(
              emailRequest.email,
              emailRequest.full_name || '',
              emailRequest.plan,
              emailRequest.amount
            )
            break

          case 'quota_warning':
            result = await sendQuotaWarning(
              emailRequest.email,
              emailRequest.full_name || '',
              emailRequest.current_usage,
              emailRequest.daily_limit,
              emailRequest.plan
            )
            break

          case 'subscription_cancellation':
            result = await sendSubscriptionCancellation(
              emailRequest.email,
              emailRequest.full_name || '',
              emailRequest.plan,
              emailRequest.end_date
            )
            break

          case 'custom':
            result = await sendCustomEmail(
              emailRequest.email,
              emailRequest.subject,
              emailRequest.html_content,
              emailRequest.text_content
            )
            break

          default:
            throw new ApiError(
              ApiErrorType.VALIDATION,
              'Invalid email type',
              400
            )
        }

        if (!result.success) {
          throw new ApiError(
            ApiErrorType.INTERNAL,
            result.error || 'Failed to send email',
            500
          )
        }

        // Log successful email send (if user_id is available)
        if (emailRequest.user_id) {
          await supabase.from('tool_usage').insert({
            user_id: emailRequest.user_id,
            tool_name: `email_${emailRequest.type}`,
            is_api_tool: false,
            success: true,
          })
        }

        return {
          success: true,
          message: `${emailRequest.type} email sent successfully`,
          type: emailRequest.type,
        }

      } catch (error) {
        console.error('Email send error:', error)
        
        // Handle validation errors
        if (error instanceof z.ZodError) {
          throw new ApiError(
            ApiErrorType.VALIDATION,
            'Invalid request data',
            400,
            { 
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
              }))
            }
          )
        }

        // Report error to monitoring
        reportError(error as Error, {
          context: 'email_send_api',
          request_body: req.body,
        })

        throw new ApiError(
          ApiErrorType.INTERNAL,
          'Failed to send email',
          500
        )
      }
    },
    {
      requireAuth: false, // This is an internal API endpoint
      allowedMethods: ['POST'],
      rateLimit: 'premium', // User-based rate limiting (30 requests/minute)
      errorContext: { endpoint: 'email-send' }
    }
  )
}

/**
 * GET endpoint to check email service status and supported types
 */
export async function GET() {
  try {
    const emailConfig = validateEmailConfig()

    const supportedTypes = [
      'welcome',
      'subscription_confirmation', 
      'quota_warning',
      'subscription_cancellation',
      'custom'
    ]

    return NextResponse.json({
      status: emailConfig.valid ? 'ready' : 'not_configured',
      errors: emailConfig.errors,
      supported_types: supportedTypes,
      configuration: {
        resend_configured: !!process.env.RESEND_API_KEY,
        from_email_configured: !!process.env.EMAIL_FROM,
      }
    })
  } catch (error) {
    console.error('Email status check error:', error)
    
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Failed to check email configuration' 
      },
      { status: 500 }
    )
  }
}