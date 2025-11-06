/**
 * Long Task Monitor for detecting and optimizing main thread blocking operations
 * Helps identify performance bottlenecks that cause poor user experience
 */

interface LongTask {
  name: string
  duration: number
  startTime: number
  endTime: number
  stack?: string
}

interface LongTaskThresholds {
  warning: number // ms
  critical: number // ms
}

class LongTaskMonitor {
  private tasks: LongTask[] = []
  private observer: PerformanceObserver | null = null
  private thresholds: LongTaskThresholds = {
    warning: 50, // 50ms - noticeable delay
    critical: 100 // 100ms - significant delay
  }
  private maxTasks = 100
  private callbacks: Set<(task: LongTask) => void> = new Set()

  constructor() {
    // Only initialize in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_LONG_TASK_MONITOR === 'true') {
      this.initializeObserver()
    }
  }

  /**
   * Initialize the PerformanceObserver for long tasks
   */
  private initializeObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          if (entry.entryType === 'longtask') {
            const task: LongTask = {
              name: entry.name || 'unknown',
              duration: entry.duration,
              startTime: entry.startTime,
              endTime: entry.startTime + entry.duration
            }
            
            this.recordTask(task)
          }
        })
      })

      this.observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      console.warn('Long Task API not supported:', error)
    }
  }

  /**
   * Record a long task manually
   */
  recordTask(task: LongTask): void {
    // Add to tasks array
    this.tasks.push(task)
    
    // Keep only the most recent tasks
    if (this.tasks.length > this.maxTasks) {
      this.tasks.shift()
    }

    // Log warning for long tasks
    if (task.duration >= this.thresholds.warning) {
      const level = task.duration >= this.thresholds.critical ? 'error' : 'warn'
      console[level](
        `[Performance] Long task detected: ${task.name} took ${task.duration.toFixed(2)}ms`,
        task
      )
    }

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(task)
      } catch (error) {
        console.error('Error in long task callback:', error)
      }
    })
  }

  /**
   * Measure and record a function execution
   */
  measure<T>(name: string, fn: () => T): T {
    const startTime = performance.now()
    
    try {
      const result = fn()
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - startTime
          if (duration >= this.thresholds.warning) {
            this.recordTask({
              name,
              duration,
              startTime,
              endTime: performance.now(),
              stack: new Error().stack
            })
          }
        }) as T
      }
      
      const duration = performance.now() - startTime
      if (duration >= this.thresholds.warning) {
        this.recordTask({
          name,
          duration,
          startTime,
          endTime: performance.now(),
          stack: new Error().stack
        })
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordTask({
        name: `${name} (error)`,
        duration,
        startTime,
        endTime: performance.now(),
        stack: new Error().stack
      })
      throw error
    }
  }

  /**
   * Add a callback for long task notifications
   */
  onLongTask(callback: (task: LongTask) => void): () => void {
    this.callbacks.add(callback)
    
    // Return cleanup function
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Get all recorded long tasks
   */
  getTasks(): LongTask[] {
    return [...this.tasks]
  }

  /**
   * Get tasks above a certain duration threshold
   */
  getTasksAboveThreshold(threshold: number): LongTask[] {
    return this.tasks.filter(task => task.duration >= threshold)
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalTasks: number
    averageDuration: number
    maxDuration: number
    tasksAboveWarning: number
    tasksAboveCritical: number
  } {
    if (this.tasks.length === 0) {
      return {
        totalTasks: 0,
        averageDuration: 0,
        maxDuration: 0,
        tasksAboveWarning: 0,
        tasksAboveCritical: 0
      }
    }

    const totalDuration = this.tasks.reduce((sum, task) => sum + task.duration, 0)
    const maxDuration = Math.max(...this.tasks.map(task => task.duration))
    const tasksAboveWarning = this.tasks.filter(task => task.duration >= this.thresholds.warning).length
    const tasksAboveCritical = this.tasks.filter(task => task.duration >= this.thresholds.critical).length

    return {
      totalTasks: this.tasks.length,
      averageDuration: totalDuration / this.tasks.length,
      maxDuration,
      tasksAboveWarning,
      tasksAboveCritical
    }
  }

  /**
   * Clear all recorded tasks
   */
  clear(): void {
    this.tasks = []
  }

  /**
   * Update thresholds for warning and critical levels
   */
  setThresholds(thresholds: Partial<LongTaskThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  /**
   * Disconnect the observer
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// Global monitor instance
let longTaskMonitor: LongTaskMonitor | null = null

/**
 * Get the global long task monitor instance
 */
export function getLongTaskMonitor(): LongTaskMonitor {
  if (!longTaskMonitor) {
    longTaskMonitor = new LongTaskMonitor()
    
    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        longTaskMonitor?.disconnect()
      })
    }
  }
  
  return longTaskMonitor
}

/**
 * React hook for monitoring long tasks
 */
export function useLongTaskMonitor() {
  const monitor = getLongTaskMonitor()
  const [stats, setStats] = React.useState(monitor.getStats())
  
  React.useEffect(() => {
    const updateStats = () => {
      setStats(monitor.getStats())
    }
    
    // Update stats when new long tasks are detected
    const cleanup = monitor.onLongTask(updateStats)
    
    // Update stats periodically
    const interval = setInterval(updateStats, 5000)
    
    return () => {
      cleanup()
      clearInterval(interval)
    }
  }, [monitor])
  
  return {
    monitor,
    stats,
    measure: monitor.measure.bind(monitor)
  }
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!
    const measureName = name || `${target.constructor.name}.${propertyKey}`
    
    descriptor.value = function (this: any, ...args: any[]) {
      const monitor = getLongTaskMonitor()
      return monitor.measure(measureName, () => originalMethod.apply(this, args))
    } as T
    
    return descriptor
  }
}

// Import React for the hook
import * as React from 'react'

export type { LongTask, LongTaskThresholds }