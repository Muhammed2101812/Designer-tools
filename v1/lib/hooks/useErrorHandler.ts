'use client'

/**
 * Error handling hook
 * Provides consistent error handling with toast notifications and retry logic
 */

import { useCallback, useState } from 'react'
import { showErrorToast, showNetworkErrorToast } from '@/lib/utils/toast-helpers'
import { logError, storeErrorForDebug } from '@/lib/utils/error-logger'
import { isRetryableError } from '@/lib/utils/retry'
import { NetworkError, QuotaExceededError, AuthenticationError } from '@/lib/utils/errors'
import { useRouter } from 'next/navigation'

export interface UseErrorHandlerOptions {
  onError?: (error: Error) => void
  onRetry?: () => void | Promise<void>
  logErrors?: boolean
  showToast?: boolean
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const router = useRouter()
  const [lastError, setLastError] = useState<Error | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleError = useCallback(
    async (error: unknown, context?: Record<string, any>) => {
      const err = error instanceof Error ? error : new Error(String(error))
      setLastError(err)

      // Log error if enabled
      if (options.logErrors !== false) {
        logError(err, context)
        storeErrorForDebug(err, context)
      }

      // Call custom error handler
      options.onError?.(err)

      // Handle specific error types
      if (err instanceof QuotaExceededError) {
        // Redirect to pricing page
        if (options.showToast !== false) {
          showErrorToast(err, {
            onRetry: () => router.push('/pricing'),
          })
        }
        return
      }

      if (err instanceof AuthenticationError) {
        // Redirect to login
        if (options.showToast !== false) {
          showErrorToast(err)
        }
        router.push('/login')
        return
      }

      if (err instanceof NetworkError && isRetryableError(err)) {
        // Show retry option for network errors
        if (options.showToast !== false && options.onRetry) {
          showNetworkErrorToast(async () => {
            setIsRetrying(true)
            try {
              await options.onRetry?.()
            } finally {
              setIsRetrying(false)
            }
          })
        }
        return
      }

      // Generic error handling
      if (options.showToast !== false) {
        showErrorToast(err, {
          onRetry: options.onRetry && isRetryableError(err) ? async () => {
            setIsRetrying(true)
            try {
              await options.onRetry?.()
            } finally {
              setIsRetrying(false)
            }
          } : undefined,
        })
      }
    },
    [options, router]
  )

  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  const retry = useCallback(async () => {
    if (!options.onRetry) return

    setIsRetrying(true)
    try {
      await options.onRetry()
      clearError()
    } catch (error) {
      handleError(error)
    } finally {
      setIsRetrying(false)
    }
  }, [options, clearError, handleError])

  return {
    handleError,
    clearError,
    retry,
    lastError,
    isRetrying,
    hasError: lastError !== null,
  }
}

/**
 * Hook for wrapping async operations with error handling
 */
export function useAsyncError<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options: UseErrorHandlerOptions = {}
) {
  const { handleError } = useErrorHandler(options)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<Awaited<ReturnType<T>> | null>(null)

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setIsLoading(true)
      try {
        const result = await asyncFn(...args)
        setData(result)
        return result
      } catch (error) {
        handleError(error, { function: asyncFn.name, args })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [asyncFn, handleError]
  )

  return {
    execute,
    isLoading,
    data,
  }
}
