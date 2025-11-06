/**
 * Performance monitoring utilities
 * Helps track and optimize Core Web Vitals
 */

/**
 * Measures First Contentful Paint (FCP)
 * Target: < 1.5s
 */
export function measureFCP(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const fcpTime = entry.startTime
          
          // Log FCP time in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] FCP: ${fcpTime.toFixed(2)}ms`)
            
            if (fcpTime > 1500) {
              console.warn(`[Performance] FCP exceeds target (1500ms): ${fcpTime.toFixed(2)}ms`)
            }
          }
          
          // Disconnect observer after measurement
          observer.disconnect()
        }
      }
    })

    observer.observe({ entryTypes: ['paint'] })
  } catch (error) {
    console.error('[Performance] Error measuring FCP:', error)
  }
}

/**
 * Measures Largest Contentful Paint (LCP)
 * Target: < 2.5s
 */
export function measureLCP(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      if (lastEntry) {
        const lcpTime = lastEntry.startTime
        
        // Log LCP time in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] LCP: ${lcpTime.toFixed(2)}ms`)
          
          if (lcpTime > 2500) {
            console.warn(`[Performance] LCP exceeds target (2500ms): ${lcpTime.toFixed(2)}ms`)
          }
        }
      }
    })

    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch (error) {
    console.error('[Performance] Error measuring LCP:', error)
  }
}

/**
 * Measures Time to Interactive (TTI)
 * Target: < 3.5s
 */
export function measureTTI(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Use load event as a proxy for TTI
    window.addEventListener('load', () => {
      const ttiTime = performance.now()
      
      // Log TTI time in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] TTI (approx): ${ttiTime.toFixed(2)}ms`)
        
        if (ttiTime > 3500) {
          console.warn(`[Performance] TTI exceeds target (3500ms): ${ttiTime.toFixed(2)}ms`)
        }
      }
    })
  } catch (error) {
    console.error('[Performance] Error measuring TTI:', error)
  }
}

/**
 * Measures custom timing for specific operations
 * @param label - Label for the measurement
 * @param fn - Function to measure
 * @returns Result of the function
 */
export async function measureOperation<T>(
  label: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await fn()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Log operation time in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
      
      // Warn if color extraction takes > 100ms
      if (label.includes('Color Extraction') && duration > 100) {
        console.warn(`[Performance] ${label} exceeds target (100ms): ${duration.toFixed(2)}ms`)
      }
    }
    
    return result
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms:`, error)
    throw error
  }
}

/**
 * Initialize all performance measurements
 * Call this in the root layout or app component
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') {
    return
  }

  measureFCP()
  measureLCP()
  measureTTI()
}
