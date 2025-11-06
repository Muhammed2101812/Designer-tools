/**
 * Client-side Instrumentation
 * This file is used to initialize Sentry and other monitoring tools for the client-side
 * Replaces sentry.client.config.ts for Turbopack compatibility
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// Only initialize Sentry in production or when explicitly enabled in development
const shouldInitializeSentry = process.env.NODE_ENV === 'production' || 
                              process.env.SENTRY_DEBUG === 'true'

if (!shouldInitializeSentry) {
  console.log('🔇 Sentry (client) disabled in development (set SENTRY_DEBUG=true to enable)')
} else {
  Sentry.init({
    // Data Source Name - identifies your project in Sentry
    dsn: SENTRY_DSN,

    // Environment (development, staging, production)
    environment: process.env.NODE_ENV || 'development',

    // Release version (helps track which version has errors)
    release: process.env.SENTRY_RELEASE || `design-kit@${process.env.npm_package_version || 'unknown'}`,

    // Percentage of transactions to send to Sentry (0.0 to 1.0)
    // Lower in production to reduce quota usage, disable in development to avoid blocked requests
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,

    // Percentage of sessions to record for Session Replay
    // Disable in development to avoid blocked requests
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,

    // Percentage of sessions with errors to record
    // Disable in development to avoid blocked requests
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.0,

    // Enable debug mode only if explicitly set
    debug: process.env.SENTRY_DEBUG === 'true',

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Track navigation and page loads
        tracePropagationTargets: [
          'localhost',
          /^\//,
          process.env.NEXT_PUBLIC_APP_URL || '',
        ],
      }),

      // Session Replay for debugging user sessions
      Sentry.replayIntegration({
        // Mask all text and inputs for privacy
        maskAllText: true,
        maskAllInputs: true,
        // Block media elements
        blockAllMedia: true,
      }),
    ],

    // Capture unhandled promise rejections
    captureUnhandledRejections: true,

    // Capture console errors
    captureConsoleIntegration: {
      levels: ['error'],
    },

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      // Filter out development-only errors
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      // Filter out known browser extension errors
      if (event.exception) {
        const error = hint.originalException
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message)
          
          // Common browser extension errors to ignore
          const ignoredErrors = [
            'Non-Error promise rejection captured',
            'ResizeObserver loop limit exceeded',
            'Script error.',
            'Network request failed',
            'Loading chunk',
            'ChunkLoadError',
          ]

          if (ignoredErrors.some(ignored => message.includes(ignored))) {
            return null
          }
        }
      }

      return event
    },

    // Set user context
    initialScope: {
      tags: {
        component: 'client',
      },
    },
  })

  // Set up additional context
  Sentry.setContext('app', {
    name: 'Design Kit',
    version: process.env.npm_package_version || 'unknown',
  })
}

// Export router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;