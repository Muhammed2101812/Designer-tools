/**
 * Custom hook for trapping focus within a container (e.g., modals, dialogs)
 * Ensures keyboard navigation stays within the container for accessibility
 */

import { useEffect, useRef, RefObject } from 'react'
import { getFocusableElements, isElementFocusable } from '@/lib/utils/accessibility'

export interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  isActive: boolean

  /**
   * Whether to focus the first element when trap activates
   * @default true
   */
  focusFirstElement?: boolean

  /**
   * Whether to restore focus to the previously focused element when trap deactivates
   * @default true
   */
  restoreFocus?: boolean

  /**
   * Callback when user tries to escape (presses Escape key)
   */
  onEscape?: () => void
}

/**
 * Hook to trap focus within a container element
 * Useful for modals, dialogs, and other overlay components
 * 
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null)
 * 
 * useFocusTrap(modalRef, {
 *   isActive: isOpen,
 *   onEscape: handleClose,
 * })
 * 
 * return (
 *   <div ref={modalRef} role="dialog">
 *     {content}
 *   </div>
 * )
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T>,
  options: UseFocusTrapOptions
): void {
  const {
    isActive,
    focusFirstElement = true,
    restoreFocus = true,
    onEscape,
  } = options

  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current

    // Save currently focused element
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }

    // Get all focusable elements
    const focusableElements = getFocusableElements(container)

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element if requested
    if (focusFirstElement) {
      firstElement?.focus()
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      // Handle Tab key
      if (event.key === 'Tab') {
        // Get current focusable elements (may have changed)
        const currentFocusableElements = getFocusableElements(container)

        if (currentFocusableElements.length === 0) return

        const currentFirstElement = currentFocusableElements[0]
        const currentLastElement = currentFocusableElements[currentFocusableElements.length - 1]

        if (event.shiftKey) {
          // Shift + Tab: moving backwards
          if (document.activeElement === currentFirstElement) {
            event.preventDefault()
            currentLastElement?.focus()
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === currentLastElement) {
            event.preventDefault()
            currentFirstElement?.focus()
          }
        }
      }
    }

    // Add event listener
    container.addEventListener('keydown', handleKeyDown)

    // Cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)

      // Restore focus to previously focused element
      if (restoreFocus && previousFocusRef.current && isElementFocusable(previousFocusRef.current)) {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive, containerRef, focusFirstElement, restoreFocus, onEscape])
}

/**
 * Hook to manage focus restoration
 * Simpler alternative to useFocusTrap when you only need focus restoration
 * 
 * @example
 * ```tsx
 * const { saveFocus, restoreFocus } = useFocusRestoration()
 * 
 * const handleOpen = () => {
 *   saveFocus()
 *   setIsOpen(true)
 * }
 * 
 * const handleClose = () => {
 *   setIsOpen(false)
 *   restoreFocus()
 * }
 * ```
 */
export function useFocusRestoration() {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusRef.current && isElementFocusable(previousFocusRef.current)) {
      previousFocusRef.current.focus()
    }
  }

  const clearFocus = () => {
    previousFocusRef.current = null
  }

  return {
    saveFocus,
    restoreFocus,
    clearFocus,
  }
}
