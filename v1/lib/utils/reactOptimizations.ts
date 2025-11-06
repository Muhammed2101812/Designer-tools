/**
 * React performance optimization utilities
 * Provides memoization helpers and performance monitoring for React components
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'

/**
 * Performance monitoring hook for React components
 * Measures render time and warns about slow renders
 */
export function useRenderPerformance(componentName: string, threshold = 16) {
  const renderStartTime = useRef<number>(0)
  
  useEffect(() => {
    renderStartTime.current = performance.now()
  })
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    
    if (renderTime > threshold && process.env.NODE_ENV === 'development') {
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
      )
    }
  })
}

/**
 * Memoized callback for expensive operations
 * Automatically handles dependency arrays for common patterns
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, [callback, ...deps])
}

/**
 * Memoized value with performance monitoring
 * Warns when expensive computations are re-executed frequently
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const computationCount = useRef(0)
  const lastComputeTime = useRef(0)
  
  return useMemo(() => {
    const startTime = performance.now()
    const result = factory()
    const computeTime = performance.now() - startTime
    
    computationCount.current++
    lastComputeTime.current = computeTime
    
    if (process.env.NODE_ENV === 'development') {
      if (computeTime > 10) {
        console.warn(
          `[Performance] ${debugName || 'useMemo'} computation took ${computeTime.toFixed(2)}ms`
        )
      }
      
      if (computationCount.current > 10 && computeTime > 5) {
        console.warn(
          `[Performance] ${debugName || 'useMemo'} has been recomputed ${computationCount.current} times`
        )
      }
    }
    
    return result
  }, [factory, debugName, ...deps])
}

/**
 * Debounced callback for expensive operations
 * Prevents excessive re-execution during rapid state changes
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay, ...deps]
  )
}

/**
 * Throttled callback for high-frequency events
 * Limits execution rate for performance-critical operations
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number,
  deps: React.DependencyList
): T {
  const inThrottle = useRef(false)
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args)
        inThrottle.current = true
        setTimeout(() => {
          inThrottle.current = false
        }, limit)
      }
    }) as T,
    [callback, limit, ...deps]
  )
}

/**
 * Intersection observer hook for lazy loading
 * Optimizes rendering of off-screen components
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver>()
  const isIntersecting = useRef(false)
  const callbacks = useRef<Set<(isVisible: boolean) => void>>(new Set())
  
  const observe = useCallback((callback: (isVisible: boolean) => void) => {
    callbacks.current.add(callback)
    
    if (!observerRef.current && elementRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          isIntersecting.current = entry.isIntersecting
          
          callbacks.current.forEach(cb => cb(entry.isIntersecting))
        },
        options
      )
      
      observerRef.current.observe(elementRef.current)
    }
    
    // Return current state immediately
    callback(isIntersecting.current)
    
    // Return cleanup function
    return () => {
      callbacks.current.delete(callback)
      
      if (callbacks.current.size === 0 && observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = undefined
      }
    }
  }, [options])
  
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])
  
  return { elementRef, observe }
}

/**
 * Virtual scrolling hook for large lists
 * Optimizes rendering of large datasets
 */
export function useVirtualScrolling({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const scrollTop = useRef(0)
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop.current / itemHeight)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop.current + containerHeight) / itemHeight)
    )
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(itemCount - 1, endIndex + overscan)
    }
  }, [itemCount, itemHeight, containerHeight, overscan])
  
  const handleScroll = useThrottledCallback(
    (event: React.UIEvent<HTMLElement>) => {
      scrollTop.current = event.currentTarget.scrollTop
    },
    16, // ~60fps
    []
  )
  
  return {
    visibleRange,
    handleScroll,
    totalHeight: itemCount * itemHeight
  }
}

/**
 * Image loading optimization hook
 * Provides lazy loading and error handling for images
 */
export function useOptimizedImage(src: string, options: {
  lazy?: boolean
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
} = {}) {
  const { lazy = true, placeholder, onLoad, onError } = options
  const imgRef = useRef<HTMLImageElement>(null)
  const isLoaded = useRef(false)
  const isError = useRef(false)
  const currentSrc = useRef<string | null>(null)
  
  const { elementRef, observe } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })
  
  useEffect(() => {
    if (!lazy) {
      // Load immediately if not lazy
      loadImage()
      return
    }
    
    // Set up intersection observer for lazy loading
    return observe((isVisible) => {
      if (isVisible && !isLoaded.current && !isError.current) {
        loadImage()
      }
    })
  }, [src, lazy, observe, loadImage])
  
  const loadImage = useCallback(() => {
    if (currentSrc.current === src) return
    
    const img = new Image()
    
    img.onload = () => {
      if (imgRef.current) {
        imgRef.current.src = src
        isLoaded.current = true
        currentSrc.current = src
        onLoad?.()
      }
    }
    
    img.onerror = () => {
      isError.current = true
      onError?.()
    }
    
    img.src = src
  }, [src, onLoad, onError])
  
  return {
    imgRef,
    elementRef,
    isLoaded: isLoaded.current,
    isError: isError.current,
    src: isLoaded.current ? src : placeholder
  }
}