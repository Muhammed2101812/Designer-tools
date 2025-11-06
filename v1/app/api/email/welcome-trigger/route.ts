import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportError } from '@/lib/utils/error-logger'

/**
 * API route to trigger welcome email for users who haven't received one yet
 * This is called when users first access the dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if welcome email has already been sent
    const { data: existingEmail } = await supabase
      .from('tool_usage')
      .select('id')
      .eq('user_id', user.id)
      .in('tool_name', ['welcome_email_sent', 'welcome_email_triggered'])
      .single()

    // If email already sent, return success without sending again
    if (existingEmail) {
      return NextResponse.json({ 
        success: true, 
        message: 'Welcome email already sent',
        already_sent: true 
      })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check email preferences
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('marketing_emails')
      .eq('user_id', user.id)
      .single()

    // Skip if user has opted out of marketing emails
    if (emailPrefs && !emailPrefs.marketing_emails) {
      // Log that we skipped due to preferences
      await supabase.from('tool_usage').insert({
        user_id: user.id,
        tool_name: 'welcome_email_skipped',
        is_api_tool: false,
        success: true,
        metadata: { reason: 'opted_out_marketing' }
      })

      return NextResponse.json({
        success: true,
        message: 'User has opted out of marketing emails',
        skipped: true,
      })
    }

    // Send welcome email via internal API
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'welcome',
        user_id: user.id,
        email: profile.email,
        full_name: profile.full_name || '',
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Email API error: ${errorText}`)
    }

    const emailResult = await emailResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
      email_result: emailResult,
    })

  } catch (error) {
    console.error('Welcome email trigger error:', error)
    
    reportError(error as Error, {
      context: 'welcome_email_trigger',
      user_id: request.headers.get('user-id') || 'unknown',
    })

    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check welcome email status for current user
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if welcome email has been sent
    const { data: emailHistory } = await supabase
      .from('tool_usage')
      .select('tool_name, created_at, success, metadata')
      .eq('user_id', user.id)
      .in('tool_name', [
        'welcome_email_sent', 
        'welcome_email_triggered', 
        'welcome_email_skipped',
        'welcome_email_queued'
      ])
      .order('created_at', { ascending: false })

    const hasWelcomeEmail = emailHistory && emailHistory.length > 0
    const latestEmail = emailHistory?.[0]

    return NextResponse.json({
      has_welcome_email: hasWelcomeEmail,
      latest_email: latestEmail,
      email_history: emailHistory,
    })

  } catch (error) {
    console.error('Welcome email status check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check welcome email status' },
      { status: 500 }
    )
  }
}