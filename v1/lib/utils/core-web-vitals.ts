/**
 * Core Web Vitals monitoring with real-time alerts
 * Tracks FCP, LCP, TTI, CLS, FID and provides threshold-based alerting
 */

export interface CoreWebVitals {
  fcp: number | null
  lcp: number | null
  tti: number | null
  cls: number | null
  fid: number | null
  timestamp: number
}

export interface PerformanceThresholds {
  fcp: { good: number; poor: number }
  lcp: { good: number; poor: number }
  tti: { good: number; poor: number }
  cls: { good: number; poor: number }
  fid: { good: number; poor: number }
}

export interface PerformanceAlert {
  metric: keyof CoreWebVitals
  value: number
  threshold: number
  severity: 'warning' | 'critical'
  timestamp: number
  url: string
}

// Performance thresholds based on Core Web Vitals standards
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fcp: { good: 1500, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  tti: { good: 3500, poor: 5000 },
  cls: { good: 0.1, poor: 0.25 },
  fid: { good: 100, poor: 300 }
}

class CoreWebVitalsMonitor {
  private metrics: CoreWebVitals = {
    fcp: null,
    lcp: null,
    tti: null,
    cls: null,
    fid: null,
    timestamp: Date.now()
  }

  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = []
  private observers: PerformanceObserver[] = []

  constructor(customThresholds?: Partial<PerformanceThresholds>) {
    if (customThresholds) {
      this.thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds }
    }
    
    // Only initialize monitoring in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CORE_WEB_VITALS === 'true') {
      this.initializeMonitoring()
    }
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    this.measureFCP()
    this.measureLCP()
    this.measureCLS()
    this.measureFID()
    this.measureTTI()
  }

  private measureFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime
            this.checkThreshold('fcp', entry.startTime)
            observer.disconnect()
          }
        }
      })

      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    } catch (error) {
      console.error('[CoreWebVitals] Error measuring FCP:', error)
    }
  }

  private measureLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime
          this.checkThreshold('lcp', lastEntry.startTime)
        }
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    } catch (error) {
      console.error('[CoreWebVitals] Error measuring LCP:', error)
    }
  }

  private measureCLS(): void {
    try {
      let clsValue = 0
      let sessionValue = 0
      let sessionEntries: PerformanceEntry[] = []

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only count layout shifts without recent user input
          if (!(entry as any).hadRecentInput) {
            const firstSessionEntry = sessionEntries[0]
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

            // If the entry occurred less than 1 second after the previous entry and
            // less than 5 seconds after the first entry in the session, include it
            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += (entry as any).value
              sessionEntries.push(entry)
            } else {
              sessionValue = (entry as any).value
              sessionEntries = [entry]
            }

            // If the current session value is larger than the current CLS value,
            // update CLS and the entries contributing to it.
            if (sessionValue > clsValue) {
              clsValue = sessionValue
              this.metrics.cls = clsValue
              this.checkThreshold('cls', clsValue)
            }
          }
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    } catch (error) {
      console.error('[CoreWebVitals] Error measuring CLS:', error)
    }
  }

  private measureFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.fid = (entry as any).processingStart - entry.startTime
          this.checkThreshold('fid', this.metrics.fid)
          observer.disconnect()
        }
      })

      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    } catch (error) {
      console.error('[CoreWebVitals] Error measuring FID:', error)
    }
  }

  private measureTTI(): void {
    // TTI is complex to measure accurately, using load event as approximation
    if (document.readyState === 'complete') {
      this.setTTI()
    } else {
      window.addEventListener('load', () => this.setTTI())
    }
  }

  private setTTI(): void {
    // Use navigation timing to approximate TTI
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const tti = navigation.domContentLoadedEventEnd - navigation.fetchStart
      this.metrics.tti = tti
      this.checkThreshold('tti', tti)
    }
  }

  private checkThreshold(metric: keyof CoreWebVitals, value: number): void {
    if (metric === 'timestamp') return

    const threshold = this.thresholds[metric]
    let severity: 'warning' | 'critical' | null = null

    if (value > threshold.poor) {
      severity = 'critical'
    } else if (value > threshold.good) {
      severity = 'warning'
    }

    if (severity) {
      const alert: PerformanceAlert = {
        metric,
        value,
        threshold: severity === 'critical' ? threshold.poor : threshold.good,
        severity,
        timestamp: Date.now(),
        url: window.location.href
      }

      this.triggerAlert(alert)
    }

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      const status = severity ? `❌ ${severity.toUpperCase()}` : '✅ GOOD'
      console.log(`[CoreWebVitals] ${metric.toUpperCase()}: ${value.toFixed(2)}ms ${status}`)
    }
  }

  private triggerAlert(alert: PerformanceAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('[CoreWebVitals] Error in alert callback:', error)
      }
    })
  }

  public onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback)
  }

  public getMetrics(): CoreWebVitals {
    return { ...this.metrics }
  }

  public getThresholds(): PerformanceThresholds {
    return { ...this.thresholds }
  }

  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.alertCallbacks = []
  }
}

// Global instance
let globalMonitor: CoreWebVitalsMonitor | null = null

export function initCoreWebVitalsMonitoring(
  thresholds?: Partial<PerformanceThresholds>
): CoreWebVitalsMonitor {
  if (typeof window === 'undefined') {
    throw new Error('Core Web Vitals monitoring can only be initialized in the browser')
  }

  if (globalMonitor) {
    globalMonitor.destroy()
  }

  globalMonitor = new CoreWebVitalsMonitor(thresholds)
  return globalMonitor
}

export function getCoreWebVitalsMonitor(): CoreWebVitalsMonitor | null {
  return globalMonitor
}

export function destroyCoreWebVitalsMonitoring(): void {
  if (globalMonitor) {
    globalMonitor.destroy()
    globalMonitor = null
  }
}