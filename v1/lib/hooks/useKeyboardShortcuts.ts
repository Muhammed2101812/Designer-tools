/**
 * Custom hook for managing keyboard shortcuts in tools
 * Provides consistent keyboard navigation across all tools
 */

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  description: string
  handler: () => void
  preventDefault?: boolean
}

export interface UseKeyboardShortcutsOptions {
  /**
   * Array of keyboard shortcuts to register
   */
  shortcuts: KeyboardShortcut[]

  /**
   * Whether shortcuts are enabled
   * @default true
   */
  enabled?: boolean

  /**
   * Whether to prevent default browser behavior
   * @default true
   */
  preventDefault?: boolean
}

/**
 * Hook to manage keyboard shortcuts for a tool
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'Escape',
 *       description: 'Cancel operation',
 *       handler: handleCancel,
 *     },
 *     {
 *       key: 's',
 *       ctrlKey: true,
 *       description: 'Save/Download',
 *       handler: handleDownload,
 *     },
 *   ],
 * })
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventDefault = true,
}: UseKeyboardShortcutsOptions): void {
  // Use ref to avoid recreating handler on every render
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key even in input fields
        if (event.key !== 'Escape') {
          return
        }
      }

      // Find matching shortcut
      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey
        const metaMatches = shortcut.metaKey ? event.metaKey : !event.metaKey

        return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches
      })

      if (matchingShortcut) {
        if (preventDefault || matchingShortcut.preventDefault !== false) {
          event.preventDefault()
        }
        matchingShortcut.handler()
      }
    },
    [enabled, preventDefault]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}

/**
 * Get keyboard shortcut display string
 * Formats shortcut for display in UI
 * 
 * @example
 * ```tsx
 * getShortcutDisplay({ key: 's', ctrlKey: true }) // "Ctrl+S" or "⌘S" on Mac
 * ```
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }

  if (shortcut.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift')
  }

  if (shortcut.altKey) {
    parts.push(isMac ? '⌥' : 'Alt')
  }

  // Format key name
  let keyName = shortcut.key
  if (keyName.length === 1) {
    keyName = keyName.toUpperCase()
  } else {
    // Capitalize first letter for special keys
    keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1)
  }

  parts.push(keyName)

  return parts.join(isMac ? '' : '+')
}

/**
 * Common keyboard shortcuts used across tools
 */
export const COMMON_SHORTCUTS = {
  ESCAPE: {
    key: 'Escape',
    description: 'Cancel operation or close dialog',
  },
  ENTER: {
    key: 'Enter',
    description: 'Confirm or process',
  },
  SAVE: {
    key: 's',
    ctrlKey: true,
    description: 'Download result',
  },
  RESET: {
    key: 'r',
    ctrlKey: true,
    description: 'Reset tool',
  },
  UNDO: {
    key: 'z',
    ctrlKey: true,
    description: 'Undo last action',
  },
  ZOOM_IN: {
    key: '+',
    description: 'Zoom in',
  },
  ZOOM_OUT: {
    key: '-',
    description: 'Zoom out',
  },
  ARROW_UP: {
    key: 'ArrowUp',
    description: 'Move up or increase value',
  },
  ARROW_DOWN: {
    key: 'ArrowDown',
    description: 'Move down or decrease value',
  },
  ARROW_LEFT: {
    key: 'ArrowLeft',
    description: 'Move left or previous',
  },
  ARROW_RIGHT: {
    key: 'ArrowRight',
    description: 'Move right or next',
  },
} as const
