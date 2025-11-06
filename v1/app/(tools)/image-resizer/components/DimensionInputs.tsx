'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Link2, Link2Off } from 'lucide-react'
import { calculateDimensions } from '@/lib/utils/imageProcessing'
import type { ImageDimensions } from '../page'

export interface DimensionInputsProps {
  originalDimensions: ImageDimensions
  targetDimensions: ImageDimensions
  maintainAspectRatio: boolean
  onDimensionsChange: (dimensions: ImageDimensions) => void
  onAspectRatioToggle: (maintain: boolean) => void
}

export default function DimensionInputs({
  originalDimensions,
  targetDimensions,
  maintainAspectRatio,
  onDimensionsChange,
  onAspectRatioToggle,
}: DimensionInputsProps) {
  const [widthInput, setWidthInput] = React.useState(targetDimensions.width.toString())
  const [heightInput, setHeightInput] = React.useState(targetDimensions.height.toString())

  // Update inputs when target dimensions change externally
  React.useEffect(() => {
    setWidthInput(targetDimensions.width.toString())
    setHeightInput(targetDimensions.height.toString())
  }, [targetDimensions])

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setWidthInput(value)

    const width = parseInt(value, 10)
    if (isNaN(width) || width <= 0) return

    if (maintainAspectRatio) {
      const newDimensions = calculateDimensions(originalDimensions, { width })
      setHeightInput(newDimensions.height.toString())
      onDimensionsChange(newDimensions)
    } else {
      onDimensionsChange({ width, height: targetDimensions.height })
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHeightInput(value)

    const height = parseInt(value, 10)
    if (isNaN(height) || height <= 0) return

    if (maintainAspectRatio) {
      const newDimensions = calculateDimensions(originalDimensions, { height })
      setWidthInput(newDimensions.width.toString())
      onDimensionsChange(newDimensions)
    } else {
      onDimensionsChange({ width: targetDimensions.width, height })
    }
  }

  const handleAspectRatioToggle = () => {
    const newValue = !maintainAspectRatio
    onAspectRatioToggle(newValue)

    // If turning on aspect ratio lock, recalculate based on current width
    if (newValue) {
      const width = parseInt(widthInput, 10)
      if (!isNaN(width) && width > 0) {
        const newDimensions = calculateDimensions(originalDimensions, { width })
        setHeightInput(newDimensions.height.toString())
        onDimensionsChange(newDimensions)
      }
    }
  }

  const handleReset = () => {
    setWidthInput(originalDimensions.width.toString())
    setHeightInput(originalDimensions.height.toString())
    onDimensionsChange(originalDimensions)
  }

  const aspectRatio = (originalDimensions.width / originalDimensions.height).toFixed(2)

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Dimensions</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAspectRatioToggle}
          className="gap-2"
          aria-label={
            maintainAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'
          }
        >
          {maintainAspectRatio ? (
            <>
              <Link2 className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">Locked</span>
            </>
          ) : (
            <>
              <Link2Off className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">Unlocked</span>
            </>
          )}
        </Button>
      </div>

      {/* Original Dimensions */}
      <div className="text-sm text-muted-foreground">
        <p>
          Original: {originalDimensions.width} × {originalDimensions.height} px
        </p>
        <p>Aspect Ratio: {aspectRatio}:1</p>
      </div>

      {/* Width Input */}
      <div className="space-y-2">
        <Label htmlFor="width-input">Width (px)</Label>
        <Input
          id="width-input"
          type="number"
          min="1"
          max="10000"
          value={widthInput}
          onChange={handleWidthChange}
          placeholder="Enter width"
          aria-describedby="width-help"
        />
        <p id="width-help" className="text-xs text-muted-foreground">
          Target width in pixels
        </p>
      </div>

      {/* Height Input */}
      <div className="space-y-2">
        <Label htmlFor="height-input">Height (px)</Label>
        <Input
          id="height-input"
          type="number"
          min="1"
          max="10000"
          value={heightInput}
          onChange={handleHeightChange}
          placeholder="Enter height"
          aria-describedby="height-help"
          disabled={maintainAspectRatio}
        />
        <p id="height-help" className="text-xs text-muted-foreground">
          {maintainAspectRatio
            ? 'Auto-calculated to maintain aspect ratio'
            : 'Target height in pixels'}
        </p>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="w-full"
        aria-label="Reset to original dimensions"
      >
        Reset to Original
      </Button>
    </div>
  )
}
