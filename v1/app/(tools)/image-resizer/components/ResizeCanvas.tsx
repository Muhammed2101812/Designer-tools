'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, Download, Maximize2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { ImageProcessingError } from '@/types/errors'
import { resizeImageFile, getImageFormat } from '@/lib/utils/imageProcessing'
import { downloadBlob, addFileNameSuffix } from '@/lib/utils/fileDownload'
import type { ImageDimensions } from '../page'

export interface ResizeCanvasProps {
  imageSrc: string
  originalDimensions: ImageDimensions
  targetDimensions: ImageDimensions
  originalFile: File | null
  onImageReset: () => void
  onResizeComplete: (blob: Blob) => void
  onResizeStart: () => void
  maintainAspectRatio: boolean
}

export function ResizeCanvas({
  imageSrc,
  originalDimensions,
  targetDimensions,
  originalFile,
  onImageReset,
  onResizeComplete,
  onResizeStart,
  maintainAspectRatio,
}: ResizeCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [resizedBlob, setResizedBlob] = React.useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Draw original image on canvas
  React.useEffect(() => {
    if (!imageSrc || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      // Set canvas to display size (fit container)
      const container = containerRef.current
      if (container) {
        const maxWidth = container.clientWidth
        const maxHeight = 500

        const scale = Math.min(
          maxWidth / img.naturalWidth,
          maxHeight / img.naturalHeight,
          1 // Don't upscale for display
        )

        canvas.width = img.naturalWidth * scale
        canvas.height = img.naturalHeight * scale

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
    }
    img.src = imageSrc
  }, [imageSrc])

  const handleResize = React.useCallback(async () => {
    if (!originalFile) {
      toast({
        title: 'Error',
        description: 'No image file available',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsProcessing(true)
      onResizeStart()

      // Get original format
      const format = getImageFormat(originalFile.type)

      // Resize the image
      const blob = await resizeImageFile(originalFile, {
        width: targetDimensions.width,
        height: targetDimensions.height,
        maintainAspectRatio,
        format,
        quality: 0.95, // High quality
      })

      setResizedBlob(blob)
      onResizeComplete(blob)

      toast({
        title: 'Image Resized',
        description: `Resized to ${targetDimensions.width}×${targetDimensions.height}px`,
      })
    } catch (error) {
      handleErrorWithToast(
        error instanceof Error ? error : new ImageProcessingError('Failed to resize image'),
        toast,
        'ResizeCanvas.handleResize'
      )
    } finally {
      setIsProcessing(false)
    }
  }, [originalFile, targetDimensions, maintainAspectRatio, onResizeStart, onResizeComplete])

  const handleDownload = React.useCallback(() => {
    if (!resizedBlob || !originalFile) {
      toast({
        title: 'Error',
        description: 'No resized image available. Please resize first.',
        variant: 'destructive',
      })
      return
    }

    try {
      const fileName = addFileNameSuffix(
        originalFile.name,
        `_${targetDimensions.width}x${targetDimensions.height}`
      )
      downloadBlob(resizedBlob, fileName)

      toast({
        title: 'Download Started',
        description: `Downloading ${fileName}`,
      })
    } catch (error) {
      handleErrorWithToast(error, toast, 'ResizeCanvas.handleDownload')
    }
  }, [resizedBlob, originalFile, targetDimensions])

  const dimensionsChanged =
    targetDimensions.width !== originalDimensions.width ||
    targetDimensions.height !== originalDimensions.height

  return (
    <div className="space-y-4">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative border rounded-lg bg-muted/20 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          role="img"
          aria-label="Image preview for resizing"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleResize}
          disabled={isProcessing || !dimensionsChanged}
          className="gap-2"
          aria-label="Resize image with current dimensions"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          {isProcessing ? 'Resizing...' : 'Resize Image'}
        </Button>

        <Button
          onClick={handleDownload}
          disabled={!resizedBlob || isProcessing}
          variant="secondary"
          className="gap-2"
          aria-label="Download resized image"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download
        </Button>

        <Button
          onClick={onImageReset}
          variant="outline"
          className="gap-2 ml-auto"
          aria-label="Reset and upload new image"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New Image
        </Button>
      </div>

      {/* Info Text */}
      {!dimensionsChanged && (
        <p className="text-sm text-muted-foreground">
          Change the dimensions to enable resizing
        </p>
      )}
    </div>
  )
}
