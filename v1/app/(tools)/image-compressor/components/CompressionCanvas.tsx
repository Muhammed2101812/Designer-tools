'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCcw, Download, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { downloadBlob, changeFileExtension } from '@/lib/utils/fileDownload'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import imageCompression from 'browser-image-compression'
import { 
  useRenderPerformance, 
  useStableCallback, 
  useStableMemo 
} from '@/lib/utils/reactOptimizations'

export interface CompressionCanvasProps {
  imageSrc: string
  originalFile: File
  quality: number
  onImageReset: () => void
  onCompressionComplete: (blob: Blob) => void
  onCompressionStart: () => void
}

export const CompressionCanvas = React.memo(function CompressionCanvas({
  imageSrc,
  originalFile,
  quality,
  onImageReset,
  onCompressionComplete,
  onCompressionStart,
}: CompressionCanvasProps) {
  // Performance monitoring
  useRenderPerformance('CompressionCanvas', 16)
  
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [compressedBlob, setCompressedBlob] = React.useState<Blob | null>(null)
  const [compressedPreview, setCompressedPreview] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null)

  // Load image and display on canvas
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageSrc) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })

      // Draw image on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }

    img.onerror = () => {
      const error = new ImageProcessingError('Failed to load image')
      handleErrorWithToast(error, toast, 'CompressionCanvas.imageLoad')
    }

    img.src = imageSrc
  }, [imageSrc])

  // Memoized compression options to prevent re-creation
  const compressionOptions = useStableMemo(() => ({
    maxSizeMB: 10, // Maximum file size
    maxWidthOrHeight: 4096, // Maximum dimension
    useWebWorker: false, // Disabled due to CSP restrictions with blob workers
    quality: quality / 100, // Convert 0-100 to 0-1
    initialQuality: quality / 100,
  }), [quality], 'CompressionCanvas.options')

  const handleCompress = useStableCallback(async () => {
    try {
      setIsProcessing(true)
      onCompressionStart()

      // Compress the image
      const compressed = await imageCompression(originalFile, compressionOptions)

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressed)
      setCompressedPreview(previewUrl)
      setCompressedBlob(compressed)
      onCompressionComplete(compressed)

      toast({
        title: 'Compression complete',
        description: `Image compressed successfully. Size reduced by ${Math.round((1 - compressed.size / originalFile.size) * 100)}%`,
      })
    } catch (error) {
      const processingError = new ImageProcessingError(
        'Failed to compress image. Please try again with different settings.'
      )
      handleErrorWithToast(processingError, toast, 'CompressionCanvas.handleCompress')
      setIsProcessing(false)
    }
  }, [originalFile, compressionOptions, onCompressionStart, onCompressionComplete])

  const handleDownload = useStableCallback(() => {
    if (!compressedBlob) return

    try {
      const fileName = changeFileExtension(originalFile.name, 'jpg')
      const downloadName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '_compressed.$1')
      downloadBlob(compressedBlob, downloadName)

      toast({
        title: 'Download started',
        description: 'Your compressed image is being downloaded',
      })
    } catch (error) {
      handleErrorWithToast(error, toast, 'CompressionCanvas.handleDownload')
    }
  }, [compressedBlob, originalFile.name])

  const handleReset = useStableCallback(() => {
    // Clean up object URLs
    if (compressedPreview) {
      URL.revokeObjectURL(compressedPreview)
    }

    setCompressedBlob(null)
    setCompressedPreview(null)
    setIsProcessing(false)
    onImageReset()
  }, [compressedPreview, onImageReset])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (compressedPreview) {
        URL.revokeObjectURL(compressedPreview)
      }
    }
  }, [compressedPreview])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Image Preview</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isProcessing}
              aria-label="Reset and upload new image"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas Display */}
        <div className="relative border rounded-lg overflow-hidden bg-muted/20">
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ maxHeight: '500px', objectFit: 'contain' }}
            aria-label="Original image preview"
          />
        </div>

        {/* Image Info */}
        {imageDimensions && (
          <div className="text-sm text-muted-foreground text-center">
            Original: {imageDimensions.width} × {imageDimensions.height} pixels
          </div>
        )}

        {/* Compressed Preview */}
        {compressedPreview && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Compressed Preview:</h4>
            <div className="relative border rounded-lg overflow-hidden bg-muted/20">
              <img
                src={compressedPreview}
                alt="Compressed preview"
                className="w-full h-auto"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleCompress}
            disabled={isProcessing}
            className="flex-1"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Compressing...
              </>
            ) : (
              'Compress Image'
            )}
          </Button>

          {compressedBlob && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
