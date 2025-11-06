import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { describe } from 'node:test'
import {
  validateFileMagicNumber,
  secureCanvasCleanup,
  sanitizeErrorForLogging,
  isSecureContext,
  validateImageFile,
  validateFileSecurely,
} from '../fileSecurity'

describe('fileSecurity', () => {
  describe('validateFileMagicNumber', () => {
    it('should validate PNG file signature', async () => {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00])
      const file = new File([pngBytes.buffer], 'test.png', { type: 'image/png' })

      const result = await validateFileMagicNumber(file)

      expect(result.valid).toBe(true)
      expect(result.detectedType).toBe('image/png')
    })

    it('should validate JPEG file signature', async () => {
      // JPEG signature: FF D8 FF E0
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      const file = new File([jpegBytes.buffer], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateFileMagicNumber(file)

      expect(result.valid).toBe(true)
      expect(result.detectedType).toBe('image/jpeg')
    })

    it('should reject file with mismatched signature', async () => {
      // PNG signature but declared as JPEG
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00])
      const file = new File([pngBytes.buffer], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateFileMagicNumber(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate GIF file signature', async () => {
      // GIF89a signature: 47 49 46 38 39 61
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      const file = new File([gifBytes.buffer], 'test.gif', { type: 'image/gif' })

      const result = await validateFileMagicNumber(file)

      expect(result.valid).toBe(true)
      expect(result.detectedType).toBe('image/gif')
    })

    it('should handle unknown file types gracefully', async () => {
      const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      const file = new File([bytes.buffer], 'test.bin', { type: 'application/octet-stream' })

      const result = await validateFileMagicNumber(file)

      // Unknown types are allowed but not validated
      expect(result.valid).toBe(true)
    })
  })

  describe('secureCanvasCleanup', () => {
    it('should clear canvas dimensions', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100

      secureCanvasCleanup(canvas)

      expect(canvas.width).toBe(0)
      expect(canvas.height).toBe(0)
    })

    it('should handle canvas without context', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100

      // Should not throw
      expect(() => secureCanvasCleanup(canvas)).not.toThrow()
    })
  })

  describe('sanitizeErrorForLogging', () => {
    it('should remove sensitive data from context', () => {
      const error = new Error('Test error')
      const context = {
        fileName: 'test.png',
        fileData: new Uint8Array([1, 2, 3]),
        imageData: 'base64data',
        normalData: 'keep this',
      }

      const sanitized = sanitizeErrorForLogging(error, context)

      expect(sanitized.message).toBe('Test error')
      expect(sanitized.context).toBeDefined()
      expect(sanitized.context!.fileName).toBe('test.png')
      expect(sanitized.context!.normalData).toBe('keep this')
      expect(sanitized.context!.fileData).toBe('[REDACTED]')
      expect(sanitized.context!.imageData).toBe('[REDACTED]')
    })

    it('should redact Blob and File objects', () => {
      const error = new Error('Test error')
      const blob = new Blob(['test'], { type: 'text/plain' })
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const context = {
        blob,
        file,
      }

      const sanitized = sanitizeErrorForLogging(error, context)

      // Blob and File are redacted as they contain 'blob' and 'file' in the key name
      expect(sanitized.context!.blob).toBe('[REDACTED]')
      expect(sanitized.context!.file).toBe('[REDACTED]')
    })

    it('should redact password and token fields', () => {
      const error = new Error('Test error')
      const context = {
        username: 'user',
        password: 'secret123',
        apiToken: 'token123',
        apiKey: 'key123',
      }

      const sanitized = sanitizeErrorForLogging(error, context)

      expect(sanitized.context!.username).toBe('user')
      expect(sanitized.context!.password).toBe('[REDACTED]')
      expect(sanitized.context!.apiToken).toBe('[REDACTED]')
      expect(sanitized.context!.apiKey).toBe('[REDACTED]')
    })

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      const sanitized = sanitizeErrorForLogging(error)

      expect(sanitized.stack).toBeDefined()

      process.env.NODE_ENV = originalEnv
    })

    it('should exclude stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Test error')
      const sanitized = sanitizeErrorForLogging(error)

      expect(sanitized.stack).toBeUndefined()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('isSecureContext', () => {
    it('should check secure context', () => {
      // In test environment, this depends on the setup
      const result = isSecureContext()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('validateImageFile', () => {
    it('should validate image file with correct signature', async () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00])
      const file = new File([pngBytes.buffer], 'test.png', { type: 'image/png' })

      const result = await validateImageFile(file)

      expect(result.valid).toBe(true)
    })

    it('should reject non-image file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })

      const result = await validateImageFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not an image')
    })

    it('should reject image with invalid signature', async () => {
      const invalidBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      const file = new File([invalidBytes.buffer], 'test.png', { type: 'image/png' })

      const result = await validateImageFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('validateFileSecurely', () => {
    it('should validate file with all checks', async () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00])
      const file = new File([pngBytes.buffer], 'test.png', { type: 'image/png' })

      const result = await validateFileSecurely(file, {
        maxSizeMB: 10,
        allowedTypes: ['image/png', 'image/jpeg'],
        validateMagicNumbers: true,
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should collect multiple validation errors', async () => {
      // Create a large file with invalid signature
      const largeData = new Uint8Array(15 * 1024 * 1024) // 15MB
      const file = new File([largeData], 'test.txt', { type: 'text/plain' })

      const result = await validateFileSecurely(file, {
        maxSizeMB: 10,
        allowedTypes: ['image/png', 'image/jpeg'],
        validateMagicNumbers: true,
      })

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should skip magic number validation when disabled', async () => {
      const invalidBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      const file = new File([invalidBytes.buffer], 'test.png', { type: 'image/png' })

      const result = await validateFileSecurely(file, {
        maxSizeMB: 10,
        allowedTypes: ['image/png'],
        validateMagicNumbers: false,
      })

      expect(result.valid).toBe(true)
    })
  })
})
