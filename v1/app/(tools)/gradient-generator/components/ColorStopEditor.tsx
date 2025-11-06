'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import type { GradientConfig, ColorStop } from '../page'

interface ColorStopEditorProps {
  config: GradientConfig
  onConfigChange: (updates: Partial<GradientConfig>) => void
  onColorStopsChange: (colorStops: ColorStop[]) => void
}

export default function ColorStopEditor({
  config,
  onConfigChange,
  onColorStopsChange,
}: ColorStopEditorProps) {
  const handleTypeChange = (type: 'linear' | 'radial') => {
    onConfigChange({ type })
  }

  const handleAngleChange = (value: number[]) => {
    onConfigChange({ angle: value[0] })
  }

  const handleAddColorStop = () => {
    if (config.colorStops.length >= 10) return

    const newStop: ColorStop = {
      id: Date.now().toString(),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      position: 50,
    }

    const newStops = [...config.colorStops, newStop].sort((a, b) => a.position - b.position)
    onColorStopsChange(newStops)
  }

  const handleRemoveColorStop = (id: string) => {
    if (config.colorStops.length <= 2) return

    const newStops = config.colorStops.filter((stop) => stop.id !== id)
    onColorStopsChange(newStops)
  }

  const handleColorChange = (id: string, color: string) => {
    const newStops = config.colorStops.map((stop) =>
      stop.id === id ? { ...stop, color } : stop
    )
    onColorStopsChange(newStops)
  }

  const handlePositionChange = (id: string, position: number) => {
    const newStops = config.colorStops.map((stop) =>
      stop.id === id ? { ...stop, position } : stop
    )
    onColorStopsChange(newStops)
  }

  return (
    <div className="border rounded-lg bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Gradient Settings</h3>

      <div className="space-y-4">
        {/* Gradient Type */}
        <div className="space-y-2">
          <Label htmlFor="gradient-type">Type</Label>
          <Select value={config.type} onValueChange={handleTypeChange}>
            <SelectTrigger id="gradient-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Angle (only for linear) */}
        {config.type === 'linear' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gradient-angle">Angle</Label>
              <span className="text-sm text-muted-foreground">{config.angle}°</span>
            </div>
            <Slider
              id="gradient-angle"
              min={0}
              max={360}
              step={1}
              value={[config.angle]}
              onValueChange={handleAngleChange}
            />
          </div>
        )}

        {/* Color Stops */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Color Stops ({config.colorStops.length}/10)</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddColorStop}
              disabled={config.colorStops.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {config.colorStops
              .sort((a, b) => a.position - b.position)
              .map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-center gap-2 p-2 border rounded-lg bg-muted/20"
                >
                  <div className="flex-shrink-0">
                    <Input
                      type="color"
                      value={stop.color}
                      onChange={(e) => handleColorChange(stop.id, e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                      aria-label={`Color ${index + 1}`}
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={stop.color}
                        onChange={(e) => handleColorChange(stop.id, e.target.value)}
                        className="h-8 text-xs font-mono"
                        placeholder="#000000"
                        aria-label={`Color ${index + 1} hex value`}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={stop.position}
                        onChange={(e) =>
                          handlePositionChange(stop.id, Number(e.target.value))
                        }
                        className="h-8 w-16 text-xs"
                        aria-label={`Color ${index + 1} position`}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveColorStop(stop.id)}
                    disabled={config.colorStops.length <= 2}
                    className="flex-shrink-0"
                    aria-label={`Remove color ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
