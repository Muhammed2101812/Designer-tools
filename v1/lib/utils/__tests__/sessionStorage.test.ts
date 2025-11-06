/**
 * Tests for session storage utilities
 * Verifies that data is properly stored and cleared
 */

import { saveColorHistory, loadColorHistory, clearColorHistory, clearAllSessionData } from '../sessionStorage'
import type { Color } from '@/types'

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
})

describe('Session Storage Utilities', () => {
  beforeEach(() => {
    mockSessionStorage.clear()
  })

  const mockColor: Color = {
    hex: '#3B82F6',
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    timestamp: Date.now(),
  }

  describe('saveColorHistory', () => {
    it('should save color history to sessionStorage', () => {
      const colors = [mockColor]
      saveColorHistory(colors)

      const stored = sessionStorage.getItem('color-picker-history')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual(colors)
    })

    it('should handle empty array', () => {
      saveColorHistory([])
      const stored = sessionStorage.getItem('color-picker-history')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual([])
    })
  })

  describe('loadColorHistory', () => {
    it('should load color history from sessionStorage', () => {
      const colors = [mockColor]
      sessionStorage.setItem('color-picker-history', JSON.stringify(colors))

      const loaded = loadColorHistory()
      expect(loaded).toEqual(colors)
    })

    it('should return empty array when no data exists', () => {
      const loaded = loadColorHistory()
      expect(loaded).toEqual([])
    })

    it('should return empty array for invalid JSON', () => {
      sessionStorage.setItem('color-picker-history', 'invalid json')
      const loaded = loadColorHistory()
      expect(loaded).toEqual([])
    })

    it('should filter out invalid color objects', () => {
      const invalidData = [
        mockColor,
        { hex: '#000000' }, // Missing rgb and hsl
        'not an object',
        null,
      ]
      sessionStorage.setItem('color-picker-history', JSON.stringify(invalidData))

      const loaded = loadColorHistory()
      expect(loaded).toEqual([mockColor])
    })
  })

  describe('clearColorHistory', () => {
    it('should clear color history from sessionStorage', () => {
      const colors = [mockColor]
      sessionStorage.setItem('color-picker-history', JSON.stringify(colors))

      clearColorHistory()

      const stored = sessionStorage.getItem('color-picker-history')
      expect(stored).toBeNull()
    })
  })

  describe('clearAllSessionData', () => {
    it('should clear all session data', () => {
      sessionStorage.setItem('color-picker-history', JSON.stringify([mockColor]))
      sessionStorage.setItem('other-data', 'test')

      clearAllSessionData()

      // Should clear our known keys
      expect(sessionStorage.getItem('color-picker-history')).toBeNull()
      
      // Other data might remain (we only clear our keys)
      // This is intentional to avoid breaking other parts of the app
    })
  })

  describe('Privacy verification', () => {
    it('should not persist data after clearing', () => {
      // Simulate user session
      const colors = [mockColor]
      saveColorHistory(colors)
      
      // Verify data is stored
      expect(loadColorHistory()).toEqual(colors)
      
      // Simulate logout
      clearAllSessionData()
      
      // Verify data is cleared
      expect(loadColorHistory()).toEqual([])
    })

    it('should use sessionStorage not localStorage', () => {
      // This test verifies we're using sessionStorage which is cleared on tab close
      // localStorage would persist across sessions
      const colors = [mockColor]
      saveColorHistory(colors)
      
      // Check that data is in sessionStorage
      expect(sessionStorage.getItem('color-picker-history')).toBeTruthy()
      
      // Check that data is NOT in localStorage
      expect(localStorage.getItem('color-picker-history')).toBeNull()
    })
  })
})
