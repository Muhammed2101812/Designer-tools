/**
 * useAnalytics Hook
 *
 * React hook for tracking analytics events with automatic server-side persistence
 */

import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { AnalyticsEvent, EventProperties } from './events'
import { trackEvent as clientTrackEvent } from './track'

interface UseAnalyticsReturn {
  track: (event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) => void
  trackServer: (
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>
  ) => Promise<void>
}

/**
 * Hook for tracking analytics events
 *
 * @example
 * ```tsx
 * const { track } = useAnalytics()
 *
 * // Track client-side only (Plausible)
 * track('tool_opened', { tool_name: 'color-picker' })
 *
 * // Track server-side (Database)
 * await trackServer('tool_processing_completed', {
 *   tool_name: 'color-picker',
 *   processing_time_ms: 1234
 * })
 * ```
 */
export function useAnalytics(): UseAnalyticsReturn {
  const { user } = useAuthStore()

  /**
   * Track event client-side (Plausible)
   */
  const track = useCallback(
    (event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) => {
      // Track with Plausible
      clientTrackEvent(event, properties)

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 [Analytics]', event, properties)
      }
    },
    []
  )

  /**
   * Track event server-side (Database)
   * Use for important events that need to be persisted
   */
  const trackServer = useCallback(
    async (event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) => {
      try {
        // Track client-side first
        track(event, properties)

        // Send to server
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event,
            properties: {
              ...properties,
              user_id: user?.id,
              page_url: window.location.href,
              referrer: document.referrer,
            },
            timestamp: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          console.error('Failed to track event server-side:', event)
        }
      } catch (error) {
        console.error('Error tracking event:', error)
        // Don't throw - analytics errors shouldn't break the app
      }
    },
    [user, track]
  )

  return {
    track,
    trackServer,
  }
}
