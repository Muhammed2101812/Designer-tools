/**
 * Tests for error handling utilities
 */

import { describe, it, expect } from 'vitest'
import {
  AppError,
  FileValidationError,
  FileSizeError,
  FileTypeError,
  ImageProcessingError,
  NetworkError,
  APIError,
  QuotaExceededError,
  BrowserCompatibilityError,
  AuthenticationError,
  TimeoutError,
  getUserErrorMessage,
  isRecoverableError,
  sanitizeErrorForLogging,
  ERROR_MESSAGES,
} from '../errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('creates error with user message and code', () => {
      const error = new AppError(
        'Technical message',
        'User-friendly message',
        'TEST_ERROR',
        true
      )

      expect(error.message).toBe('Technical message')
      expect(error.userMessage).toBe('User-friendly message')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.recoverable).toBe(true)
      expect(error.name).toBe('AppError')
    })
  })

  describe('FileSizeError', () => {
    it('creates error with formatted size message', () => {
      const error = new FileSizeError(15 * 1024 * 1024, 10)

      expect(error.userMessage).toContain('15.00MB')
      expect(error.userMessage).toContain('10MB')
      expect(error.userMessage).toContain('Upgrade')
    })
  })

  describe('FileTypeError', () => {
    it('creates error with accepted types', () => {
      const error = new FileTypeError('image/bmp', ['PNG', 'JPG', 'WEBP'])

      expect(error.userMessage).toContain('Invalid file type')
      expect(error.userMessage).toContain('PNG, JPG, WEBP')
    })
  })

  describe('NetworkError', () => {
    it('creates error with status code', () => {
      const error = new NetworkError('Connection failed', 500)

      expect(error.statusCode).toBe(500)
      expect(error.userMessage).toContain('Network error')
    })
  })

  describe('APIError', () => {
    it('creates error with API name', () => {
      const error = new APIError('Rate limit', 429, 'Remove.bg')

      expect(error.apiName).toBe('Remove.bg')
      expect(error.statusCode).toBe(429)
    })
  })

  describe('QuotaExceededError', () => {
    it('creates error with plan name', () => {
      const error = new QuotaExceededError('Premium')

      expect(error.userMessage).toContain('Premium')
      expect(error.userMessage).toContain('quota')
      expect(error.recoverable).toBe(false)
    })
  })

  describe('BrowserCompatibilityError', () => {
    it('creates error with feature name', () => {
      const error = new BrowserCompatibilityError('Canvas API')

      expect(error.userMessage).toContain('Canvas API')
      expect(error.userMessage).toContain('upgrade')
      expect(error.recoverable).toBe(false)
    })
  })

  describe('TimeoutError', () => {
    it('creates error with timeout duration', () => {
      const error = new TimeoutError('Image processing', 30000)

      expect(error.message).toContain('30000ms')
      expect(error.userMessage).toContain('too long')
    })
  })
})

describe('Error Utilities', () => {
  describe('getUserErrorMessage', () => {
    it('returns user message for AppError', () => {
      const error = new FileSizeError(15 * 1024 * 1024, 10)
      const message = getUserErrorMessage(error)

      expect(message).toBe(error.userMessage)
    })

    it('returns generic message for standard Error', () => {
      const error = new Error('Technical error')
      const message = getUserErrorMessage(error)

      expect(message).toBe(ERROR_MESSAGES.GENERIC_ERROR)
    })

    it('returns generic message for unknown error', () => {
      const message = getUserErrorMessage('string error')

      expect(message).toBe(ERROR_MESSAGES.GENERIC_ERROR)
    })
  })

  describe('isRecoverableError', () => {
    it('returns true for recoverable AppError', () => {
      const error = new NetworkError('Connection failed')
      expect(isRecoverableError(error)).toBe(true)
    })

    it('returns false for non-recoverable AppError', () => {
      const error = new QuotaExceededError()
      expect(isRecoverableError(error)).toBe(false)
    })

    it('returns true for unknown errors', () => {
      const error = new Error('Unknown')
      expect(isRecoverableError(error)).toBe(true)
    })
  })

  describe('sanitizeErrorForLogging', () => {
    it('removes sensitive data from context', () => {
      const error = new Error('Test error')
      const context = {
        fileName: 'test.png',
        fileData: new Blob(),
        imageData: new Uint8Array(),
        apiKey: 'secret',
        token: 'secret-token',
        normalData: 'keep this',
      }

      const sanitized = sanitizeErrorForLogging(error, context)

      expect(sanitized.context).toBeDefined()
      expect(sanitized.context.fileName).toBe('test.png')
      expect(sanitized.context.normalData).toBe('keep this')
      expect(sanitized.context.fileData).toBeUndefined()
      expect(sanitized.context.imageData).toBeUndefined()
      expect(sanitized.context.apiKey).toBeUndefined()
      expect(sanitized.context.token).toBeUndefined()
    })

    it('includes error name, message, and stack', () => {
      const error = new Error('Test error')
      const sanitized = sanitizeErrorForLogging(error)

      expect(sanitized.name).toBe('Error')
      expect(sanitized.message).toBe('Test error')
      expect(sanitized.stack).toBeDefined()
    })

    it('handles context without sensitive data', () => {
      const error = new Error('Test error')
      const context = { tool: 'image-resizer', attempt: 1 }

      const sanitized = sanitizeErrorForLogging(error, context)

      expect(sanitized.context).toEqual(context)
    })
  })
})

describe('ERROR_MESSAGES', () => {
  it('provides consistent error messages', () => {
    expect(ERROR_MESSAGES.FILE_TOO_LARGE(15, 10)).toContain('15MB')
    expect(ERROR_MESSAGES.FILE_TOO_LARGE(15, 10)).toContain('10MB')

    expect(ERROR_MESSAGES.INVALID_FILE_TYPE('PNG, JPG')).toContain('PNG, JPG')

    expect(ERROR_MESSAGES.QUOTA_EXCEEDED('Premium')).toContain('Premium')

    expect(ERROR_MESSAGES.BROWSER_UNSUPPORTED('Canvas')).toContain('Canvas')
  })
})
