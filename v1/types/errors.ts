/**
 * Custom error classes for the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Daily quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 403)
    this.name = 'QuotaExceededError'
  }
}

export class FileValidationError extends AppError {
  constructor(message: string) {
    super(message, 'FILE_VALIDATION_ERROR', 400)
    this.name = 'FileValidationError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed', public retryable: boolean = true) {
    super(message, 'NETWORK_ERROR', 503)
    this.name = 'NetworkError'
  }
}

export class BrowserCompatibilityError extends AppError {
  constructor(message: string, public feature: string) {
    super(message, 'BROWSER_COMPAT_ERROR', 400)
    this.name = 'BrowserCompatibilityError'
  }
}

export class ImageProcessingError extends AppError {
  constructor(message: string) {
    super(message, 'IMAGE_PROCESSING_ERROR', 500)
    this.name = 'ImageProcessingError'
  }
}

export class ClipboardError extends AppError {
  constructor(message: string = 'Failed to copy to clipboard') {
    super(message, 'CLIPBOARD_ERROR', 500)
    this.name = 'ClipboardError'
  }
}
