/**
 * Enhanced toast notification helpers
 * Provides consistent toast notifications with retry functionality
 */

import { toast as baseToast } from '@/lib/hooks/use-toast'
import { getUserErrorMessage, isRecoverableError } from './errors'
import type { ToastActionElement } from '@/components/ui/toast'

export interface ToastOptions {
  title?: string
  description?: string
  duration?: number
  action?: ToastActionElement
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string, options?: ToastOptions) {
  return baseToast({
    title: options?.title || 'Success',
    description: message,
    duration: options?.duration || 3000,
    variant: 'default',
    action: options?.action,
  })
}

/**
 * Show error toast notification
 */
export function showErrorToast(
  error: unknown,
  options?: ToastOptions & { onRetry?: () => void }
) {
  const message = getUserErrorMessage(error)
  
  return baseToast({
    title: options?.title || 'Error',
    description: message,
    duration: options?.duration || 5000,
    variant: 'destructive',
    action: options?.action,
  })
}

/**
 * Show warning toast notification
 */
export function showWarningToast(message: string, options?: ToastOptions) {
  return baseToast({
    title: options?.title || 'Warning',
    description: message,
    duration: options?.duration || 4000,
    variant: 'default',
    action: options?.action,
  })
}

/**
 * Show info toast notification
 */
export function showInfoToast(message: string, options?: ToastOptions) {
  return baseToast({
    title: options?.title || 'Info',
    description: message,
    duration: options?.duration || 3000,
    variant: 'default',
    action: options?.action,
  })
}

/**
 * Show processing toast notification
 */
export function showProcessingToast(message: string = 'Processing...') {
  return baseToast({
    title: 'Processing',
    description: message,
    duration: Infinity, // Don't auto-dismiss
    variant: 'default',
  })
}

/**
 * Common toast messages for tool operations
 */
export const TOAST_MESSAGES = {
  // File operations
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DOWNLOAD_STARTED: 'Download started',
  FILE_DOWNLOAD_COMPLETE: 'Download complete',
  
  // Processing
  PROCESSING_STARTED: 'Processing your image...',
  PROCESSING_COMPLETE: 'Processing complete',
  PROCESSING_FAILED: 'Processing failed',
  
  // Quota
  QUOTA_LOW: (remaining: number) => `Only ${remaining} operations remaining today`,
  QUOTA_EXHAUSTED: 'Daily quota exhausted',
  
  // Copy operations
  COPIED_TO_CLIPBOARD: (format: string) => `Copied ${format} to clipboard`,
  COPY_FAILED: 'Failed to copy to clipboard',
  
  // Export operations
  EXPORT_SUCCESS: (format: string) => `Exported as ${format}`,
  EXPORT_FAILED: 'Export failed',
  
  // Network
  NETWORK_ERROR: 'Network error. Please check your connection.',
  RETRY_AVAILABLE: 'Click retry to try again',
} as const

/**
 * Show file upload success toast
 */
export function showFileUploadedToast(fileName: string) {
  return showSuccessToast(`${fileName} uploaded successfully`)
}

/**
 * Show file download toast
 */
export function showFileDownloadToast(fileName: string) {
  return showSuccessToast(`${fileName} downloaded`)
}

/**
 * Show processing complete toast
 */
export function showProcessingCompleteToast(onDownload?: () => void) {
  return showSuccessToast(
    TOAST_MESSAGES.PROCESSING_COMPLETE
  )
}

/**
 * Show quota warning toast
 */
export function showQuotaWarningToast(remaining: number, onUpgrade?: () => void) {
  return showWarningToast(
    TOAST_MESSAGES.QUOTA_LOW(remaining)
  )
}

/**
 * Show quota exhausted toast
 */
export function showQuotaExhaustedToast(onUpgrade: () => void) {
  return showErrorToast(
    new Error(TOAST_MESSAGES.QUOTA_EXHAUSTED)
  )
}

/**
 * Show network error toast with retry
 */
export function showNetworkErrorToast(onRetry: () => void) {
  return showErrorToast(
    new Error(TOAST_MESSAGES.NETWORK_ERROR)
  )
}

/**
 * Show clipboard copy success toast
 */
export function showCopiedToast(format: string) {
  return showSuccessToast(TOAST_MESSAGES.COPIED_TO_CLIPBOARD(format))
}

/**
 * Dismiss a toast by ID
 */
export function dismissToast(toastId: string) {
  // The toast hook provides a dismiss function
  // This is a convenience wrapper
  return baseToast({ id: toastId, open: false } as any)
}
