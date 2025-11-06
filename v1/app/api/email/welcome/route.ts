import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/client'
import { reportError } from '@/lib/utils/error-logger'

/**
 * API route to send welcome emails
 * This can be called directly or triggered by webhooks/notifications
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the request body
    const body = await request.json()
    const { user_id, email, full_name } = body

    // Validate required fields
    if (!user_id || !email) {
      return NextResponse.json(
        { error: 'user_id and email are required' },
        { status: 400 }
      )
    }

    // Verify the user exists and get their email preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check email preferences (if they exist)
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('marketing_emails')
      .eq('user_id', user_id)
      .single()

    // Skip if user has opted out of marketing emails
    if (emailPrefs && !emailPrefs.marketing_emails) {
      return NextResponse.json({
        success: true,
        message: 'User has opted out of marketing emails',
      })
    }

    // Send the welcome email
    const result = await sendWelcomeEmail(
      profile.email,
      full_name || profile.full_name || ''
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to send welcome email')
    }

    // Log successful email send
    await supabase.from('tool_usage').insert({
      user_id,
      tool_name: 'welcome_email_sent',
      is_api_tool: false,
      success: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    })

  } catch (error) {
    console.error('Welcome email error:', error)
    
    // Report error to monitoring
    reportError(error, {
      context: 'welcome_email_api',
      user_id: request.body?.user_id,
    })

    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check email service status
 */
export async function GET() {
  try {
    const { validateEmailConfig } = await import('@/lib/email/client')
    const validation = validateEmailConfig()

    return NextResponse.json({
      status: validation.valid ? 'ready' : 'not_configured',
      errors: validation.errors,
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: 'Failed to check email configuration' },
      { status: 500 }
    )
  }
}