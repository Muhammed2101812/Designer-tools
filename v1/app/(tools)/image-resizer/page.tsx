'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { FileUploader } from '@/components/shared/FileUploader'
import { Maximize2, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { ensureFileReaderSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { validateFileUpload } from '@/lib/utils/validation'

// Dynamic imports for code splitting
const ResizeCanvas = dynamic(
  () => import('./components/ResizeCanvas').then((mod) => ({ default: mod.ResizeCanvas })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading canvas...</p>
        </div>
      </div>
    ),
    ssr: false, // Canvas is client-side only
  }
)

const DimensionInputs = dynamic<{
  originalDimensions: ImageDimensions
  targetDimensions: ImageDimensions
  maintainAspectRatio: boolean
  onDimensionsChange: (dimensions: ImageDimensions) => void
  onAspectRatioToggle: (maintain: boolean) => void
}>(
  () => import('./components/DimensionInputs'),
  {
    loading: () => (
      <div className="p-4 border rounded-lg bg-card animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-3" />
        <div className="space-y-3">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    ),
  }
)

const ResizePreview = dynamic<{
  originalDimensions: ImageDimensions
  targetDimensions: ImageDimensions
  resizedBlob: Blob | null
  originalFile: File | null
  isProcessing: boolean
}>(
  () => import('./components/ResizePreview'),
  {
    loading: () => (
      <div className="p-4 border rounded-lg bg-card animate-pulse">
        <div className="h-6 bg-muted rounded w-24 mb-3" />
        <div className="h-32 bg-muted rounded" />
      </div>
    ),
  }
)

export interface ImageDimensions {
  width: number
  height: number
}

export default function ImageResizerPage() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalFile, setOriginalFile] = React.useState<File | null>(null)
  const [originalDimensions, setOriginalDimensions] = React.useState<ImageDimensions | null>(null)
  const [targetDimensions, setTargetDimensions] = React.useState<ImageDimensions | null>(null)
  const [maintainAspectRatio, setMaintainAspectRatio] = React.useState(true)
  const [resizedBlob, setResizedBlob] = React.useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file

    if (!selectedFile) return

    try {
      validateFileUpload(selectedFile)
      ensureFileReaderSupport()

      const reader = new FileReader()

      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setImageSrc(result)
          setOriginalFile(selectedFile)
          setResizedBlob(null)

          // Load image to get dimensions
          const img = new Image()
          img.onload = () => {
            const dims = { width: img.naturalWidth, height: img.naturalHeight }
            setOriginalDimensions(dims)
            setTargetDimensions(dims)
          }
          img.src = result
        } else {
          const error = new ImageProcessingError('Invalid image data')
          handleErrorWithToast(error, toast, 'ImageResizer.handleFileSelect')
        }
      }

      reader.onerror = () => {
        const error = new ImageProcessingError('Failed to read image file. Please try again.')
        handleErrorWithToast(error, toast, 'ImageResizer.FileReader')
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      handleErrorWithToast(error, toast, 'ImageResizer.handleFileSelect')
    }
  }

  const handleImageReset = React.useCallback(() => {
    setImageSrc(null)
    setOriginalFile(null)
    setOriginalDimensions(null)
    setTargetDimensions(null)
    setResizedBlob(null)
  }, [])

  const handleDimensionsChange = React.useCallback(
    (newDimensions: ImageDimensions) => {
      setTargetDimensions(newDimensions)
      // Clear previous resize when dimensions change
      setResizedBlob(null)
    },
    []
  )

  const handleAspectRatioToggle = React.useCallback((maintain: boolean) => {
    setMaintainAspectRatio(maintain)
  }, [])

  const handleResizeComplete = React.useCallback((blob: Blob) => {
    setResizedBlob(blob)
    setIsProcessing(false)
  }, [])

  const handleResizeStart = React.useCallback(() => {
    setIsProcessing(true)
  }, [])

  return (
    <ToolWrapper
      title="Image Resizer"
      description="Resize images to custom dimensions with quality preservation"
      icon={<Maximize2 className="h-6 w-6" />}
      isClientSide={true}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Upload an image (PNG, JPG, or WEBP format, max 10MB)</li>
              <li>Enter your desired width and/or height in pixels</li>
              <li>Toggle aspect ratio lock to maintain proportions</li>
              <li>Click &quot;Resize Image&quot; to process</li>
              <li>Preview the resized image</li>
              <li>Download the result in the original format</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Maintain aspect ratio option</li>
              <li>High-quality bicubic interpolation</li>
              <li>Before/after comparison</li>
              <li>Original format preservation</li>
              <li>100% client-side - your images never leave your browser</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Keep aspect ratio locked to avoid distortion</li>
              <li>Enter just width or height to auto-calculate the other</li>
              <li>Upscaling may reduce quality - use Image Upscaler for AI enhancement</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* File Upload Section */}
        {!imageSrc && (
          <FileUploader
            onFileSelect={handleFileSelect}
            accept="image/png,image/jpeg,image/webp"
            maxSize={10}
            description="Select a PNG, JPG, or WEBP image to resize"
            multiple={false}
          />
        )}

        {/* Resize Interface */}
        {imageSrc && originalDimensions && targetDimensions && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Canvas - full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 order-1 lg:order-1">
              <ResizeCanvas
                imageSrc={imageSrc}
                originalDimensions={originalDimensions}
                targetDimensions={targetDimensions}
                originalFile={originalFile}
                onImageReset={handleImageReset}
                onResizeComplete={handleResizeComplete}
                onResizeStart={handleResizeStart}
                maintainAspectRatio={maintainAspectRatio}
              />
            </div>

            {/* Controls and Preview - stacked vertically on mobile, sidebar on desktop */}
            <div className="space-y-4 order-2 lg:order-2">
              <DimensionInputs
                originalDimensions={originalDimensions}
                targetDimensions={targetDimensions}
                maintainAspectRatio={maintainAspectRatio}
                onDimensionsChange={handleDimensionsChange}
                onAspectRatioToggle={handleAspectRatioToggle}
              />
              <ResizePreview
                originalDimensions={originalDimensions}
                targetDimensions={targetDimensions}
                resizedBlob={resizedBlob}
                originalFile={originalFile}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  )
}
