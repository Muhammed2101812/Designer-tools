/**
 * Performance alerting system with real-time notifications
 * Handles threshold violations and provides user feedback
 */

import { PerformanceAlert } from './core-web-vitals'

export interface AlertConfig {
  enableConsoleAlerts: boolean
  enableToastAlerts: boolean
  enableLocalStorage: boolean
  maxStoredAlerts: number
  alertCooldown: number // milliseconds
}

export interface StoredAlert extends PerformanceAlert {
  id: string
  acknowledged: boolean
}

const DEFAULT_CONFIG: AlertConfig = {
  enableConsoleAlerts: true,
  enableToastAlerts: process.env.NODE_ENV === 'development',
  enableLocalStorage: true,
  maxStoredAlerts: 50,
  alertCooldown: 5000 // 5 seconds
}

class PerformanceAlertManager {
  private config: AlertConfig
  private lastAlertTime: Map<string, number> = new Map()
  private toastFunction: ((message: string, type: 'warning' | 'error') => void) | null = null

  constructor(config?: Partial<AlertConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  public setToastFunction(toastFn: (message: string, type: 'warning' | 'error') => void): void {
    this.toastFunction = toastFn
  }

  public handleAlert(alert: PerformanceAlert): void {
    // Check cooldown to prevent spam
    const alertKey = `${alert.metric}-${alert.severity}`
    const lastTime = this.lastAlertTime.get(alertKey) || 0
    const now = Date.now()

    if (now - lastTime < this.config.alertCooldown) {
      return
    }

    this.lastAlertTime.set(alertKey, now)

    // Store alert
    if (this.config.enableLocalStorage) {
      this.storeAlert(alert)
    }

    // Console alert
    if (this.config.enableConsoleAlerts) {
      this.logConsoleAlert(alert)
    }

    // Toast alert (development only by default)
    if (this.config.enableToastAlerts && this.toastFunction) {
      this.showToastAlert(alert)
    }

    // Send to analytics/monitoring service
    this.sendToMonitoring(alert)
  }

  private storeAlert(alert: PerformanceAlert): void {
    try {
      const storedAlert: StoredAlert = {
        ...alert,
        id: `${alert.timestamp}-${alert.metric}`,
        acknowledged: false
      }

      const stored = this.getStoredAlerts()
      stored.unshift(storedAlert)

      // Keep only the most recent alerts
      const trimmed = stored.slice(0, this.config.maxStoredAlerts)
      
      localStorage.setItem('performance-alerts', JSON.stringify(trimmed))
    } catch (error) {
      console.error('[PerformanceAlerts] Error storing alert:', error)
    }
  }

  private logConsoleAlert(alert: PerformanceAlert): void {
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️'
    const metricName = alert.metric.toUpperCase()
    const message = `${emoji} Performance Alert: ${metricName} ${alert.value.toFixed(2)}ms exceeds ${alert.severity} threshold (${alert.threshold}ms)`
    
    if (alert.severity === 'critical') {
      console.error(message)
    } else {
      console.warn(message)
    }

    // Provide actionable advice
    this.logPerformanceAdvice(alert.metric as string, alert.severity)
  }

  private logPerformanceAdvice(metric: string, severity: string): void {
    const advice: Record<string, string[]> = {
      fcp: [
        '• Inline critical CSS to reduce render-blocking',
        '• Optimize font loading with font-display: swap',
        '• Remove unused CSS and JavaScript',
        '• Use resource hints (preload, prefetch)'
      ],
      lcp: [
        '• Optimize largest content element (images, text)',
        '• Use Next.js Image component for optimization',
        '• Implement lazy loading for below-fold content',
        '• Reduce server response times'
      ],
      cls: [
        '• Set explicit dimensions for images and videos',
        '• Reserve space for dynamic content',
        '• Avoid inserting content above existing content',
        '• Use CSS aspect-ratio for responsive elements'
      ],
      fid: [
        '• Break up long-running JavaScript tasks',
        '• Use code splitting and lazy loading',
        '• Optimize third-party scripts',
        '• Consider using Web Workers for heavy computations'
      ],
      tti: [
        '• Reduce JavaScript bundle size',
        '• Implement progressive loading',
        '• Optimize critical rendering path',
        '• Use service workers for caching'
      ]
    }

    const suggestions = advice[metric as keyof typeof advice]
    if (suggestions) {
      console.group(`💡 Suggestions to improve ${metric.toUpperCase()}:`)
      suggestions.forEach(suggestion => console.log(suggestion))
      console.groupEnd()
    }
  }

  private showToastAlert(alert: PerformanceAlert): void {
    if (!this.toastFunction) return

    const metricName = alert.metric.toUpperCase()
    const message = `${metricName}: ${alert.value.toFixed(0)}ms (${alert.severity})`
    
    this.toastFunction(message, alert.severity === 'critical' ? 'error' : 'warning')
  }

  private sendToMonitoring(alert: PerformanceAlert): void {
    // Send to external monitoring service (Sentry, DataDog, etc.)
    if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
      try {
        const Sentry = (window as any).Sentry
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `Performance alert: ${alert.metric}`,
          level: alert.severity === 'critical' ? 'error' : 'warning',
          data: {
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold,
            url: alert.url
          }
        })

        if (alert.severity === 'critical') {
          Sentry.captureMessage(`Critical performance issue: ${alert.metric}`, 'error')
        }
      } catch (error) {
        console.error('[PerformanceAlerts] Error sending to Sentry:', error)
      }
    }

    // Send to custom analytics endpoint
    this.sendToAnalytics(alert)
  }

  private async sendToAnalytics(alert: PerformanceAlert): Promise<void> {
    try {
      // Only send in production to avoid development noise
      if (process.env.NODE_ENV !== 'production') {
        return
      }

      await fetch('/api/analytics/performance-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...alert,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          connection: (navigator as any).connection ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink
          } : null
        })
      })
    } catch (error) {
      // Silently fail - don't let analytics errors affect user experience
      console.debug('[PerformanceAlerts] Analytics request failed:', error)
    }
  }

  public getStoredAlerts(): StoredAlert[] {
    try {
      const stored = localStorage.getItem('performance-alerts')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('[PerformanceAlerts] Error reading stored alerts:', error)
      return []
    }
  }

  public acknowledgeAlert(alertId: string): void {
    try {
      const alerts = this.getStoredAlerts()
      const alert = alerts.find(a => a.id === alertId)
      if (alert) {
        alert.acknowledged = true
        localStorage.setItem('performance-alerts', JSON.stringify(alerts))
      }
    } catch (error) {
      console.error('[PerformanceAlerts] Error acknowledging alert:', error)
    }
  }

  public clearAlerts(): void {
    try {
      localStorage.removeItem('performance-alerts')
    } catch (error) {
      console.error('[PerformanceAlerts] Error clearing alerts:', error)
    }
  }

  public getUnacknowledgedAlerts(): StoredAlert[] {
    return this.getStoredAlerts().filter(alert => !alert.acknowledged)
  }

  public updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Global instance
let globalAlertManager: PerformanceAlertManager | null = null

export function initPerformanceAlerts(config?: Partial<AlertConfig>): PerformanceAlertManager {
  if (globalAlertManager) {
    globalAlertManager.updateConfig(config || {})
    return globalAlertManager
  }

  globalAlertManager = new PerformanceAlertManager(config)
  return globalAlertManager
}

export function getPerformanceAlertManager(): PerformanceAlertManager | null {
  return globalAlertManager
}

export function setToastFunction(toastFn: (message: string, type: 'warning' | 'error') => void): void {
  if (globalAlertManager) {
    globalAlertManager.setToastFunction(toastFn)
  }
}