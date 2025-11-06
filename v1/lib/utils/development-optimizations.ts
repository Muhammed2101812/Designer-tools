/**
 * Development optimizations to improve local development experience
 * Addresses common issues like slow loading, blocked requests, and debugging
 */

/**
 * Disable problematic features in development
 */
export function optimizeForDevelopment(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  // Disable service worker in development to prevent caching issues
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister()
      })
    })
  }

  // Clear any problematic localStorage entries
  try {
    const problematicKeys = [
      'sentry-replay',
      'sentry-session',
      'debug',
    ]
    
    problematicKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log(`[Dev Optimization] Cleared localStorage: ${key}`)
      }
    })
  } catch (error) {
    // localStorage might not be available
  }

  // Detect and warn about ad blockers affecting development
  detectAdBlocker()
}

/**
 * Detect if ad blocker is interfering with development
 */
function detectAdBlocker(): void {
  // Create a test element that ad blockers typically block
  const testAd = document.createElement('div')
  testAd.innerHTML = '&nbsp;'
  testAd.className = 'adsbox'
  testAd.style.position = 'absolute'
  testAd.style.left = '-10000px'
  testAd.style.width = '1px'
  testAd.style.height = '1px'
  
  document.body.appendChild(testAd)
  
  setTimeout(() => {
    const isBlocked = testAd.offsetHeight === 0
    document.body.removeChild(testAd)
    
    if (isBlocked) {
      console.warn(`
🚫 [Dev Warning] Ad blocker detected!

This may be blocking Sentry requests and causing console errors.
For development, consider:
1. Disabling ad blocker on localhost
2. Adding localhost to ad blocker whitelist
3. Using incognito mode without extensions

Current errors you might see:
- net::ERR_BLOCKED_BY_CLIENT
- Failed Sentry requests
- Performance monitoring issues
      `)
    }
  }, 100)
}

/**
 * Optimize image loading for development
 */
export function optimizeImageLoading(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  // Add loading="lazy" to images without it
  const images = document.querySelectorAll('img:not([loading])')
  images.forEach(img => {
    img.setAttribute('loading', 'lazy')
  })

  // Warn about large images
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
          console.warn(`[Dev Warning] Large image detected: ${img.src} (${img.naturalWidth}x${img.naturalHeight})`)
        }
      }
    })
  })

  document.querySelectorAll('img').forEach(img => observer.observe(img))
}

/**
 * Monitor and report slow operations
 */
export function monitorSlowOperations(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  // Monitor fetch requests
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const startTime = performance.now()
    let url = '[unknown URL]'
    if (typeof args[0] === 'string') {
      url = args[0]
    } else if (args[0] instanceof Request) {
      url = args[0].url
    } else if (args[0] instanceof URL) {
      url = args[0].href
    }
    
    try {
      const response = await originalFetch(...args)
      const duration = performance.now() - startTime
      
      if (duration > 5000) {
        console.warn(`[Dev Warning] Very slow fetch request: ${url} took ${duration.toFixed(2)}ms`)
      }
      
      return response
    } catch (error) {
      const duration = performance.now() - startTime
      
      if (error instanceof Error && error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.warn(`[Dev Warning] Request blocked by client (likely ad blocker): ${url}`)
      } else {
        console.warn(`[Dev Warning] Fetch failed: ${url} after ${duration.toFixed(2)}ms`, error)
      }
      
      throw error
    }
  }

  // Monitor DOM mutations for performance impact
  let mutationCount = 0
  const mutationObserver = new MutationObserver((mutations) => {
    mutationCount += mutations.length
    
    // Reset counter every 5 seconds and warn if too many mutations
    setTimeout(() => {
      if (mutationCount > 1000) {
        console.warn(`[Dev Warning] High DOM mutation rate: ${mutationCount} mutations in 5s`)
      }
      mutationCount = 0
    }, 5000)
  })

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  })
}

/**
 * Provide development shortcuts and debugging helpers
 */
export function addDevelopmentHelpers(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  // Add global debugging helpers
  ;(window as any).__DEV_HELPERS__ = {
    // Clear all caches
    clearCaches: () => {
      localStorage.clear()
      sessionStorage.clear()
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      console.log('✅ All caches cleared')
    },
    
    // Measure page performance
    measurePerformance: () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        console.table({
          'DNS Lookup': `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
          'TCP Connection': `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
          'Request': `${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`,
          'Response': `${(navigation.responseEnd - navigation.responseStart).toFixed(2)}ms`,
          'DOM Processing': `${(navigation.domContentLoadedEventStart - navigation.responseEnd).toFixed(2)}ms`,
          'Total Load Time': `${(navigation.loadEventEnd - navigation.navigationStart).toFixed(2)}ms`
        })
      }
    },
    
    // Check for performance issues
    checkPerformance: () => {
      const issues = []
      
      // Check DOM size
      const nodeCount = document.querySelectorAll('*').length
      if (nodeCount > 1500) {
        issues.push(`Too many DOM nodes: ${nodeCount}`)
      }
      
      // Check for large images
      const largeImages = Array.from(document.querySelectorAll('img')).filter(
        img => img.naturalWidth > 2000 || img.naturalHeight > 2000
      )
      if (largeImages.length > 0) {
        issues.push(`${largeImages.length} large unoptimized images`)
      }
      
      // Check for synchronous scripts
      const syncScripts = document.querySelectorAll('script[src]:not([async]):not([defer])')
      if (syncScripts.length > 0) {
        issues.push(`${syncScripts.length} synchronous scripts`)
      }
      
      if (issues.length === 0) {
        console.log('✅ No performance issues detected')
      } else {
        console.warn('⚠️ Performance issues found:', issues)
      }
    },
    
    // Toggle performance monitoring
    togglePerformanceMonitoring: () => {
      const isEnabled = localStorage.getItem('dev-performance-monitoring') === 'true'
      localStorage.setItem('dev-performance-monitoring', (!isEnabled).toString())
      console.log(`Performance monitoring ${!isEnabled ? 'enabled' : 'disabled'}`)
      window.location.reload()
    }
  }

  // Log available helpers
  console.log(`
🛠️ Development helpers available:

__DEV_HELPERS__.clearCaches()              - Clear all browser caches
__DEV_HELPERS__.measurePerformance()       - Show page load timing
__DEV_HELPERS__.checkPerformance()         - Check for performance issues
__DEV_HELPERS__.togglePerformanceMonitoring() - Toggle performance monitoring

Type any of these in the console to use them.
  `)
}

/**
 * Initialize all development optimizations
 */
export function initDevelopmentOptimizations(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  optimizeForDevelopment()
  optimizeImageLoading()
  monitorSlowOperations()
  addDevelopmentHelpers()
  
  console.log('🚀 Development optimizations initialized')
}