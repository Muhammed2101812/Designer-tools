/**
 * Tests for input validation utilities
 * Ensures all user inputs are properly validated
 */

import {
  validateFileUpload,
  validateColor,
  validateCanvasCoordinates,
  validateZoomLevel,
  validateEmail,
  validatePassword,
} from '../validation'
import { z } from 'zod'

describe('Input Validation', () => {
  describe('validateFileUpload', () => {
    it('should accept valid image files', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }) // 5MB

      expect(() => validateFileUpload(file)).not.toThrow()
    })

    it('should reject files larger than 10MB', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }) // 11MB

      expect(() => validateFileUpload(file)).toThrow()
    })

    it('should reject invalid file types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })

      expect(() => validateFileUpload(file)).toThrow()
    })

    it('should accept PNG, JPG, and WEBP formats', () => {
      const formats = ['image/png', 'image/jpeg', 'image/webp']

      formats.forEach((type) => {
        const file = new File(['test'], `test.${type.split('/')[1]}`, { type })
        Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })

        expect(() => validateFileUpload(file)).not.toThrow()
      })
    })
  })

  describe('validateColor', () => {
    it('should accept valid color objects', () => {
      const color = {
        hex: '#3B82F6',
        rgb: { r: 59, g: 130, b: 246 },
        hsl: { h: 217, s: 91, l: 60 },
        timestamp: Date.now(),
      }

      expect(() => validateColor(color)).not.toThrow()
    })

    it('should reject invalid HEX format', () => {
      const color = {
        hex: 'invalid',
        rgb: { r: 59, g: 130, b: 246 },
        hsl: { h: 217, s: 91, l: 60 },
        timestamp: Date.now(),
      }

      expect(() => validateColor(color)).toThrow()
    })

    it('should reject RGB values out of range', () => {
      const color = {
        hex: '#3B82F6',
        rgb: { r: 300, g: 130, b: 246 }, // r > 255
        hsl: { h: 217, s: 91, l: 60 },
        timestamp: Date.now(),
      }

      expect(() => validateColor(color)).toThrow()
    })

    it('should reject HSL values out of range', () => {
      const color = {
        hex: '#3B82F6',
        rgb: { r: 59, g: 130, b: 246 },
        hsl: { h: 400, s: 91, l: 60 }, // h > 360
        timestamp: Date.now(),
      }

      expect(() => validateColor(color)).toThrow()
    })
  })

  describe('validateCanvasCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(() => validateCanvasCoordinates(100, 200)).not.toThrow()
    })

    it('should accept zero coordinates', () => {
      expect(() => validateCanvasCoordinates(0, 0)).not.toThrow()
    })

    it('should reject negative coordinates', () => {
      expect(() => validateCanvasCoordinates(-1, 100)).toThrow()
      expect(() => validateCanvasCoordinates(100, -1)).toThrow()
    })

    it('should reject non-integer coordinates', () => {
      expect(() => validateCanvasCoordinates(100.5, 200)).toThrow()
      expect(() => validateCanvasCoordinates(100, 200.5)).toThrow()
    })
  })

  describe('validateZoomLevel', () => {
    it('should accept valid zoom levels', () => {
      expect(() => validateZoomLevel(1)).not.toThrow()
      expect(() => validateZoomLevel(0.5)).not.toThrow()
      expect(() => validateZoomLevel(3)).not.toThrow()
    })

    it('should reject zoom levels below 0.5', () => {
      expect(() => validateZoomLevel(0.4)).toThrow()
    })

    it('should reject zoom levels above 3', () => {
      expect(() => validateZoomLevel(3.1)).toThrow()
    })
  })

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
      ]

      validEmails.forEach((email) => {
        expect(() => validateEmail(email)).not.toThrow()
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
      ]

      invalidEmails.forEach((email) => {
        expect(() => validateEmail(email)).toThrow()
      })
    })
  })

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(() => validatePassword('password123')).not.toThrow()
      expect(() => validatePassword('MySecureP@ssw0rd!')).not.toThrow()
    })

    it('should reject passwords shorter than 8 characters', () => {
      expect(() => validatePassword('short')).toThrow()
    })

    it('should reject passwords longer than 100 characters', () => {
      const longPassword = 'a'.repeat(101)
      expect(() => validatePassword(longPassword)).toThrow()
    })
  })

  describe('Security considerations', () => {
    it('should validate all inputs before processing', () => {
      // This test ensures that validation happens before any processing
      // Preventing injection attacks and malformed data

      const maliciousInputs = [
        { type: 'file', value: null },
        { type: 'color', value: { hex: '<script>alert("xss")</script>' } },
        { type: 'coordinates', value: { x: 'DROP TABLE users;', y: 0 } },
        { type: 'email', value: 'admin@example.com; DROP TABLE users;' },
      ]

      maliciousInputs.forEach((input) => {
        expect(() => {
          switch (input.type) {
            case 'file':
              validateFileUpload(input.value as any)
              break
            case 'color':
              validateColor(input.value)
              break
            case 'coordinates':
              validateCanvasCoordinates((input.value as any).x, (input.value as any).y)
              break
            case 'email':
              validateEmail(input.value as string)
              break
          }
        }).toThrow()
      })
    })
  })
})
