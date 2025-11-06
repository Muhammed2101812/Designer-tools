/**
 * Performance debugging utilities for development
 * Helps identify performance bottlenecks causing slow loading
 */

/**
 * Debug performance issues by measuring resource loading times
 */
export function debugPerformance(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  // Measure navigation timing
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      console.group('[Performance Debug] Navigation Timing')
      console.log('DNS Lookup:', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms')
      console.log('TCP Connection:', navigation.connectEnd - navigation.connectStart, 'ms')
      console.log('Request:', navigation.responseStart - navigation.requestStart, 'ms')
      console.log('Response:', navigation.responseEnd - navigation.responseStart, 'ms')
      console.log('DOM Processing:', navigation.domContentLoadedEventStart - navigation.responseEnd, 'ms')
      console.log('Load Event:', navigation.loadEventEnd - navigation.loadEventStart, 'ms')
      console.log('Total:', navigation.loadEventEnd - navigation.navigationStart, 'ms')
      console.groupEnd()
    }

    // Measure resource loading times
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const slowResources = resources
      .filter(resource => resource.duration > 1000) // Resources taking > 1s
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10) // Top 10 slowest

    if (slowResources.length > 0) {
      console.group('[Performance Debug] Slow Resources (>1s)')
      slowResources.forEach(resource => {
        console.log(`${resource.name}: ${resource.duration.toFixed(2)}ms`)
      })
      console.groupEnd()
    }

    // Check for render-blocking resources
    const renderBlocking = resources.filter(resource => 
      resource.renderBlockingStatus === 'blocking' ||
      (resource.name.includes('.css') && resource.startTime < 1000)
    )

    if (renderBlocking.length > 0) {
      console.group('[Performance Debug] Render-Blocking Resources')
      renderBlocking.forEach(resource => {
        console.log(`${resource.name}: ${resource.duration.toFixed(2)}ms`)
      })
      console.groupEnd()
    }
  })

  // Monitor long tasks (>50ms)
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`[Performance Debug] Long Task: ${entry.duration.toFixed(2)}ms`)
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      // Long task API not supported
    }
  }
}

/**
 * Monitor memory usage in development
 */
export function debugMemoryUsage(): void {
  if (typeof window === 'undefined' || 
      process.env.NODE_ENV !== 'development' ||
      !('memory' in performance)) {
    return
  }

  const memory = (performance as any).memory
  
  setInterval(() => {
    const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100
    const total = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100
    const limit = Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100
    
    console.log(`[Memory Debug] Used: ${used}MB, Total: ${total}MB, Limit: ${limit}MB`)
    
    if (used > limit * 0.8) {
      console.warn('[Memory Debug] High memory usage detected!')
    }
  }, 30000) // Check every 30 seconds
}

/**
 * Check for common performance issues
 */
export function checkPerformanceIssues(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  setTimeout(() => {
    const issues: string[] = []

    // Check for too many DOM nodes
    const nodeCount = document.querySelectorAll('*').length
    if (nodeCount > 1500) {
      issues.push(`Too many DOM nodes: ${nodeCount} (target: <1500)`)
    }

    // Check for large images without optimization
    const images = document.querySelectorAll('img')
    images.forEach((img, index) => {
      if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
        issues.push(`Large unoptimized image #${index}: ${img.naturalWidth}x${img.naturalHeight}`)
      }
    })

    // Check for synchronous scripts
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])')
    if (scripts.length > 0) {
      issues.push(`${scripts.length} synchronous script(s) found (should be async/defer)`)
    }

    // Check for missing preload hints
    const criticalResources = document.querySelectorAll('link[rel="stylesheet"], script[src]')
    const preloadHints = document.querySelectorAll('link[rel="preload"]')
    if (criticalResources.length > 3 && preloadHints.length === 0) {
      issues.push('No preload hints found for critical resources')
    }

    if (issues.length > 0) {
      console.group('[Performance Debug] Issues Found')
      issues.forEach(issue => console.warn(issue))
      console.groupEnd()
    }
  }, 2000) // Check after initial load
}

/**
 * Initialize all performance debugging
 */
export function initPerformanceDebug(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  debugPerformance()
  debugMemoryUsage()
  checkPerformanceIssues()
}