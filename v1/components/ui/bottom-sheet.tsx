'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

export interface BottomSheetProps {
  /**
   * Whether the bottom sheet is open
   */
  open: boolean
  
  /**
   * Callback when the bottom sheet should close
   */
  onClose: () => void
  
  /**
   * Title displayed at the top of the sheet
   */
  title?: string
  
  /**
   * Content to display in the sheet
   */
  children: React.ReactNode
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean
}

/**
 * BottomSheet Component
 * 
 * Mobile-optimized bottom sheet for displaying controls and options.
 * Slides up from the bottom of the screen with a backdrop.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}: BottomSheetProps) {
  const [isAnimating, setIsAnimating] = React.useState(false)
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const startY = React.useRef<number>(0)
  const currentY = React.useRef<number>(0)

  // Handle escape key
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setIsAnimating(true)
    } else {
      document.body.style.overflow = ''
      setIsAnimating(false)
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    currentY.current = startY.current
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current

    // Only allow downward swipes
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }

  const handleTouchEnd = () => {
    const deltaY = currentY.current - startY.current

    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }

    // Close if swiped down more than 100px
    if (deltaY > 100) {
      onClose()
    }
  }

  if (!open && !isAnimating) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 transition-opacity',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background rounded-t-2xl shadow-2xl',
          'max-h-[85vh] overflow-hidden',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 pb-3 border-b">
            {title && (
              <h2 id="bottom-sheet-title" className="text-lg font-semibold">
                {title}
              </h2>
            )}
            {!title && <div />}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-4rem)] p-4">
          {children}
        </div>
      </div>
    </>
  )
}
