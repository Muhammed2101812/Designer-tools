/**
 * Centralized Logging Utility
 *
 * This utility provides structured logging with environment-aware behavior:
 * - Development: Logs to console
 * - Production: Sends to Sentry (errors only) and silences debug logs
 */

import * as Sentry from '@sentry/nextjs'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Log a debug message (development only)
 */
export function logDebug(message: string, context?: LogContext) {
  if (isDevelopment) {
    console.log(`[DEBUG] ${message}`, context || '')
  }
}

/**
 * Log an info message (development only)
 */
export function logInfo(message: string, context?: LogContext) {
  if (isDevelopment) {
    console.log(`[INFO] ${message}`, context || '')
  }
}

/**
 * Log a warning (both environments)
 */
export function logWarning(message: string, context?: LogContext) {
  if (isDevelopment) {
    console.warn(`[WARN] ${message}`, context || '')
  }

  // In production, send warnings to Sentry as breadcrumbs
  if (!isDevelopment) {
    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: context,
    })
  }
}

/**
 * Log an error (both environments - sends to Sentry in production)
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext) {
  if (isDevelopment) {
    console.error(`[ERROR] ${message}`, error || '', context || '')
  }

  // In production, send to Sentry
  if (!isDevelopment) {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          context: message,
        },
        extra: context,
      })
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { error, ...context },
      })
    }
  }
}

/**
 * Log an API request (development only)
 */
export function logApiRequest(method: string, path: string, context?: LogContext) {
  if (isDevelopment) {
    console.log(`[API] ${method} ${path}`, context || '')
  }
}

/**
 * Log a database query (development only)
 */
export function logDatabaseQuery(query: string, context?: LogContext) {
  if (isDevelopment) {
    console.log(`[DB] ${query}`, context || '')
  }
}

/**
 * Log authentication events (development only, production sends to Sentry as breadcrumb)
 */
export function logAuth(event: string, context?: LogContext) {
  if (isDevelopment) {
    console.log(`[AUTH] ${event}`, context || '')
  } else {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: event,
      level: 'info',
      data: context,
    })
  }
}

/**
 * Log payment events (always log to Sentry due to importance)
 */
export function logPayment(event: string, context?: LogContext) {
  if (isDevelopment) {
    console.log(`[PAYMENT] ${event}`, context || '')
  }

  // Always track payment events in Sentry
  Sentry.addBreadcrumb({
    category: 'payment',
    message: event,
    level: 'info',
    data: context,
  })
}

/**
 * Log performance metrics (development only)
 */
export function logPerformance(metric: string, value: number, unit: string = 'ms') {
  if (isDevelopment) {
    console.log(`[PERF] ${metric}: ${value}${unit}`)
  }
}

export const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarning,
  error: logError,
  api: logApiRequest,
  db: logDatabaseQuery,
  auth: logAuth,
  payment: logPayment,
  performance: logPerformance,
}
