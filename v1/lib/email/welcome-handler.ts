import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from './client'
import { reportError } from '@/lib/utils/error-logger'

/**
 * Check if user needs a welcome email and send it
 * This should be called when user first accesses the dashboard
 */
export async function handleWelcomeEmailIfNeeded(userId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Check if welcome email has already been sent
    const { data: existingEmail } = await supabase
      .from('tool_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('tool_name', 'welcome_email_sent')
      .single()

    // If email already sent, skip
    if (existingEmail) {
      return
    }

    // Get user profile and email preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.warn('Profile not found for welcome email:', userId)
      return
    }

    // Check email preferences
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('marketing_emails')
      .eq('user_id', userId)
      .single()

    // Skip if user has opted out of marketing emails
    if (emailPrefs && !emailPrefs.marketing_emails) {
      // Still log that we "sent" it (but skipped due to preferences)
      await supabase.from('tool_usage').insert({
        user_id: userId,
        tool_name: 'welcome_email_sent',
        is_api_tool: false,
        success: true,
      })
      return
    }

    // Send welcome email
    const result = await sendWelcomeEmail(profile.email, profile.full_name || '')

    // Log the result
    await supabase.from('tool_usage').insert({
      user_id: userId,
      tool_name: 'welcome_email_sent',
      is_api_tool: false,
      success: result.success,
      error_message: result.error || null,
    })

    if (!result.success) {
      console.error('Failed to send welcome email:', result.error)
    }

  } catch (error) {
    console.error('Welcome email handler error:', error)
    reportError(error, {
      context: 'welcome_email_handler',
      user_id: userId,
    })
  }
}

/**
 * Send welcome email immediately (for manual triggers)
 */
export async function sendWelcomeEmailNow(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' }
    }

    // Check email preferences
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('marketing_emails')
      .eq('user_id', userId)
      .single()

    // Skip if user has opted out
    if (emailPrefs && !emailPrefs.marketing_emails) {
      return { success: false, error: 'User has opted out of marketing emails' }
    }

    // Send welcome email
    const result = await sendWelcomeEmail(profile.email, profile.full_name || '')

    // Log the attempt
    await supabase.from('tool_usage').insert({
      user_id: userId,
      tool_name: 'welcome_email_manual',
      is_api_tool: false,
      success: result.success,
      error_message: result.error || null,
    })

    return result

  } catch (error) {
    console.error('Manual welcome email error:', error)
    reportError(error, {
      context: 'welcome_email_manual',
      user_id: userId,
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}