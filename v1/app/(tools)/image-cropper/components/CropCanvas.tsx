'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { cn } from '@/lib/utils/cn'
import { cropImage, rotateImage, canvasToBlob, loadImage } from '@/lib/utils/imageProcessing'
import { downloadBlob } from '@/lib/utils/fileDownload'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import type { AspectRatio, CropArea } from '../page'
import { 
  useRenderPerformance, 
  useStableCallback, 
  useStableMemo, 
  useThrottledCallback 
} from '@/lib/utils/reactOptimizations'

export interface CropCanvasProps {
  imageSrc: string
  originalFile: File
  aspectRatio: AspectRatio
  zoom: number
  rotation: number
  onImageReset: () => void
  onCropComplete: () => void
  isProcessing: boolean
  cropArea: CropArea | null
  onCropAreaChange: (area: CropArea) => void
}

type DragHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move' | null

const HANDLE_SIZE = 12
const MIN_CROP_SIZE = 50

export const CropCanvas = React.memo(function CropCanvas({
  imageSrc,
  originalFile,
  aspectRatio,
  zoom,
  rotation,
  onImageReset,
  onCropComplete,
  isProcessing,
  cropArea,
  onCropAreaChange,
}: CropCanvasProps) {
  // Performance monitoring
  useRenderPerformance('CropCanvas', 16)
  
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [image, setImage] = React.useState<HTMLImageElement | null>(null)
  const [croppedBlob, setCroppedBlob] = React.useState<Blob | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragHandle, setDragHandle] = React.useState<DragHandle>(null)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
  const [canvasDimensions, setCanvasDimensions] = React.useState({ width: 0, height: 0 })
  
  // Memoized constants to prevent re-creation
  const cropConstants = useStableMemo(() => ({
    HANDLE_SIZE,
    MIN_CROP_SIZE
  }), [], 'CropCanvas.constants')

  // Load image
  React.useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      // Initialize crop area to center 80% of image
      const width = img.naturalWidth * 0.8
      const height = img.naturalHeight * 0.8
      const x = (img.naturalWidth - width) / 2
      const y = (img.naturalHeight - height) / 2
      onCropAreaChange({ x, y, width, height })
    }
    img.src = imageSrc
  }, [imageSrc, onCropAreaChange])

  // Draw crop overlay function
  const drawCropOverlay = useStableCallback((
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    area: CropArea,
    img: HTMLImageElement
  ) => {
    // Convert crop area from image coordinates to canvas coordinates
    const scaleX = canvas.width / img.naturalWidth
    const scaleY = canvas.height / img.naturalHeight
    
    const x = area.x * scaleX
    const y = area.y * scaleY
    const width = area.width * scaleX
    const height = area.height * scaleY

    // Draw dark overlay outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, y) // Top
    ctx.fillRect(0, y, x, height) // Left
    ctx.fillRect(x + width, y, canvas.width - (x + width), height) // Right
    ctx.fillRect(0, y + height, canvas.width, canvas.height - (y + height)) // Bottom

    // Draw crop area border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    // Draw grid lines (rule of thirds)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    // Vertical lines
    ctx.moveTo(x + width / 3, y)
    ctx.lineTo(x + width / 3, y + height)
    ctx.moveTo(x + (2 * width) / 3, y)
    ctx.lineTo(x + (2 * width) / 3, y + height)
    // Horizontal lines
    ctx.moveTo(x, y + height / 3)
    ctx.lineTo(x + width, y + height / 3)
    ctx.moveTo(x, y + (2 * height) / 3)
    ctx.lineTo(x + width, y + (2 * height) / 3)
    ctx.stroke()

    // Draw resize handles
    const handles = [
      { x: x - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 }, // nw
      { x: x + width - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 }, // ne
      { x: x - HANDLE_SIZE / 2, y: y + height - HANDLE_SIZE / 2 }, // sw
      { x: x + width - HANDLE_SIZE / 2, y: y + height - HANDLE_SIZE / 2 }, // se
      { x: x + width / 2 - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 }, // n
      { x: x + width / 2 - HANDLE_SIZE / 2, y: y + height - HANDLE_SIZE / 2 }, // s
      { x: x + width - HANDLE_SIZE / 2, y: y + height / 2 - HANDLE_SIZE / 2 }, // e
      { x: x - HANDLE_SIZE / 2, y: y + height / 2 - HANDLE_SIZE / 2 }, // w
    ]

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    handles.forEach((handle) => {
      ctx.fillRect(handle.x, handle.y, cropConstants.HANDLE_SIZE, cropConstants.HANDLE_SIZE)
      ctx.strokeRect(handle.x, handle.y, cropConstants.HANDLE_SIZE, cropConstants.HANDLE_SIZE)
    })
  }, [cropConstants])

  // Draw canvas
  React.useEffect(() => {
    if (!image || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate canvas size to fit container
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const imageAspect = image.naturalWidth / image.naturalHeight
    
    let displayWidth = containerWidth
    let displayHeight = containerWidth / imageAspect
    
    if (displayHeight > containerHeight) {
      displayHeight = containerHeight
      displayWidth = containerHeight * imageAspect
    }

    canvas.width = displayWidth
    canvas.height = displayHeight
    setCanvasDimensions({ width: displayWidth, height: displayHeight })

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and rotation
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(zoom, zoom)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Draw crop overlay
    if (cropArea) {
      drawCropOverlay(ctx, canvas, cropArea, image)
    }
  }, [image, zoom, rotation, cropArea])



  const getHandleAtPosition = useStableCallback((x: number, y: number): DragHandle => {
    if (!cropArea || !image || !canvasRef.current) return null

    const canvas = canvasRef.current
    const scaleX = canvas.width / image.naturalWidth
    const scaleY = canvas.height / image.naturalHeight

    const cropX = cropArea.x * scaleX
    const cropY = cropArea.y * scaleY
    const cropWidth = cropArea.width * scaleX
    const cropHeight = cropArea.height * scaleY

    const tolerance = HANDLE_SIZE

    // Check corner handles
    if (Math.abs(x - cropX) < tolerance && Math.abs(y - cropY) < tolerance) return 'nw'
    if (Math.abs(x - (cropX + cropWidth)) < tolerance && Math.abs(y - cropY) < tolerance) return 'ne'
    if (Math.abs(x - cropX) < tolerance && Math.abs(y - (cropY + cropHeight)) < tolerance) return 'sw'
    if (Math.abs(x - (cropX + cropWidth)) < tolerance && Math.abs(y - (cropY + cropHeight)) < tolerance) return 'se'

    // Check edge handles
    if (Math.abs(x - (cropX + cropWidth / 2)) < tolerance && Math.abs(y - cropY) < tolerance) return 'n'
    if (Math.abs(x - (cropX + cropWidth / 2)) < tolerance && Math.abs(y - (cropY + cropHeight)) < tolerance) return 's'
    if (Math.abs(x - (cropX + cropWidth)) < tolerance && Math.abs(y - (cropY + cropHeight / 2)) < tolerance) return 'e'
    if (Math.abs(x - cropX) < tolerance && Math.abs(y - (cropY + cropHeight / 2)) < tolerance) return 'w'

    // Check if inside crop area (for moving)
    if (x >= cropX && x <= cropX + cropWidth && y >= cropY && y <= cropY + cropHeight) {
      return 'move'
    }

    return null
  }, [cropArea, image])

  const getCursorForHandle = (handle: DragHandle): string => {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nwse-resize'
      case 'ne':
      case 'sw':
        return 'nesw-resize'
      case 'n':
      case 's':
        return 'ns-resize'
      case 'e':
      case 'w':
        return 'ew-resize'
      case 'move':
        return 'move'
      default:
        return 'default'
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cropArea || !image) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const handle = getHandleAtPosition(x, y)
    if (handle) {
      setIsDragging(true)
      setDragHandle(handle)
      setDragStart({ x, y })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging && dragHandle && cropArea) {
      const dx = x - dragStart.x
      const dy = y - dragStart.y

      const canvas = canvasRef.current
      const scaleX = image.naturalWidth / canvas.width
      const scaleY = image.naturalHeight / canvas.height

      let newArea = { ...cropArea }

      if (dragHandle === 'move') {
        // Move crop area
        newArea.x = Math.max(0, Math.min(image.naturalWidth - cropArea.width, cropArea.x + dx * scaleX))
        newArea.y = Math.max(0, Math.min(image.naturalHeight - cropArea.height, cropArea.y + dy * scaleY))
      } else {
        // Resize crop area
        const aspectValue = getAspectRatioValue(aspectRatio, cropArea)
        newArea = resizeCropArea(cropArea, dragHandle, dx * scaleX, dy * scaleY, aspectValue, image)
      }

      onCropAreaChange(newArea)
      setDragStart({ x, y })
    } else {
      // Update cursor
      const handle = getHandleAtPosition(x, y)
      canvasRef.current.style.cursor = getCursorForHandle(handle)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragHandle(null)
  }

  const getAspectRatioValue = (ratio: AspectRatio, area: CropArea): number | null => {
    switch (ratio) {
      case '1:1':
        return 1
      case '4:3':
        return 4 / 3
      case '16:9':
        return 16 / 9
      case 'free':
      default:
        return null
    }
  }

  const resizeCropArea = (
    area: CropArea,
    handle: DragHandle,
    dx: number,
    dy: number,
    aspectRatio: number | null,
    img: HTMLImageElement
  ): CropArea => {
    let newArea = { ...area }

    switch (handle) {
      case 'nw':
        newArea.x += dx
        newArea.y += dy
        newArea.width -= dx
        newArea.height -= dy
        break
      case 'ne':
        newArea.y += dy
        newArea.width += dx
        newArea.height -= dy
        break
      case 'sw':
        newArea.x += dx
        newArea.width -= dx
        newArea.height += dy
        break
      case 'se':
        newArea.width += dx
        newArea.height += dy
        break
      case 'n':
        newArea.y += dy
        newArea.height -= dy
        break
      case 's':
        newArea.height += dy
        break
      case 'e':
        newArea.width += dx
        break
      case 'w':
        newArea.x += dx
        newArea.width -= dx
        break
    }

    // Apply aspect ratio constraint
    if (aspectRatio !== null) {
      if (handle === 'e' || handle === 'w') {
        newArea.height = newArea.width / aspectRatio
      } else if (handle === 'n' || handle === 's') {
        newArea.width = newArea.height * aspectRatio
      } else {
        // Corner handles - maintain aspect ratio
        const currentAspect = newArea.width / newArea.height
        if (currentAspect > aspectRatio) {
          newArea.width = newArea.height * aspectRatio
        } else {
          newArea.height = newArea.width / aspectRatio
        }
      }
    }

    // Ensure minimum size
    newArea.width = Math.max(MIN_CROP_SIZE, newArea.width)
    newArea.height = Math.max(MIN_CROP_SIZE, newArea.height)

    // Ensure within bounds
    newArea.x = Math.max(0, Math.min(img.naturalWidth - newArea.width, newArea.x))
    newArea.y = Math.max(0, Math.min(img.naturalHeight - newArea.height, newArea.y))
    newArea.width = Math.min(img.naturalWidth - newArea.x, newArea.width)
    newArea.height = Math.min(img.naturalHeight - newArea.y, newArea.height)

    return newArea
  }

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!cropArea || !image) return

      const step = e.shiftKey ? 10 : 1

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          onCropAreaChange({
            ...cropArea,
            y: Math.max(0, cropArea.y - step),
          })
          break
        case 'ArrowDown':
          e.preventDefault()
          onCropAreaChange({
            ...cropArea,
            y: Math.min(image.naturalHeight - cropArea.height, cropArea.y + step),
          })
          break
        case 'ArrowLeft':
          e.preventDefault()
          onCropAreaChange({
            ...cropArea,
            x: Math.max(0, cropArea.x - step),
          })
          break
        case 'ArrowRight':
          e.preventDefault()
          onCropAreaChange({
            ...cropArea,
            x: Math.min(image.naturalWidth - cropArea.width, cropArea.x + step),
          })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cropArea, image, onCropAreaChange])

  const handleCrop = async () => {
    if (!image || !cropArea) return

    try {
      // Create canvas with original image
      const sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = image.naturalWidth
      sourceCanvas.height = image.naturalHeight
      const ctx = sourceCanvas.getContext('2d')
      if (!ctx) throw new ImageProcessingError('Failed to get canvas context')

      ctx.drawImage(image, 0, 0)

      // Apply rotation if needed
      let processedCanvas = sourceCanvas
      if (rotation !== 0) {
        processedCanvas = rotateImage(sourceCanvas, rotation)
      }

      // Crop the image
      const croppedCanvas = cropImage(processedCanvas, cropArea)

      // Convert to blob
      const format = originalFile.type.includes('png') ? 'png' : originalFile.type.includes('webp') ? 'webp' : 'jpeg'
      const blob = await canvasToBlob(croppedCanvas, { format, quality: 0.95 })

      setCroppedBlob(blob)
      onCropComplete()

      toast({
        title: 'Image cropped successfully',
        description: 'You can now download your cropped image',
      })
    } catch (error) {
      handleErrorWithToast(error, toast, 'CropCanvas.handleCrop')
      onCropComplete()
    }
  }

  // Trigger crop when isProcessing becomes true
  React.useEffect(() => {
    if (isProcessing && !croppedBlob) {
      handleCrop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing])

  const handleDownload = () => {
    if (!croppedBlob) return

    const extension = originalFile.name.split('.').pop() || 'png'
    const baseName = originalFile.name.replace(/\.[^/.]+$/, '')
    const fileName = `${baseName}_cropped.${extension}`

    downloadBlob(croppedBlob, fileName)

    toast({
      title: 'Download started',
      description: `Downloading ${fileName}`,
    })
  }

  return (
    <div className="space-y-4">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative border rounded-lg bg-muted/20 overflow-hidden"
        style={{ height: '500px' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          role="img"
          aria-label="Image crop canvas with draggable crop area"
          tabIndex={0}
        />

        {/* Reset Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onImageReset}
          aria-label="Remove image and start over"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Download Section */}
      {croppedBlob && (
        <div className="p-4 border rounded-lg bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Cropped Image Ready</h3>
              <p className="text-sm text-muted-foreground">
                Size: {Math.round(cropArea!.width)} × {Math.round(cropArea!.height)} px
              </p>
            </div>
          </div>

          <Button onClick={handleDownload} className="w-full" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download Cropped Image
          </Button>
        </div>
      )}
    </div>
  )
})
