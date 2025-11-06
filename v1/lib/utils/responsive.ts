/**
 * Responsive Design Utilities
 * 
 * Utilities for handling responsive behavior, touch interactions,
 * and mobile-specific optimizations across all tools.
 */

/**
 * Tailwind breakpoints for reference
 * sm: 640px
 * md: 768px
 * lg: 1024px
 * xl: 1280px
 * 2xl: 1536px
 */

/**
 * Check if device is mobile based on screen width
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768 // md breakpoint
}

/**
 * Check if device is tablet based on screen width
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 768 && window.innerWidth < 1024 // md to lg
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Get optimal canvas size for current device
 * Limits canvas dimensions to prevent performance issues on mobile
 */
export function getOptimalCanvasSize(
  width: number,
  height: number,
  options: {
    maxMobile?: number
    maxTablet?: number
    maxDesktop?: number
  } = {}
): { width: number; height: number } {
  const {
    maxMobile = 1024,
    maxTablet = 2048,
    maxDesktop = 4096,
  } = options

  let maxDimension = maxDesktop

  if (isMobileDevice()) {
    maxDimension = maxMobile
  } else if (isTabletDevice()) {
    maxDimension = maxTablet
  }

  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const scale = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
  }
}

/**
 * Get touch-optimized tap target size
 * Returns minimum size for touch targets (44x44px recommended by WCAG)
 */
export function getTouchTargetSize(): number {
  return isTouchDevice() ? 44 : 32
}

/**
 * Hook to detect screen size changes
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  return matches
}

/**
 * Responsive breakpoint hooks
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * Get responsive grid columns based on screen size
 */
export function getResponsiveColumns(
  mobile: number = 1,
  tablet: number = 2,
  desktop: number = 3
): number {
  if (isMobileDevice()) return mobile
  if (isTabletDevice()) return tablet
  return desktop
}

/**
 * Debounce function for resize events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for scroll/touch events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Prevent default touch behavior (useful for canvas interactions)
 */
export function preventTouchScroll(element: HTMLElement): () => void {
  const handler = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault()
    }
  }

  element.addEventListener('touchmove', handler, { passive: false })

  return () => {
    element.removeEventListener('touchmove', handler)
  }
}

/**
 * Get pointer position from mouse or touch event
 */
export function getPointerPosition(
  event: MouseEvent | TouchEvent,
  element: HTMLElement
): { x: number; y: number } {
  const rect = element.getBoundingClientRect()

  let clientX: number
  let clientY: number

  if ('touches' in event && event.touches.length > 0) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else if ('clientX' in event) {
    clientX = event.clientX
    clientY = event.clientY
  } else {
    return { x: 0, y: 0 }
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

/**
 * Responsive spacing utilities
 */
export const RESPONSIVE_SPACING = {
  container: 'px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',
  gap: 'gap-4 sm:gap-6 lg:gap-8',
  gapSmall: 'gap-2 sm:gap-3 lg:gap-4',
} as const

/**
 * Responsive text size utilities
 */
export const RESPONSIVE_TEXT = {
  h1: 'text-3xl sm:text-4xl lg:text-5xl',
  h2: 'text-2xl sm:text-3xl lg:text-4xl',
  h3: 'text-xl sm:text-2xl lg:text-3xl',
  h4: 'text-lg sm:text-xl lg:text-2xl',
  body: 'text-sm sm:text-base',
  small: 'text-xs sm:text-sm',
} as const

// Import React for hooks
import * as React from 'react'
