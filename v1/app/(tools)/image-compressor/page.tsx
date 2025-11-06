'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { FileUploader } from '@/components/shared/FileUploader'
import { Minimize2, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { ensureFileReaderSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { validateFileUpload } from '@/lib/utils/validation'

// Dynamic imports for code splitting
import { CompressionCanvas } from './components/CompressionCanvas'
import QualityControls from './components/QualityControls'
import CompressionStats from './components/CompressionStats'

export default function ImageCompressorPage() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalFile, setOriginalFile] = React.useState<File | null>(null)
  const [compressedBlob, setCompressedBlob] = React.useState<Blob | null>(null)
  const [quality, setQuality] = React.useState(80)
  const [preset, setPreset] = React.useState('medium')
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
          setCompressedBlob(null)
        } else {
          const error = new ImageProcessingError('Invalid image data')
          handleErrorWithToast(error, toast, 'ImageCompressor.handleFileSelect')
        }
      }

      reader.onerror = () => {
        const error = new ImageProcessingError('Failed to read image file. Please try again.')
        handleErrorWithToast(error, toast, 'ImageCompressor.FileReader')
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      handleErrorWithToast(error, toast, 'ImageCompressor.handleFileSelect')
    }
  }

  const handleImageReset = React.useCallback(() => {
    setImageSrc(null)
    setOriginalFile(null)
    setCompressedBlob(null)
    setQuality(80)
    setPreset('medium')
  }, [])

  const handleQualityChange = React.useCallback((newQuality: number) => {
    setQuality(newQuality)
    // Clear previous compression when quality changes
    setCompressedBlob(null)
  }, [])

  const handlePresetChange = React.useCallback((newPreset: string) => {
    setPreset(newPreset)
    // Update quality based on preset
    const presetQuality = {
      low: 60,
      medium: 80,
      high: 90,
      custom: quality,
    }
    if (newPreset !== 'custom') {
      setQuality(presetQuality[newPreset as keyof typeof presetQuality])
    }
    // Clear previous compression when preset changes
    setCompressedBlob(null)
  }, [quality])

  const handleCompressionComplete = React.useCallback((blob: Blob) => {
    setCompressedBlob(blob)
    setIsProcessing(false)
  }, [])

  const handleCompressionStart = React.useCallback(() => {
    setIsProcessing(true)
  }, [])

  return (
    <ToolWrapper
      title="Image Compressor"
      description="Reduce image file size with smart compression and quality control"
      icon={<Minimize2 className="h-6 w-6" />}
      isClientSide={true}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Upload an image (PNG, JPG, or WEBP format, max 10MB)</li>
              <li>Choose a compression preset or use custom quality</li>
              <li>Adjust the quality slider for custom compression</li>
              <li>Click &quot;Compress Image&quot; to process</li>
              <li>Compare original and compressed file sizes</li>
              <li>Download the compressed image</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Smart compression with quality presets</li>
              <li>Custom quality control (0-100)</li>
              <li>Real-time file size comparison</li>
              <li>Compression ratio display</li>
              <li>100% client-side - your images never leave your browser</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Quality Presets:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Low (60%):</strong> Maximum compression, smaller file size</li>
              <li><strong>Medium (80%):</strong> Balanced quality and size</li>
              <li><strong>High (90%):</strong> Minimal compression, best quality</li>
              <li><strong>Custom:</strong> Fine-tune compression to your needs</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Start with Medium preset for most use cases</li>
              <li>Use Low quality for web thumbnails and previews</li>
              <li>PNG files may not compress as much as JPG</li>
              <li>Compare before/after to find the right balance</li>
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
            description="Select a PNG, JPG, or WEBP image to compress"
            multiple={false}
          />
        )}

        {/* Compression Interface */}
        {imageSrc && originalFile && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Canvas - full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 order-1 lg:order-1">
              <CompressionCanvas
                imageSrc={imageSrc}
                originalFile={originalFile}
                quality={quality}
                onImageReset={handleImageReset}
                onCompressionComplete={handleCompressionComplete}
                onCompressionStart={handleCompressionStart}
              />
            </div>

            {/* Controls and Stats - stacked vertically on mobile, sidebar on desktop */}
            <div className="space-y-4 order-2 lg:order-2">
              <QualityControls
                quality={quality}
                preset={preset}
                onQualityChange={handleQualityChange}
                onPresetChange={handlePresetChange}
              />
              <CompressionStats
                originalSize={originalFile.size}
                compressedSize={compressedBlob?.size || null}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  )
}
