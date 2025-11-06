'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeedbackDialog } from './FeedbackDialog'
import { cn } from '@/lib/utils/cn'

interface FeedbackButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'floating'
}

/**
 * Feedback Button
 *
 * Floating button that opens feedback dialog.
 * Can be placed anywhere in the app for easy user feedback collection.
 */
export function FeedbackButton({ className, variant = 'floating' }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false)

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-50',
            'flex h-14 w-14 items-center justify-center rounded-full',
            'bg-primary text-primary-foreground shadow-lg',
            'transition-all hover:scale-110 hover:shadow-xl',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'md:h-auto md:w-auto md:rounded-lg md:px-4 md:py-2.5',
            className
          )}
          aria-label="Send feedback"
        >
          <MessageSquare className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">Feedback</span>
        </button>

        <FeedbackDialog open={open} onOpenChange={setOpen} />
      </>
    )
  }

  return (
    <>
      <Button
        variant={variant === 'default' ? 'default' : variant === 'outline' ? 'outline' : 'ghost'}
        onClick={() => setOpen(true)}
        className={className}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Send Feedback
      </Button>

      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
