/**
 * Custom hook for making screen reader announcements
 * Provides a simple way to announce status updates to screen reader users
 */

import { useCallback, useRef } from 'react'
import { announceToScreenReader } from '@/lib/utils/accessibility'

export interface UseAnnouncementOptions {
  /**
   * Default priority for announcements
   * @default 'polite'
   */
  defaultPriority?: 'polite' | 'assertive'

  /**
   * Debounce time in milliseconds to prevent rapid announcements
   * @default 300
   */
  debounceMs?: number
}

/**
 * Hook to make screen reader announcements
 * Provides debouncing to prevent announcement spam
 * 
 * @example
 * ```tsx
 * const announce = useAnnouncement()
 * 
 * const handleProcess = async () => {
 *   announce('Processing image...')
 *   await processImage()
 *   announce('Image processed successfully', 'assertive')
 * }
 * ```
 */
export function useAnnouncement(options: UseAnnouncementOptions = {}) {
  const { defaultPriority = 'polite', debounceMs = 300 } = options

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnnouncementRef = useRef<string>('')

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = defaultPriority) => {
      // Don't announce the same message twice in a row
      if (message === lastAnnouncementRef.current) {
        return
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Debounce announcements
      timeoutRef.current = setTimeout(() => {
        announceToScreenReader(message, priority)
        lastAnnouncementRef.current = message
      }, debounceMs)
    },
    [defaultPriority, debounceMs]
  )

  const announceImmediate = useCallback(
    (message: string, priority: 'polite' | 'assertive' = defaultPriority) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      announceToScreenReader(message, priority)
      lastAnnouncementRef.current = message
    },
    [defaultPriority]
  )

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    lastAnnouncementRef.current = ''
  }, [])

  return {
    /**
     * Make an announcement with debouncing
     */
    announce,

    /**
     * Make an immediate announcement without debouncing
     */
    announceImmediate,

    /**
     * Clear pending announcements
     */
    clear,
  }
}

/**
 * Common announcement messages for tools
 */
export const ANNOUNCEMENT_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_REMOVED: 'File removed',
  PROCESSING: 'Processing...',
  PROCESSING_COMPLETE: 'Processing complete',
  DOWNLOAD_READY: 'Download ready',
  DOWNLOAD_STARTED: 'Download started',
  ERROR: 'An error occurred',
  COPIED: 'Copied to clipboard',
  RESET: 'Tool reset',
  ZOOM_IN: 'Zoomed in',
  ZOOM_OUT: 'Zoomed out',
  COLOR_PICKED: (color: string) => `Color picked: ${color}`,
  IMAGE_CROPPED: 'Image cropped',
  IMAGE_RESIZED: 'Image resized',
  FORMAT_CONVERTED: 'Format converted',
  QR_GENERATED: 'QR code generated',
  GRADIENT_UPDATED: 'Gradient updated',
  BACKGROUND_REMOVED: 'Background removed',
  IMAGE_UPSCALED: 'Image upscaled',
  MOCKUP_GENERATED: 'Mockup generated',
  QUOTA_LOW: (remaining: number) => `${remaining} operations remaining today`,
  QUOTA_EXCEEDED: 'Daily quota exceeded',
} as const
