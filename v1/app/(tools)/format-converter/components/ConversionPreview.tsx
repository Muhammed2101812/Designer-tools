'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, Download, RefreshCw, Loader2, ArrowRight } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { ImageProcessingError } from '@/types/errors'
import { convertImageFormat } from '@/lib/utils/imageProcessing'
import { downloadBlob } from '@/lib/utils/fileDownload'
import { formatFileSize } from '@/lib/utils/fileValidation'
import type { ImageFormat } from '../page'

export interface ConversionPreviewProps {
  originalFile: File | null
  convertedBlob: Blob | null
  targetFormat: ImageFormat
  quality: number
  isProcessing: boolean
  onConvert: () => void
  onDownload: () => void
  onReset: () => void
}

function ConversionPreview({
  originalFile,
  convertedBlob,
  targetFormat,
  quality,
  isProcessing,
  onConvert,
  onReset,
}: ConversionPreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [originalUrl, setOriginalUrl] = React.useState<string | null>(null)
  const [processing, setProcessing] = React.useState(false)
  const [converted, setConverted] = React.useState<Blob | null>(null)

  // Create preview URL from original file
  React.useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile)
      setOriginalUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setOriginalUrl(null)
    }
  }, [originalFile])

  // Create preview URL from converted blob
  React.useEffect(() => {
    if (converted) {
      const url = URL.createObjectURL(converted)
      setPreviewUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [converted])

  const handleConvert = React.useCallback(async () => {
    if (!originalFile) {
      toast({
        title: 'Error',
        description: 'No image file available',
        variant: 'destructive',
      })
      return
    }

    try {
      setProcessing(true)
      onConvert()

      // Convert the image
      const blob = await convertImageFormat(originalFile, {
        format: targetFormat,
        quality: quality / 100, // Convert percentage to 0-1 range
      })

      setConverted(blob)

      toast({
        title: 'Conversion Complete',
        description: `Converted to ${targetFormat.toUpperCase()} format`,
      })
    } catch (error) {
      handleErrorWithToast(
        error instanceof Error ? error : new ImageProcessingError('Failed to convert image'),
        toast,
        'ConversionPreview.handleConvert'
      )
    } finally {
      setProcessing(false)
    }
  }, [originalFile, targetFormat, quality, onConvert])

  const handleDownload = React.useCallback(() => {
    if (!converted || !originalFile) {
      toast({
        title: 'Error',
        description: 'No converted image available. Please convert first.',
        variant: 'destructive',
      })
      return
    }

    try {
      // Generate filename with new extension
      const originalName = originalFile.name.replace(/\.[^/.]+$/, '')
      const extension = targetFormat === 'jpeg' ? 'jpg' : targetFormat
      const fileName = `${originalName}.${extension}`

      downloadBlob(converted, fileName)

      toast({
        title: 'Download Started',
        description: `Downloading ${fileName}`,
      })
    } catch (error) {
      handleErrorWithToast(error, toast, 'ConversionPreview.handleDownload')
    }
  }, [converted, originalFile, targetFormat])

  const formatChanged = converted !== null
  const compressionRatio = originalFile && converted
    ? Math.round((converted.size / originalFile.size) * 100)
    : 100

  return (
    <div className="space-y-4">
      {/* Preview Container */}
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* Image Preview */}
        <div className="relative bg-muted/20 min-h-[300px] flex items-center justify-center">
          {processing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Converting image...</p>
            </div>
          )}

          {!processing && !converted && originalUrl && (
            <div className="w-full p-4">
              <img
                src={originalUrl}
                alt="Original image"
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
          )}

          {!processing && converted && previewUrl && (
            <div className="w-full p-4">
              <img
                src={previewUrl}
                alt="Converted image preview"
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
          )}
        </div>

        {/* Stats */}
        {originalFile && (
          <div className="p-4 border-t bg-card space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Original */}
              <div>
                <p className="text-muted-foreground mb-1">Original</p>
                <p className="font-medium">{originalFile.type.split('/')[1].toUpperCase()}</p>
                <p className="text-muted-foreground">{formatFileSize(originalFile.size)}</p>
              </div>

              {/* Converted */}
              <div>
                <p className="text-muted-foreground mb-1">Converted</p>
                {converted ? (
                  <>
                    <p className="font-medium text-primary">{targetFormat.toUpperCase()}</p>
                    <p className="text-muted-foreground">{formatFileSize(converted.size)}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Not converted yet</p>
                )}
              </div>
            </div>

            {/* Compression Info */}
            {converted && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size change:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatFileSize(originalFile.size)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className={`font-medium ${
                      compressionRatio < 100 ? 'text-green-600 dark:text-green-400' : 
                      compressionRatio > 100 ? 'text-orange-600 dark:text-orange-400' : 
                      'text-foreground'
                    }`}>
                      {formatFileSize(converted.size)} ({compressionRatio}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleConvert}
          disabled={processing}
          className="gap-2"
          aria-label="Convert image to selected format"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {processing ? 'Converting...' : converted ? 'Convert Again' : 'Convert Image'}
        </Button>

        <Button
          onClick={handleDownload}
          disabled={!converted || processing}
          variant="secondary"
          className="gap-2"
          aria-label="Download converted image"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download
        </Button>

        <Button
          onClick={onReset}
          variant="outline"
          className="gap-2 ml-auto"
          aria-label="Reset and upload new image"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New Image
        </Button>
      </div>

      {/* Info Text */}
      {!formatChanged && (
        <p className="text-sm text-muted-foreground">
          Click &quot;Convert Image&quot; to process the image
        </p>
      )}
    </div>
  )
}


export default ConversionPreview
