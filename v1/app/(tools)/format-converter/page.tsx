'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { FileUploader } from '@/components/shared/FileUploader'
import { RefreshCw, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { ensureFileReaderSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { validateFileUpload } from '@/lib/utils/validation'
import { getImageFormat } from '@/lib/utils/imageProcessing'

// Dynamic imports for code splitting
import FormatSelector from './components/FormatSelector'
import QualitySlider from './components/QualitySlider'
import ConversionPreview from './components/ConversionPreview'

export type ImageFormat = 'png' | 'jpeg' | 'webp'

export default function FormatConverterPage() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalFile, setOriginalFile] = React.useState<File | null>(null)
  const [sourceFormat, setSourceFormat] = React.useState<ImageFormat | null>(null)
  const [targetFormat, setTargetFormat] = React.useState<ImageFormat>('png')
  const [quality, setQuality] = React.useState(90)
  const [convertedBlob, setConvertedBlob] = React.useState<Blob | null>(null)
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
          setConvertedBlob(null)

          // Detect source format
          const format = getImageFormat(selectedFile.type)
          setSourceFormat(format)

          // Set default target format (different from source)
          if (format === 'png') {
            setTargetFormat('jpeg')
          } else {
            setTargetFormat('png')
          }
        } else {
          const error = new ImageProcessingError('Invalid image data')
          handleErrorWithToast(error, toast, 'FormatConverter.handleFileSelect')
        }
      }

      reader.onerror = () => {
        const error = new ImageProcessingError('Failed to read image file. Please try again.')
        handleErrorWithToast(error, toast, 'FormatConverter.FileReader')
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      handleErrorWithToast(error, toast, 'FormatConverter.handleFileSelect')
    }
  }

  const handleImageReset = React.useCallback(() => {
    setImageSrc(null)
    setOriginalFile(null)
    setSourceFormat(null)
    setTargetFormat('png')
    setQuality(90)
    setConvertedBlob(null)
    setIsProcessing(false)
  }, [])

  const handleFormatChange = React.useCallback((format: ImageFormat) => {
    setTargetFormat(format)
    // Clear previous conversion when format changes
    setConvertedBlob(null)
  }, [])

  const handleQualityChange = React.useCallback((newQuality: number) => {
    setQuality(newQuality)
    // Clear previous conversion when quality changes
    setConvertedBlob(null)
  }, [])

  const handleConversionComplete = React.useCallback((blob: Blob) => {
    setConvertedBlob(blob)
    setIsProcessing(false)
  }, [])

  const handleConversionStart = React.useCallback(() => {
    setIsProcessing(true)
  }, [])

  return (
    <ToolWrapper
      title="Format Converter"
      description="Convert images between PNG, JPG, and WEBP formats"
      icon={<RefreshCw className="h-6 w-6" />}
      isClientSide={true}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Upload an image (PNG, JPG, or WEBP format, max 10MB)</li>
              <li>Select your desired output format</li>
              <li>Adjust quality for lossy formats (JPG, WEBP)</li>
              <li>Click &quot;Convert Image&quot; to process</li>
              <li>Preview the converted image</li>
              <li>Download the result in the selected format</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Format Guide:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>PNG:</strong> Lossless, supports transparency, larger file size</li>
              <li><strong>JPG:</strong> Lossy, no transparency, smaller file size, best for photos</li>
              <li><strong>WEBP:</strong> Modern format, lossy/lossless, supports transparency, excellent compression</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use PNG for images with transparency or text</li>
              <li>Use JPG for photographs to reduce file size</li>
              <li>Use WEBP for best compression with quality</li>
              <li>Higher quality = larger file size</li>
              <li>100% client-side - your images never leave your browser</li>
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
            description="Select a PNG, JPG, or WEBP image to convert"
            multiple={false}
          />
        )}

        {/* Conversion Interface */}
        {imageSrc && originalFile && sourceFormat && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Preview - full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 order-1 lg:order-1">
              <ConversionPreview
                originalFile={originalFile}
                convertedBlob={convertedBlob}
                targetFormat={targetFormat}
                quality={quality}
                isProcessing={isProcessing}
                onConvert={handleConversionStart}
                onDownload={() => {}}
                onReset={handleImageReset}
              />
            </div>

            {/* Controls - stacked vertically on mobile, sidebar on desktop */}
            <div className="space-y-4 order-2 lg:order-2">
              <FormatSelector
                sourceFormat={sourceFormat}
                targetFormat={targetFormat}
                onFormatChange={handleFormatChange}
              />
              <QualitySlider
                quality={quality}
                targetFormat={targetFormat}
                onQualityChange={handleQualityChange}
              />
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  )
}
