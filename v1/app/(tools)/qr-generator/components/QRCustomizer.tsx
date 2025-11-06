'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import type { QRConfig } from '../page'

export interface QRCustomizerProps {
  config: QRConfig
  onConfigChange: (updates: Partial<QRConfig>) => void
}

const MAX_CONTENT_LENGTH = 500

const SIZE_OPTIONS = [
  { value: 128, label: 'Small (128px)' },
  { value: 256, label: 'Medium (256px)' },
  { value: 512, label: 'Large (512px)' },
  { value: 1024, label: 'Extra Large (1024px)' },
]

const ERROR_CORRECTION_OPTIONS = [
  { value: 'L', label: 'Low (~7%)', description: 'Smallest QR code' },
  { value: 'M', label: 'Medium (~15%)', description: 'Recommended' },
  { value: 'Q', label: 'Quartile (~25%)', description: 'More robust' },
  { value: 'H', label: 'High (~30%)', description: 'Most reliable' },
]

export default function QRCustomizer({ config, onConfigChange }: QRCustomizerProps) {
  const [contentError, setContentError] = React.useState<string | null>(null)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    if (value.length > MAX_CONTENT_LENGTH) {
      setContentError(`Content exceeds ${MAX_CONTENT_LENGTH} characters`)
      return
    }
    
    setContentError(null)
    onConfigChange({ content: value })
  }

  const handleSizeChange = (value: string) => {
    onConfigChange({ size: parseInt(value, 10) })
  }

  const handleForegroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ foregroundColor: e.target.value })
  }

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ backgroundColor: e.target.value })
  }

  const handleErrorCorrectionChange = (value: string) => {
    onConfigChange({ errorCorrectionLevel: value as QRConfig['errorCorrectionLevel'] })
  }

  const remainingChars = MAX_CONTENT_LENGTH - config.content.length

  return (
    <div className="border rounded-lg bg-card p-4">
      <h2 className="text-lg font-semibold mb-4">Customize</h2>
      
      <div className="space-y-4">
        {/* Content Input */}
        <div className="space-y-2">
          <Label htmlFor="qr-content">
            Content <span className="text-muted-foreground text-xs">(required)</span>
          </Label>
          <Textarea
            id="qr-content"
            placeholder="Enter text or URL..."
            value={config.content}
            onChange={handleContentChange}
            rows={4}
            className="resize-none font-mono text-sm"
            aria-describedby="content-help"
          />
          <div className="flex items-center justify-between text-xs">
            <span
              id="content-help"
              className={remainingChars < 50 ? 'text-warning' : 'text-muted-foreground'}
            >
              {remainingChars} characters remaining
            </span>
          </div>
          {contentError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{contentError}</span>
            </div>
          )}
        </div>

        {/* Size Selection */}
        <div className="space-y-2">
          <Label htmlFor="qr-size">Size</Label>
          <Select value={config.size.toString()} onValueChange={handleSizeChange}>
            <SelectTrigger id="qr-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Foreground Color */}
        <div className="space-y-2">
          <Label htmlFor="qr-foreground">Foreground Color</Label>
          <div className="flex gap-2">
            <Input
              id="qr-foreground"
              type="color"
              value={config.foregroundColor}
              onChange={handleForegroundColorChange}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={config.foregroundColor}
              onChange={handleForegroundColorChange}
              className="flex-1 font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="qr-background">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="qr-background"
              type="color"
              value={config.backgroundColor}
              onChange={handleBackgroundColorChange}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={config.backgroundColor}
              onChange={handleBackgroundColorChange}
              className="flex-1 font-mono text-sm"
              placeholder="#ffffff"
            />
          </div>
        </div>

        {/* Error Correction Level */}
        <div className="space-y-2">
          <Label htmlFor="qr-error-correction">Error Correction</Label>
          <Select
            value={config.errorCorrectionLevel}
            onValueChange={handleErrorCorrectionChange}
          >
            <SelectTrigger id="qr-error-correction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ERROR_CORRECTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Higher levels create larger QR codes but are more resistant to damage
          </p>
        </div>
      </div>
    </div>
  )
}
