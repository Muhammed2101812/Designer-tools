import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportError } from '@/lib/utils/error-logger'

/**
 * Cron job endpoint to check and send quota warnings for all users
 * This should be called periodically (e.g., every hour) by an external cron service
 * 
 * Security: Uses a cron secret to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.warn('CRON_SECRET not configured, skipping cron job')
      return NextResponse.json({ error: 'Cron not configured' }, { status: 503 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get all users who have used API tools today and might need warnings
    const today = new Date().toISOString().split('T')[0]
    
    const { data: usersWithUsage, error: usageError } = await supabase
      .from('daily_limits')
      .select(`
        user_id,
        api_tools_count,
        profiles!inner(plan, email, full_name)
      `)
      .eq('date', today)
      .gt('api_tools_count', 0)

    if (usageError) {
      throw new Error(`Failed to fetch user usage: ${usageError.message}`)
    }

    if (!usersWithUsage || usersWithUsage.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with API usage today',
        users_checked: 0,
        warnings_sent: 0,
      })
    }

    let warningsSent = 0
    let usersChecked = 0
    const errors: string[] = []

    // Check each user for quota warnings
    for (const userUsage of usersWithUsage) {
      try {
        usersChecked++
        
        const profile = (userUsage as any).profiles
        const currentUsage = userUsage.api_tools_count
        
        // Determine daily limit based on plan
        const planLimits = {
          free: 10,
          premium: 500,
          pro: 2000,
        }

        const dailyLimit = planLimits[profile.plan as keyof typeof planLimits] || 10
        const percentage = (currentUsage / dailyLimit) * 100

        // Skip if usage is below warning threshold
        if (percentage < 90) {
          continue
        }

        // Check if warning was already sent today
        const { data: existingWarning } = await supabase
          .from('tool_usage')
          .select('id')
          .eq('user_id', userUsage.user_id)
          .eq('tool_name', 'quota_warning_sent')
          .gte('created_at', today)
          .single()

        if (existingWarning) {
          continue // Already sent warning today
        }

        // Check email preferences
        const { data: emailPrefs } = await supabase
          .from('email_preferences')
          .select('quota_warnings')
          .eq('user_id', userUsage.user_id)
          .single()

        if (emailPrefs && !emailPrefs.quota_warnings) {
          // Log that we skipped due to preferences
          await supabase.from('tool_usage').insert({
            user_id: userUsage.user_id,
            tool_name: 'quota_warning_skipped',
            is_api_tool: false,
            success: true,
            metadata: { 
              reason: 'opted_out_quota_warnings',
              current_usage: currentUsage,
              daily_limit: dailyLimit,
              percentage: Math.round(percentage),
              cron_job: true
            }
          })
          continue
        }

        // Send quota warning email
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'quota_warning',
            user_id: userUsage.user_id,
            email: profile.email,
            full_name: profile.full_name || '',
            current_usage: currentUsage,
            daily_limit: dailyLimit,
            plan: profile.plan,
          }),
        })

        if (emailResponse.ok) {
          warningsSent++
          console.log(`Quota warning sent to user ${userUsage.user_id} (${percentage.toFixed(1)}% usage)`)
        } else {
          const errorText = await emailResponse.text()
          errors.push(`Failed to send warning to ${userUsage.user_id}: ${errorText}`)
        }

      } catch (error) {
        const errorMsg = `Error processing user ${userUsage.user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Log summary
    console.log(`Quota warning cron job completed: ${usersChecked} users checked, ${warningsSent} warnings sent`)

    if (errors.length > 0) {
      console.error('Quota warning cron job errors:', errors)
    }

    return NextResponse.json({
      success: true,
      message: 'Quota warning cron job completed',
      users_checked: usersChecked,
      warnings_sent: warningsSent,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('Quota warning cron job failed:', error)
    
    reportError(error as Error, {
      context: 'quota_warning_cron_job',
    })

    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check cron job status and configuration
 */
export async function GET() {
  try {
    const cronSecret = process.env.CRON_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    return NextResponse.json({
      status: 'ready',
      cron_configured: !!cronSecret,
      app_url_configured: !!appUrl,
      endpoint: '/api/cron/quota-warnings',
      method: 'POST',
      auth_header: 'Bearer <CRON_SECRET>',
      recommended_schedule: 'Every hour or every 4 hours',
    })

  } catch (error) {
    console.error('Cron status check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check cron status' },
      { status: 500 }
    )
  }
}