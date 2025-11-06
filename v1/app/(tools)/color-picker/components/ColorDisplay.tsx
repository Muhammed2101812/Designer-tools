'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { ClipboardFallback } from '@/components/shared/ClipboardFallback'
import { logError } from '@/lib/utils/errorHandling'
import { checkClipboardSupport } from '@/lib/utils/browserCompat'
import type { Color } from '@/types'

export interface ColorDisplayProps {
  /**
   * The color to display. If null, shows empty state.
   */
  color: Color | null
  
  /**
   * Callback when a color format is copied
   */
  onCopy?: (format: 'hex' | 'rgb' | 'hsl') => void
}

export const ColorDisplay = React.memo(function ColorDisplay({ color, onCopy }: ColorDisplayProps) {
  const [copiedFormat, setCopiedFormat] = React.useState<'hex' | 'rgb' | 'hsl' | null>(null)
  const [fallbackOpen, setFallbackOpen] = React.useState(false)
  const [fallbackValue, setFallbackValue] = React.useState('')
  const [fallbackLabel, setFallbackLabel] = React.useState('')
  
  // Screen reader announcement for color changes
  const [announcement, setAnnouncement] = React.useState('')

  /**
   * Announce color change to screen readers
   */
  React.useEffect(() => {
    if (color) {
      const rgbString = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
      const hslString = `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
      setAnnouncement(
        `Color extracted: ${color.hex}, ${rgbString}, ${hslString}`
      )
    }
  }, [color])

  /**
   * Copy text to clipboard and show feedback
   */
  const copyToClipboard = async (text: string, format: 'hex' | 'rgb' | 'hsl') => {
    try {
      // Check if clipboard API is available
      const hasClipboard = checkClipboardSupport()
      
      if (!hasClipboard) {
        // Show fallback modal for manual copying
        setFallbackValue(text)
        setFallbackLabel(`${format.toUpperCase()} Color`)
        setFallbackOpen(true)
        return
      }

      await navigator.clipboard.writeText(text)
      
      // Show success toast
      toast({
        title: 'Copied!',
        description: `${format.toUpperCase()} value copied to clipboard`,
      })
      
      // Show visual feedback (checkmark)
      setCopiedFormat(format)
      
      // Call optional callback
      onCopy?.(format)
      
      // Reset visual feedback after 2 seconds
      setTimeout(() => {
        setCopiedFormat(null)
      }, 2000)
    } catch (error) {
      logError(error, 'ColorDisplay.copyToClipboard')
      
      // Show fallback modal for manual copying
      setFallbackValue(text)
      setFallbackLabel(`${format.toUpperCase()} Color`)
      setFallbackOpen(true)
    }
  }

  /**
   * Handle copy button click for HEX format
   */
  const handleCopyHex = () => {
    if (color) {
      copyToClipboard(color.hex, 'hex')
    }
  }

  /**
   * Handle copy button click for RGB format
   */
  const handleCopyRgb = () => {
    if (color) {
      const rgbString = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
      copyToClipboard(rgbString, 'rgb')
    }
  }

  /**
   * Handle copy button click for HSL format
   */
  const handleCopyHsl = () => {
    if (color) {
      const hslString = `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
      copyToClipboard(hslString, 'hsl')
    }
  }

  // Empty state when no color is selected
  if (!color) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="text-sm font-semibold mb-3">Current Color</h3>
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          Click on the image to pick a color
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Screen reader announcement for color changes */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      <ClipboardFallback
        open={fallbackOpen}
        onOpenChange={setFallbackOpen}
        value={fallbackValue}
        label={fallbackLabel}
      />
    
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-sm font-semibold mb-3" id="current-color-heading">Current Color</h3>
      
      <div className="space-y-3" role="region" aria-labelledby="current-color-heading">
        {/* Color Swatch */}
        <div
          className="w-full h-24 rounded-md border-2 border-border shadow-sm"
          style={{ backgroundColor: color.hex }}
          role="img"
          aria-label={`Color swatch showing ${color.hex}`}
        />

        {/* Color Values */}
        <div className="space-y-2">
          {/* HEX Value */}
          <div>
            <label htmlFor="hex-value" className="text-xs font-medium text-muted-foreground">
              HEX
            </label>
            <div className="flex items-center gap-2 mt-1">
              <code 
                id="hex-value"
                className="flex-1 px-3 py-2 text-sm bg-muted rounded border font-mono"
                aria-label={`HEX color value: ${color.hex}`}
              >
                {color.hex}
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyHex}
                aria-label={`Copy HEX value ${color.hex} to clipboard`}
                className="shrink-0 h-11 w-11 sm:h-10 sm:w-10"
              >
                {copiedFormat === 'hex' ? (
                  <Check className="h-5 w-5 sm:h-4 sm:w-4 text-green-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {copiedFormat === 'hex' ? 'Copied' : 'Copy'}
                </span>
              </Button>
            </div>
          </div>

          {/* RGB Value */}
          <div>
            <label htmlFor="rgb-value" className="text-xs font-medium text-muted-foreground">
              RGB
            </label>
            <div className="flex items-center gap-2 mt-1">
              <code 
                id="rgb-value"
                className="flex-1 px-3 py-2 text-sm bg-muted rounded border font-mono"
                aria-label={`RGB color value: rgb ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`}
              >
                rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyRgb}
                aria-label={`Copy RGB value rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}) to clipboard`}
                className="shrink-0 h-11 w-11 sm:h-10 sm:w-10"
              >
                {copiedFormat === 'rgb' ? (
                  <Check className="h-5 w-5 sm:h-4 sm:w-4 text-green-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {copiedFormat === 'rgb' ? 'Copied' : 'Copy'}
                </span>
              </Button>
            </div>
          </div>

          {/* HSL Value */}
          <div>
            <label htmlFor="hsl-value" className="text-xs font-medium text-muted-foreground">
              HSL
            </label>
            <div className="flex items-center gap-2 mt-1">
              <code 
                id="hsl-value"
                className="flex-1 px-3 py-2 text-sm bg-muted rounded border font-mono"
                aria-label={`HSL color value: hsl ${color.hsl.h}, ${color.hsl.s} percent, ${color.hsl.l} percent`}
              >
                hsl({color.hsl.h}, {color.hsl.s}%, {color.hsl.l}%)
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyHsl}
                aria-label={`Copy HSL value hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%) to clipboard`}
                className="shrink-0 h-11 w-11 sm:h-10 sm:w-10"
              >
                {copiedFormat === 'hsl' ? (
                  <Check className="h-5 w-5 sm:h-4 sm:w-4 text-green-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {copiedFormat === 'hsl' ? 'Copied' : 'Copy'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
})
