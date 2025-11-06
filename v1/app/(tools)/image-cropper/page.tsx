'use client'

import * as React from 'react'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { FileUploader } from '@/components/shared/FileUploader'
import { Crop } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { ensureFileReaderSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { validateFileUpload } from '@/lib/utils/validation'
import { CropCanvas } from './components/CropCanvas'
import AspectRatioSelector from './components/AspectRatioSelector'
import CropControls from './components/CropControls'

export type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | 'custom'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function ImageCropperPage() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalFile, setOriginalFile] = React.useState<File | null>(null)
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>('free')
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [cropArea, setCropArea] = React.useState<CropArea | null>(null)

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
          // Reset controls
          setZoom(1)
          setRotation(0)
          setCropArea(null)
        } else {
          const error = new ImageProcessingError('Invalid image data')
          handleErrorWithToast(error, toast, 'ImageCropper.handleFileSelect')
        }
      }

      reader.onerror = () => {
        const error = new ImageProcessingError('Failed to read image file. Please try again.')
        handleErrorWithToast(error, toast, 'ImageCropper.FileReader')
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      handleErrorWithToast(error, toast, 'ImageCropper.handleFileSelect')
    }
  }

  const handleImageReset = React.useCallback(() => {
    setImageSrc(null)
    setOriginalFile(null)
    setAspectRatio('free')
    setZoom(1)
    setRotation(0)
    setCropArea(null)
  }, [])

  const handleRatioChange = React.useCallback((ratio: AspectRatio) => {
    setAspectRatio(ratio)
  }, [])

  const handleZoomChange = React.useCallback((newZoom: number) => {
    setZoom(newZoom)
  }, [])

  const handleRotationChange = React.useCallback((newRotation: number) => {
    setRotation(newRotation)
  }, [])

  const handleReset = React.useCallback(() => {
    setZoom(1)
    setRotation(0)
    setCropArea(null)
  }, [])

  const handleCrop = React.useCallback(() => {
    setIsProcessing(true)
    // The actual crop will be handled by CropCanvas component
  }, [])

  const handleCropComplete = React.useCallback(() => {
    setIsProcessing(false)
  }, [])

  return (
    <ToolWrapper
      title="Image Cropper"
      description="Crop images with custom aspect ratios and precision controls"
      icon={<Crop className="h-6 w-6" />}
      isClientSide={true}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Upload an image (PNG, JPG, or WEBP format, max 10MB)</li>
              <li>Select an aspect ratio or use free crop</li>
              <li>Drag the crop area to position it</li>
              <li>Resize using the corner handles</li>
              <li>Use zoom and rotation controls for precision</li>
              <li>Click &quot;Crop Image&quot; to process</li>
              <li>Download the cropped result</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Preset aspect ratios (1:1, 4:3, 16:9)</li>
              <li>Free crop with no constraints</li>
              <li>Draggable crop area with resize handles</li>
              <li>Zoom controls for precision cropping</li>
              <li>Rotation support (0-360 degrees)</li>
              <li>Touch-optimized for mobile devices</li>
              <li>100% client-side - your images never leave your browser</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Keyboard Shortcuts:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Arrow keys: Move crop area</li>
              <li>+/-: Zoom in/out</li>
              <li>Enter: Apply crop</li>
              <li>Escape: Reset controls</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use aspect ratio presets for social media images</li>
              <li>Zoom in for precise crop positioning</li>
              <li>Rotate before cropping for better composition</li>
              <li>The crop area can be moved by dragging the center</li>
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
            description="Select a PNG, JPG, or WEBP image to crop"
            multiple={false}
          />
        )}

        {/* Crop Interface */}
        {imageSrc && originalFile && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Canvas - full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 order-1 lg:order-1">
              <CropCanvas
                imageSrc={imageSrc}
                originalFile={originalFile}
                aspectRatio={aspectRatio}
                zoom={zoom}
                rotation={rotation}
                onImageReset={handleImageReset}
                onCropComplete={handleCropComplete}
                isProcessing={isProcessing}
                cropArea={cropArea}
                onCropAreaChange={setCropArea}
              />
            </div>

            {/* Controls - stacked vertically on mobile, sidebar on desktop */}
            <div className="space-y-4 order-2 lg:order-2">
              <AspectRatioSelector
                selectedRatio={aspectRatio}
                onRatioChange={handleRatioChange}
              />
              <CropControls
                zoom={zoom}
                rotation={rotation}
                onZoomChange={handleZoomChange}
                onRotationChange={handleRotationChange}
                onReset={handleReset}
                onCrop={handleCrop}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  )
}
