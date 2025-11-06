/**
 * Session storage utilities for temporary data
 * Data is cleared when the browser tab is closed
 */

import type { Color } from '@/types'

const STORAGE_KEYS = {
  COLOR_HISTORY: 'color-picker-history',
} as const

/**
 * Safely checks if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
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
 * Saves color history to session storage
 * Data is automatically cleared when tab is closed
 */
export function saveColorHistory(colors: Color[]): void {
  if (!isSessionStorageAvailable()) {
    console.warn('sessionStorage is not available')
    return
  }

  try {
    sessionStorage.setItem(STORAGE_KEYS.COLOR_HISTORY, JSON.stringify(colors))
  } catch (error) {
    console.error('Failed to save color history:', error)
  }
}

/**
 * Loads color history from session storage
 */
export function loadColorHistory(): Color[] {
  if (!isSessionStorageAvailable()) {
    return []
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.COLOR_HISTORY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    
    // Validate the data structure
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is Color => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.hex === 'string' &&
        typeof item.rgb === 'object' &&
        typeof item.hsl === 'object' &&
        typeof item.timestamp === 'number'
      )
    })
  } catch (error) {
    console.error('Failed to load color history:', error)
    return []
  }
}

/**
 * Clears color history from session storage
 */
export function clearColorHistory(): void {
  if (!isSessionStorageAvailable()) {
    return
  }

  try {
    sessionStorage.removeItem(STORAGE_KEYS.COLOR_HISTORY)
  } catch (error) {
    console.error('Failed to clear color history:', error)
  }
}

/**
 * Clears all session data
 * Called on logout to ensure no data persists
 */
export function clearAllSessionData(): void {
  if (!isSessionStorageAvailable()) {
    return
  }

  try {
    // Clear specific keys we know about
    Object.values(STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(key)
    })
    
    // Optionally clear everything (be careful with this in production)
    // sessionStorage.clear()
  } catch (error) {
    console.error('Failed to clear session data:', error)
  }
}
