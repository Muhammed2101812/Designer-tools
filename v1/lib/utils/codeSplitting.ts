/**
 * Code splitting utilities for heavy computational operations
 * Helps reduce main bundle size and improve initial load performance
 */

import { lazy, ComponentType } from 'react'

/**
 * Lazy load a component with error boundary and loading state
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3
): ComponentType<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (attempt: number) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (attempt < retries) {
              // Retry after a delay
              setTimeout(() => attemptImport(attempt + 1), 1000 * attempt)
            } else {
              reject(error)
            }
          })
      }
      
      attemptImport(1)
    })
  })
}

/**
 * Preload a component for better UX
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Only preload in browser environment
  if (typeof window === 'undefined') return
  
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 })
    } else {
      setTimeout(callback, 100)
    }
  }
  
  schedulePreload(() => {
    importFn().catch(() => {
      // Ignore preload errors
    })
  })
}

/**
 * Lazy load heavy image processing utilities
 */
export const ImageProcessingUtils = lazyWithRetry(
  () => import('@/lib/utils/imageProcessing')
)

/**
 * Lazy load canvas utilities
 */
export const CanvasUtils = lazyWithRetry(
  () => import('@/lib/utils/canvasPool')
)

/**
 * Lazy load color conversion utilities
 */
export const ColorUtils = lazyWithRetry(
  () => import('@/lib/utils/colorConversion')
)

/**
 * Lazy load file validation utilities
 */
export const FileValidationUtils = lazyWithRetry(
  () => import('@/lib/utils/fileValidation')
)

/**
 * Dynamic import with error handling and retries
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await importFn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < retries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }
  
  throw lastError!
}

/**
 * Split heavy computation into chunks to avoid blocking the main thread
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  chunkSize = 100,
  delay = 5
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    
    // Process chunk
    const chunkResults = chunk.map((item, index) => 
      processor(item, i + index)
    )
    
    results.push(...chunkResults)
    
    // Yield control to the browser
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return results
}

/**
 * Use Web Workers for heavy computations
 */
export class WorkerPool {
  private workers: Worker[] = []
  private availableWorkers: Worker[] = []
  private taskQueue: Array<{
    data: any
    resolve: (value: any) => void
    reject: (error: Error) => void
  }> = []
  
  constructor(
    private workerScript: string,
    private poolSize = navigator.hardwareConcurrency || 4
  ) {
    this.initializeWorkers()
  }
  
  private initializeWorkers(): void {
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new Worker(this.workerScript)
        this.workers.push(worker)
        this.availableWorkers.push(worker)
      } catch (error) {
        console.warn('Failed to create worker:', error)
      }
    }
  }
  
  async execute<T, R>(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject }
      
      if (this.availableWorkers.length > 0) {
        this.executeTask(task)
      } else {
        this.taskQueue.push(task)
      }
    })
  }
  
  private executeTask(task: {
    data: any
    resolve: (value: any) => void
    reject: (error: Error) => void
  }): void {
    const worker = this.availableWorkers.pop()!
    
    const handleMessage = (event: MessageEvent) => {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      
      this.availableWorkers.push(worker)
      task.resolve(event.data)
      
      // Process next task in queue
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift()!
        this.executeTask(nextTask)
      }
    }
    
    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      
      this.availableWorkers.push(worker)
      task.reject(new Error(error.message))
      
      // Process next task in queue
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift()!
        this.executeTask(nextTask)
      }
    }
    
    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)
    worker.postMessage(task.data)
  }
  
  terminate(): void {
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    this.availableWorkers = []
    this.taskQueue = []
  }
}

/**
 * React hook for using worker pool
 */
export function useWorkerPool(workerScript: string, poolSize?: number) {
  const workerPoolRef = React.useRef<WorkerPool | null>(null)
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      workerPoolRef.current = new WorkerPool(workerScript, poolSize)
    }
    
    return () => {
      workerPoolRef.current?.terminate()
    }
  }, [workerScript, poolSize])
  
  const execute = React.useCallback(async <T, R>(data: T): Promise<R> => {
    if (!workerPoolRef.current) {
      throw new Error('Worker pool not initialized')
    }
    
    return workerPoolRef.current.execute<T, R>(data)
  }, [])
  
  return { execute }
}

// Import React for hooks
import * as React from 'react'