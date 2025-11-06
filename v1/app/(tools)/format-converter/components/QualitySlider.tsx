'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Gauge } from 'lucide-react'
import type { ImageFormat } from '../page'

export interface QualitySliderProps {
  quality: number
  targetFormat: ImageFormat
  onQualityChange: (quality: number) => void
}

const QUALITY_PRESETS = [
  { label: 'Low', value: 60, description: 'Smallest file' },
  { label: 'Medium', value: 80, description: 'Balanced' },
  { label: 'High', value: 90, description: 'Best quality' },
  { label: 'Maximum', value: 100, description: 'Largest file' },
]

function QualitySlider({
  quality,
  targetFormat,
  onQualityChange,
}: QualitySliderProps) {
  // PNG is lossless, so quality doesn't apply
  const isLossyFormat = targetFormat === 'jpeg' || targetFormat === 'webp'

  if (!isLossyFormat) {
    return (
      <div className="p-4 border rounded-lg bg-card space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="font-semibold">Quality</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>PNG is a lossless format.</p>
          <p className="mt-1">Quality settings don&apos;t apply.</p>
        </div>
      </div>
    )
  }

  const getQualityLabel = (value: number): string => {
    if (value >= 95) return 'Maximum'
    if (value >= 85) return 'High'
    if (value >= 70) return 'Medium'
    return 'Low'
  }

  const getQualityColor = (value: number): string => {
    if (value >= 85) return 'text-green-600 dark:text-green-400'
    if (value >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <div className="flex items-center gap-2">
        <Gauge className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h3 className="font-semibold">Quality</h3>
      </div>

      {/* Quality Display */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Current:</span>
        <div className="text-right">
          <span className={`text-2xl font-bold ${getQualityColor(quality)}`}>
            {quality}%
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            ({getQualityLabel(quality)})
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <Label htmlFor="quality-slider" className="sr-only">
          Quality percentage
        </Label>
        <Slider
          id="quality-slider"
          min={1}
          max={100}
          step={1}
          value={[quality]}
          onValueChange={(values) => onQualityChange(values[0])}
          aria-label="Adjust image quality"
          aria-valuemin={1}
          aria-valuemax={100}
          aria-valuenow={quality}
          aria-valuetext={`${quality} percent, ${getQualityLabel(quality)} quality`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <Label className="text-xs">Quick presets:</Label>
        <div className="grid grid-cols-2 gap-2">
          {QUALITY_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={quality === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onQualityChange(preset.value)}
              className="h-auto py-2 px-3"
              aria-label={`Set quality to ${preset.label} (${preset.value}%)`}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-semibold">{preset.label}</span>
                <span className="text-[10px] opacity-70">{preset.description}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        <p>
          Higher quality = better image but larger file size.
          Lower quality = smaller file but visible compression artifacts.
        </p>
      </div>
    </div>
  )
}


export default QualitySlider
