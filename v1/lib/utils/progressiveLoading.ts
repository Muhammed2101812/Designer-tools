/**
 * Progressive loading utilities for optimized resource loading
 * Implements lazy loading, intersection observer, and font optimization
 */

import { useState, useEffect, useRef, RefObject } from 'react'

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return [ref, isIntersecting]
}

/**
 * Lazy image loading utility
 */
export function createLazyImage(src: string, alt: string, options: {
  placeholder?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
} = {}) {
  const { placeholder, className = '', onLoad, onError } = options
  
  return {
    src,
    alt,
    className: `transition-opacity duration-300 ${className}`,
    loading: 'lazy' as const,
    onLoad,
    onError,
  }
}

/**
 * Progressive component loading utility
 */
export function createProgressiveLoader(threshold: number = 0.1) {
  return function useProgressiveLoad() {
    const [ref, isIntersecting] = useIntersectionObserver({ threshold })
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
      if (isIntersecting && !isLoaded) {
        const timer = setTimeout(() => {
          setIsLoaded(true)
        }, 100)
        
        return () => clearTimeout(timer)
      }
    }, [isIntersecting, isLoaded])

    return { ref, isLoaded, isIntersecting }
  }
}

/**
 * Font loading optimization utilities
 */
export function optimizeFontLoading() {
  if (typeof document === 'undefined') return

  // Add font-display: swap to existing font faces
  const style = document.createElement('style')
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      font-display: swap;
    }
    
    /* Ensure all fonts use swap for better performance */
    * {
      font-display: swap;
    }
  `
  document.head.appendChild(style)
}

/**
 * Preload critical fonts
 */
export function preloadCriticalFonts() {
  if (typeof document === 'undefined') return

  const fonts = [
    '/fonts/inter-var.woff2',
    // Add other critical fonts here
  ]

  fonts.forEach(fontUrl => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = fontUrl
    document.head.appendChild(link)
  })
}

/**
 * Staggered loading utility
 */
export function createStaggeredLoader(delay: number = 100) {
  return function useStaggeredLoad(itemCount: number) {
    const [visibleCount, setVisibleCount] = useState(0)
    const [ref, isIntersecting] = useIntersectionObserver()

    useEffect(() => {
      if (!isIntersecting) return

      const timer = setInterval(() => {
        setVisibleCount(prev => {
          if (prev >= itemCount) {
            clearInterval(timer)
            return prev
          }
          return prev + 1
        })
      }, delay)

      return () => clearInterval(timer)
    }, [isIntersecting, itemCount]) // delay removed from dependencies

    return { ref, visibleCount, isIntersecting }
  }
}

/**
 * Batch image preloader for better performance
 */
export class ImagePreloader {
  private loadedImages = new Set<string>()
  private loadingImages = new Map<string, Promise<void>>()

  async preloadImage(src: string): Promise<void> {
    if (this.loadedImages.has(src)) {
      return Promise.resolve()
    }

    if (this.loadingImages.has(src)) {
      return this.loadingImages.get(src)!
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.loadedImages.add(src)
        this.loadingImages.delete(src)
        resolve()
      }
      img.onerror = () => {
        this.loadingImages.delete(src)
        reject(new Error(`Failed to load image: ${src}`))
      }
      img.src = src
    })

    this.loadingImages.set(src, promise)
    return promise
  }

  async preloadImages(sources: string[]): Promise<void> {
    const promises = sources.map(src => this.preloadImage(src))
    await Promise.allSettled(promises)
  }

  isLoaded(src: string): boolean {
    return this.loadedImages.has(src)
  }
}

// Global image preloader instance
export const imagePreloader = new ImagePreloader()

/**
 * Hook for progressive image loading
 */
export function useProgressiveImage(src: string, placeholder?: string) {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) return

    setIsLoading(true)
    setHasError(false)

    imagePreloader
      .preloadImage(src)
      .then(() => {
        setCurrentSrc(src)
        setIsLoading(false)
      })
      .catch(() => {
        setHasError(true)
        setIsLoading(false)
      })
  }, [src])

  return { src: currentSrc, isLoading, hasError }
}