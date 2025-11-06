/**
 * Accessibility utilities for Design Kit
 * Provides functions for screen reader announcements, focus management, and ARIA helpers
 */

/**
 * Announce a message to screen readers using aria-live regions
 * Creates a temporary element that screen readers will announce
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement is made (1 second delay)
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(container.querySelectorAll<HTMLElement>(selector))
}

/**
 * Trap focus within a container (useful for modals and dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container)
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  container.addEventListener('keydown', handleTab)

  // Focus first element
  firstElement?.focus()

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTab)
  }
}

/**
 * Check if an element is visible and focusable
 */
export function isElementFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return false
  if (element.getAttribute('tabindex') === '-1') return false
  if (element.offsetParent === null) return false // Hidden element
  return true
}

/**
 * Get contrast ratio between two colors
 * Used to verify WCAG color contrast requirements
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1)
  const l2 = getRelativeLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get relative luminance of a color
 * Used in contrast ratio calculation
 */
function getRelativeLuminance(color: string): number {
  // Convert hex to RGB
  const rgb = hexToRgb(color)
  if (!rgb) return 0

  // Convert to sRGB
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const sRGB = val / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })

  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '')

  // Parse hex values
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  if (hex.length !== 6) return null

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return { r, g, b }
}

/**
 * Check if color contrast meets WCAG AA standards
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Object with pass/fail status and contrast ratio
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; level: 'AAA' | 'AA' | 'Fail' } {
  const ratio = getContrastRatio(foreground, background)
  const requiredRatio = isLargeText ? 3 : 4.5
  const aaaRatio = isLargeText ? 4.5 : 7

  return {
    passes: ratio >= requiredRatio,
    ratio: Math.round(ratio * 100) / 100,
    level: ratio >= aaaRatio ? 'AAA' : ratio >= requiredRatio ? 'AA' : 'Fail',
  }
}

/**
 * Generate accessible label for a color value
 */
export function getColorAccessibleLabel(
  hex: string,
  rgb?: { r: number; g: number; b: number },
  hsl?: { h: number; s: number; l: number }
): string {
  let label = `Color ${hex}`

  if (rgb) {
    label += `, RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}`
  }

  if (hsl) {
    label += `, HSL: ${Math.round(hsl.h)} degrees, ${Math.round(hsl.s)}% saturation, ${Math.round(hsl.l)}% lightness`
  }

  return label
}

/**
 * Create a skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, label: string): HTMLAnchorElement {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = label
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md'

  return skipLink
}

/**
 * Manage focus restoration after modal/dialog closes
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null

  /**
   * Save current focus before opening modal
   */
  saveFocus(): void {
    this.previousFocus = document.activeElement as HTMLElement
  }

  /**
   * Restore focus after closing modal
   */
  restoreFocus(): void {
    if (this.previousFocus && isElementFocusable(this.previousFocus)) {
      this.previousFocus.focus()
    }
  }

  /**
   * Clear saved focus
   */
  clear(): void {
    this.previousFocus = null
  }
}
