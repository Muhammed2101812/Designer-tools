/**
 * Analytics Events Definition
 *
 * This file defines all analytics events tracked in the application.
 * Events are sent to both Plausible (client-side) and our database (server-side).
 */

// ============================================
// Event Types
// ============================================

export type AnalyticsEvent =
  // User Events
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  | 'profile_updated'

  // Tool Usage Events
  | 'tool_opened'
  | 'tool_file_uploaded'
  | 'tool_processing_started'
  | 'tool_processing_completed'
  | 'tool_processing_failed'
  | 'tool_download'
  | 'tool_share'

  // Subscription Events
  | 'pricing_page_viewed'
  | 'upgrade_button_clicked'
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_failed'
  | 'subscription_canceled'
  | 'subscription_reactivated'

  // Engagement Events
  | 'feature_discovered'
  | 'tutorial_started'
  | 'tutorial_completed'
  | 'help_clicked'
  | 'feedback_submitted'
  | 'share_clicked'

  // Error Events
  | 'error_occurred'
  | 'quota_exceeded'
  | 'file_validation_failed'

// ============================================
// Event Properties
// ============================================

export interface BaseEventProperties {
  timestamp?: string
  user_id?: string
  session_id?: string
  page_url?: string
  referrer?: string
}

export interface ToolUsageProperties extends BaseEventProperties {
  tool_name: string
  file_size_mb?: number
  file_type?: string
  processing_time_ms?: number
  success?: boolean
  error_message?: string
}

export interface SubscriptionProperties extends BaseEventProperties {
  plan?: 'free' | 'premium' | 'pro'
  price?: number
  billing_cycle?: 'monthly' | 'yearly'
}

export interface ErrorProperties extends BaseEventProperties {
  error_type: string
  error_message: string
  error_stack?: string
  component?: string
}

export type EventProperties =
  | BaseEventProperties
  | ToolUsageProperties
  | SubscriptionProperties
  | ErrorProperties

// ============================================
// Event Metadata
// ============================================

export const EVENT_METADATA: Record<AnalyticsEvent, {
  category: 'user' | 'tool' | 'subscription' | 'engagement' | 'error'
  description: string
  value?: number // For revenue/conversion tracking
}> = {
  // User Events
  user_signup: {
    category: 'user',
    description: 'User completed signup',
    value: 1,
  },
  user_login: {
    category: 'user',
    description: 'User logged in',
  },
  user_logout: {
    category: 'user',
    description: 'User logged out',
  },
  profile_updated: {
    category: 'user',
    description: 'User updated their profile',
  },

  // Tool Usage Events
  tool_opened: {
    category: 'tool',
    description: 'User opened a tool page',
  },
  tool_file_uploaded: {
    category: 'tool',
    description: 'User uploaded a file to a tool',
  },
  tool_processing_started: {
    category: 'tool',
    description: 'Tool processing started',
  },
  tool_processing_completed: {
    category: 'tool',
    description: 'Tool processing completed successfully',
    value: 1,
  },
  tool_processing_failed: {
    category: 'tool',
    description: 'Tool processing failed',
  },
  tool_download: {
    category: 'tool',
    description: 'User downloaded processed file',
    value: 1,
  },
  tool_share: {
    category: 'tool',
    description: 'User shared a tool or result',
  },

  // Subscription Events
  pricing_page_viewed: {
    category: 'subscription',
    description: 'User viewed pricing page',
  },
  upgrade_button_clicked: {
    category: 'subscription',
    description: 'User clicked upgrade button',
  },
  checkout_started: {
    category: 'subscription',
    description: 'User started checkout process',
  },
  checkout_completed: {
    category: 'subscription',
    description: 'User completed checkout',
    value: 1,
  },
  checkout_failed: {
    category: 'subscription',
    description: 'Checkout failed',
  },
  subscription_canceled: {
    category: 'subscription',
    description: 'User canceled subscription',
  },
  subscription_reactivated: {
    category: 'subscription',
    description: 'User reactivated subscription',
    value: 1,
  },

  // Engagement Events
  feature_discovered: {
    category: 'engagement',
    description: 'User discovered a new feature',
  },
  tutorial_started: {
    category: 'engagement',
    description: 'User started a tutorial',
  },
  tutorial_completed: {
    category: 'engagement',
    description: 'User completed a tutorial',
    value: 1,
  },
  help_clicked: {
    category: 'engagement',
    description: 'User clicked help/info',
  },
  feedback_submitted: {
    category: 'engagement',
    description: 'User submitted feedback',
    value: 1,
  },
  share_clicked: {
    category: 'engagement',
    description: 'User clicked share button',
  },

  // Error Events
  error_occurred: {
    category: 'error',
    description: 'An error occurred',
  },
  quota_exceeded: {
    category: 'error',
    description: 'User exceeded quota limit',
  },
  file_validation_failed: {
    category: 'error',
    description: 'File validation failed',
  },
}

// ============================================
// Conversion Funnels
// ============================================

export const CONVERSION_FUNNELS = {
  signup_to_first_tool: [
    'user_signup',
    'tool_opened',
    'tool_file_uploaded',
    'tool_processing_completed',
    'tool_download',
  ],

  free_to_premium: [
    'quota_exceeded',
    'pricing_page_viewed',
    'upgrade_button_clicked',
    'checkout_started',
    'checkout_completed',
  ],

  tool_completion: [
    'tool_opened',
    'tool_file_uploaded',
    'tool_processing_started',
    'tool_processing_completed',
    'tool_download',
  ],

  onboarding: [
    'user_signup',
    'profile_updated',
    'tool_opened',
    'tutorial_started',
    'tutorial_completed',
  ],
} as const

// ============================================
// Helper Functions
// ============================================

/**
 * Get event category
 */
export function getEventCategory(event: AnalyticsEvent): string {
  return EVENT_METADATA[event].category
}

/**
 * Get event description
 */
export function getEventDescription(event: AnalyticsEvent): string {
  return EVENT_METADATA[event].description
}

/**
 * Check if event has value (for conversion tracking)
 */
export function hasEventValue(event: AnalyticsEvent): boolean {
  return EVENT_METADATA[event].value !== undefined
}

/**
 * Get event value
 */
export function getEventValue(event: AnalyticsEvent): number | undefined {
  return EVENT_METADATA[event].value
}

/**
 * Get all events in a category
 */
export function getEventsByCategory(category: typeof EVENT_METADATA[AnalyticsEvent]['category']): AnalyticsEvent[] {
  return Object.entries(EVENT_METADATA)
    .filter(([_, meta]) => meta.category === category)
    .map(([event]) => event as AnalyticsEvent)
}
