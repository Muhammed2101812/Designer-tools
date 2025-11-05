/**
 * Sentry Client Configuration
 * Handles error tracking and monitoring for client-side (browser) errors
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

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

  // Percentage of sessions to record for Session Replay
  // This helps debug issues by recording user sessions
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,

  // Percentage of sessions with errors to record
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.0,

  // Enable debug mode only if explicitly set
  debug: process.env.SENTRY_DEBUG === 'true',

  // Integrations
  integrations: [
    // Browser tracing for performance monitoring
    Sentry.browserTracingIntegration(),

    // Session replay for debugging
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: true,
      // Block all media (images, videos) for privacy
      blockAllMedia: true,
    }),
  ],

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
      if (event.request.query_string && typeof event.request.query_string === 'string') {
        const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key']
        sensitiveParams.forEach(param => {
          if (event.request?.query_string && typeof event.request.query_string === 'string' && event.request.query_string.includes(param)) {
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]*`, 'gi'),
              `${param}=[REDACTED]`
            )
          }
        })
      }
    }

    // Remove file data from context
    if (event.contexts) {
      Object.keys(event.contexts).forEach(key => {
        const context = event.contexts?.[key]
        if (context && typeof context === 'object') {
          // Remove blob, file, and image data
          if ('blob' in context) delete context.blob
          if ('file' in context) delete context.file
          if ('imageData' in context) delete context.imageData
          if ('data' in context && typeof context.data === 'string' && context.data.length > 1000) {
            context.data = '[LARGE_DATA_REDACTED]'
          }
        }
      })
    }

    // Remove large breadcrumbs data
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          Object.keys(breadcrumb.data).forEach(key => {
            const value = breadcrumb.data?.[key]
            if (typeof value === 'string' && value.length > 500) {
              breadcrumb.data![key] = '[LARGE_DATA_REDACTED]'
            }
          })
        }
        return breadcrumb
      })
    }

    return event
  },

  // Ignore certain errors that are not actionable
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors that are expected
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // User cancelled actions
    'AbortError',
    'The user aborted a request',
    // ResizeObserver errors (benign)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],

  // Don't capture errors from certain URLs
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    // Third-party scripts
    /google-analytics\.com/i,
    /googletagmanager\.com/i,
  ],
})
