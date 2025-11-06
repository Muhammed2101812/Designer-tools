'use client'

import * as React from 'react'
import { TrendingUp, AlertCircle, Zap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'
import { useQuota, type QuotaInfo } from '@/lib/hooks/useQuota'

export interface UsageIndicatorProps {
  /**
   * Current usage count for the day (optional - will fetch if not provided)
   */
  currentUsage?: number
  
  /**
   * Daily limit for the user's plan (optional - will fetch if not provided)
   */
  dailyLimit?: number
  
  /**
   * User's plan name (optional - will fetch if not provided)
   */
  planName?: 'free' | 'premium' | 'pro'
  
  /**
   * Callback when upgrade button is clicked
   */
  onUpgradeClick?: () => void
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Show compact version (smaller, inline)
   * @default false
   */
  compact?: boolean
  
  /**
   * Auto-refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number
  
  /**
   * Callback when usage data is updated
   */
  onUsageUpdate?: (usage: { currentUsage: number; dailyLimit: number; planName: string }) => void
  
  /**
   * Callback when quota is exceeded
   */
  onQuotaExceeded?: () => void
  
  /**
   * Whether to show real-time updates
   * @default false
   */
  realTimeUpdates?: boolean
}

/**
 * UsageIndicator displays remaining API quota for authenticated users
 * with a progress bar, numerical count, and upgrade CTA when needed.
 * Supports real-time updates and automatic data fetching.
 */
export function UsageIndicator({
  currentUsage: initialUsage,
  dailyLimit: initialLimit,
  planName: initialPlan,
  onUpgradeClick,
  className,
  compact = false,
  refreshInterval = 30000,
  onUsageUpdate,
  onQuotaExceeded,
  realTimeUpdates = false, // Changed to false to prevent loading issues
}: UsageIndicatorProps) {
  const router = useRouter()
  
  // Use the quota hook for real-time updates
  const {
    quota,
    isLoading: isQuotaLoading,
    error: quotaError,
    refreshQuota,
    lastUpdated,
  } = useQuota({
    refreshInterval: realTimeUpdates ? refreshInterval : 0,
    fetchOnMount: realTimeUpdates && !initialUsage && !initialLimit && !initialPlan,
    onQuotaUpdate: (quotaData: QuotaInfo) => {
      if (onUsageUpdate) {
        onUsageUpdate({
          currentUsage: quotaData.currentUsage,
          dailyLimit: quotaData.dailyLimit,
          planName: quotaData.plan,
        })
      }
    },
    onQuotaExceeded,
  })
  
  // Use either real-time data or provided props
  const currentUsage = realTimeUpdates && quota ? quota.currentUsage : (initialUsage ?? 0)
  const dailyLimit = realTimeUpdates && quota ? quota.dailyLimit : (initialLimit ?? 10)
  const planName = realTimeUpdates && quota ? (quota.plan as 'free' | 'premium' | 'pro') : (initialPlan ?? 'free')
  const isLoading = realTimeUpdates ? isQuotaLoading : false
  
  const remaining = Math.max(0, dailyLimit - currentUsage)
  const usagePercentage = dailyLimit > 0 ? (currentUsage / dailyLimit) * 100 : 0
  
  // Manual refresh function
  const handleRefresh = () => {
    if (realTimeUpdates) {
      refreshQuota()
    }
  }
  
  // Determine color based on remaining quota
  const getStatusColor = () => {
    const remainingPercentage = (remaining / dailyLimit) * 100
    
    if (remainingPercentage > 50) return 'text-green-600 dark:text-green-400'
    if (remainingPercentage > 20) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  const getProgressIndicatorClass = () => {
    const remainingPercentage = (remaining / dailyLimit) * 100
    
    if (remainingPercentage > 50) return 'bg-green-500'
    if (remainingPercentage > 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }
  
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      router.push('/pricing')
    }
  }
  
  const isLowQuota = remaining < dailyLimit * 0.2
  const isOutOfQuota = remaining === 0
  
  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5',
          className
        )}
        role="status"
        aria-label={`API quota: ${remaining} of ${dailyLimit} remaining`}
      >
        <Zap className={cn('h-4 w-4', getStatusColor())} aria-hidden="true" />
        <span className={cn('text-sm font-medium', getStatusColor())}>
          {remaining}/{dailyLimit}
        </span>
      </div>
    )
  }
  
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3',
        className
      )}
      role="region"
      aria-label="API usage quota information"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={cn('h-5 w-5', getStatusColor())} aria-hidden="true" />
          <h3 className="text-sm font-semibold">API Quota</h3>
          {!compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-6 w-6 p-0"
              aria-label="Refresh quota data"
            >
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {planName} Plan
          </span>
          {!compact && lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          {isLoading ? (
            <div className="h-full w-full bg-muted animate-pulse" />
          ) : (
            <div
              className={cn(
                'h-full transition-all duration-300 ease-in-out',
                getProgressIndicatorClass()
              )}
              style={{ width: `${usagePercentage}%` }}
              role="progressbar"
              aria-valuenow={usagePercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${usagePercentage.toFixed(0)}% of daily quota used`}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className={cn('font-medium', getStatusColor())} role="status">
            {isLoading ? '...' : `${remaining} remaining`}
          </span>
          <span className="text-muted-foreground">
            {isLoading ? 'Loading...' : `${currentUsage} / ${dailyLimit} used`}
          </span>
        </div>
      </div>
      
      {/* Error Message */}
      {quotaError && realTimeUpdates && (
        <div
          className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>Failed to load quota: {quotaError}</p>
        </div>
      )}
      
      {/* Warning Message */}
      {isLowQuota && !isOutOfQuota && !quotaError && (
        <div
          className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm text-yellow-800 dark:text-yellow-200"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>You&apos;re running low on API quota. Consider upgrading for more operations.</p>
        </div>
      )}
      
      {/* Out of Quota Message */}
      {isOutOfQuota && !quotaError && (
        <div
          className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>You&apos;ve reached your daily quota limit. Upgrade to continue using API tools.</p>
        </div>
      )}
      
      {/* Upgrade CTA */}
      {(isLowQuota || isOutOfQuota) && planName !== 'pro' && (
        <Button
          onClick={handleUpgrade}
          className="w-full gap-2"
          variant={isOutOfQuota ? 'default' : 'outline'}
          aria-label="Upgrade your plan for more API quota"
        >
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Upgrade Plan
        </Button>
      )}
      
      {/* Reset Info */}
      <p className="text-xs text-center text-muted-foreground">
        Quota resets daily at midnight UTC
      </p>
    </div>
  )
}
