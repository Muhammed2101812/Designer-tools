'use client'

import * as React from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils/cn'

export interface ControlTooltipProps {
  /**
   * The tooltip content to display
   */
  content: string | React.ReactNode
  
  /**
   * The child element that triggers the tooltip
   * If not provided, a help icon will be shown
   */
  children?: React.ReactNode
  
  /**
   * Side of the trigger where the tooltip should appear
   * @default "top"
   */
  side?: 'top' | 'right' | 'bottom' | 'left'
  
  /**
   * Whether to show the help icon
   * @default true when no children provided
   */
  showIcon?: boolean
  
  /**
   * Additional CSS classes for the trigger
   */
  className?: string
  
  /**
   * Delay before showing tooltip in milliseconds
   * @default 200
   */
  delayDuration?: number
}

/**
 * ControlTooltip - A wrapper component for adding helpful tooltips to tool controls
 * 
 * Usage:
 * ```tsx
 * <ControlTooltip content="Adjust the quality of the output image">
 *   <Slider value={quality} onChange={setQuality} />
 * </ControlTooltip>
 * ```
 * 
 * Or as a standalone help icon:
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <Label>Quality</Label>
 *   <ControlTooltip content="Higher quality means larger file size" />
 * </div>
 * ```
 */
export function ControlTooltip({
  content,
  children,
  side = 'top',
  showIcon = !children,
  className,
  delayDuration = 200,
}: ControlTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild={!!children}>
          {children || (
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center rounded-full',
                'text-muted-foreground hover:text-foreground',
                'transition-colors focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-ring focus-visible:ring-offset-2',
                'h-4 w-4',
                className
              )}
              aria-label="Help"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {typeof content === 'string' ? (
            <p className="text-sm">{content}</p>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * LabelWithTooltip - A label component with an integrated tooltip
 * 
 * Usage:
 * ```tsx
 * <LabelWithTooltip
 *   label="Quality"
 *   tooltip="Higher quality means larger file size"
 *   htmlFor="quality-slider"
 * />
 * ```
 */
export interface LabelWithTooltipProps {
  /**
   * The label text
   */
  label: string
  
  /**
   * The tooltip content
   */
  tooltip: string | React.ReactNode
  
  /**
   * The ID of the form element this label is for
   */
  htmlFor?: string
  
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean
  
  /**
   * Additional CSS classes for the label
   */
  className?: string
}

export function LabelWithTooltip({
  label,
  tooltip,
  htmlFor,
  required = false,
  className,
}: LabelWithTooltipProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <ControlTooltip content={tooltip} />
    </div>
  )
}
