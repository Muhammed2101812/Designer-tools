'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Rate limit error information
 */
export interface RateLimitError {
  limit: number
  remaining: number
  reset: number
  message?: string
}

/**
 * Rate limit error handler options
 */
export interface RateLimitErrorOptions {
  /**
   * Show upgrade suggestion for free users
   */
  showUpgrade?: boolean
  /**
   * Custom retry callback
   */
  onRetry?: () => void
  /**
   * Custom upgrade callback
   */
  onUpgrade?: () => void
  /**
   * Auto-close dialog after retry time expires
   */
  autoClose?: boolean
}

/**
 * Hook for handling rate limit errors (429 responses)
 */
export function useRateLimitError(options: RateLimitErrorOptions = {}) {
  const [error, setError] = useState<RateLimitError | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()

  /**
   * Handle a rate limit error from an API response
   */
  const handleRateLimitError = useCallback(
    (errorData: RateLimitError) => {
      setError(errorData)
      setShowDialog(true)
    },
    []
  )

  /**
   * Parse rate limit error from fetch response
   */
  const parseRateLimitError = useCallback(
    async (response: Response): Promise<RateLimitError | null> => {
      if (response.status !== 429) {
        return null
      }

      try {
        const data = await response.json()
        
        // Get rate limit info from headers
        const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0')
        const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0')
        const resetHeader = response.headers.get('X-RateLimit-Reset')
        
        // Parse reset time (could be timestamp or seconds)
        let reset = 0
        if (resetHeader) {
          const resetValue = parseInt(resetHeader)
          // If it's a timestamp (large number), use as-is
          // If it's seconds (small number), add to current time
          reset = resetValue > 1000000000 
            ? resetValue 
            : Math.floor(Date.now() / 1000) + resetValue
        }

        return {
          limit,
          remaining,
          reset,
          message: data.error || data.message,
        }
      } catch {
        // Fallback if response is not JSON
        return {
          limit: 0,
          remaining: 0,
          reset: Math.floor(Date.now() / 1000) + 60, // Default to 1 minute
          message: 'Rate limit exceeded. Please try again later.',
        }
      }
    },
    []
  )

  /**
   * Handle fetch response and check for rate limit errors
   */
  const handleResponse = useCallback(
    async (response: Response): Promise<Response> => {
      if (response.status === 429) {
        const rateLimitError = await parseRateLimitError(response)
        if (rateLimitError) {
          handleRateLimitError(rateLimitError)
        }
      }
      return response
    },
    [handleRateLimitError, parseRateLimitError]
  )

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null)
    setShowDialog(false)
  }, [])

  /**
   * Retry the failed operation
   */
  const retry = useCallback(() => {
    if (options.onRetry) {
      options.onRetry()
    }
    clearError()
  }, [options, clearError])

  /**
   * Navigate to upgrade page
   */
  const upgrade = useCallback(() => {
    if (options.onUpgrade) {
      options.onUpgrade()
    } else {
      router.push('/pricing')
    }
    clearError()
  }, [options, router, clearError])

  /**
   * Check if user can retry (reset time has passed)
   */
  const canRetry = useCallback(() => {
    if (!error) return false
    const now = Math.floor(Date.now() / 1000)
    return now >= error.reset
  }, [error])

  /**
   * Get time remaining until retry is allowed
   */
  const getTimeRemaining = useCallback(() => {
    if (!error) return 0
    const now = Math.floor(Date.now() / 1000)
    return Math.max(0, error.reset - now)
  }, [error])

  return {
    // State
    error,
    showDialog,
    
    // Actions
    handleRateLimitError,
    parseRateLimitError,
    handleResponse,
    clearError,
    retry,
    upgrade,
    setShowDialog,
    
    // Computed
    canRetry: canRetry(),
    timeRemaining: getTimeRemaining(),
    
    // Options
    showUpgrade: options.showUpgrade ?? false,
  }
}

/**
 * Utility function to check if an error is a rate limit error
 */
export function isRateLimitError(error: any): error is RateLimitError {
  return (
    error &&
    typeof error === 'object' &&
    typeof error.limit === 'number' &&
    typeof error.remaining === 'number' &&
    typeof error.reset === 'number'
  )
}

/**
 * Utility function to create a rate limit aware fetch wrapper
 */
export function createRateLimitAwareFetch(
  onRateLimitError: (error: RateLimitError) => void
) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, init)
    
    if (response.status === 429) {
      try {
        const data = await response.clone().json()
        const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0')
        const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0')
        const resetHeader = response.headers.get('X-RateLimit-Reset')
        
        let reset = 0
        if (resetHeader) {
          const resetValue = parseInt(resetHeader)
          reset = resetValue > 1000000000 
            ? resetValue 
            : Math.floor(Date.now() / 1000) + resetValue
        }

        onRateLimitError({
          limit,
          remaining,
          reset,
          message: data.error || data.message,
        })
      } catch {
        // Fallback error
        onRateLimitError({
          limit: 0,
          remaining: 0,
          reset: Math.floor(Date.now() / 1000) + 60,
          message: 'Rate limit exceeded. Please try again later.',
        })
      }
    }
    
    return response
  }
}