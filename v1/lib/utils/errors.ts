/**
 * Custom error types for Design Kit application
 * Provides structured error handling with user-friendly messages
 */

// Base error class with user-friendly messages
export class AppError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// File validation errors
export class FileValidationError extends AppError {
  constructor(message: string, userMessage: string) {
    super(message, userMessage, 'FILE_VALIDATION_ERROR', true)
  }
}

export class FileSizeError extends FileValidationError {
  constructor(size: number, limit: number) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2)
    const limitMB = limit
    super(
      `File size ${sizeMB}MB exceeds limit of ${limitMB}MB`,
      `File size (${sizeMB}MB) exceeds your plan limit (${limitMB}MB). Upgrade to process larger files.`
    )
  }
}

export class FileTypeError extends FileValidationError {
  constructor(actualType: string, acceptedTypes: string[]) {
    super(
      `Invalid file type: ${actualType}`,
      `Invalid file type. Accepted formats: ${acceptedTypes.join(', ')}`
    )
  }
}

// Image processing errors
export class ImageProcessingError extends AppError {
  constructor(message: string, userMessage: string) {
    super(message, userMessage, 'IMAGE_PROCESSING_ERROR', true)
  }
}

export class ImageLoadError extends ImageProcessingError {
  constructor(reason?: string) {
    super(
      `Failed to load image: ${reason || 'unknown'}`,
      'Failed to load image. Please ensure the file is a valid image.'
    )
  }
}

export class ImageDimensionError extends ImageProcessingError {
  constructor(width: number, height: number, maxDimension: number) {
    super(
      `Image dimensions ${width}x${height} exceed maximum ${maxDimension}px`,
      `Image is too large (${width}x${height}). Maximum dimension is ${maxDimension}px.`
    )
  }
}

export class CanvasError extends ImageProcessingError {
  constructor(operation: string) {
    super(
      `Canvas operation failed: ${operation}`,
      'Image processing failed. Please try again with a different image.'
    )
  }
}

// Network errors
export class NetworkError extends AppError {
  constructor(message: string, public statusCode?: number) {
    super(
      message,
      'Network error. Please check your connection and try again.',
      'NETWORK_ERROR',
      true
    )
  }
}

export class APIError extends NetworkError {
  constructor(message: string, statusCode: number, public apiName: string) {
    super(`${apiName} API error: ${message}`, statusCode)
    this.userMessage = `Processing failed. Please try again later.`
  }
}

// Quota errors
export class QuotaError extends AppError {
  constructor(message: string, userMessage: string) {
    super(message, userMessage, 'QUOTA_ERROR', false)
  }
}

export class QuotaExceededError extends QuotaError {
  constructor(planName: string = 'Premium') {
    super(
      'Daily quota exceeded',
      `Daily quota exhausted. Upgrade to ${planName} for more operations.`
    )
  }
}

// Browser compatibility errors
export class BrowserCompatibilityError extends AppError {
  constructor(feature: string) {
    super(
      `Browser doesn't support ${feature}`,
      `Your browser doesn't support ${feature}. Please upgrade to a modern browser.`,
      'BROWSER_COMPATIBILITY_ERROR',
      false
    )
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(
      message,
      'Please sign in to use this feature.',
      'AUTHENTICATION_ERROR',
      true
    )
  }
}

// Timeout errors
export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation timed out after ${timeoutMs}ms: ${operation}`,
      'Operation took too long. Please try again.',
      'TIMEOUT_ERROR',
      true
    )
  }
}

/**
 * Error message templates for consistent user-facing messages
 */
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: (size: number, limit: number) =>
    `File size (${size}MB) exceeds your plan limit (${limit}MB). Upgrade to process larger files.`,
  
  INVALID_FILE_TYPE: (accepted: string) =>
    `Invalid file type. Accepted formats: ${accepted}`,
  
  QUOTA_EXCEEDED: (plan: string) =>
    `Daily quota exhausted. Upgrade to ${plan} for more operations.`,
  
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  
  PROCESSING_FAILED: 'Processing failed. Your quota has not been used.',
  
  BROWSER_UNSUPPORTED: (feature: string) =>
    `Your browser doesn't support ${feature}. Please upgrade to a modern browser.`,
  
  IMAGE_LOAD_FAILED: 'Failed to load image. Please ensure the file is a valid image.',
  
  AUTHENTICATION_REQUIRED: 'Please sign in to use this feature.',
  
  TIMEOUT: 'Operation took too long. Please try again.',
  
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const

/**
 * Check if an error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.recoverable
  }
  return true // Assume unknown errors are recoverable
}

/**
 * Get user-friendly error message from any error
 */
export function getUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage
  }
  
  if (error instanceof Error) {
    return ERROR_MESSAGES.GENERIC_ERROR
  }
  
  return ERROR_MESSAGES.GENERIC_ERROR
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
export function sanitizeErrorForLogging(error: Error, context?: Record<string, any>) {
  const sanitized: Record<string, any> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  }
  
  if (context) {
    const sanitizedContext = { ...context }
    
    // Remove sensitive data
    delete sanitizedContext.fileData
    delete sanitizedContext.imageData
    delete sanitizedContext.blob
    delete sanitizedContext.apiKey
    delete sanitizedContext.token
    
    sanitized.context = sanitizedContext
  }
  
  return sanitized
}
