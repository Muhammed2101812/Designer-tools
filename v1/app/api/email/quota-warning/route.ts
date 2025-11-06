import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportError } from '@/lib/utils/error-logger'
import { z } from 'zod'

// Schema for manual quota warning requests
const quotaWarningSchema = z.object({
  user_id: z.string().uuid().optional(), // If not provided, check current user
  force: z.boolean().default(false), // Force send even if already sent today
})

/**
 * API route to send quota warning emails
 * Can be called manually for specific users or to check current user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { user_id, force } = quotaWarningSchema.parse(body)

    let targetUserId: string

    if (user_id) {
      // Admin/system request for specific user - verify permissions
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // For now, allow any authenticated user to trigger for themselves
      // In production, you might want to add admin role checking here
      targetUserId = user_id
    } else {
      // Request for current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      targetUserId = user.id
    }

    // Get user profile and current usage
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, plan')
      .eq('id', targetUserId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get current usage for today
    const { data: dailyLimit } = await supabase
      .from('daily_limits')
      .select('api_tools_count')
      .eq('user_id', targetUserId)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    const currentUsage = dailyLimit?.api_tools_count || 0

    // Determine daily limit based on plan
    const planLimits = {
      free: 10,
      premium: 500,
      pro: 2000,
    }

    const dailyLimitValue = planLimits[profile.plan as keyof typeof planLimits] || 10
    const percentage = (currentUsage / dailyLimitValue) * 100

    // Check if warning should be sent (>= 90% usage)
    if (percentage < 90 && !force) {
      return NextResponse.json({
        success: false,
        message: 'Quota warning not needed',
        current_usage: currentUsage,
        daily_limit: dailyLimitValue,
        percentage: Math.round(percentage),
        threshold: 90,
      })
    }

    // Check if already sent today (unless forced)
    if (!force) {
      const { data: existingWarning } = await supabase
        .from('tool_usage')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('tool_name', 'quota_warning_sent')
        .gte('created_at', new Date().toISOString().split('T')[0])
        .single()

      if (existingWarning) {
        return NextResponse.json({
          success: false,
          message: 'Quota warning already sent today',
          already_sent: true,
        })
      }
    }

    // Check email preferences
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('quota_warnings')
      .eq('user_id', targetUserId)
      .single()

    if (emailPrefs && !emailPrefs.quota_warnings) {
      // Log that we skipped due to preferences
      await supabase.from('tool_usage').insert({
        user_id: targetUserId,
        tool_name: 'quota_warning_skipped',
        is_api_tool: false,
        success: true,
        metadata: { 
          reason: 'opted_out_quota_warnings',
          current_usage: currentUsage,
          daily_limit: dailyLimitValue,
          percentage: Math.round(percentage)
        }
      })

      return NextResponse.json({
        success: true,
        message: 'User has opted out of quota warnings',
        skipped: true,
      })
    }

    // Send quota warning email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'quota_warning',
        user_id: targetUserId,
        email: profile.email,
        full_name: profile.full_name || '',
        current_usage: currentUsage,
        daily_limit: dailyLimitValue,
        plan: profile.plan,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Email API error: ${errorText}`)
    }

    const emailResult = await emailResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Quota warning email sent successfully',
      current_usage: currentUsage,
      daily_limit: dailyLimitValue,
      percentage: Math.round(percentage),
      email_result: emailResult,
    })

  } catch (error) {
    console.error('Quota warning email error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    reportError(error as Error, {
      context: 'quota_warning_email',
      request_body: await request.text(),
    })

    return NextResponse.json(
      { error: 'Failed to send quota warning email' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check quota status and warning eligibility
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get current usage for today
    const { data: dailyLimit } = await supabase
      .from('daily_limits')
      .select('api_tools_count')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    const currentUsage = dailyLimit?.api_tools_count || 0

    // Determine daily limit based on plan
    const planLimits = {
      free: 10,
      premium: 500,
      pro: 2000,
    }

    const dailyLimitValue = planLimits[profile.plan as keyof typeof planLimits] || 10
    const percentage = (currentUsage / dailyLimitValue) * 100

    // Check if warning was already sent today
    const { data: warningHistory } = await supabase
      .from('tool_usage')
      .select('tool_name, created_at, success, metadata')
      .eq('user_id', user.id)
      .in('tool_name', ['quota_warning_sent', 'quota_warning_skipped'])
      .gte('created_at', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    const hasWarningToday = warningHistory && warningHistory.length > 0

    return NextResponse.json({
      current_usage: currentUsage,
      daily_limit: dailyLimitValue,
      percentage: Math.round(percentage),
      plan: profile.plan,
      warning_threshold: 90,
      needs_warning: percentage >= 90,
      warning_sent_today: hasWarningToday,
      warning_history: warningHistory,
    })

  } catch (error) {
    console.error('Quota status check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check quota status' },
      { status: 500 }
    )
  }
}