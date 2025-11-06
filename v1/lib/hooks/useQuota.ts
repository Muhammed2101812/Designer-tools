/**
 * Custom hook for quota management and real-time updates
 * 
 * Provides quota information, real-time updates, and optimistic UI updates
 * for API-powered tools.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'

// ============================================
// Types
// ============================================

export interface QuotaInfo {
  canUse: boolean
  currentUsage: number
  dailyLimit: number
  remaining: number
  plan: string
  resetAt: string
}

export interface UseQuotaOptions {
  /**
   * Auto-refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number
  
  /**
   * Whether to fetch quota on mount
   * @default true
   */
  fetchOnMount?: boolean
  
  /**
   * Callback when quota data is updated
   */
  onQuotaUpdate?: (quota: QuotaInfo) => void
  
  /**
   * Callback when quota is exceeded
   */
  onQuotaExceeded?: () => void
}

export interface UseQuotaReturn {
  /** Current quota information */
  quota: QuotaInfo | null
  
  /** Whether quota data is being fetched */
  isLoading: boolean
  
  /** Error message if fetch failed */
  error: string | null
  
  /** Manually refresh quota data */
  refreshQuota: () => Promise<void>
  
  /** 
   * Optimistically update quota (before API call)
   * Call this before making an API tool request
   */
  optimisticUpdate: () => void
  
  /** 
   * Revert optimistic update (on API failure)
   * Call this if the API tool request fails
   */
  revertOptimisticUpdate: () => void
  
  /** 
   * Confirm quota usage (after successful API call)
   * Call this after a successful API tool request
   */
  confirmUsage: (toolName: string, metadata?: {
    fileSizeMb?: number
    processingTimeMs?: number
  }) => Promise<void>
  
  /** Whether user can make an API call */
  canUseApi: boolean
  
  /** Last update timestamp */
  lastUpdated: Date | null
}

// ============================================
// Hook Implementation
// ============================================

export function useQuota(options: UseQuotaOptions = {}): UseQuotaReturn {
  const {
    refreshInterval = 30000,
    fetchOnMount = true,
    onQuotaUpdate,
    onQuotaExceeded,
  } = options
  
  const { user } = useAuthStore()
  
  // State
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Refs for optimistic updates
  const originalQuotaRef = useRef<QuotaInfo | null>(null)
  const isOptimisticRef = useRef(false)
  
  // Fetch quota data from API
  const fetchQuota = useCallback(async (): Promise<QuotaInfo | null> => {
    if (!user) {
      setQuota(null)
      setError(null)
      return null
    }
    
    try {
      setError(null)
      
      const response = await fetch('/api/tools/check-quota', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const quotaData: QuotaInfo = await response.json()
      
      // Only update if not in optimistic state
      if (!isOptimisticRef.current) {
        setQuota(quotaData)
        setLastUpdated(new Date())
        
        // Call callback if provided
        if (onQuotaUpdate) {
          onQuotaUpdate(quotaData)
        }
        
        // Check if quota is exceeded
        if (!quotaData.canUse && onQuotaExceeded) {
          onQuotaExceeded()
        }
      }
      
      return quotaData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quota'
      setError(errorMessage)
      console.error('Error fetching quota:', err)
      return null
    }
  }, [user, onQuotaUpdate, onQuotaExceeded])
  
  // Refresh quota with loading state
  const refreshQuota = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchQuota()
    } finally {
      setIsLoading(false)
    }
  }, [fetchQuota])
  
  // Optimistic update - decrease remaining quota by 1
  const optimisticUpdate = useCallback(() => {
    if (!quota || isOptimisticRef.current) return
    
    // Store original quota for potential revert
    originalQuotaRef.current = quota
    isOptimisticRef.current = true
    
    // Create optimistic quota (decrease remaining by 1)
    const optimisticQuota: QuotaInfo = {
      ...quota,
      currentUsage: quota.currentUsage + 1,
      remaining: Math.max(0, quota.remaining - 1),
      canUse: quota.remaining > 1, // Can use if more than 1 remaining
    }
    
    setQuota(optimisticQuota)
  }, [quota])
  
  // Revert optimistic update
  const revertOptimisticUpdate = useCallback(() => {
    if (!isOptimisticRef.current || !originalQuotaRef.current) return
    
    setQuota(originalQuotaRef.current)
    isOptimisticRef.current = false
    originalQuotaRef.current = null
  }, [])
  
  // Confirm usage and increment on server
  const confirmUsage = useCallback(async (
    toolName: string,
    metadata: { fileSizeMb?: number; processingTimeMs?: number } = {}
  ) => {
    if (!user) return
    
    try {
      const response = await fetch('/api/tools/increment-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName,
          success: true,
          ...metadata,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to increment usage')
      }
      
      const result = await response.json()
      
      // Update quota with server response
      if (quota) {
        const updatedQuota: QuotaInfo = {
          ...quota,
          currentUsage: result.currentUsage,
          remaining: result.remaining,
          canUse: result.remaining > 0,
        }
        
        setQuota(updatedQuota)
        setLastUpdated(new Date())
        
        if (onQuotaUpdate) {
          onQuotaUpdate(updatedQuota)
        }
      }
      
      // Clear optimistic state
      isOptimisticRef.current = false
      originalQuotaRef.current = null
      
    } catch (err) {
      console.error('Error confirming usage:', err)
      // Revert optimistic update on error
      revertOptimisticUpdate()
      throw err
    }
  }, [user, quota, onQuotaUpdate, revertOptimisticUpdate])
  
  // Initial fetch on mount
  useEffect(() => {
    if (fetchOnMount && user) {
      setIsLoading(true)
      fetchQuota().finally(() => setIsLoading(false))
    } else if (!user) {
      setQuota(null)
      setError(null)
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchOnMount]) // Only re-run when user or fetchOnMount changes
  
  // Auto-refresh interval - DISABLED to prevent infinite loops
  // Users can manually refresh via refreshQuota() if needed
  useEffect(() => {
    // Auto-refresh disabled - was causing performance issues
    // if (!user || refreshInterval <= 0) return
    // const interval = setInterval(() => {
    //   if (!isOptimisticRef.current) {
    //     fetchQuota()
    //   }
    // }, refreshInterval)
    // return () => clearInterval(interval)
  }, [user, refreshInterval, fetchQuota])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isOptimisticRef.current = false
      originalQuotaRef.current = null
    }
  }, [])
  
  return {
    quota,
    isLoading,
    error,
    refreshQuota,
    optimisticUpdate,
    revertOptimisticUpdate,
    confirmUsage,
    canUseApi: Boolean(quota?.canUse && !isOptimisticRef.current),
    lastUpdated,
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get quota status color based on remaining percentage
 */
export function getQuotaStatusColor(remaining: number, dailyLimit: number): string {
  const percentage = dailyLimit > 0 ? (remaining / dailyLimit) * 100 : 0
  
  if (percentage > 50) return 'green'
  if (percentage > 20) return 'yellow'
  return 'red'
}

/**
 * Format quota display text
 */
export function formatQuotaText(remaining: number, dailyLimit: number): string {
  return `${remaining}/${dailyLimit} remaining`
}

/**
 * Check if quota is low (less than 20% remaining)
 */
export function isQuotaLow(remaining: number, dailyLimit: number): boolean {
  return dailyLimit > 0 && (remaining / dailyLimit) < 0.2
}

/**
 * Check if quota is very low (less than 5% remaining)
 */
export function isQuotaVeryLow(remaining: number, dailyLimit: number): boolean {
  return dailyLimit > 0 && (remaining / dailyLimit) < 0.05
}