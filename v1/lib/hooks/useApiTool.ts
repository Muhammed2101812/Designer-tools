/**
 * Custom hook for API tool integration with quota management
 * 
 * Provides a complete solution for API tools including:
 * - Quota checking before operations
 * - Optimistic UI updates
 * - Error handling and recovery
 * - Usage tracking after successful operations
 */

import { useState, useCallback } from 'react'
import { useQuota } from './useQuota'
import { useAuthStore } from '@/store/authStore'

// ============================================
// Types
// ============================================

export interface ApiToolOptions {
  /**
   * Name of the tool (for usage tracking)
   */
  toolName: string
  
  /**
   * Auto-refresh quota interval
   * @default 30000
   */
  refreshInterval?: number
  
  /**
   * Callback when quota is exceeded
   */
  onQuotaExceeded?: () => void
  
  /**
   * Callback when operation starts
   */
  onOperationStart?: () => void
  
  /**
   * Callback when operation completes successfully
   */
  onOperationSuccess?: (result: any) => void
  
  /**
   * Callback when operation fails
   */
  onOperationError?: (error: Error) => void
}

export interface ApiToolState {
  /** Whether an operation is currently in progress */
  isProcessing: boolean
  
  /** Current quota information */
  quota: ReturnType<typeof useQuota>['quota']
  
  /** Whether quota data is loading */
  isLoadingQuota: boolean
  
  /** Quota error message */
  quotaError: string | null
  
  /** Whether user can make API calls */
  canUseApi: boolean
  
  /** Last operation error */
  operationError: string | null
}

export interface ApiToolActions {
  /** 
   * Execute an API operation with quota management
   * Handles optimistic updates, error recovery, and usage tracking
   */
  executeOperation: <T>(
    operation: () => Promise<T>,
    metadata?: {
      fileSizeMb?: number
      processingTimeMs?: number
    }
  ) => Promise<T>
  
  /** Manually refresh quota */
  refreshQuota: () => Promise<void>
  
  /** Clear operation error */
  clearError: () => void
  
  /** Check if user can perform operation */
  checkCanOperate: () => boolean
}

export interface UseApiToolReturn {
  /** Current state */
  state: ApiToolState
  
  /** Available actions */
  actions: ApiToolActions
}

// ============================================
// Hook Implementation
// ============================================

export function useApiTool(options: ApiToolOptions): UseApiToolReturn {
  const {
    toolName,
    refreshInterval = 30000,
    onQuotaExceeded,
    onOperationStart,
    onOperationSuccess,
    onOperationError,
  } = options
  
  const { user } = useAuthStore()
  
  // Local state
  const [isProcessing, setIsProcessing] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  
  // Quota management
  const {
    quota,
    isLoading: isLoadingQuota,
    error: quotaError,
    refreshQuota,
    optimisticUpdate,
    revertOptimisticUpdate,
    confirmUsage,
    canUseApi,
  } = useQuota({
    refreshInterval,
    onQuotaExceeded,
  })
  
  // Check if user can perform operation
  const checkCanOperate = useCallback((): boolean => {
    if (!user) {
      setOperationError('Authentication required')
      return false
    }
    
    if (!canUseApi) {
      setOperationError('Daily quota exceeded')
      if (onQuotaExceeded) {
        onQuotaExceeded()
      }
      return false
    }
    
    if (isProcessing) {
      setOperationError('Operation already in progress')
      return false
    }
    
    return true
  }, [user, canUseApi, isProcessing, onQuotaExceeded])
  
  // Execute API operation with full quota management
  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    metadata: {
      fileSizeMb?: number
      processingTimeMs?: number
    } = {}
  ): Promise<T> => {
    // Clear previous errors
    setOperationError(null)
    
    // Check if operation can proceed
    if (!checkCanOperate()) {
      throw new Error(operationError || 'Cannot perform operation')
    }
    
    // Start processing
    setIsProcessing(true)
    
    // Track processing time
    const startTime = Date.now()
    
    try {
      // Callback for operation start
      if (onOperationStart) {
        onOperationStart()
      }
      
      // Apply optimistic update (decrease quota by 1)
      optimisticUpdate()
      
      // Execute the actual operation
      const result = await operation()
      
      // Calculate processing time
      const processingTimeMs = Date.now() - startTime
      
      // Confirm usage on server (this will update quota with real data)
      await confirmUsage(toolName, {
        ...metadata,
        processingTimeMs,
      })
      
      // Callback for success
      if (onOperationSuccess) {
        onOperationSuccess(result)
      }
      
      return result
      
    } catch (error) {
      // Revert optimistic update on error
      revertOptimisticUpdate()
      
      const errorMessage = error instanceof Error ? error.message : 'Operation failed'
      setOperationError(errorMessage)
      
      // Callback for error
      if (onOperationError) {
        onOperationError(error instanceof Error ? error : new Error(errorMessage))
      }
      
      throw error
      
    } finally {
      setIsProcessing(false)
    }
  }, [
    checkCanOperate,
    operationError,
    onOperationStart,
    optimisticUpdate,
    confirmUsage,
    toolName,
    onOperationSuccess,
    revertOptimisticUpdate,
    onOperationError,
  ])
  
  // Clear operation error
  const clearError = useCallback(() => {
    setOperationError(null)
  }, [])
  
  // Return state and actions
  return {
    state: {
      isProcessing,
      quota,
      isLoadingQuota,
      quotaError,
      canUseApi,
      operationError,
    },
    actions: {
      executeOperation,
      refreshQuota,
      clearError,
      checkCanOperate,
    },
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Higher-order function to wrap API operations with quota management
 */
export function withQuotaManagement<T extends any[], R>(
  toolName: string,
  operation: (...args: T) => Promise<R>
) {
  return async function wrappedOperation(
    quotaActions: ApiToolActions,
    metadata: { fileSizeMb?: number } = {},
    ...args: T
  ): Promise<R> {
    return quotaActions.executeOperation(
      () => operation(...args),
      metadata
    )
  }
}

/**
 * Create a quota-aware fetch function
 */
export function createQuotaAwareFetch(toolName: string) {
  return async function quotaAwareFetch(
    quotaActions: ApiToolActions,
    url: string,
    options: RequestInit = {},
    metadata: { fileSizeMb?: number } = {}
  ): Promise<Response> {
    return quotaActions.executeOperation(async () => {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      return response
    }, metadata)
  }
}