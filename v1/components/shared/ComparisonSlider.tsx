'use client'

import * as React from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ComparisonSliderProps {
  /**
   * URL or data URL of the "before" image
   */
  beforeImage: string
  
  /**
   * URL or data URL of the "after" image
   */
  afterImage: string
  
  /**
   * Label for the before image
   * @default "Before"
   */
  beforeLabel?: string
  
  /**
   * Label for the after image
   * @default "After"
   */
  afterLabel?: string
  
  /**
   * Initial slider position (0-100)
   * @default 50
   */
  initialPosition?: number
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Alt text for before image
   */
  beforeAlt?: string
  
  /**
   * Alt text for after image
   */
  afterAlt?: string
}

/**
 * ComparisonSlider provides a side-by-side image comparison with a draggable slider.
 * Supports mouse, touch, and keyboard navigation.
 */
export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  initialPosition = 50,
  className,
  beforeAlt = 'Before image',
  afterAlt = 'After image',
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = React.useState(initialPosition)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const sliderRef = React.useRef<HTMLDivElement>(null)
  
  // Update slider position based on mouse/touch position
  const updateSliderPosition = React.useCallback((clientX: number) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    
    setSliderPosition(percentage)
  }, [])
  
  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    updateSliderPosition(e.clientX)
  }
  
  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      updateSliderPosition(e.clientX)
    },
    [isDragging, updateSliderPosition]
  )
  
  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false)
  }, [])
  
  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    updateSliderPosition(e.touches[0].clientX)
  }
  
  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault() // Prevent scrolling while dragging
      updateSliderPosition(e.touches[0].clientX)
    },
    [isDragging, updateSliderPosition]
  )
  
  const handleTouchEnd = React.useCallback(() => {
    setIsDragging(false)
  }, [])
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        setSliderPosition((prev) => Math.max(0, prev - step))
        break
      case 'ArrowRight':
        e.preventDefault()
        setSliderPosition((prev) => Math.min(100, prev + step))
        break
      case 'Home':
        e.preventDefault()
        setSliderPosition(0)
        break
      case 'End':
        e.preventDefault()
        setSliderPosition(100)
        break
    }
  }
  
  // Set up global event listeners
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg select-none',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="img"
      aria-label="Image comparison slider"
    >
      {/* After Image (Background) */}
      <div className="relative w-full aspect-video">
        <img
          src={afterImage}
          alt={afterAlt}
          className="absolute inset-0 w-full h-full object-contain bg-muted"
          draggable={false}
        />
        
        {/* After Label */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-medium shadow-sm">
          {afterLabel}
        </div>
      </div>
      
      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeAlt}
          className="absolute inset-0 w-full h-full object-contain bg-muted"
          draggable={false}
        />
        
        {/* Before Label */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-medium shadow-sm">
          {beforeLabel}
        </div>
      </div>
      
      {/* Slider Line and Handle */}
      <div
        ref={sliderRef}
        className="absolute inset-y-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        role="slider"
        aria-label="Comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPosition)}
        aria-valuetext={`${Math.round(sliderPosition)}% before image visible`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              'flex items-center justify-center',
              'w-12 h-12 sm:w-10 sm:h-10 rounded-full',
              'bg-white shadow-lg',
              'border-2 border-primary',
              'transition-transform touch-manipulation',
              isDragging ? 'scale-110' : 'scale-100',
              'hover:scale-110 active:scale-110'
            )}
          >
            <GripVertical
              className="h-6 w-6 sm:h-5 sm:w-5 text-primary"
              aria-hidden="true"
            />
          </div>
        </div>
        
        {/* Vertical line extensions */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white" />
      </div>
      
      {/* Instructions overlay (shown on first interaction) */}
      {sliderPosition === initialPosition && !isDragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-md text-sm text-muted-foreground shadow-sm">
            Drag slider or use arrow keys
          </div>
        </div>
      )}
    </div>
  )
}
