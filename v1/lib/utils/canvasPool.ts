/**
 * Canvas pooling utility for performance optimization
 * Reuses canvas elements to reduce memory allocation and garbage collection
 */

interface PooledCanvas {
  canvas: HTMLCanvasElement
  width: number
  height: number
  inUse: boolean
  lastUsed: number
}

class CanvasPool {
  private pool: PooledCanvas[] = []
  private maxPoolSize = 10
  private maxIdleTime = 30000 // 30 seconds

  /**
   * Get a canvas from the pool or create a new one
   */
  getCanvas(width: number, height: number): HTMLCanvasElement {
    // Clean up old canvases first
    this.cleanup()

    // Try to find a suitable canvas in the pool
    const pooledCanvas = this.pool.find(
      item => !item.inUse && item.width >= width && item.height >= height
    )

    if (pooledCanvas) {
      // Reuse existing canvas
      pooledCanvas.inUse = true
      pooledCanvas.lastUsed = Date.now()
      
      // Resize if needed
      if (pooledCanvas.width !== width || pooledCanvas.height !== height) {
        pooledCanvas.canvas.width = width
        pooledCanvas.canvas.height = height
        pooledCanvas.width = width
        pooledCanvas.height = height
      }
      
      // Clear the canvas
      const ctx = pooledCanvas.canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, width, height)
      }
      
      return pooledCanvas.canvas
    }

    // Create new canvas if pool is not full
    if (this.pool.length < this.maxPoolSize) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const pooledCanvas: PooledCanvas = {
        canvas,
        width,
        height,
        inUse: true,
        lastUsed: Date.now()
      }

      this.pool.push(pooledCanvas)
      return canvas
    }

    // Pool is full, create temporary canvas (not pooled)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  /**
   * Release a canvas back to the pool
   */
  releaseCanvas(canvas: HTMLCanvasElement): void {
    const pooledCanvas = this.pool.find(item => item.canvas === canvas)
    if (pooledCanvas) {
      pooledCanvas.inUse = false
      pooledCanvas.lastUsed = Date.now()
    }
  }

  /**
   * Clean up old unused canvases
   */
  private cleanup(): void {
    const now = Date.now()
    this.pool = this.pool.filter(item => {
      if (!item.inUse && (now - item.lastUsed) > this.maxIdleTime) {
        // Remove old canvas from DOM if it has a parent
        if (item.canvas.parentNode) {
          item.canvas.parentNode.removeChild(item.canvas)
        }
        return false
      }
      return true
    })
  }

  /**
   * Clear all canvases from the pool
   */
  clear(): void {
    this.pool.forEach(item => {
      if (item.canvas.parentNode) {
        item.canvas.parentNode.removeChild(item.canvas)
      }
    })
    this.pool = []
  }

  /**
   * Get pool statistics for debugging
   */
  getStats(): {
    totalCanvases: number
    inUse: number
    available: number
    memoryUsage: number
  } {
    const inUse = this.pool.filter(item => item.inUse).length
    const memoryUsage = this.pool.reduce((total, item) => {
      return total + (item.width * item.height * 4) // 4 bytes per pixel (RGBA)
    }, 0)

    return {
      totalCanvases: this.pool.length,
      inUse,
      available: this.pool.length - inUse,
      memoryUsage
    }
  }
}

// Global canvas pool instance
let canvasPool: CanvasPool | null = null

/**
 * Get the global canvas pool instance
 */
export function getCanvasPool(): CanvasPool {
  if (!canvasPool) {
    canvasPool = new CanvasPool()
    
    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        canvasPool?.clear()
      })
    }
  }
  
  return canvasPool
}

/**
 * Hook for using canvas pool in React components
 */
export function useCanvasPool() {
  const pool = getCanvasPool()
  
  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      // Note: We don't clear the entire pool on component unmount
      // as it's shared across components. Individual canvases are
      // released when components call releaseCanvas()
    }
  }, [])
  
  return pool
}

// Import React for the hook
import * as React from 'react'