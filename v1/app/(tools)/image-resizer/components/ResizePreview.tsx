'use client'

import * as React from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import { formatFileSize } from '@/lib/utils/fileValidation'
import type { ImageDimensions } from '../page'

export interface ResizePreviewProps {
  originalDimensions: ImageDimensions
  targetDimensions: ImageDimensions
  resizedBlob: Blob | null
  originalFile: File | null
  isProcessing: boolean
}

export default function ResizePreview({
  originalDimensions,
  targetDimensions,
  resizedBlob,
  originalFile,
  isProcessing,
}: ResizePreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  // Create preview URL from resized blob
  React.useEffect(() => {
    if (resizedBlob) {
      const url = URL.createObjectURL(resizedBlob)
      setPreviewUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [resizedBlob])

  const dimensionsChanged =
    targetDimensions.width !== originalDimensions.width ||
    targetDimensions.height !== originalDimensions.height

  const scalePercentage = dimensionsChanged
    ? Math.round(
        ((targetDimensions.width * targetDimensions.height) /
          (originalDimensions.width * originalDimensions.height)) *
          100
      )
    : 100

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <h3 className="font-semibold">Preview</h3>

      {/* Processing State */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Resizing image...</p>
        </div>
      )}

      {/* Before Resize State */}
      {!isProcessing && !resizedBlob && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            {dimensionsChanged
              ? 'Click "Resize Image" to process'
              : 'Adjust dimensions to resize'}
          </p>
          {dimensionsChanged && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="font-medium">
                  {originalDimensions.width} × {originalDimensions.height}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-primary">
                  {targetDimensions.width} × {targetDimensions.height}
                </span>
              </div>
              <p className="text-muted-foreground">
                Scale: {scalePercentage}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* After Resize State */}
      {!isProcessing && resizedBlob && previewUrl && (
        <div className="space-y-3">
          {/* Preview Image */}
          <div className="relative border rounded-lg overflow-hidden bg-muted/20">
            <img
              src={previewUrl}
              alt="Resized preview"
              className="w-full h-auto"
            />
          </div>

          {/* Stats */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original:</span>
              <span className="font-medium">
                {originalDimensions.width} × {originalDimensions.height}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resized:</span>
              <span className="font-medium text-primary">
                {targetDimensions.width} × {targetDimensions.height}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scale:</span>
              <span className="font-medium">{scalePercentage}%</span>
            </div>
            {originalFile && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Size:</span>
                  <span className="font-medium">
                    {formatFileSize(originalFile.size)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resized Size:</span>
                  <span className="font-medium">
                    {formatFileSize(resizedBlob.size)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
