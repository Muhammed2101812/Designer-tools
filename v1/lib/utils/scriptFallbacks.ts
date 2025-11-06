/**
 * Fallback mechanisms for failed third-party scripts
 * Provides graceful degradation when external services fail
 */

/**
 * Stripe fallback implementation
 */
export class StripeFallback {
  private static instance: StripeFallback
  private isEnabled = false

  static getInstance(): StripeFallback {
    if (!StripeFallback.instance) {
      StripeFallback.instance = new StripeFallback()
    }
    return StripeFallback.instance
  }

  enable(): void {
    this.isEnabled = true
    console.warn('Stripe fallback enabled - payment features limited')
  }

  disable(): void {
    this.isEnabled = false
  }

  /**
   * Mock Stripe object for graceful degradation
   */
  createMockStripe() {
    return {
      elements: () => ({
        create: () => ({
          mount: () => console.warn('Stripe element mount failed - using fallback'),
          unmount: () => {},
          on: () => {},
          off: () => {},
        }),
        getElement: () => null,
      }),
      createToken: () => Promise.reject(new Error('Stripe unavailable')),
      createPaymentMethod: () => Promise.reject(new Error('Stripe unavailable')),
      confirmCardPayment: () => Promise.reject(new Error('Stripe unavailable')),
      redirectToCheckout: () => {
        // Redirect to a fallback payment page or show error
        alert('Payment service temporarily unavailable. Please try again later.')
        return Promise.reject(new Error('Stripe unavailable'))
      },
    }
  }

  /**
   * Show payment unavailable message
   */
  showPaymentUnavailableMessage(): void {
    if (!this.isEnabled) return

    const message = document.createElement('div')
    message.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50'
    message.innerHTML = `
      <div class="flex items-center">
        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span>Payment service temporarily unavailable</span>
        <button class="ml-4 text-yellow-800 hover:text-yellow-900" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `
    document.body.appendChild(message)

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (message.parentElement) {
        message.remove()
      }
    }, 10000)
  }
}

/**
 * Analytics fallback implementation
 */
export class AnalyticsFallback {
  private static instance: AnalyticsFallback
  private events: Array<{ event: string; data: any; timestamp: number }> = []
  private isEnabled = false

  static getInstance(): AnalyticsFallback {
    if (!AnalyticsFallback.instance) {
      AnalyticsFallback.instance = new AnalyticsFallback()
    }
    return AnalyticsFallback.instance
  }

  enable(): void {
    this.isEnabled = true
    console.warn('Analytics fallback enabled - events will be queued locally')
  }

  disable(): void {
    this.isEnabled = false
  }

  /**
   * Queue analytics events locally
   */
  trackEvent(event: string, data: any = {}): void {
    if (!this.isEnabled) return

    this.events.push({
      event,
      data,
      timestamp: Date.now(),
    })

    // Limit queue size
    if (this.events.length > 100) {
      this.events = this.events.slice(-50)
    }

    // Try to send events periodically
    this.attemptToSendEvents()
  }

  /**
   * Attempt to send queued events when analytics becomes available
   */
  private attemptToSendEvents(): void {
    // Check if analytics is now available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      this.flushEvents()
    }
  }

  /**
   * Flush queued events to analytics
   */
  private flushEvents(): void {
    if (this.events.length === 0) return

    const gtag = (window as any).gtag
    if (!gtag) return

    this.events.forEach(({ event, data }) => {
      try {
        gtag('event', event, data)
      } catch (error) {
        console.warn('Failed to send queued analytics event:', error)
      }
    })

    this.events = []
    console.log('Flushed queued analytics events')
  }

  /**
   * Get queued events for debugging
   */
  getQueuedEvents(): Array<{ event: string; data: any; timestamp: number }> {
    return [...this.events]
  }
}

/**
 * Sentry fallback implementation
 */
export class SentryFallback {
  private static instance: SentryFallback
  private errors: Array<{ error: Error; context: any; timestamp: number }> = []
  private isEnabled = false

  static getInstance(): SentryFallback {
    if (!SentryFallback.instance) {
      SentryFallback.instance = new SentryFallback()
    }
    return SentryFallback.instance
  }

  enable(): void {
    this.isEnabled = true
    console.warn('Sentry fallback enabled - errors will be logged locally')
    
    // Set up global error handlers
    this.setupErrorHandlers()
  }

  disable(): void {
    this.isEnabled = false
  }

  /**
   * Set up global error handlers
   */
  private setupErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        type: 'unhandledrejection',
      })
    })
  }

  /**
   * Capture error locally
   */
  captureError(error: Error, context: any = {}): void {
    if (!this.isEnabled) return

    this.errors.push({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error,
      context,
      timestamp: Date.now(),
    })

    // Limit queue size
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-25)
    }

    // Log to console as fallback
    console.error('Captured error (Sentry fallback):', error, context)
  }

  /**
   * Get captured errors for debugging
   */
  getCapturedErrors(): Array<{ error: Error; context: any; timestamp: number }> {
    return [...this.errors]
  }

  /**
   * Export errors for manual reporting
   */
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2)
  }
}

/**
 * Initialize all fallback mechanisms
 */
export function initializeFallbacks(): void {
  // Enable fallbacks when scripts fail to load
  setTimeout(() => {
    // Check if Stripe loaded
    if (typeof window !== 'undefined' && !(window as any).Stripe) {
      StripeFallback.getInstance().enable()
    }

    // Check if analytics loaded
    if (typeof window !== 'undefined' && !(window as any).gtag) {
      AnalyticsFallback.getInstance().enable()
    }

    // Check if Sentry loaded
    if (typeof window !== 'undefined' && !(window as any).Sentry) {
      SentryFallback.getInstance().enable()
    }
  }, 10000) // Check after 10 seconds
}

/**
 * Global fallback object for easy access
 */
export const fallbacks = {
  stripe: StripeFallback.getInstance(),
  analytics: AnalyticsFallback.getInstance(),
  sentry: SentryFallback.getInstance(),
}

/**
 * React hook for fallback status
 */
export function useFallbackStatus() {
  const [status, setStatus] = useState({
    stripe: false,
    analytics: false,
    sentry: false,
  })

  React.useEffect(() => {
    const checkStatus = () => {
      setStatus({
        stripe: fallbacks.stripe['isEnabled'],
        analytics: fallbacks.analytics['isEnabled'],
        sentry: fallbacks.sentry['isEnabled'],
      })
    }

    const interval = setInterval(checkStatus, 5000)
    checkStatus()

    return () => clearInterval(interval)
  }, [])

  return status
}