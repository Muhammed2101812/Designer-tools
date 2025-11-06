/**
 * Script loading optimization utilities
 * Implements async/defer loading strategies and critical path optimization
 */

import React, { ReactElement } from 'react'
import Script from 'next/script'
import { crossOrigin } from '../../next.config'
import { type } from 'os'
import { crossOrigin } from '../../next.config'
import { crossOrigin } from '../../next.config'
import { crossOrigin } from '../../next.config'
import { type } from 'os'

/**
 * Script loading strategies
 */
export type ScriptStrategy = 'afterInteractive' | 'lazyOnload' | 'beforeInteractive'

/**
 * Critical scripts that should load immediately
 */
export const CRITICAL_SCRIPTS = [
  // Authentication and core functionality
  'supabase',
  'stripe',
] as const

/**
 * Non-critical scripts that can be deferred
 */
export const DEFERRED_SCRIPTS = [
  // Analytics and monitoring
  'analytics',
  'sentry',
  'performance-monitoring',
  // Third-party integrations
  'social-sharing',
  'feedback-widgets',
] as const

/**
 * Script configuration interface
 */
export interface ScriptConfig {
  id: string
  src?: string
  strategy: ScriptStrategy
  onLoad?: () => void
  onError?: (error: Error) => void
  defer?: boolean
  async?: boolean
  crossOrigin?: 'anonymous' | 'use-credentials'
  integrity?: string
}

/**
 * Create optimized script component
 */
export function createOptimizedScript({
  id,
  src,
  strategy = 'afterInteractive',
  onLoad,
  onError,
  defer = true,
  async = true,
  crossOrigin,
  integrity,
}: ScriptConfig): ReactElement {
  return (
    <Script
      key={id}
      id={id}
      src={src}
      strategy={strategy}
      onLoad={onLoad}
      onError={onError ? () => onError(new Error(`Script ${id} failed to load`)) : undefined}
      defer={defer}
      async={async}
      crossOrigin={crossOrigin}
      integrity={integrity}
    />
  )
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(): ReactElement[] {
  const resources = []
  
  // Preload critical fonts
  resources.push(
    <link
      key="font-preload"
      rel="preload"
      href="/fonts/inter-var.woff2"
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />
  )
  
  // DNS prefetch for external domains
  resources.push(<link key="dns-supabase" rel="dns-prefetch" href="//supabase.co" />)
  resources.push(<link key="dns-stripe" rel="dns-prefetch" href="//js.stripe.com" />)
  resources.push(<link key="dns-sentry" rel="dns-prefetch" href="//sentry.io" />)
  
  // Preconnect to critical origins
  resources.push(<link key="preconnect-supabase" rel="preconnect" href="https://supabase.co" />)
  resources.push(<link key="preconnect-stripe" rel="preconnect" href="https://js.stripe.com" />)
  
  return resources
}

/**
 * Critical CSS inlining utility
 */
export function inlineCriticalCSS(): string {
  // Import from dedicated critical CSS utility
  const { getCriticalCSS } = require('./criticalCSS')
  return getCriticalCSS()
}

/**
 * Resource hints for performance
 */
export function generateResourceHints(): ReactElement[] {
  const hints = []
  
  // Prefetch likely next pages
  hints.push(<link key="prefetch-dashboard" rel="prefetch" href="/dashboard" />)
  hints.push(<link key="prefetch-pricing" rel="prefetch" href="/pricing" />)
  
  // Preload critical images
  hints.push(<link key="preload-logo" rel="preload" href="/logo.svg" as="image" />)
  
  // Module preload for critical chunks
  hints.push(<link key="modulepreload-framework" rel="modulepreload" href="/_next/static/chunks/framework.js" />)
  hints.push(<link key="modulepreload-main" rel="modulepreload" href="/_next/static/chunks/main.js" />)
  
  return hints
}

/**
 * Optimize third-party script loading
 */
export function createThirdPartyScripts(): ReactElement[] {
  const scripts: ReactElement[] = []
  
  // Stripe (critical for payments)
  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    scripts.push(
      createOptimizedScript({
        id: 'stripe-js',
        src: 'https://js.stripe.com/v3/',
        strategy: 'afterInteractive',
        defer: true,
        async: true,
      })
    )
  }
  
  // Sentry (non-critical, can be deferred)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    scripts.push(
      createOptimizedScript({
        id: 'sentry-init',
        strategy: 'lazyOnload',
        onLoad: () => {
          // Sentry is initialized in instrumentation.ts
          console.log('Sentry monitoring active')
        },
      })
    )
  }
  
  return scripts
}

/**
 * Performance monitoring script
 */
export function createPerformanceMonitoringScript(): ReactElement {
  return createOptimizedScript({
    id: 'performance-monitor',
    strategy: 'afterInteractive',
    onLoad: () => {
      // Initialize performance monitoring
      if (typeof window !== 'undefined' && 'performance' in window) {
        // Monitor Core Web Vitals
        import('@/lib/utils/performanceMonitoring').then(({ initPerformanceMonitoring }) => {
          initPerformanceMonitoring()
        })
      }
    },
  })
}

/**
 * Service worker registration script
 */
export function createServiceWorkerScript(): ReactElement {
  return createOptimizedScript({
    id: 'service-worker',
    strategy: 'lazyOnload',
    onLoad: () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.warn('Service worker registration failed:', error)
        })
      }
    },
  })
}