/**
 * Analytics Tracking Functions
 *
 * Provides functions to track events both client-side (Plausible) and server-side (Database).
 */

import { AnalyticsEvent, EventProperties, getEventCategory } from './events'

// ============================================
// Client-side Tracking (Plausible)
// ============================================

/**
 * Track event in Plausible Analytics (client-side)
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>
): void {
  // Only track in browser environment
  if (typeof window === 'undefined') {
    return
  }

  // Check if Plausible is loaded
  if (typeof window.plausible === 'undefined') {
    console.warn('Plausible not loaded, event not tracked:', event)
    return
  }

  try {
    // Track event with Plausible
    window.plausible(event, {
      props: properties as Record<string, string | number>,
    })

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, properties)
    }
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

/**
 * Track page view (automatic in Plausible, but useful for SPAs)
 */
export function trackPageView(url?: string): void {
  if (typeof window === 'undefined') return

  const pageUrl = url || window.location.pathname + window.location.search

  trackEvent('pageview' as AnalyticsEvent, {
    url: pageUrl,
  })
}

// ============================================
// Tool Usage Tracking
// ============================================

/**
 * Track tool opened
 */
export function trackToolOpened(toolName: string): void {
  trackEvent('tool_opened', {
    tool_name: toolName,
  })
}

/**
 * Track file upload
 */
export function trackFileUpload(toolName: string, fileSizeMb: number, fileType: string): void {
  trackEvent('tool_file_uploaded', {
    tool_name: toolName,
    file_size_mb: fileSizeMb,
    file_type: fileType,
  })
}

/**
 * Track processing started
 */
export function trackProcessingStarted(toolName: string): void {
  trackEvent('tool_processing_started', {
    tool_name: toolName,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track processing completed
 */
export function trackProcessingCompleted(
  toolName: string,
  processingTimeMs: number,
  success: boolean
): void {
  trackEvent(success ? 'tool_processing_completed' : 'tool_processing_failed', {
    tool_name: toolName,
    processing_time_ms: processingTimeMs,
    success,
  })
}

/**
 * Track download
 */
export function trackDownload(toolName: string, fileType: string): void {
  trackEvent('tool_download', {
    tool_name: toolName,
    file_type: fileType,
  })
}

// ============================================
// User Events
// ============================================

/**
 * Track user signup
 */
export function trackSignup(method: 'email' | 'google' | 'github'): void {
  trackEvent('user_signup', {
    method,
  })
}

/**
 * Track user login
 */
export function trackLogin(method: 'email' | 'google' | 'github'): void {
  trackEvent('user_login', {
    method,
  })
}

/**
 * Track profile update
 */
export function trackProfileUpdate(fields: string[]): void {
  trackEvent('profile_updated', {
    fields_updated: fields.join(','),
  })
}

// ============================================
// Subscription Events
// ============================================

/**
 * Track pricing page view
 */
export function trackPricingPageView(): void {
  trackEvent('pricing_page_viewed')
}

/**
 * Track upgrade button click
 */
export function trackUpgradeClick(plan: 'premium' | 'pro', location: string): void {
  trackEvent('upgrade_button_clicked', {
    plan,
    location, // e.g., 'pricing_page', 'tool_page', 'quota_warning'
  })
}

/**
 * Track checkout started
 */
export function trackCheckoutStarted(plan: 'premium' | 'pro', price: number): void {
  trackEvent('checkout_started', {
    plan,
    price,
  })
}

/**
 * Track checkout completed
 */
export function trackCheckoutCompleted(plan: 'premium' | 'pro', price: number): void {
  trackEvent('checkout_completed', {
    plan,
    price,
    revenue: price, // For conversion tracking
  })
}

// ============================================
// Engagement Events
// ============================================

/**
 * Track help/info clicked
 */
export function trackHelpClick(location: string, topic?: string): void {
  trackEvent('help_clicked', {
    location,
    ...(topic && { topic }),
  })
}

/**
 * Track feedback submitted
 */
export function trackFeedbackSubmit(rating?: number, category?: string): void {
  trackEvent('feedback_submitted', {
    ...(rating && { rating }),
    ...(category && { category }),
  })
}

/**
 * Track share clicked
 */
export function trackShareClick(platform: string, content: string): void {
  trackEvent('share_clicked', {
    platform,
    content_type: content,
  })
}

// ============================================
// Error Events
// ============================================

/**
 * Track error
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  component?: string
): void {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    ...(component && { component }),
  })
}

/**
 * Track quota exceeded
 */
export function trackQuotaExceeded(toolName: string, currentUsage: number, limit: number): void {
  trackEvent('quota_exceeded', {
    tool_name: toolName,
    current_usage: currentUsage,
    limit,
  })
}

/**
 * Track file validation failure
 */
export function trackFileValidationFailed(reason: string, fileType?: string): void {
  trackEvent('file_validation_failed', {
    reason,
    ...(fileType && { file_type: fileType }),
  })
}

// ============================================
// Funnel Tracking
// ============================================

interface FunnelStep {
  step: string
  timestamp: string
  completed: boolean
}

class FunnelTracker {
  private funnels: Map<string, FunnelStep[]> = new Map()

  /**
   * Start tracking a funnel
   */
  startFunnel(funnelName: string, firstStep: string): void {
    this.funnels.set(funnelName, [
      {
        step: firstStep,
        timestamp: new Date().toISOString(),
        completed: true,
      },
    ])

    // Track funnel start
    trackEvent('funnel_started' as AnalyticsEvent, {
      funnel: funnelName,
      step: firstStep,
    })
  }

  /**
   * Track funnel step completion
   */
  completeStep(funnelName: string, step: string): void {
    const funnel = this.funnels.get(funnelName)
    if (!funnel) {
      console.warn(`Funnel ${funnelName} not started`)
      return
    }

    funnel.push({
      step,
      timestamp: new Date().toISOString(),
      completed: true,
    })

    // Track step completion
    trackEvent('funnel_step_completed' as AnalyticsEvent, {
      funnel: funnelName,
      step,
      step_number: funnel.length,
    })
  }

  /**
   * Complete entire funnel
   */
  completeFunnel(funnelName: string): void {
    const funnel = this.funnels.get(funnelName)
    if (!funnel) {
      console.warn(`Funnel ${funnelName} not started`)
      return
    }

    const totalTime =
      new Date(funnel[funnel.length - 1].timestamp).getTime() -
      new Date(funnel[0].timestamp).getTime()

    // Track funnel completion
    trackEvent('funnel_completed' as AnalyticsEvent, {
      funnel: funnelName,
      total_steps: funnel.length,
      total_time_ms: totalTime,
    })

    // Clear funnel
    this.funnels.delete(funnelName)
  }

  /**
   * Abandon funnel
   */
  abandonFunnel(funnelName: string, reason?: string): void {
    const funnel = this.funnels.get(funnelName)
    if (!funnel) return

    trackEvent('funnel_abandoned' as AnalyticsEvent, {
      funnel: funnelName,
      last_step: funnel[funnel.length - 1].step,
      steps_completed: funnel.length,
      ...(reason && { reason }),
    })

    this.funnels.delete(funnelName)
  }
}

// Export singleton instance
export const funnelTracker = new FunnelTracker()

// ============================================
// Type Declarations
// ============================================

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: {
        props?: Record<string, string | number>
        callback?: () => void
      }
    ) => void
  }
}
