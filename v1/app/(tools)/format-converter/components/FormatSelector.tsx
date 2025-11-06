'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FileImage } from 'lucide-react'
import type { ImageFormat } from '../page'

export interface FormatSelectorProps {
  sourceFormat: ImageFormat
  targetFormat: ImageFormat
  onFormatChange: (format: ImageFormat) => void
}

const FORMAT_OPTIONS: Array<{
  value: ImageFormat
  label: string
  description: string
  extension: string
}> = [
  {
    value: 'png',
    label: 'PNG',
    description: 'Lossless, transparency',
    extension: '.png',
  },
  {
    value: 'jpeg',
    label: 'JPG',
    description: 'Lossy, smaller size',
    extension: '.jpg',
  },
  {
    value: 'webp',
    label: 'WEBP',
    description: 'Modern, best compression',
    extension: '.webp',
  },
]

export default function FormatSelector({
  sourceFormat,
  targetFormat,
  onFormatChange,
}: FormatSelectorProps) {
  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <div className="flex items-center gap-2">
        <FileImage className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h3 className="font-semibold">Output Format</h3>
      </div>

      {/* Source Format Info */}
      <div className="text-sm">
        <p className="text-muted-foreground">
          Source: <span className="font-medium text-foreground">{sourceFormat.toUpperCase()}</span>
        </p>
      </div>

      {/* Format Options */}
      <div className="space-y-2">
        <Label>Select target format:</Label>
        <div className="grid gap-2">
          {FORMAT_OPTIONS.map((option) => {
            const isSelected = targetFormat === option.value
            const isSource = sourceFormat === option.value

            return (
              <Button
                key={option.value}
                variant={isSelected ? 'default' : 'outline'}
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => onFormatChange(option.value)}
                disabled={isSource}
                aria-label={`Convert to ${option.label} format`}
                aria-pressed={isSelected}
              >
                <div className="flex flex-col items-start gap-1 w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs opacity-70">{option.extension}</span>
                  </div>
                  <span className="text-xs opacity-80">
                    {isSource ? 'Current format' : option.description}
                  </span>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Format Info */}
      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
        <p>
          <strong>PNG:</strong> Best for graphics, logos, screenshots
        </p>
        <p>
          <strong>JPG:</strong> Best for photos, no transparency
        </p>
        <p>
          <strong>WEBP:</strong> Best overall compression, modern browsers
        </p>
      </div>
    </div>
  )
}
