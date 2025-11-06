'use server'

import { handleWelcomeEmailIfNeeded } from '@/lib/email/welcome-handler'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server action to handle welcome email when user visits dashboard
 */
export async function handleDashboardVisit() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Handle welcome email if needed (non-blocking)
    handleWelcomeEmailIfNeeded(user.id).catch(error => {
      console.error('Welcome email error (non-blocking):', error)
    })

    return { success: true }
  } catch (error) {
    console.error('Dashboard visit error:', error)
    return { success: false, error: 'Failed to process dashboard visit' }
  }
}

/**
 * Server action to manually trigger welcome email
 */
export async function triggerWelcomeEmail() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { sendWelcomeEmailNow } = await import('@/lib/email/welcome-handler')
    const result = await sendWelcomeEmailNow(user.id)

    return result
  } catch (error) {
    console.error('Manual welcome email error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}