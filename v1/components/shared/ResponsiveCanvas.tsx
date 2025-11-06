'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { getOptimalCanvasSize, useIsMobile } from '@/lib/utils/responsive'

export interface ResponsiveCanvasProps {
  /**
   * Canvas width
   */
  width: number
  
  /**
   * Canvas height
   */
  height: number
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Callback when canvas is ready
   */
  onCanvasReady?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void
  
  /**
   * Whether to optimize for mobile
   * @default true
   */
  optimizeForMobile?: boolean
  
  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string
  
  /**
   * Additional props to pass to canvas element
   */
  canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>
}

/**
 * ResponsiveCanvas Component
 * 
 * A canvas wrapper that automatically optimizes dimensions for mobile devices
 * to prevent performance issues while maintaining aspect ratio.
 */
export const ResponsiveCanvas = React.forwardRef<HTMLCanvasElement, ResponsiveCanvasProps>(
  (
    {
      width,
      height,
      className,
      onCanvasReady,
      optimizeForMobile = true,
      ariaLabel,
      canvasProps,
    },
    ref
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const isMobile = useIsMobile()
    const [dimensions, setDimensions] = React.useState({ width, height })

    // Combine refs
    React.useImperativeHandle(ref, () => canvasRef.current!)

    // Calculate optimal dimensions
    React.useEffect(() => {
      if (optimizeForMobile) {
        const optimal = getOptimalCanvasSize(width, height)
        setDimensions(optimal)
      } else {
        setDimensions({ width, height })
      }
    }, [width, height, optimizeForMobile])

    // Call onCanvasReady when canvas is mounted
    React.useEffect(() => {
      if (canvasRef.current && onCanvasReady) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          onCanvasReady(canvasRef.current, ctx)
        }
      }
    }, [onCanvasReady])

    // Handle container resize
    React.useEffect(() => {
      if (!containerRef.current) return

      const resizeObserver = new ResizeObserver(() => {
        // Trigger re-render if needed
      })

      resizeObserver.observe(containerRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }, [])

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative w-full overflow-hidden rounded-lg border bg-muted/20',
          'flex items-center justify-center',
          className
        )}
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className={cn(
            'max-w-full h-auto',
            'touch-none', // Prevent default touch behaviors
            isMobile && 'cursor-pointer' // Better mobile UX
          )}
          aria-label={ariaLabel}
          {...canvasProps}
          style={{
            ...canvasProps?.style,
            imageRendering: isMobile ? 'auto' : 'crisp-edges',
          }}
        />
      </div>
    )
  }
)

ResponsiveCanvas.displayName = 'ResponsiveCanvas'
