/**
 * Performance monitoring utilities
 * Tracks and reports performance metrics
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private marks: Map<string, number> = new Map()

  /**
   * Start measuring a performance metric
   */
  start(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * End measuring and record the metric
   */
  end(name: string): number | null {
    const startTime = this.marks.get(name)
    
    if (!startTime) {
      console.warn(`Performance mark "${name}" not found`)
      return null
    }

    const duration = performance.now() - startTime
    
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    })

    this.marks.delete(name)
    
    return duration
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    this.start(name)
    
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name)
    
    if (metrics.length === 0) return 0
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.marks.clear()
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (this.metrics.length === 0) {
      console.log('No performance metrics recorded')
      return
    }

    const summary = new Map<string, { count: number; total: number; avg: number }>()

    this.metrics.forEach((metric) => {
      const existing = summary.get(metric.name) || { count: 0, total: 0, avg: 0 }
      existing.count++
      existing.total += metric.duration
      existing.avg = existing.total / existing.count
      summary.set(metric.name, existing)
    })

    console.group('Performance Summary')
    summary.forEach((stats, name) => {
      console.log(
        `${name}: ${stats.avg.toFixed(2)}ms avg (${stats.count} calls, ${stats.total.toFixed(2)}ms total)`
      )
    })
    console.groupEnd()
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null

/**
 * Get the performance monitor singleton
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor()
  }
  return performanceMonitorInstance
}

/**
 * Hook for performance monitoring in React components
 */
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor()

  return {
    start: (name: string) => monitor.start(name),
    end: (name: string) => monitor.end(name),
    measure: <T,>(name: string, fn: () => T | Promise<T>) => monitor.measure(name, fn),
    getMetrics: () => monitor.getMetrics(),
    getAverageDuration: (name: string) => monitor.getAverageDuration(name),
    clear: () => monitor.clear(),
    logSummary: () => monitor.logSummary(),
  }
}

/**
 * Measure Web Vitals
 */
export function measureWebVitals(): void {
  if (typeof window === 'undefined') return

  // Measure FCP (First Contentful Paint)
  const paintEntries = performance.getEntriesByType('paint')
  const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint')
  
  if (fcpEntry) {
    console.log(`FCP: ${fcpEntry.startTime.toFixed(2)}ms`)
  }

  // Measure LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`)
      })
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (error) {
      console.warn('LCP measurement not supported')
    }
  }

  // Measure CLS (Cumulative Layout Shift)
  if ('PerformanceObserver' in window) {
    try {
      let clsScore = 0
      
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value
          }
        }
        console.log(`CLS: ${clsScore.toFixed(4)}`)
      })
      
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.warn('CLS measurement not supported')
    }
  }

  // Measure FID (First Input Delay)
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstInput = entries[0]
        const fid = (firstInput as any).processingStart - firstInput.startTime
        console.log(`FID: ${fid.toFixed(2)}ms`)
      })
      
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (error) {
      console.warn('FID measurement not supported')
    }
  }
}

/**
 * Log resource loading performance
 */
export function logResourcePerformance(): void {
  if (typeof window === 'undefined') return

  const resources = performance.getEntriesByType('resource')
  
  console.group('Resource Loading Performance')
  
  const byType = new Map<string, { count: number; totalSize: number; totalDuration: number }>()
  
  resources.forEach((resource: any) => {
    const type = resource.initiatorType || 'other'
    const existing = byType.get(type) || { count: 0, totalSize: 0, totalDuration: 0 }
    
    existing.count++
    existing.totalSize += resource.transferSize || 0
    existing.totalDuration += resource.duration || 0
    
    byType.set(type, existing)
  })
  
  byType.forEach((stats, type) => {
    console.log(
      `${type}: ${stats.count} resources, ${(stats.totalSize / 1024).toFixed(2)}KB, ${stats.totalDuration.toFixed(2)}ms`
    )
  })
  
  console.groupEnd()
}
