'use client'

import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { initPerformanceMonitoring } from '@/lib/utils/performance'
import { initPerformanceDebug } from '@/lib/utils/performance-debug'
import { initDevelopmentOptimizations } from '@/lib/utils/development-optimizations'
import { initCoreWebVitalsMonitoring } from '@/lib/utils/core-web-vitals'
import { initPerformanceAlerts, setToastFunction } from '@/lib/utils/performance-alerts'
import { initPerformanceDashboard } from '@/lib/utils/performance-dashboard'

/**
 * Enhanced performance monitoring component
 * Initializes Core Web Vitals tracking, real-time alerts, and performance dashboard
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      // Lightweight monitoring for development
      if (process.env.NODE_ENV === 'development') {
        // Only basic Core Web Vitals monitoring in development
        const vitalsMonitor = initCoreWebVitalsMonitoring()
        
        // Minimal alerts - only console, no toast spam
        const alertManager = initPerformanceAlerts({
          enableToastAlerts: false, // Disable toast alerts in dev
          enableConsoleAlerts: true,
          enableLocalStorage: false // Disable localStorage in dev
        })
        
        // Connect alerts to monitoring
        vitalsMonitor.onAlert((alert) => {
          // Only log severe performance issues
          if (alert.severity === 'error' || alert.value > 5000) {
            alertManager.handleAlert(alert)
          }
        })
        
        // Cleanup function
        return () => {
          vitalsMonitor.destroy()
        }
      } else {
        // Full monitoring for production
        initPerformanceMonitoring()
        
        const vitalsMonitor = initCoreWebVitalsMonitoring()
        
        const alertManager = initPerformanceAlerts({
          enableToastAlerts: false, // No toast alerts in production either
          enableConsoleAlerts: false,
          enableLocalStorage: true
        })
        
        setToastFunction((message: string, type: 'warning' | 'error') => {
          // Only log to console in production
          console.warn(`Performance: ${message}`)
        })
        
        vitalsMonitor.onAlert((alert) => {
          alertManager.handleAlert(alert)
        })
        
        const dashboard = initPerformanceDashboard()
        
        const recordSession = () => {
          const metrics = vitalsMonitor.getMetrics()
          dashboard.recordSession(metrics)
        }
        
        // Delayed session recording
        setTimeout(recordSession, 3000)
        window.addEventListener('beforeunload', recordSession)
        
        return () => {
          vitalsMonitor.destroy()
          window.removeEventListener('beforeunload', recordSession)
        }
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}
