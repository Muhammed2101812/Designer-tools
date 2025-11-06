/**
 * Supabase Client Configuration
 * 
 * This module provides Supabase client utilities for both client-side and server-side usage.
 * 
 * Usage:
 * - Client Components: import { supabase } from '@/lib/supabase/client'
 * - Server Components: import { createClient } from '@/lib/supabase/server'
 * - Admin Operations: import { createAdminClient } from '@/lib/supabase/server'
 * - Middleware: import { updateSession } from '@/lib/supabase/middleware'
 */

// Re-export client utilities
export { createClient as createBrowserClient, supabase } from './client'

// Re-export server utilities
export { createClient as createServerClient, createAdminClient } from './server'

// Re-export middleware utilities
export { updateSession } from './middleware'

// Re-export types
export type {
  Database,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
  ToolUsage,
  ToolUsageInsert,
  ToolUsageUpdate,
  DailyLimit,
  DailyLimitInsert,
  DailyLimitUpdate,
  Plan,
  SubscriptionStatus,
} from './types'
