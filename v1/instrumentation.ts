/**
 * Next.js Instrumentation
 * This file is used to initialize Sentry and other monitoring tools
 * It runs once when the server starts
 */

export async function register() {
  // Skip Sentry initialization in development for better performance
  if (process.env.NODE_ENV === 'development') {
    console.log('🔇 Sentry disabled in development for performance')
    return
  }

  // Initialize Sentry for server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  // Initialize Sentry for Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
