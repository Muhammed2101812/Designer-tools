/**
 * Performance dashboard utilities for tracking metrics over time
 * Provides data collection and visualization helpers
 */

import { CoreWebVitals } from './core-web-vitals'
import { StoredAlert } from './performance-alerts'

export interface PerformanceSession {
  id: string
  timestamp: number
  url: string
  userAgent: string
  viewport: { width: number; height: number }
  connection?: {
    effectiveType: string
    downlink: number
  }
  metrics: CoreWebVitals
  loadTime: number
  resourceCount: number
  transferSize: number
}

export interface PerformanceTrend {
  metric: keyof CoreWebVitals
  values: { timestamp: number; value: number }[]
  average: number
  trend: 'improving' | 'degrading' | 'stable'
  changePercent: number
}

export interface PerformanceReport {
  period: { start: number; end: number }
  sessions: PerformanceSession[]
  trends: PerformanceTrend[]
  alerts: StoredAlert[]
  summary: {
    totalSessions: number
    averageLoadTime: number
    alertCount: number
    worstMetric: { metric: keyof CoreWebVitals; value: number }
    bestMetric: { metric: keyof CoreWebVitals; value: number }
  }
}

class PerformanceDashboard {
  private maxSessions: number = 100
  private storageKey: string = 'performance-sessions'

  public recordSession(metrics: CoreWebVitals): void {
    try {
      const session: PerformanceSession = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: this.getConnectionInfo(),
        metrics,
        loadTime: this.calculateLoadTime(),
        resourceCount: this.getResourceCount(),
        transferSize: this.getTransferSize()
      }

      this.storeSession(session)
    } catch (error) {
      console.error('[PerformanceDashboard] Error recording session:', error)
    }
  }

  private getConnectionInfo() {
    const connection = (navigator as any).connection
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0
      }
    }
    return undefined
  }

  private calculateLoadTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      return navigation.loadEventEnd - navigation.navigationStart
    }
    return 0
  }

  private getResourceCount(): number {
    return performance.getEntriesByType('resource').length
  }

  private getTransferSize(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    return resources.reduce((total, resource) => {
      return total + (resource.transferSize || 0)
    }, 0)
  }

  private storeSession(session: PerformanceSession): void {
    try {
      const sessions = this.getSessions()
      sessions.unshift(session)

      // Keep only the most recent sessions
      const trimmed = sessions.slice(0, this.maxSessions)
      
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed))
    } catch (error) {
      console.error('[PerformanceDashboard] Error storing session:', error)
    }
  }

  public getSessions(): PerformanceSession[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('[PerformanceDashboard] Error reading sessions:', error)
      return []
    }
  }

  public getSessionsInPeriod(startTime: number, endTime: number): PerformanceSession[] {
    return this.getSessions().filter(
      session => session.timestamp >= startTime && session.timestamp <= endTime
    )
  }

  public calculateTrends(sessions: PerformanceSession[]): PerformanceTrend[] {
    const metrics: (keyof CoreWebVitals)[] = ['fcp', 'lcp', 'tti', 'cls', 'fid']
    
    return metrics.map(metric => {
      const values = sessions
        .filter(session => session.metrics[metric] !== null)
        .map(session => ({
          timestamp: session.timestamp,
          value: session.metrics[metric]!
        }))
        .sort((a, b) => a.timestamp - b.timestamp)

      if (values.length === 0) {
        return {
          metric,
          values: [],
          average: 0,
          trend: 'stable' as const,
          changePercent: 0
        }
      }

      const average = values.reduce((sum, v) => sum + v.value, 0) / values.length
      
      // Calculate trend based on first and last quartile
      const quartileSize = Math.floor(values.length / 4)
      if (quartileSize === 0) {
        return {
          metric,
          values,
          average,
          trend: 'stable' as const,
          changePercent: 0
        }
      }

      const firstQuartile = values.slice(0, quartileSize)
      const lastQuartile = values.slice(-quartileSize)
      
      const firstAvg = firstQuartile.reduce((sum, v) => sum + v.value, 0) / firstQuartile.length
      const lastAvg = lastQuartile.reduce((sum, v) => sum + v.value, 0) / lastQuartile.length
      
      const changePercent = ((lastAvg - firstAvg) / firstAvg) * 100
      
      let trend: 'improving' | 'degrading' | 'stable'
      if (Math.abs(changePercent) < 5) {
        trend = 'stable'
      } else if (changePercent < 0) {
        trend = 'improving' // Lower values are better for performance metrics
      } else {
        trend = 'degrading'
      }

      return {
        metric,
        values,
        average,
        trend,
        changePercent: Math.abs(changePercent)
      }
    })
  }

  public generateReport(days: number = 7): PerformanceReport {
    const endTime = Date.now()
    const startTime = endTime - (days * 24 * 60 * 60 * 1000)
    
    const sessions = this.getSessionsInPeriod(startTime, endTime)
    const trends = this.calculateTrends(sessions)
    
    // Get alerts from the same period
    const alerts = this.getAlertsInPeriod(startTime, endTime)
    
    // Calculate summary statistics
    const summary = this.calculateSummary(sessions, alerts)

    return {
      period: { start: startTime, end: endTime },
      sessions,
      trends,
      alerts,
      summary
    }
  }

  private getAlertsInPeriod(startTime: number, endTime: number): StoredAlert[] {
    try {
      const stored = localStorage.getItem('performance-alerts')
      const alerts: StoredAlert[] = stored ? JSON.parse(stored) : []
      
      return alerts.filter(
        alert => alert.timestamp >= startTime && alert.timestamp <= endTime
      )
    } catch (error) {
      console.error('[PerformanceDashboard] Error reading alerts:', error)
      return []
    }
  }

  private calculateSummary(sessions: PerformanceSession[], alerts: StoredAlert[]) {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageLoadTime: 0,
        alertCount: 0,
        worstMetric: { metric: 'fcp' as const, value: 0 },
        bestMetric: { metric: 'fcp' as const, value: 0 }
      }
    }

    const averageLoadTime = sessions.reduce((sum, s) => sum + s.loadTime, 0) / sessions.length
    
    // Find worst and best metrics
    const metrics: (keyof CoreWebVitals)[] = ['fcp', 'lcp', 'tti', 'cls', 'fid']
    let worstMetric = { metric: 'fcp' as keyof CoreWebVitals, value: 0 }
    let bestMetric = { metric: 'fcp' as keyof CoreWebVitals, value: Infinity }

    metrics.forEach(metric => {
      const values = sessions
        .map(s => s.metrics[metric])
        .filter(v => v !== null) as number[]
      
      if (values.length > 0) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length
        
        if (avg > worstMetric.value) {
          worstMetric = { metric, value: avg }
        }
        
        if (avg < bestMetric.value) {
          bestMetric = { metric, value: avg }
        }
      }
    })

    return {
      totalSessions: sessions.length,
      averageLoadTime,
      alertCount: alerts.length,
      worstMetric,
      bestMetric
    }
  }

  public exportData(): string {
    const sessions = this.getSessions()
    const alerts = this.getAlertsInPeriod(0, Date.now())
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      sessions,
      alerts
    }, null, 2)
  }

  public clearData(): void {
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem('performance-alerts')
    } catch (error) {
      console.error('[PerformanceDashboard] Error clearing data:', error)
    }
  }

  public getMetricHistory(metric: keyof CoreWebVitals, days: number = 30): { timestamp: number; value: number }[] {
    const endTime = Date.now()
    const startTime = endTime - (days * 24 * 60 * 60 * 1000)
    
    const sessions = this.getSessionsInPeriod(startTime, endTime)
    
    return sessions
      .filter(session => session.metrics[metric] !== null)
      .map(session => ({
        timestamp: session.timestamp,
        value: session.metrics[metric]!
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }
}

// Global instance
let globalDashboard: PerformanceDashboard | null = null

export function initPerformanceDashboard(): PerformanceDashboard {
  if (!globalDashboard) {
    globalDashboard = new PerformanceDashboard()
  }
  return globalDashboard
}

export function getPerformanceDashboard(): PerformanceDashboard | null {
  return globalDashboard
}