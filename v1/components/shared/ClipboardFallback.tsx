'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ClipboardFallbackProps {
  /**
   * Whether the dialog is open
   */
  open: boolean
  
  /**
   * Callback when dialog should close
   */
  onOpenChange: (open: boolean) => void
  
  /**
   * The value to display for manual copying
   */
  value: string
  
  /**
   * Label for the value (e.g., "HEX Color", "RGB Value")
   */
  label?: string
}

export function ClipboardFallback({
  open,
  onOpenChange,
  value,
  label = 'Value',
}: ClipboardFallbackProps) {
  const [copied, setCopied] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Reset copied state when dialog opens
  React.useEffect(() => {
    if (open) {
      setCopied(false)
    }
  }, [open])

  // Auto-select text when dialog opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.select()
    }
  }, [open])

  const handleCopy = async () => {
    if (!inputRef.current) return

    try {
      // Try clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      }

      // Fallback to execCommand (deprecated but widely supported)
      inputRef.current.select()
      const success = document.execCommand('copy')
      
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSelectAll = () => {
    inputRef.current?.select()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy {label}</DialogTitle>
          <DialogDescription>
            Automatic copying is not available. Please manually copy the value below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={value}
              readOnly
              onClick={handleSelectAll}
              className="font-mono"
              aria-label={label}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopy}
              className={cn(
                'flex-shrink-0',
                copied && 'bg-green-50 border-green-500 text-green-700'
              )}
              aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Click the input field to select all, then press Ctrl+C (Cmd+C on Mac) to copy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
