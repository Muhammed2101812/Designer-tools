'use client'

import * as React from 'react'
import { extractColorFromCanvas } from '@/lib/utils/colorConversion'
import type { Color } from '@/types'
import { Loader2, ZoomIn, ZoomOut, RotateCcw, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ensureCanvasSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError, BrowserCompatibilityError } from '@/types/errors'
import { logError } from '@/lib/utils/errorHandling'
import { validateCanvasCoordinates, validateZoomLevel } from '@/lib/utils/validation'
import { 
  useRenderPerformance, 
  useStableCallback, 
  useStableMemo, 
  useThrottledCallback 
} from '@/lib/utils/reactOptimizations'

export interface ColorCanvasProps {
  /**
   * The image source to display on the canvas
   */
  imageSrc: string
  
  /**
   * Callback when a color is picked from the canvas
   */
  onColorPick: (color: Color) => void
  
  /**
   * Callback when the image is reset
   */
  onImageReset: () => void
  
  /**
   * Maximum width for the canvas (image will be scaled to fit)
   * @default 800
   */
  maxWidth?: number
}

export const ColorCanvas = React.memo(function ColorCanvas({
  imageSrc,
  onColorPick,
  onImageReset,
  maxWidth = 800,
}: ColorCanvasProps) {
  // Performance monitoring
  useRenderPerformance('ColorCanvas', 16)
  
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [zoom, setZoom] = React.useState(1)
  
  // Touch gesture state for pinch-to-zoom
  const touchStateRef = React.useRef<{
    initialDistance: number | null
    initialZoom: number
  }>({
    initialDistance: null,
    initialZoom: 1,
  })
  
  // Zoom constraints - memoized to prevent re-creation
  const zoomConstraints = useStableMemo(() => ({
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 3,
    ZOOM_STEP: 0.25
  }), [], 'ColorCanvas.zoomConstraints')

  // Load image onto canvas with optimization and chunked processing
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageSrc) return

    setIsLoading(true)
    setError(null)

    // Check browser compatibility
    try {
      ensureCanvasSupport()
    } catch (err) {
      if (err instanceof BrowserCompatibilityError) {
        logError(err, 'ColorCanvas')
        setError(err.message)
        setIsLoading(false)
        return
      }
    }

    const img = new Image()
    
    img.onload = () => {
      try {
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          const error = new BrowserCompatibilityError(
            'Canvas context not available. Please use a modern browser.',
            'canvas'
          )
          logError(error, 'ColorCanvas')
          setError(error.message)
          setIsLoading(false)
          return
        }

        // Determine max width based on viewport (mobile optimization)
        const isMobile = window.innerWidth < 768
        const effectiveMaxWidth = isMobile ? Math.min(maxWidth, window.innerWidth - 48) : maxWidth

        // Performance optimization: Downsample large images
        // Images larger than 2x the display size are downsampled for better performance
        let targetWidth = img.width
        let targetHeight = img.height
        
        if (img.width > effectiveMaxWidth * 2) {
          // Aggressive downsampling for very large images
          const downsampleScale = (effectiveMaxWidth * 1.5) / img.width
          targetWidth = Math.floor(img.width * downsampleScale)
          targetHeight = Math.floor(img.height * downsampleScale)
        } else if (img.width > effectiveMaxWidth) {
          // Standard scaling for moderately large images
          const imageScale = effectiveMaxWidth / img.width
          targetWidth = Math.floor(img.width * imageScale)
          targetHeight = Math.floor(img.height * imageScale)
        }

        canvas.width = targetWidth
        canvas.height = targetHeight

        // Use chunked processing for large images to prevent long tasks
        const processImageInChunks = () => {
          const CHUNK_SIZE = 25 // Smaller chunks - process 25 rows at a time
          let currentRow = 0
          
          const processChunk = () => {
            const startTime = performance.now()
            
            // Smaller time budget - max 5ms per chunk to avoid long tasks
            while (currentRow < targetHeight && (performance.now() - startTime) < 5) {
              const rowsToProcess = Math.min(CHUNK_SIZE, targetHeight - currentRow)
              
              // Draw image chunk by chunk
              ctx.imageSmoothingEnabled = true
              ctx.imageSmoothingQuality = img.width > effectiveMaxWidth * 2 ? 'medium' : 'high'
              
              // Draw portion of image
              const sourceY = (currentRow / targetHeight) * img.height
              const sourceHeight = (rowsToProcess / targetHeight) * img.height
              
              ctx.drawImage(
                img,
                0, sourceY, img.width, sourceHeight,
                0, currentRow, targetWidth, rowsToProcess
              )
              
              currentRow += rowsToProcess
            }
            
            if (currentRow < targetHeight) {
              // Schedule next chunk with shorter timeout
              if ('requestIdleCallback' in window) {
                requestIdleCallback(processChunk, { timeout: 16 }) // ~1 frame
              } else {
                setTimeout(processChunk, 0)
              }
            } else {
              setIsLoading(false)
            }
          }
          
          processChunk()
        }

        // For small images, draw directly. For large images, use chunked processing
        if (targetWidth * targetHeight < 1000000) { // Less than 1MP
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = img.width > effectiveMaxWidth * 2 ? 'medium' : 'high'
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          setIsLoading(false)
        } else {
          processImageInChunks()
        }
        
      } catch (err) {
        const error = new ImageProcessingError('Failed to process image. Please try a different image.')
        logError(err, 'ColorCanvas.img.onload')
        setError(error.message)
        setIsLoading(false)
      }
    }

    img.onerror = () => {
      const error = new ImageProcessingError('Failed to load image. Please try again.')
      logError(error, 'ColorCanvas.img.onerror')
      setError(error.message)
      setIsLoading(false)
    }

    img.src = imageSrc
    
    // Cleanup function
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageSrc, maxWidth])

  /**
   * Extract color from canvas at given client coordinates
   * Performance target: < 100ms - optimized with memoization
   */
  const extractColorAtPosition = useStableCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas || isLoading) return

    // Performance measurement in development
    const startTime = process.env.NODE_ENV === 'development' ? performance.now() : 0

    // Get canvas bounding rectangle
    const rect = canvas.getBoundingClientRect()
    
    // Calculate position relative to canvas
    // Account for canvas scaling in CSS vs actual canvas dimensions AND zoom
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = Math.floor((clientX - rect.left) * scaleX)
    const y = Math.floor((clientY - rect.top) * scaleY)

    try {
      // Validate coordinates before processing
      validateCanvasCoordinates(x, y)
      
      // Extract color at position
      const color = extractColorFromCanvas(canvas, x, y)
      
      if (color) {
        // Call the callback with extracted color
        onColorPick(color)
        
        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
          const duration = performance.now() - startTime
          if (duration > 100) {
            console.warn(`[Performance] Color extraction took ${duration.toFixed(2)}ms (target: <100ms)`)
          }
        }
      } else {
        console.warn('Failed to extract color at position:', { x, y })
      }
    } catch (error) {
      // Invalid coordinates - likely clicked outside canvas bounds
      logError(error, 'ColorCanvas.extractColorAtPosition')
    }
  }, [onColorPick, isLoading])

  /**
   * Handle click event on canvas to extract color - memoized for performance
   */
  const handleCanvasClick = useStableCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    extractColorAtPosition(event.clientX, event.clientY)
  }, [extractColorAtPosition])

  /**
   * Handle touch tap on canvas to extract color (mobile) - memoized for performance
   */
  const handleCanvasTouchEnd = useStableCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    // Only handle single touch (tap to pick color)
    // Don't extract color if this was a pinch gesture
    if (event.changedTouches.length === 1 && !touchStateRef.current.initialDistance) {
      const touch = event.changedTouches[0]
      extractColorAtPosition(touch.clientX, touch.clientY)
    }
  }, [extractColorAtPosition])

  /**
   * Calculate distance between two touch points - memoized for performance
   */
  const getTouchDistance = useStableCallback((touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  /**
   * Handle touch start for pinch-to-zoom - memoized for performance
   */
  const handleTouchStart = useStableCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2) {
      // Prevent default to avoid page zoom
      event.preventDefault()
      
      // Calculate initial distance between two fingers
      const distance = getTouchDistance(event.touches[0], event.touches[1])
      touchStateRef.current = {
        initialDistance: distance,
        initialZoom: zoom,
      }
    }
  }, [getTouchDistance, zoom])

  /**
   * Handle touch move for pinch-to-zoom - throttled for performance
   */
  const handleTouchMove = useThrottledCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2 && touchStateRef.current.initialDistance) {
      // Prevent default to avoid page zoom
      event.preventDefault()
      
      // Calculate current distance between two fingers
      const currentDistance = getTouchDistance(event.touches[0], event.touches[1])
      
      // Calculate zoom factor based on distance change
      const distanceRatio = currentDistance / touchStateRef.current.initialDistance
      const newZoom = touchStateRef.current.initialZoom * distanceRatio
      
      // Apply zoom with constraints
      setZoom(Math.max(zoomConstraints.MIN_ZOOM, Math.min(zoomConstraints.MAX_ZOOM, newZoom)))
    }
  }, 16, [getTouchDistance, zoomConstraints])

  /**
   * Handle touch end to reset pinch state - memoized for performance
   */
  const handleTouchEndGesture = useStableCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length < 2) {
      touchStateRef.current = {
        initialDistance: null,
        initialZoom: zoom,
      }
    }
  }, [zoom])

  /**
   * Zoom in by ZOOM_STEP - memoized for performance
   */
  const handleZoomIn = useStableCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.min(prev + zoomConstraints.ZOOM_STEP, zoomConstraints.MAX_ZOOM)
      try {
        validateZoomLevel(newZoom)
        return newZoom
      } catch {
        return prev
      }
    })
  }, [zoomConstraints])

  /**
   * Zoom out by ZOOM_STEP - memoized for performance
   */
  const handleZoomOut = useStableCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - zoomConstraints.ZOOM_STEP, zoomConstraints.MIN_ZOOM)
      try {
        validateZoomLevel(newZoom)
        return newZoom
      } catch {
        return prev
      }
    })
  }, [zoomConstraints])

  /**
   * Reset zoom to 1x - memoized for performance
   */
  const handleResetZoom = useStableCallback(() => {
    setZoom(1)
  }, [])

  /**
   * Reset image (clear canvas and return to upload state) - memoized for performance
   */
  const handleResetImage = useStableCallback(() => {
    setZoom(1)
    onImageReset()
  }, [onImageReset])

  /**
   * Keyboard shortcuts for zoom controls
   */
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when canvas is loaded
      if (isLoading) return

      // Check if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      switch (event.key) {
        case '+':
        case '=':
          event.preventDefault()
          handleZoomIn()
          break
        case '-':
        case '_':
          event.preventDefault()
          handleZoomOut()
          break
        case '0':
          event.preventDefault()
          handleResetZoom()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoading, zoom])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-destructive rounded-lg bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetImage}
            className="mt-2"
          >
            Try Another Image
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile Instructions */}
      <div className="block md:hidden p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          💡 <strong>Tip:</strong> Tap to pick colors. Use two fingers to pinch and zoom for precise selection.
        </p>
      </div>

      {/* Canvas Controls */}
      <div 
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border"
        role="toolbar"
        aria-label="Canvas zoom and control tools"
      >
        <div className="flex items-center gap-2" role="group" aria-label="Zoom controls">
          <Button
            variant="outline"
            size="default"
            onClick={handleZoomOut}
            disabled={zoom <= zoomConstraints.MIN_ZOOM || isLoading}
            aria-label="Zoom out by 25 percent. Keyboard shortcut: minus key"
            title="Zoom out (0.25x) - Press minus key"
            className="h-11 w-11 p-0 sm:h-9 sm:w-auto sm:px-3"
          >
            <ZoomOut className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Zoom Out</span>
          </Button>
          
          <Button
            variant="outline"
            size="default"
            onClick={handleResetZoom}
            disabled={zoom === 1 || isLoading}
            aria-label="Reset zoom to 100 percent. Keyboard shortcut: zero key"
            title="Reset zoom to 1x - Press 0 key"
            className="h-11 w-11 p-0 sm:h-9 sm:w-auto sm:px-3"
          >
            <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Reset</span>
          </Button>
          
          <Button
            variant="outline"
            size="default"
            onClick={handleZoomIn}
            disabled={zoom >= zoomConstraints.MAX_ZOOM || isLoading}
            aria-label="Zoom in by 25 percent. Keyboard shortcut: plus key"
            title="Zoom in (0.25x) - Press plus key"
            className="h-11 w-11 p-0 sm:h-9 sm:w-auto sm:px-3"
          >
            <ZoomIn className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Zoom In</span>
          </Button>
          
          <span 
            className="text-sm font-medium text-muted-foreground ml-2"
            aria-live="polite"
            aria-atomic="true"
          >
            {(zoom * 100).toFixed(0)}%
          </span>
        </div>
        
        <Button
          variant="destructive"
          size="default"
          onClick={handleResetImage}
          disabled={isLoading}
          aria-label="Clear canvas and upload a new image"
          title="Clear canvas and upload new image"
          className="h-11 sm:h-9"
        >
          <X className="h-5 w-5 sm:h-4 sm:w-4 mr-1" aria-hidden="true" />
          <span className="text-sm">Reset Image</span>
        </Button>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative overflow-auto border rounded-lg bg-muted/20 max-h-[500px] md:max-h-[600px] touch-pan-x touch-pan-y"
        style={{
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          touchAction: zoom !== 1 ? 'none' : 'auto', // Prevent default touch actions when zoomed
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading image...</p>
            </div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={(e) => {
            handleTouchEndGesture(e)
            handleCanvasTouchEnd(e)
          }}
          tabIndex={0}
          role="img"
          className="cursor-crosshair transition-transform touch-none w-full active:opacity-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          style={{
            display: isLoading ? 'none' : 'block',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            imageRendering: zoom > 1 ? 'pixelated' : 'auto',
            height: 'auto',
            willChange: zoom !== 1 ? 'transform' : 'auto', // Performance hint for browsers
            WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
          }}
          aria-label="Interactive color picker canvas. Click or tap anywhere on the image to extract a color. Use plus and minus keys to zoom, or pinch with two fingers on touch devices. Current zoom level is displayed above."
        />
      </div>
    </div>
  )
})
