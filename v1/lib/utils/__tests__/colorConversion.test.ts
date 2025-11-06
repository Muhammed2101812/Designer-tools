/**
 * Tests for color conversion utilities
 */

import {
  rgbToHex,
  rgbToHsl,
  formatRgb,
  formatHsl,
} from '../colorConversion'

describe('Color Conversion Utilities', () => {
  describe('rgbToHex', () => {
    it('converts RGB to HEX correctly', () => {
      expect(rgbToHex(59, 130, 246)).toBe('#3B82F6')
      expect(rgbToHex(255, 0, 0)).toBe('#FF0000')
      expect(rgbToHex(0, 255, 0)).toBe('#00FF00')
      expect(rgbToHex(0, 0, 255)).toBe('#0000FF')
      expect(rgbToHex(0, 0, 0)).toBe('#000000')
      expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF')
    })

    it('handles decimal values by rounding', () => {
      expect(rgbToHex(59.4, 130.6, 246.2)).toBe('#3B83F6')
    })
  })

  describe('rgbToHsl', () => {
    it('converts RGB to HSL correctly', () => {
      const result = rgbToHsl(59, 130, 246)
      expect(result.h).toBe(217)
      expect(result.s).toBe(91)
      expect(result.l).toBe(60)
    })

    it('handles pure red', () => {
      const result = rgbToHsl(255, 0, 0)
      expect(result.h).toBe(0)
      expect(result.s).toBe(100)
      expect(result.l).toBe(50)
    })

    it('handles pure green', () => {
      const result = rgbToHsl(0, 255, 0)
      expect(result.h).toBe(120)
      expect(result.s).toBe(100)
      expect(result.l).toBe(50)
    })

    it('handles pure blue', () => {
      const result = rgbToHsl(0, 0, 255)
      expect(result.h).toBe(240)
      expect(result.s).toBe(100)
      expect(result.l).toBe(50)
    })

    it('handles grayscale (no saturation)', () => {
      const result = rgbToHsl(128, 128, 128)
      expect(result.h).toBe(0)
      expect(result.s).toBe(0)
      expect(result.l).toBe(50)
    })

    it('handles black', () => {
      const result = rgbToHsl(0, 0, 0)
      expect(result.h).toBe(0)
      expect(result.s).toBe(0)
      expect(result.l).toBe(0)
    })

    it('handles white', () => {
      const result = rgbToHsl(255, 255, 255)
      expect(result.h).toBe(0)
      expect(result.s).toBe(0)
      expect(result.l).toBe(100)
    })
  })

  describe('formatRgb', () => {
    it('formats RGB values as CSS string', () => {
      expect(formatRgb(59, 130, 246)).toBe('rgb(59, 130, 246)')
      expect(formatRgb(255, 0, 0)).toBe('rgb(255, 0, 0)')
    })

    it('rounds decimal values', () => {
      expect(formatRgb(59.4, 130.6, 246.2)).toBe('rgb(59, 131, 246)')
    })
  })

  describe('formatHsl', () => {
    it('formats HSL values as CSS string', () => {
      expect(formatHsl(217, 91, 60)).toBe('hsl(217, 91%, 60%)')
      expect(formatHsl(0, 100, 50)).toBe('hsl(0, 100%, 50%)')
    })

    it('rounds decimal values', () => {
      expect(formatHsl(217.4, 91.6, 60.2)).toBe('hsl(217, 92%, 60%)')
    })
  })
})
