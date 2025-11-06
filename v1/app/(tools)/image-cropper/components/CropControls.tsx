'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Crop, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface CropControlsProps {
  zoom: number
  rotation: number
  onZoomChange: (zoom: number) => void
  onRotationChange: (rotation: number) => void
  onReset: () => void
  onCrop: () => void
  isProcessing: boolean
}

export function CropControls({
  zoom,
  rotation,
  onZoomChange,
  onRotationChange,
  onReset,
  onCrop,
  isProcessing,
}: CropControlsProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.1, 3))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.1, 0.5))
  }

  const handleRotateRight = () => {
    onRotationChange((rotation + 90) % 360)
  }

  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div className="p-4 border rounded-lg bg-card space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Zoom</Label>
          <span className="text-sm text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5 || isProcessing}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Slider
            value={[zoom]}
            onValueChange={([value]) => onZoomChange(value)}
            min={0.5}
            max={3}
            step={0.1}
            className="flex-1"
            disabled={isProcessing}
            aria-label="Zoom level"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3 || isProcessing}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Use zoom for precision cropping
        </p>
      </div>

      {/* Rotation Controls */}
      <div className="p-4 border rounded-lg bg-card space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Rotation</Label>
          <span className="text-sm text-muted-foreground">
            {rotation}°
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRotateRight}
            disabled={isProcessing}
            aria-label="Rotate 90 degrees clockwise"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Slider
            value={[rotation]}
            onValueChange={([value]) => onRotationChange(value)}
            min={0}
            max={360}
            step={1}
            className="flex-1"
            disabled={isProcessing}
            aria-label="Rotation angle"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Rotate image before cropping
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={onCrop}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crop className="mr-2 h-4 w-4" />
              Crop Image
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={onReset}
          disabled={isProcessing}
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Controls
        </Button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="p-3 border rounded-lg bg-muted/50">
        <p className="text-xs font-semibold mb-1">Keyboard Shortcuts:</p>
        <ul className="text-xs text-muted-foreground space-y-0.5">
          <li>+/- : Zoom in/out</li>
          <li>Arrow keys: Move crop area</li>
          <li>Enter: Apply crop</li>
          <li>Escape: Reset</li>
        </ul>
      </div>
    </div>
  )
}

export default CropControls
