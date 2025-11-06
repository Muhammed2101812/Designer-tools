/**
 * Tests for performance monitoring system
 * Validates Core Web Vitals tracking, alerting, and dashboard functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  initCoreWebVitalsMonitoring, 
  getCoreWebVitalsMonitor,
  destroyCoreWebVitalsMonitoring,
  DEFAULT_THRESHOLDS,
  type PerformanceAlert
} from '../core-web-vitals'
import { 
  initPerformanceAlerts, 
  getPerformanceAlertManager 
} from '../performance-alerts'
import { 
  initPerformanceDashboard, 
  getPerformanceDashboard 
} from '../performance-dashboard'

// Mock browser APIs
const mockPerformanceObserver = vi.fn()
const mockPerformanceEntry = {
  name: 'first-contentful-paint',
  startTime: 1200,
  entryType: 'paint'
}

// Mock window and performance APIs
Object.defineProperty(global, 'window', {
  value: {
    PerformanceObserver: mockPerformanceObserver,
    performance: {
      now: () => 1500,
      getEntriesByType: (type: string) => {
        if (type === 'navigation') {
          return [{
            navigationStart: 0,
            domContentLoadedEventEnd: 1400,
            loadEventEnd: 1500,
            loadEventStart: 1450
          }]
        }
        if (type === 'resource') {
          return [
            { name: 'script.js', duration: 100, transferSize: 50000 },
            { name: 'style.css', duration: 50, transferSize: 10000 }
          ]
        }
        return []
      }
    },
    location: { href: 'http://localhost:3000/test' },
    navigator: { userAgent: 'test-agent' },
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('Core Web Vitals Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    destroyCoreWebVitalsMonitoring()
  })

  afterEach(() => {
    destroyCoreWebVitalsMonitoring()
  })

  it('should initialize monitoring with default thresholds', () => {
    const monitor = initCoreWebVitalsMonitoring()
    
    expect(monitor).toBeDefined()
    expect(getCoreWebVitalsMonitor()).toBe(monitor)
    
    const thresholds = monitor.getThresholds()
    expect(thresholds).toEqual(DEFAULT_THRESHOLDS)
  })

  it('should initialize monitoring with custom thresholds', () => {
    const customThresholds = {
      fcp: { good: 1000, poor: 2000 },
      lcp: { good: 2000, poor: 3000 }
    }
    
    const monitor = initCoreWebVitalsMonitoring(customThresholds)
    const thresholds = monitor.getThresholds()
    
    expect(thresholds.fcp).toEqual(customThresholds.fcp)
    expect(thresholds.lcp).toEqual(customThresholds.lcp)
    expect(thresholds.cls).toEqual(DEFAULT_THRESHOLDS.cls) // Should keep defaults for others
  })

  it('should track performance metrics', () => {
    const monitor = initCoreWebVitalsMonitoring()
    const metrics = monitor.getMetrics()
    
    expect(metrics).toHaveProperty('fcp')
    expect(metrics).toHaveProperty('lcp')
    expect(metrics).toHaveProperty('cls')
    expect(metrics).toHaveProperty('fid')
    expect(metrics).toHaveProperty('tti')
    expect(metrics).toHaveProperty('timestamp')
  })

  it('should trigger alerts for threshold violations', async () => {
    const alerts: PerformanceAlert[] = []
    
    // Mock PerformanceObserver to simulate threshold violation
    const mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn()
    }
    
    mockPerformanceObserver.mockImplementation((callback) => {
      // Immediately trigger callback with high FCP value
      process.nextTick(() => {
        callback({
          getEntries: () => [{
            name: 'first-contentful-paint',
            startTime: 4000 // Exceeds poor threshold (3000ms)
          }]
        })
      })
      
      return mockObserver
    })

    const monitor = initCoreWebVitalsMonitoring()
    monitor.onAlert((alert) => {
      alerts.push(alert)
    })

    // Wait for the async callback to execute
    await new Promise(resolve => setTimeout(resolve, 50))
    
    expect(alerts.length).toBeGreaterThan(0)
    if (alerts.length > 0) {
      expect(alerts[0].metric).toBe('fcp')
      expect(alerts[0].severity).toBe('critical')
      expect(alerts[0].value).toBe(4000)
    }
  })

  it('should update thresholds dynamically', () => {
    const monitor = initCoreWebVitalsMonitoring()
    
    const newThresholds = {
      fcp: { good: 800, poor: 1600 }
    }
    
    monitor.updateThresholds(newThresholds)
    const updatedThresholds = monitor.getThresholds()
    
    expect(updatedThresholds.fcp).toEqual(newThresholds.fcp)
  })

  it('should clean up observers on destroy', () => {
    const monitor = initCoreWebVitalsMonitoring()
    expect(monitor).toBeDefined()
    
    destroyCoreWebVitalsMonitoring()
    expect(getCoreWebVitalsMonitor()).toBeNull()
  })
})

describe('Performance Alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should initialize alert manager with default config', () => {
    const alertManager = initPerformanceAlerts()
    
    expect(alertManager).toBeDefined()
    expect(getPerformanceAlertManager()).toBe(alertManager)
  })

  it('should store alerts in localStorage', () => {
    const alertManager = initPerformanceAlerts()
    
    const mockAlert: PerformanceAlert = {
      metric: 'fcp',
      value: 2000,
      threshold: 1500,
      severity: 'warning',
      timestamp: Date.now(),
      url: 'http://localhost:3000/test'
    }

    alertManager.handleAlert(mockAlert)
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'performance-alerts',
      expect.stringContaining('"metric":"fcp"')
    )
  })

  it('should respect alert cooldown', () => {
    // Mock localStorage to return empty array initially
    mockLocalStorage.getItem.mockReturnValue('[]')
    
    const alertManager = initPerformanceAlerts({ 
      alertCooldown: 1000,
      enableLocalStorage: true 
    })
    
    const mockAlert: PerformanceAlert = {
      metric: 'fcp',
      value: 2000,
      threshold: 1500,
      severity: 'warning',
      timestamp: Date.now(),
      url: 'http://localhost:3000/test'
    }

    // First alert should be processed
    alertManager.handleAlert(mockAlert)
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1)

    // Second alert within cooldown should be ignored
    alertManager.handleAlert(mockAlert)
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1) // Still only called once
  })

  it('should retrieve stored alerts', () => {
    const storedAlerts = [
      {
        id: 'test-1',
        metric: 'fcp',
        value: 2000,
        threshold: 1500,
        severity: 'warning',
        timestamp: Date.now(),
        url: 'http://localhost:3000/test',
        acknowledged: false
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAlerts))
    
    const alertManager = initPerformanceAlerts()
    const alerts = alertManager.getStoredAlerts()
    
    expect(alerts).toEqual(storedAlerts)
  })

  it('should acknowledge alerts', () => {
    const storedAlerts = [
      {
        id: 'test-1',
        metric: 'fcp',
        value: 2000,
        threshold: 1500,
        severity: 'warning',
        timestamp: Date.now(),
        url: 'http://localhost:3000/test',
        acknowledged: false
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAlerts))
    
    const alertManager = initPerformanceAlerts()
    alertManager.acknowledgeAlert('test-1')
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'performance-alerts',
      expect.stringContaining('"acknowledged":true')
    )
  })
})

describe('Performance Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should initialize dashboard', () => {
    const dashboard = initPerformanceDashboard()
    
    expect(dashboard).toBeDefined()
    expect(getPerformanceDashboard()).toBe(dashboard)
  })

  it('should record performance sessions', () => {
    const dashboard = initPerformanceDashboard()
    
    const mockMetrics = {
      fcp: 1200,
      lcp: 2000,
      tti: 3000,
      cls: 0.05,
      fid: 80,
      timestamp: Date.now()
    }

    dashboard.recordSession(mockMetrics)
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'performance-sessions',
      expect.stringContaining('"fcp":1200')
    )
  })

  it('should generate performance reports', () => {
    const sessions = [
      {
        id: 'session-1',
        timestamp: Date.now() - 1000,
        url: 'http://localhost:3000/test',
        userAgent: 'test-agent',
        viewport: { width: 1920, height: 1080 },
        metrics: {
          fcp: 1200,
          lcp: 2000,
          tti: 3000,
          cls: 0.05,
          fid: 80,
          timestamp: Date.now()
        },
        loadTime: 1500,
        resourceCount: 10,
        transferSize: 100000
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessions))
    
    const dashboard = initPerformanceDashboard()
    const report = dashboard.generateReport(7)
    
    expect(report).toHaveProperty('sessions')
    expect(report).toHaveProperty('trends')
    expect(report).toHaveProperty('summary')
    expect(report.sessions).toHaveLength(1)
    expect(report.summary.totalSessions).toBe(1)
  })

  it('should calculate performance trends', () => {
    const sessions = [
      {
        id: 'session-1',
        timestamp: Date.now() - 2000,
        url: 'http://localhost:3000/test',
        userAgent: 'test-agent',
        viewport: { width: 1920, height: 1080 },
        metrics: {
          fcp: 1000,
          lcp: 2000,
          tti: 3000,
          cls: 0.05,
          fid: 80,
          timestamp: Date.now() - 2000
        },
        loadTime: 1500,
        resourceCount: 10,
        transferSize: 100000
      },
      {
        id: 'session-2',
        timestamp: Date.now() - 1000,
        url: 'http://localhost:3000/test',
        userAgent: 'test-agent',
        viewport: { width: 1920, height: 1080 },
        metrics: {
          fcp: 1200,
          lcp: 2200,
          tti: 3200,
          cls: 0.06,
          fid: 90,
          timestamp: Date.now() - 1000
        },
        loadTime: 1600,
        resourceCount: 12,
        transferSize: 110000
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessions))
    
    const dashboard = initPerformanceDashboard()
    const trends = dashboard.calculateTrends(sessions)
    
    expect(trends).toHaveLength(5) // fcp, lcp, tti, cls, fid
    
    const fcpTrend = trends.find(t => t.metric === 'fcp')
    expect(fcpTrend).toBeDefined()
    expect(fcpTrend?.values).toHaveLength(2)
    expect(fcpTrend?.average).toBe(1100) // (1000 + 1200) / 2
  })

  it('should export performance data', () => {
    const dashboard = initPerformanceDashboard()
    const exportData = dashboard.exportData()
    
    expect(exportData).toContain('exportDate')
    expect(exportData).toContain('sessions')
    expect(exportData).toContain('alerts')
    
    // Should be valid JSON
    expect(() => JSON.parse(exportData)).not.toThrow()
  })

  it('should clear all data', () => {
    const dashboard = initPerformanceDashboard()
    dashboard.clearData()
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('performance-sessions')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('performance-alerts')
  })
})