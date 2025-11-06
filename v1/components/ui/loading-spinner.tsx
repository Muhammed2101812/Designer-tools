import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg' | 'xl'
  
  /**
   * Optional text to display below the spinner
   */
  text?: string
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Whether to center the spinner in its container
   * @default false
   */
  centered?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  default: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

export function LoadingSpinner({
  size = 'default',
  text,
  className,
  centered = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        centered && 'min-h-[200px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={text || 'Loading'}
    >
      <Loader2
        className={cn('animate-spin text-primary', sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  )

  return spinner
}
