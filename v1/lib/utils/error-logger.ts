/**
 * Error logging utilities
 * Logs errors for debugging without exposing sensitive data
 * Integrates with Sentry for production error tracking and monitoring
 */

import * as Sentry from '@sentry/nextjs'
import { sanitizeErrorForLogging } from './errors'
import { getBrowserInfo } from './browser-compat'
import { MONITORING_CONFIG } from '../monitoring/config'

export interface ErrorLogEntry {
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  context?: Record<string, any>
  browser: ReturnType<typeof getBrowserInfo>
  url: string
  userAgent: string
}

export interface SentryUser {
  id: string
  email?: string
  username?: string
  plan?: string
}

/**
 * Log error to console in development
 */
export function logError(
  error: Error,
  context?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Error Log')
    console.error('Error:', error)
    if (context) {
      console.log('Context:', sanitizeErrorForLogging(error, context))
    }
    console.log('Browser:', getBrowserInfo())
    console.groupEnd()
  }
}

/**
 * Create structured error log entry
 */
export function createErrorLogEntry(
  error: Error,
  context?: Record<string, any>
): ErrorLogEntry {
  const sanitized = sanitizeErrorForLogging(error, context)
  
  return {
    timestamp: new Date().toISOString(),
    error: {
      name: sanitized.name,
      message: sanitized.message,
      stack: sanitized.stack,
    },
    context: sanitized.context,
    browser: getBrowserInfo(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  }
}

/**
 * Report error to Sentry and log locally
 * This is the main function to use for error reporting throughout the app
 */
export async function reportError(
  error: Error,
  context?: Record<string, any>
): Promise<void> {
  // Create sanitized log entry
  const logEntry = createErrorLogEntry(error, context)
  
  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    logError(error, context)
  }
  
  // Determine error severity based on context and error type
  const severity = determineErrorSeverity(error, context)
  
  // Send to Sentry in production (or if SENTRY_DEBUG is enabled)
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      // Capture exception with Sentry
      Sentry.captureException(error, {
        level: severity,
        contexts: {
          error_details: {
            timestamp: logEntry.timestamp,
            url: logEntry.url,
            browser: logEntry.browser,
          },
          monitoring: {
            error_rate_threshold: MONITORING_CONFIG.errorRates.critical.threshold,
            performance_threshold: MONITORING_CONFIG.performance.responseTime.critical,
            environment: MONITORING_CONFIG.app.environment,
          },
        },
        extra: {
          context: logEntry.context,
          severity,
        },
        tags: {
          tool_name: context?.toolName,
          error_type: error.name,
          error_category: categorizeError(error, context),
          severity,
          component: context?.component || 'unknown',
          api_endpoint: context?.endpoint,
        },
        fingerprint: generateErrorFingerprint(error, context),
      })
      
      // Add performance monitoring context if available
      if (context?.performanceMetrics) {
        Sentry.setContext('performance', context.performanceMetrics)
      }
      
    } catch (sentryError) {
      // If Sentry fails, log to console but don't throw
      console.error('Failed to report error to Sentry:', sentryError)
      console.error('Original error:', logEntry)
    }
  }
  
  // Store for local debugging
  storeErrorForDebug(error, context)
  
  // Track error metrics for monitoring
  trackErrorMetrics(error, context, severity)
}

/**
 * Set user context in Sentry
 * Call this after user logs in to associate errors with specific users
 */
export function setSentryUser(user: SentryUser): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
      })
    } catch (error) {
      console.error('Failed to set Sentry user:', error)
    }
  }
}

/**
 * Clear user context in Sentry
 * Call this after user logs out
 */
export function clearSentryUser(): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.setUser(null)
    } catch (error) {
      console.error('Failed to clear Sentry user:', error)
    }
  }
}

/**
 * Add breadcrumb to Sentry for debugging context
 * Breadcrumbs help understand what led to an error
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
      })
    } catch (error) {
      console.error('Failed to add Sentry breadcrumb:', error)
    }
  }
}

/**
 * Set custom context in Sentry
 * Use this to add additional context that will be included with all errors
 */
export function setSentryContext(
  name: string,
  context: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.setContext(name, context)
    } catch (error) {
      console.error('Failed to set Sentry context:', error)
    }
  }
}

/**
 * Capture a message in Sentry (for non-error events)
 * Use this for important events that aren't errors but should be tracked
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.captureMessage(message, {
        level,
        extra: context,
      })
    } catch (error) {
      console.error('Failed to capture message in Sentry:', error)
    }
  }
}

/**
 * Store error in session storage for debugging
 */
export function storeErrorForDebug(
  error: Error,
  context?: Record<string, any>
): void {
  if (typeof window === 'undefined') return
  
  try {
    const logEntry = createErrorLogEntry(error, context)
    const key = `error_log_${Date.now()}`
    
    // Store in sessionStorage (cleared on tab close)
    sessionStorage.setItem(key, JSON.stringify(logEntry))
    
    // Keep only last 10 errors
    const keys = Object.keys(sessionStorage)
      .filter(k => k.startsWith('error_log_'))
      .sort()
    
    if (keys.length > 10) {
      keys.slice(0, keys.length - 10).forEach(k => {
        sessionStorage.removeItem(k)
      })
    }
  } catch (e) {
    // Ignore storage errors
    console.warn('Failed to store error log:', e)
  }
}

/**
 * Get all stored error logs
 */
export function getStoredErrors(): ErrorLogEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const keys = Object.keys(sessionStorage)
      .filter(k => k.startsWith('error_log_'))
      .sort()
    
    return keys.map(key => {
      const data = sessionStorage.getItem(key)
      return data ? JSON.parse(data) : null
    }).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Clear all stored error logs
 */
export function clearStoredErrors(): void {
  if (typeof window === 'undefined') return
  
  try {
    const keys = Object.keys(sessionStorage)
      .filter(k => k.startsWith('error_log_'))
    
    keys.forEach(key => sessionStorage.removeItem(key))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Determine error severity based on error type and context
 */
function determineErrorSeverity(
  error: Error,
  context?: Record<string, any>
): 'fatal' | 'error' | 'warning' | 'info' {
  // Fatal errors - system-breaking issues
  if (
    error.name === 'DatabaseConnectionError' ||
    error.name === 'PaymentProcessingError' ||
    context?.component === 'stripe' ||
    context?.component === 'database'
  ) {
    return 'fatal'
  }
  
  // High priority errors - user-facing issues
  if (
    error.name === 'APIError' ||
    error.name === 'AuthenticationError' ||
    context?.component === 'api' ||
    context?.toolName
  ) {
    return 'error'
  }
  
  // Medium priority - degraded functionality
  if (
    error.name === 'ValidationError' ||
    error.name === 'NetworkError' ||
    context?.type === 'validation'
  ) {
    return 'warning'
  }
  
  // Low priority - informational
  return 'info'
}

/**
 * Categorize error for better organization in monitoring
 */
function categorizeError(error: Error, context?: Record<string, any>): string {
  if (context?.component) {
    return context.component
  }
  
  if (context?.toolName) {
    return 'tool'
  }
  
  if (error.name.includes('Network')) {
    return 'network'
  }
  
  if (error.name.includes('Auth')) {
    return 'authentication'
  }
  
  if (error.name.includes('Payment') || error.name.includes('Stripe')) {
    return 'payment'
  }
  
  if (error.name.includes('Database') || error.name.includes('Supabase')) {
    return 'database'
  }
  
  if (error.name.includes('Validation')) {
    return 'validation'
  }
  
  return 'general'
}

/**
 * Generate error fingerprint for grouping similar errors
 */
function generateErrorFingerprint(error: Error, context?: Record<string, any>): string[] {
  const fingerprint = [error.name]
  
  if (context?.component) {
    fingerprint.push(context.component)
  }
  
  if (context?.toolName) {
    fingerprint.push(context.toolName)
  }
  
  if (context?.endpoint) {
    fingerprint.push(context.endpoint)
  }
  
  // Add error message hash for similar errors
  const messageHash = error.message.replace(/\d+/g, 'N').replace(/['"]/g, '')
  fingerprint.push(messageHash)
  
  return fingerprint
}

/**
 * Track error metrics for monitoring dashboards
 */
function trackErrorMetrics(
  error: Error,
  context?: Record<string, any>,
  severity?: string
): void {
  // In a real implementation, this would send metrics to your monitoring system
  // For now, we'll use console logging with structured data
  
  if (process.env.NODE_ENV === 'production') {
    const metrics = {
      timestamp: new Date().toISOString(),
      error_name: error.name,
      error_category: categorizeError(error, context),
      severity,
      component: context?.component,
      tool_name: context?.toolName,
      endpoint: context?.endpoint,
      user_id: context?.userId,
      session_id: context?.sessionId,
    }
    
    // Log structured metrics (these would be picked up by log aggregation)
    console.log('ERROR_METRIC:', JSON.stringify(metrics))
  }
}

/**
 * Report performance issue to monitoring
 */
export function reportPerformanceIssue(
  operation: string,
  duration: number,
  context?: Record<string, any>
): void {
  const threshold = MONITORING_CONFIG.performance.responseTime.warning
  
  if (duration > threshold) {
    const severity = duration > MONITORING_CONFIG.performance.responseTime.critical 
      ? 'error' 
      : 'warning'
    
    if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
      Sentry.captureMessage(`Performance issue: ${operation}`, {
        level: severity,
        tags: {
          operation,
          performance_issue: true,
        },
        extra: {
          duration,
          threshold,
          context,
        },
      })
    }
    
    // Track performance metrics
    if (process.env.NODE_ENV === 'production') {
      console.log('PERFORMANCE_METRIC:', JSON.stringify({
        timestamp: new Date().toISOString(),
        operation,
        duration,
        threshold,
        severity,
        ...context,
      }))
    }
  }
}

/**
 * Report business metric anomaly
 */
export function reportBusinessMetricAnomaly(
  metric: string,
  value: number,
  expected: number,
  context?: Record<string, any>
): void {
  const deviation = Math.abs(value - expected) / expected
  
  if (deviation > 0.2) { // 20% deviation threshold
    const severity = deviation > 0.5 ? 'error' : 'warning'
    
    if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
      Sentry.captureMessage(`Business metric anomaly: ${metric}`, {
        level: severity,
        tags: {
          metric,
          business_anomaly: true,
        },
        extra: {
          value,
          expected,
          deviation,
          context,
        },
      })
    }
    
    // Track business metrics
    if (process.env.NODE_ENV === 'production') {
      console.log('BUSINESS_METRIC:', JSON.stringify({
        timestamp: new Date().toISOString(),
        metric,
        value,
        expected,
        deviation,
        severity,
        ...context,
      }))
    }
  }
}

/**
 * Global error handler setup with enhanced monitoring
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason))
    
    reportError(error, { 
      type: 'unhandledRejection',
      component: 'global',
      severity: 'error',
    })
  })
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error
      ? event.error
      : new Error(event.message)
    
    reportError(error, {
      type: 'globalError',
      component: 'global',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      severity: 'error',
    })
  })
  
  // Monitor performance
  if ('performance' in window && 'getEntriesByType' in window.performance) {
    // Monitor navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart
          reportPerformanceIssue('page_load', loadTime, {
            component: 'navigation',
            url: window.location.href,
          })
        }
      }, 0)
    })
  }
}
