/**
 * Component to display keyboard shortcuts in tool info dialogs
 * Shows available keyboard shortcuts with visual key representations
 */

import * as React from 'react'
import { Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { KeyboardShortcut } from '@/lib/hooks/useKeyboardShortcuts'
import { getShortcutDisplay } from '@/lib/hooks/useKeyboardShortcuts'

export interface KeyboardShortcutsProps {
  /**
   * Array of keyboard shortcuts to display
   */
  shortcuts: KeyboardShortcut[]

  /**
   * Optional title for the shortcuts section
   * @default "Keyboard Shortcuts"
   */
  title?: string

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Display keyboard shortcuts in a formatted list
 * Used in tool info dialogs to show available shortcuts
 */
export function KeyboardShortcuts({
  shortcuts,
  title = 'Keyboard Shortcuts',
  className,
}: KeyboardShortcutsProps) {
  if (shortcuts.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Keyboard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>

      <div className="space-y-2" role="list" aria-label="Available keyboard shortcuts">
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 text-sm"
            role="listitem"
          >
            <span className="text-muted-foreground">{shortcut.description}</span>
            <kbd
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1',
                'rounded border border-border bg-muted',
                'font-mono text-xs font-semibold',
                'text-foreground'
              )}
              aria-label={`Keyboard shortcut: ${getShortcutDisplay(shortcut)}`}
            >
              {getShortcutDisplay(shortcut)}
            </kbd>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        <span className="font-medium">Note:</span> Keyboard shortcuts work when the tool is in focus
        and not typing in an input field.
      </p>
    </div>
  )
}

/**
 * Single keyboard shortcut display component
 * For inline display of a single shortcut
 */
export function KeyboardShortcutBadge({
  shortcut,
  className,
}: {
  shortcut: KeyboardShortcut
  className?: string
}) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1',
        'rounded border border-border bg-muted',
        'font-mono text-xs font-semibold',
        'text-foreground',
        className
      )}
      aria-label={`Keyboard shortcut: ${getShortcutDisplay(shortcut)}`}
    >
      {getShortcutDisplay(shortcut)}
    </kbd>
  )
}
