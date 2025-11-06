/**
 * Error handling utilities and user-friendly error messages
 */

import {
  AppError,
  ValidationError,
  FileValidationError,
  NetworkError,
  BrowserCompatibilityError,
  ImageProcessingError,
  ClipboardError,
  QuotaExceededError,
  AuthenticationError,
} from '@/types/errors'

export interface ErrorDisplayInfo {
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'destructive'
}

/**
 * Convert any error to user-friendly display information
 */
export function getErrorDisplayInfo(error: unknown): ErrorDisplayInfo {
  // Handle known error types
  if (error instanceof FileValidationError) {
    return {
      title: 'Invalid File',
      message: error.message,
      variant: 'destructive',
    }
  }

  if (error instanceof ValidationError) {
    return {
      title: 'Validation Error',
      message: error.message,
      variant: 'destructive',
    }
  }

  if (error instanceof NetworkError) {
    return {
      title: 'Network Error',
      message: error.message,
      variant: 'destructive',
      action: error.retryable
        ? {
            label: 'Retry',
            onClick: () => {
              // This will be overridden by the caller
            },
          }
        : undefined,
    }
  }

  if (error instanceof BrowserCompatibilityError) {
    return {
      title: 'Browser Not Supported',
      message: error.message,
      variant: 'destructive',
    }
  }

  if (error instanceof ImageProcessingError) {
    return {
      title: 'Image Processing Failed',
      message: error.message,
      variant: 'destructive',
    }
  }

  if (error instanceof ClipboardError) {
    return {
      title: 'Copy Failed',
      message: 'Unable to copy to clipboard. Please try manually selecting and copying the text.',
      variant: 'default',
    }
  }

  if (error instanceof QuotaExceededError) {
    return {
      title: 'Quota Exceeded',
      message: error.message,
      variant: 'destructive',
    }
  }

  if (error instanceof AuthenticationError) {
    return {
      title: 'Authentication Required',
      message: error.message,
      variant: 'destructive',
    }
  }

  if (error instanceof AppError) {
    return {
      title: 'Error',
      message: error.message,
      variant: 'destructive',
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect. Please check your internet connection and try again.',
        variant: 'destructive',
      }
    }

    if (error.message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long. Please try again.',
        variant: 'destructive',
      }
    }

    return {
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      variant: 'destructive',
    }
  }

  // Handle unknown error types
  return {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again.',
    variant: 'destructive',
  }
}

/**
 * Log error to console with context
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '[Error]'
  
  if (error instanceof AppError) {
    console.error(prefix, {
      name: error.name,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
    })
  } else if (error instanceof Error) {
    console.error(prefix, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
  } else {
    console.error(prefix, error)
  }
}

/**
 * Handle error with toast notification
 */
export function handleErrorWithToast(
  error: unknown,
  toast: (options: any) => void,
  context?: string
): void {
  logError(error, context)
  
  const errorInfo = getErrorDisplayInfo(error)
  
  toast({
    title: errorInfo.title,
    description: errorInfo.message,
    variant: errorInfo.variant,
    action: errorInfo.action,
  })
}

/**
 * Create a retry handler for network errors
 */
export function createRetryHandler<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): () => Promise<T> {
  return async () => {
    let lastError: unknown
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        // Don't retry if it's not a network error
        if (!(error instanceof NetworkError) || !error.retryable) {
          throw error
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * Math.pow(2, attempt))
          )
        }
      }
    }
    
    throw lastError
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: unknown) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (onError) {
        onError(error)
      } else {
        logError(error, fn.name)
      }
      throw error
    }
  }) as T
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return error.retryable
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection')
    )
  }
  
  return false
}
