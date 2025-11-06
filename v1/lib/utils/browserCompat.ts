/**
 * Browser compatibility checking utilities
 */

import { BrowserCompatibilityError } from '@/types/errors'

export interface BrowserFeatures {
  canvas: boolean
  fileReader: boolean
  clipboard: boolean
  localStorage: boolean
  sessionStorage: boolean
}

/**
 * Check if HTML5 Canvas is supported
 */
export function checkCanvasSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext && canvas.getContext('2d'))
  } catch {
    return false
  }
}

/**
 * Check if FileReader API is supported
 */
export function checkFileReaderSupport(): boolean {
  return typeof FileReader !== 'undefined'
}

/**
 * Check if Clipboard API is supported
 */
export function checkClipboardSupport(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText)
}

/**
 * Check if localStorage is supported and accessible
 */
export function checkLocalStorageSupport(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Check if sessionStorage is supported and accessible
 */
export function checkSessionStorageSupport(): boolean {
  try {
    const test = '__storage_test__'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get all browser feature support status
 */
export function getBrowserFeatures(): BrowserFeatures {
  return {
    canvas: checkCanvasSupport(),
    fileReader: checkFileReaderSupport(),
    clipboard: checkClipboardSupport(),
    localStorage: checkLocalStorageSupport(),
    sessionStorage: checkSessionStorageSupport(),
  }
}

/**
 * Ensure canvas support or throw error
 */
export function ensureCanvasSupport(): void {
  if (!checkCanvasSupport()) {
    throw new BrowserCompatibilityError(
      'Your browser does not support HTML5 Canvas. Please use a modern browser like Chrome, Firefox, Safari, or Edge.',
      'canvas'
    )
  }
}

/**
 * Ensure FileReader support or throw error
 */
export function ensureFileReaderSupport(): void {
  if (!checkFileReaderSupport()) {
    throw new BrowserCompatibilityError(
      'Your browser does not support file reading. Please use a modern browser.',
      'fileReader'
    )
  }
}

/**
 * Get user-friendly browser name
 */
export function getBrowserName(): string {
  const userAgent = navigator.userAgent
  
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera'
  
  return 'Unknown'
}

/**
 * Check if browser is mobile
 */
export function isMobileBrowser(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}
