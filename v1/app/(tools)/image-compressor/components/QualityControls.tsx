'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface QualityControlsProps {
  quality: number
  preset: string
  onQualityChange: (quality: number) => void
  onPresetChange: (preset: string) => void
}

function QualityControls({
  quality,
  preset,
  onQualityChange,
  onPresetChange,
}: QualityControlsProps) {
  const handlePresetChange = (value: string) => {
    onPresetChange(value)
  }

  const handleQualityChange = (values: number[]) => {
    const newQuality = values[0]
    onQualityChange(newQuality)
    // Switch to custom preset when manually adjusting
    if (preset !== 'custom') {
      onPresetChange('custom')
    }
  }

  const getQualityLabel = (q: number) => {
    if (q < 50) return 'Very Low'
    if (q < 70) return 'Low'
    if (q < 85) return 'Medium'
    if (q < 95) return 'High'
    return 'Very High'
  }

  const getQualityColor = (q: number) => {
    if (q < 50) return 'text-red-500'
    if (q < 70) return 'text-orange-500'
    if (q < 85) return 'text-yellow-500'
    if (q < 95) return 'text-green-500'
    return 'text-blue-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compression Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Selection */}
        <div className="space-y-2">
          <Label htmlFor="preset-select">Quality Preset</Label>
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger id="preset-select" aria-label="Select compression quality preset">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Low Quality</span>
                  <span className="text-xs text-muted-foreground">60% - Maximum compression</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Medium Quality</span>
                  <span className="text-xs text-muted-foreground">80% - Balanced</span>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex flex-col items-start">
                  <span className="font-medium">High Quality</span>
                  <span className="text-xs text-muted-foreground">90% - Minimal compression</span>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Custom</span>
                  <span className="text-xs text-muted-foreground">Adjust manually</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quality Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="quality-slider">Quality Level</Label>
            <span className={`text-sm font-medium ${getQualityColor(quality)}`}>
              {quality}% - {getQualityLabel(quality)}
            </span>
          </div>
          <Slider
            id="quality-slider"
            min={10}
            max={100}
            step={5}
            value={[quality]}
            onValueChange={handleQualityChange}
            className="w-full"
            aria-label={`Compression quality: ${quality}%`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Smaller file</span>
            <span>Better quality</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
          <p className="font-medium">💡 Tip:</p>
          <p className="text-muted-foreground">
            Lower quality = smaller file size. Start with Medium (80%) for most use cases.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


export default QualityControls
