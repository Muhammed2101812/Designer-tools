/**
 * Retry utilities for network operations
 * Provides exponential backoff and configurable retry logic
 */

import { NetworkError, TimeoutError } from './errors'

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  timeout?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
  onRetry?: (error: Error, attempt: number, delay: number) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  timeout: 30000,
  shouldRetry: (error) => {
    // Retry on network errors, not on validation errors
    return error instanceof NetworkError
  },
  onRetry: () => {},
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Add timeout wrapper
      const result = await withTimeout(operation(), opts.timeout)
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Check if we should retry
      const shouldRetry = opts.shouldRetry(lastError, attempt)
      const isLastAttempt = attempt === opts.maxAttempts
      
      if (!shouldRetry || isLastAttempt) {
        throw lastError
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      )
      
      opts.onRetry(lastError, attempt, delay)
      await sleep(delay)
    }
  }
  
  throw lastError!
}

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(operation, timeoutMs))
    }, timeoutMs)
  })
  
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

/**
 * Retry with progress callback
 */
export async function retryWithProgress<T>(
  operation: () => Promise<T>,
  onProgress: (attempt: number, maxAttempts: number, delay?: number) => void,
  options: RetryOptions = {}
): Promise<T> {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    onRetry: (error: Error, attempt: number, delay: number) => {
      onProgress(attempt, opts.maxAttempts, delay)
      options.onRetry?.(error, attempt, delay)
    },
  }
  
  onProgress(1, opts.maxAttempts)
  return retry(operation, opts)
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    // Don't retry on 4xx errors (client errors)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return false
    }
    return true
  }
  
  if (error instanceof TimeoutError) {
    return true
  }
  
  return false
}

/**
 * Retry fetch requests with exponential backoff
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return retry(async () => {
    const response = await fetch(url, init)
    
    if (!response.ok) {
      throw new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      )
    }
    
    return response
  }, {
    ...options,
    shouldRetry: (error, attempt) => {
      // Custom retry logic for fetch
      if (error instanceof NetworkError) {
        const status = error.statusCode
        
        // Don't retry client errors (4xx)
        if (status && status >= 400 && status < 500) {
          return false
        }
        
        // Retry server errors (5xx) and network errors
        return true
      }
      
      return options.shouldRetry?.(error, attempt) ?? false
    },
  })
}

/**
 * Batch retry multiple operations
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<T | Error>> {
  return Promise.all(
    operations.map(async (operation) => {
      try {
        return await retry(operation, options)
      } catch (error) {
        return error instanceof Error ? error : new Error(String(error))
      }
    })
  )
}
