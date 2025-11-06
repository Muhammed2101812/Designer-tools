'use client'

import { useEffect } from 'react'

/**
 * Component that triggers welcome email check when dashboard loads
 * This runs client-side to avoid blocking server-side rendering
 */
export function WelcomeEmailTrigger() {
  useEffect(() => {
    // Trigger welcome email check on first dashboard visit
    const triggerWelcomeEmail = async () => {
      try {
        const response = await fetch('/api/email/welcome-trigger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          
          if (result.success && !result.already_sent && !result.skipped) {
            console.log('Welcome email sent successfully')
          }
        }
      } catch (error) {
        // Silently fail - welcome email is not critical for dashboard functionality
        console.warn('Failed to trigger welcome email:', error)
      }
    }

    // Delay the trigger to avoid blocking initial render and only in production
    if (process.env.NODE_ENV === 'production') {
      const timer = setTimeout(triggerWelcomeEmail, 5000)
      return () => clearTimeout(timer)
    }

  }, [])

  // This component doesn't render anything
  return null
}