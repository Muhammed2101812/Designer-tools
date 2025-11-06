/**
 * Sentry Edge Configuration
 * Handles error tracking for Edge Runtime (middleware, edge routes)
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// Only initialize Sentry in production or when explicitly enabled in development
const shouldInitializeSentry = process.env.NODE_ENV === 'production' || 
                              process.env.SENTRY_DEBUG === 'true'

if (!shouldInitializeSentry) {
  console.log('🔇 Sentry (edge) disabled in development (set SENTRY_DEBUG=true to enable)')
} else {
  Sentry.init({
    // Data Source Name - identifies your project in Sentry
    dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: process.env.NODE_ENV || 'development',

  // Release version (helps track which version has errors)
  release: process.env.SENTRY_RELEASE || `design-kit@${process.env.npm_package_version || 'unknown'}`,

  // Percentage of transactions to send to Sentry (0.0 to 1.0)
  // Lower in production to reduce quota usage
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable debug mode only if explicitly set
  debug: process.env.SENTRY_DEBUG === 'true',

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null
    }

    // Remove sensitive data from event
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key']
        sensitiveParams.forEach(param => {
          if (event.request?.query_string?.includes(param)) {
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]*`, 'gi'),
              `${param}=[REDACTED]`
            )
          }
        })
      }
    }

    return event
  },

  // Ignore certain errors that are not actionable
  ignoreErrors: [
    // Network errors that are expected
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // User cancelled actions
    'AbortError',
    'The user aborted a request',
  ],
  })
}
