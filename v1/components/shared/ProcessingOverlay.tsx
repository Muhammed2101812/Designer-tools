'use client'

import * as React from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

export interface ProcessingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  isProcessing: boolean
  
  /**
   * Progress percentage (0-100)
   * If not provided, shows indeterminate spinner
   */
  progress?: number
  
  /**
   * Status message to display
   * @default "Processing..."
   */
  message?: string
  
  /**
   * Callback when cancel button is clicked
   * If not provided, cancel button is hidden
   */
  onCancel?: () => void
  
  /**
   * Additional CSS classes for the overlay
   */
  className?: string
  
  /**
   * Whether to show a backdrop blur effect
   * @default true
   */
  showBackdrop?: boolean
}

/**
 * ProcessingOverlay shows a loading state during API operations
 * with optional progress bar and cancel functionality.
 */
export function ProcessingOverlay({
  isProcessing,
  progress,
  message = 'Processing...',
  onCancel,
  className,
  showBackdrop = true,
}: ProcessingOverlayProps) {
  const [isCancelling, setIsCancelling] = React.useState(false)
  const overlayRef = React.useRef<HTMLDivElement>(null)
  
  // Trap focus within overlay when active
  useFocusTrap(overlayRef, {
    isActive: isProcessing,
    onEscape: onCancel,
  })
  
  // Prevent body scroll when overlay is active
  React.useEffect(() => {
    if (isProcessing) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isProcessing])
  
  const handleCancel = () => {
    if (onCancel && !isCancelling) {
      setIsCancelling(true)
      onCancel()
      
      // Reset cancelling state after a delay
      setTimeout(() => {
        setIsCancelling(false)
      }, 1000)
    }
  }
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onCancel && !isCancelling) {
      handleCancel()
    }
  }
  
  if (!isProcessing) {
    return null
  }
  
  return (
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        showBackdrop && 'bg-background/80 backdrop-blur-sm',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-title"
      aria-describedby="processing-description"
      aria-live="polite"
      onKeyDown={handleKeyDown}
    >
      {/* Processing Card */}
      <div className="relative w-full max-w-md mx-4 rounded-lg border bg-card p-6 shadow-lg">
        {/* Cancel Button */}
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleCancel}
            disabled={isCancelling}
            aria-label="Cancel processing"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        
        {/* Content */}
        <div className="space-y-4">
          {/* Spinner or Progress */}
          <div className="flex justify-center">
            {progress !== undefined ? (
              <div className="w-16 h-16 relative">
                <svg
                  className="w-16 h-16 transform -rotate-90"
                  viewBox="0 0 64 64"
                  aria-hidden="true"
                >
                  {/* Background circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                    className="text-primary transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold" aria-live="polite">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            ) : (
              <Loader2
                className="h-16 w-16 animate-spin text-primary"
                aria-hidden="true"
              />
            )}
          </div>
          
          {/* Message */}
          <div className="text-center space-y-2">
            <h2
              id="processing-title"
              className="text-lg font-semibold"
            >
              {message}
            </h2>
            
            {progress !== undefined && (
              <p
                id="processing-description"
                className="text-sm text-muted-foreground"
              >
                Please wait while we process your request
              </p>
            )}
            
            {!progress && (
              <p
                id="processing-description"
                className="text-sm text-muted-foreground"
              >
                This may take a few moments
              </p>
            )}
          </div>
          
          {/* Progress Bar (alternative to circular progress) */}
          {progress !== undefined && (
            <div className="space-y-2">
              <Progress
                value={progress}
                className="h-2"
                aria-label={`Processing progress: ${progress}%`}
              />
              <p className="text-xs text-center text-muted-foreground">
                {progress < 30 && 'Starting...'}
                {progress >= 30 && progress < 70 && 'Processing...'}
                {progress >= 70 && progress < 100 && 'Almost done...'}
                {progress === 100 && 'Finalizing...'}
              </p>
            </div>
          )}
          
          {/* Cancel hint */}
          {onCancel && !isCancelling && (
            <p className="text-xs text-center text-muted-foreground">
              Press Escape or click the X to cancel
            </p>
          )}
          
          {isCancelling && (
            <p className="text-xs text-center text-muted-foreground">
              Cancelling...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
