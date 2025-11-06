/**
 * Browser compatibility checking utilities
 * Detects required features and provides user-friendly warnings
 */

import { BrowserCompatibilityError } from './errors'

export interface BrowserFeature {
  name: string
  check: () => boolean
  required: boolean
  fallback?: string
}

/**
 * Check if Canvas API is supported
 */
export function hasCanvasSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext && canvas.getContext('2d'))
  } catch {
    return false
  }
}

/**
 * Check if File API is supported
 */
export function hasFileAPISupport(): boolean {
  return typeof File !== 'undefined' && typeof FileReader !== 'undefined'
}

/**
 * Check if Blob API is supported
 */
export function hasBlobSupport(): boolean {
  try {
    return typeof Blob !== 'undefined' && typeof URL.createObjectURL === 'function'
  } catch {
    return false
  }
}

/**
 * Check if Web Workers are supported
 */
export function hasWebWorkerSupport(): boolean {
  return typeof Worker !== 'undefined'
}

/**
 * Check if OffscreenCanvas is supported
 */
export function hasOffscreenCanvasSupport(): boolean {
  return typeof OffscreenCanvas !== 'undefined'
}

/**
 * Check if Clipboard API is supported
 */
export function hasClipboardSupport(): boolean {
  return typeof navigator !== 'undefined' && 
         typeof navigator.clipboard !== 'undefined' &&
         typeof navigator.clipboard.writeText === 'function'
}

/**
 * Check if WebP format is supported
 */
export function hasWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='
    const img = new Image()
    img.onload = () => resolve(img.width === 1)
    img.onerror = () => resolve(false)
    img.src = webP
  })
}

/**
 * Check if AVIF format is supported
 */
export function hasAVIFSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
    const img = new Image()
    img.onload = () => resolve(img.width === 2)
    img.onerror = () => resolve(false)
    img.src = avif
  })
}

/**
 * Required features for client-side tools
 */
export const REQUIRED_FEATURES: BrowserFeature[] = [
  {
    name: 'Canvas API',
    check: hasCanvasSupport,
    required: true,
  },
  {
    name: 'File API',
    check: hasFileAPISupport,
    required: true,
  },
  {
    name: 'Blob API',
    check: hasBlobSupport,
    required: true,
  },
]

/**
 * Optional features that enhance functionality
 */
export const OPTIONAL_FEATURES: BrowserFeature[] = [
  {
    name: 'Web Workers',
    check: hasWebWorkerSupport,
    required: false,
    fallback: 'Processing will be slower without Web Worker support',
  },
  {
    name: 'OffscreenCanvas',
    check: hasOffscreenCanvasSupport,
    required: false,
    fallback: 'Using standard Canvas API',
  },
  {
    name: 'Clipboard API',
    check: hasClipboardSupport,
    required: false,
    fallback: 'Manual copy required',
  },
]

/**
 * Check all required features
 */
export function checkRequiredFeatures(): {
  supported: boolean
  missing: string[]
} {
  const missing: string[] = []
  
  for (const feature of REQUIRED_FEATURES) {
    if (!feature.check()) {
      missing.push(feature.name)
    }
  }
  
  return {
    supported: missing.length === 0,
    missing,
  }
}

/**
 * Check optional features and return warnings
 */
export function checkOptionalFeatures(): {
  feature: string
  supported: boolean
  fallback?: string
}[] {
  return OPTIONAL_FEATURES.map((feature) => ({
    feature: feature.name,
    supported: feature.check(),
    fallback: feature.fallback,
  }))
}

/**
 * Throw error if required features are missing
 */
export function assertBrowserCompatibility(): void {
  const { supported, missing } = checkRequiredFeatures()
  
  if (!supported) {
    throw new BrowserCompatibilityError(
      missing.join(', ')
    )
  }
}

/**
 * Get browser information for debugging
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = 'Unknown'
  
  // Detect browser
  if (ua.includes('Firefox/')) {
    browserName = 'Firefox'
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge'
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Chrome/')) {
    browserName = 'Chrome'
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.includes('Safari/')) {
    browserName = 'Safari'
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
  }
  
  return {
    name: browserName,
    version: browserVersion,
    userAgent: ua,
    platform: navigator.platform,
    language: navigator.language,
  }
}

/**
 * Check if browser is supported (minimum versions)
 */
export function isSupportedBrowser(): boolean {
  const browser = getBrowserInfo()
  const version = parseInt(browser.version, 10)
  
  // Minimum supported versions
  const minimumVersions: Record<string, number> = {
    Chrome: 90,
    Firefox: 88,
    Safari: 14,
    Edge: 90,
  }
  
  const minVersion = minimumVersions[browser.name]
  if (!minVersion) {
    // Unknown browser, assume supported
    return true
  }
  
  return version >= minVersion
}

/**
 * Get recommended browser upgrade message
 */
export function getBrowserUpgradeMessage(): string | null {
  if (isSupportedBrowser()) {
    return null
  }
  
  const browser = getBrowserInfo()
  return `Your browser (${browser.name} ${browser.version}) may not support all features. Please upgrade to the latest version for the best experience.`
}
