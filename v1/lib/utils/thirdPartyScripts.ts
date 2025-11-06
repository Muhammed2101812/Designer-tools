/**
 * Third-party script optimization utilities
 * Implements async loading, fallback mechanisms, and performance monitoring
 */

/**
 * Third-party script configuration
 */
interface ThirdPartyScript {
  id: string
  src: string
  async?: boolean
  defer?: boolean
  strategy?: 'eager' | 'lazy' | 'idle'
  fallback?: () => void
  onLoad?: () => void
  onError?: (error: Error) => void
  timeout?: number
  retries?: number
  critical?: boolean
}

/**
 * Script loading strategies
 */
export type ScriptStrategy = 'eager' | 'lazy' | 'idle'

/**
 * Third-party script manager
 */
export class ThirdPartyScriptManager {
  private loadedScripts = new Set<string>()
  private loadingScripts = new Map<string, Promise<void>>()
  private failedScripts = new Set<string>()

  /**
   * Load a third-party script with optimization
   */
  async loadScript(config: ThirdPartyScript): Promise<void> {
    const { id, src, strategy = 'lazy', timeout = 10000, retries = 2 } = config

    // Skip if already loaded
    if (this.loadedScripts.has(id)) {
      return Promise.resolve()
    }

    // Return existing promise if already loading
    if (this.loadingScripts.has(id)) {
      return this.loadingScripts.get(id)!
    }

    // Create loading promise
    const loadingPromise = this.createLoadingPromise(config, timeout, retries)
    this.loadingScripts.set(id, loadingPromise)

    try {
      await loadingPromise
      this.loadedScripts.add(id)
      this.loadingScripts.delete(id)
    } catch (error) {
      this.failedScripts.add(id)
      this.loadingScripts.delete(id)
      throw error
    }
  }

  /**
   * Create loading promise with timeout and retries
   */
  private async createLoadingPromise(
    config: ThirdPartyScript,
    timeout: number,
    retries: number
  ): Promise<void> {
    const { id, src, strategy, fallback, onLoad, onError } = config

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.loadScriptWithTimeout(config, timeout)
        onLoad?.()
        return
      } catch (error) {
        console.warn(`Failed to load script ${id} (attempt ${attempt + 1}/${retries + 1}):`, error)
        
        if (attempt === retries) {
          // Final attempt failed, call fallback
          if (fallback) {
            try {
              fallback()
            } catch (fallbackError) {
              console.error(`Fallback failed for script ${id}:`, fallbackError)
            }
          }
          
          const finalError = new Error(`Failed to load script ${id} after ${retries + 1} attempts`)
          onError?.(finalError)
          throw finalError
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  /**
   * Load script with timeout
   */
  private loadScriptWithTimeout(config: ThirdPartyScript, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const { id, src, async = true, defer = false, strategy } = config

      // Create script element
      const script = document.createElement('script')
      script.id = id
      script.src = src
      script.async = async
      script.defer = defer

      // Set loading strategy attributes
      if (strategy === 'lazy') {
        // Note: loading attribute is not standard for script elements
        script.setAttribute('data-loading', 'lazy')
      }

      // Timeout handler
      const timeoutId = setTimeout(() => {
        script.remove()
        reject(new Error(`Script ${id} timed out after ${timeout}ms`))
      }, timeout)

      // Success handler
      script.onload = () => {
        clearTimeout(timeoutId)
        resolve()
      }

      // Error handler
      script.onerror = () => {
        clearTimeout(timeoutId)
        script.remove()
        reject(new Error(`Failed to load script ${id}`))
      }

      // Add to document based on strategy
      if (strategy === 'eager') {
        document.head.appendChild(script)
      } else if (strategy === 'idle') {
        this.loadOnIdle(() => document.head.appendChild(script))
      } else {
        // Lazy loading - load when needed
        document.head.appendChild(script)
      }
    })
  }

  /**
   * Load script when browser is idle
   */
  private loadOnIdle(callback: () => void): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 5000 })
    } else {
      setTimeout(callback, 0)
    }
  }

  /**
   * Check if script is loaded
   */
  isLoaded(id: string): boolean {
    return this.loadedScripts.has(id)
  }

  /**
   * Check if script failed to load
   */
  hasFailed(id: string): boolean {
    return this.failedScripts.has(id)
  }

  /**
   * Get loading status
   */
  getStatus(id: string): 'not-loaded' | 'loading' | 'loaded' | 'failed' {
    if (this.loadedScripts.has(id)) return 'loaded'
    if (this.failedScripts.has(id)) return 'failed'
    if (this.loadingScripts.has(id)) return 'loading'
    return 'not-loaded'
  }
}

// Global script manager instance
export const scriptManager = new ThirdPartyScriptManager()

/**
 * Predefined third-party script configurations
 */
export const THIRD_PARTY_SCRIPTS: Record<string, ThirdPartyScript> = {
  stripe: {
    id: 'stripe-js',
    src: 'https://js.stripe.com/v3/',
    strategy: 'lazy',
    async: true,
    defer: true,
    timeout: 10000,
    retries: 2,
    fallback: () => {
      console.warn('Stripe failed to load, payment features may not work')
    },
  },

  sentry: {
    id: 'sentry-js',
    src: 'https://browser.sentry-cdn.com/7.0.0/bundle.min.js',
    strategy: 'idle',
    async: true,
    timeout: 8000,
    retries: 1,
    fallback: () => {
      console.warn('Sentry failed to load, error tracking disabled')
    },
  },

  analytics: {
    id: 'analytics-js',
    src: 'https://www.googletagmanager.com/gtag/js',
    strategy: 'idle',
    async: true,
    timeout: 8000,
    retries: 1,
    fallback: () => {
      console.warn('Analytics failed to load, tracking disabled')
    },
  },
}

/**
 * Load critical third-party scripts
 */
export async function loadCriticalScripts(): Promise<void> {
  const criticalScripts = Object.values(THIRD_PARTY_SCRIPTS).filter(
    script => script.critical
  )

  const promises = criticalScripts.map(script => 
    scriptManager.loadScript(script).catch(error => {
      console.error(`Critical script ${script.id} failed to load:`, error)
    })
  )

  await Promise.allSettled(promises)
}

/**
 * Load non-critical scripts with delay
 */
export function loadNonCriticalScripts(delay: number = 2000): void {
  setTimeout(async () => {
    const nonCriticalScripts = Object.values(THIRD_PARTY_SCRIPTS).filter(
      script => !script.critical
    )

    for (const script of nonCriticalScripts) {
      try {
        await scriptManager.loadScript(script)
      } catch (error) {
        console.warn(`Non-critical script ${script.id} failed to load:`, error)
      }
    }
  }, delay)
}

/**
 * Conditionally load scripts based on user interaction
 */
export function loadScriptOnInteraction(
  scriptId: string,
  events: string[] = ['click', 'scroll', 'keydown']
): void {
  const script = THIRD_PARTY_SCRIPTS[scriptId]
  if (!script) {
    console.warn(`Script ${scriptId} not found in configuration`)
    return
  }

  let loaded = false

  const loadScript = () => {
    if (loaded) return
    loaded = true

    // Remove event listeners
    events.forEach(event => {
      document.removeEventListener(event, loadScript, true)
    })

    // Load the script
    scriptManager.loadScript(script).catch(error => {
      console.error(`Script ${scriptId} failed to load on interaction:`, error)
    })
  }

  // Add event listeners
  events.forEach(event => {
    document.addEventListener(event, loadScript, true)
  })

  // Fallback timeout
  setTimeout(loadScript, 10000)
}

/**
 * Monitor third-party script performance
 */
export function monitorScriptPerformance(): void {
  if (!('PerformanceObserver' in window)) return

  const observer = new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
      if (entry.entryType === 'resource' && entry.name.includes('.js')) {
        const resourceEntry = entry as PerformanceResourceTiming
        const loadTime = resourceEntry.responseEnd - resourceEntry.startTime
        
        if (loadTime > 3000) {
          console.warn(`Slow script detected: ${entry.name} took ${loadTime}ms to load`)
        }
      }
    })
  })

  observer.observe({ entryTypes: ['resource'] })
}

/**
 * Initialize third-party script optimization
 */
export function initializeThirdPartyScripts(): void {
  // Monitor script performance
  monitorScriptPerformance()

  // Load critical scripts immediately
  loadCriticalScripts()

  // Load non-critical scripts after delay
  loadNonCriticalScripts()

  // Set up interaction-based loading for heavy scripts
  loadScriptOnInteraction('analytics')
}

/**
 * Third-party script loading hook (for use in React components)
 */
export function createThirdPartyScriptHook() {
  return function useThirdPartyScript(scriptId: string) {
    // This would be implemented in a React component file
    // Return script loading status
    return {
      isLoaded: scriptManager.isLoaded(scriptId),
      isLoading: scriptManager.getStatus(scriptId) === 'loading',
      hasFailed: scriptManager.hasFailed(scriptId),
      status: scriptManager.getStatus(scriptId),
    }
  }
}

/**
 * Preconnect to third-party domains
 */
export function preconnectToThirdPartyDomains(): void {
  if (typeof document === 'undefined') return

  const domains = [
    'https://js.stripe.com',
    'https://api.stripe.com',
    'https://sentry.io',
    'https://www.googletagmanager.com',
  ]

  domains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = domain
    document.head.appendChild(link)
  })
}