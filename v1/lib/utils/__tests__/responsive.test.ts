import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isMobileDevice,
  isTabletDevice,
  isTouchDevice,
  getOptimalCanvasSize,
  getTouchTargetSize,
  getResponsiveColumns,
  debounce,
  throttle,
  getPointerPosition,
} from '../responsive'

describe('responsive utilities', () => {
  describe('device detection', () => {
    beforeEach(() => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
    })

    it('detects mobile devices correctly', () => {
      window.innerWidth = 500
      expect(isMobileDevice()).toBe(true)

      window.innerWidth = 800
      expect(isMobileDevice()).toBe(false)
    })

    it('detects tablet devices correctly', () => {
      window.innerWidth = 800
      expect(isTabletDevice()).toBe(true)

      window.innerWidth = 500
      expect(isTabletDevice()).toBe(false)

      window.innerWidth = 1200
      expect(isTabletDevice()).toBe(false)
    })

    it('detects touch devices', () => {
      // This will depend on the test environment
      const result = isTouchDevice()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getOptimalCanvasSize', () => {
    beforeEach(() => {
      window.innerWidth = 1024
    })

    it('returns original size when within limits', () => {
      const result = getOptimalCanvasSize(800, 600)
      expect(result).toEqual({ width: 800, height: 600 })
    })

    it('scales down large images on mobile', () => {
      window.innerWidth = 500
      const result = getOptimalCanvasSize(2000, 1500)
      
      expect(result.width).toBeLessThan(2000)
      expect(result.height).toBeLessThan(1500)
      expect(result.width).toBeLessThanOrEqual(1024)
      expect(result.height).toBeLessThanOrEqual(1024)
    })

    it('maintains aspect ratio when scaling', () => {
      window.innerWidth = 500
      const result = getOptimalCanvasSize(2000, 1000)
      
      const originalRatio = 2000 / 1000
      const scaledRatio = result.width / result.height
      
      expect(Math.abs(originalRatio - scaledRatio)).toBeLessThan(0.01)
    })

    it('respects custom max dimensions', () => {
      const result = getOptimalCanvasSize(5000, 5000, {
        maxDesktop: 2000,
      })
      
      expect(result.width).toBeLessThanOrEqual(2000)
      expect(result.height).toBeLessThanOrEqual(2000)
    })
  })

  describe('getTouchTargetSize', () => {
    it('returns appropriate touch target size', () => {
      const size = getTouchTargetSize()
      expect(size).toBeGreaterThanOrEqual(32)
      expect(size).toBeLessThanOrEqual(44)
    })
  })

  describe('getResponsiveColumns', () => {
    it('returns correct columns for mobile', () => {
      window.innerWidth = 500
      expect(getResponsiveColumns(1, 2, 3)).toBe(1)
    })

    it('returns correct columns for tablet', () => {
      window.innerWidth = 800
      expect(getResponsiveColumns(1, 2, 3)).toBe(2)
    })

    it('returns correct columns for desktop', () => {
      window.innerWidth = 1200
      expect(getResponsiveColumns(1, 2, 3)).toBe(3)
    })
  })

  describe('debounce', () => {
    it('delays function execution', async () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      expect(fn).not.toHaveBeenCalled()

      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('cancels previous calls', async () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()

      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('limits function execution rate', async () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)

      await new Promise((resolve) => setTimeout(resolve, 150))
      throttled()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('getPointerPosition', () => {
    it('gets position from mouse event', () => {
      const element = document.createElement('div')
      element.getBoundingClientRect = () => ({
        left: 100,
        top: 100,
        right: 200,
        bottom: 200,
        width: 100,
        height: 100,
        x: 100,
        y: 100,
        toJSON: () => {},
      })

      const mouseEvent = new MouseEvent('click', {
        clientX: 150,
        clientY: 150,
      })

      const position = getPointerPosition(mouseEvent, element)
      expect(position).toEqual({ x: 50, y: 50 })
    })

    it('gets position from touch event', () => {
      const element = document.createElement('div')
      element.getBoundingClientRect = () => ({
        left: 100,
        top: 100,
        right: 200,
        bottom: 200,
        width: 100,
        height: 100,
        x: 100,
        y: 100,
        toJSON: () => {},
      })

      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 150,
            clientY: 150,
          } as Touch,
        ],
      })

      const position = getPointerPosition(touchEvent, element)
      expect(position).toEqual({ x: 50, y: 50 })
    })
  })
})
