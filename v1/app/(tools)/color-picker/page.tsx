'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { FileUploader } from '@/components/shared/FileUploader'
import { Palette, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { ensureFileReaderSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { saveColorHistory, loadColorHistory, clearColorHistory as clearStoredHistory } from '@/lib/utils/sessionStorage'
import { validateFileUpload } from '@/lib/utils/validation'
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts'
import { useAnnouncement, ANNOUNCEMENT_MESSAGES } from '@/lib/hooks/useAnnouncement'
import type { Color } from '@/types'
import type { KeyboardShortcut } from '@/lib/hooks/useKeyboardShortcuts'

// Dynamic imports for code splitting - ColorCanvas is heavy due to canvas operations
const ColorCanvas = dynamic(() => import('./components/ColorCanvas').then(mod => ({ default: mod.ColorCanvas })), {
  loading: () => (
    <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading canvas...</p>
      </div>
    </div>
  ),
  ssr: false, // Canvas is client-side only
})

const ColorDisplay = dynamic(() => import('./components/ColorDisplay').then(mod => ({ default: mod.ColorDisplay })), {
  loading: () => (
    <div className="p-4 border rounded-lg bg-card animate-pulse">
      <div className="h-6 bg-muted rounded w-24 mb-3" />
      <div className="h-24 bg-muted rounded mb-3" />
      <div className="space-y-2">
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
      </div>
    </div>
  ),
})

const ColorHistory = dynamic(() => import('./components/ColorHistory').then(mod => ({ default: mod.ColorHistory })), {
  loading: () => (
    <div className="p-4 border rounded-lg bg-card animate-pulse">
      <div className="h-6 bg-muted rounded w-32 mb-3" />
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-md" />
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-muted rounded" />
        <div className="flex-1 h-9 bg-muted rounded" />
      </div>
    </div>
  ),
})

export default function ColorPickerPage() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [currentColor, setCurrentColor] = React.useState<Color | null>(null)
  const [colorHistory, setColorHistory] = React.useState<Color[]>([])
  
  // Debounce timer ref for rapid color picks
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  
  // Screen reader announcements
  const { announce } = useAnnouncement()
  
  // Load color history from sessionStorage on mount
  React.useEffect(() => {
    const storedHistory = loadColorHistory()
    if (storedHistory.length > 0) {
      setColorHistory(storedHistory)
    }
  }, [])
  
  // Save color history to sessionStorage whenever it changes
  React.useEffect(() => {
    if (colorHistory.length > 0) {
      saveColorHistory(colorHistory)
    }
  }, [colorHistory])

  const handleFileSelect = (file: File | File[]) => {
    // Handle single file (FileUploader returns File when multiple=false)
    const selectedFile = Array.isArray(file) ? file[0] : file
    
    if (!selectedFile) return

    try {
      // Validate file input with Zod schema
      validateFileUpload(selectedFile)
      
      // Check FileReader support
      ensureFileReaderSupport()

      // Read file and create data URL for canvas
      // Note: File stays in browser memory, never uploaded to server
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setImageSrc(result)
          announce(ANNOUNCEMENT_MESSAGES.FILE_UPLOADED)
        } else {
          const error = new ImageProcessingError('Invalid image data')
          handleErrorWithToast(error, toast, 'ColorPicker.handleFileSelect')
        }
      }
      
      reader.onerror = () => {
        const error = new ImageProcessingError('Failed to read image file. Please try again.')
        handleErrorWithToast(error, toast, 'ColorPicker.FileReader')
      }
      
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      handleErrorWithToast(error, toast, 'ColorPicker.handleFileSelect')
    }
  }

  const handleColorPick = React.useCallback((color: Color) => {
    // Debounce rapid color picks to prevent excessive re-renders
    // This improves performance when user rapidly clicks on canvas
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setCurrentColor(color)
      announce(ANNOUNCEMENT_MESSAGES.COLOR_PICKED(color.hex))
      
      // Add to history (max 10 colors)
      setColorHistory((prev) => {
        // Check if color already exists in history (by hex value)
        const exists = prev.some((c) => c.hex === color.hex)
        if (exists) {
          return prev
        }
        
        // Add new color to the beginning and limit to 10
        return [color, ...prev].slice(0, 10)
      })
    }, 50) // 50ms debounce - still feels instant but prevents excessive updates
  }, [announce])
  
  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleImageReset = React.useCallback(() => {
    setImageSrc(null)
    setCurrentColor(null)
    announce(ANNOUNCEMENT_MESSAGES.RESET)
  }, [announce])

  /**
   * Handle color selection from history
   */
  const handleColorSelect = React.useCallback((color: Color) => {
    setCurrentColor(color)
  }, [])

  /**
   * Handle export palette - download as JSON
   */
  const handleExportPalette = React.useCallback(() => {
    if (colorHistory.length === 0) {
      return
    }

    try {
      // Create palette data
      const palette = {
        name: 'Color Picker Palette',
        colors: colorHistory.map((color) => ({
          hex: color.hex,
          rgb: color.rgb,
          hsl: color.hsl,
        })),
        exportedAt: new Date().toISOString(),
      }

      // Convert to JSON
      const json = JSON.stringify(palette, null, 2)
      
      // Create blob and download
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `color-palette-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show success toast
      toast({
        title: 'Palette Exported',
        description: `${colorHistory.length} colors exported successfully`,
      })
      
      announce(ANNOUNCEMENT_MESSAGES.DOWNLOAD_STARTED)
    } catch (error) {
      handleErrorWithToast(error, toast, 'ColorPicker.handleExportPalette')
    }
  }, [colorHistory, announce])

  /**
   * Handle clear history
   */
  const handleClearHistory = React.useCallback(() => {
    setColorHistory([])
    clearStoredHistory()
    toast({
      title: 'History Cleared',
      description: 'All colors have been removed from history',
    })
    announce('Color history cleared')
  }, [announce])
  
  // Define keyboard shortcuts for this tool
  const keyboardShortcuts: KeyboardShortcut[] = React.useMemo(() => [
    {
      ...COMMON_SHORTCUTS.ESCAPE,
      handler: handleImageReset,
    },
    {
      ...COMMON_SHORTCUTS.SAVE,
      handler: handleExportPalette,
    },
    {
      key: 'c',
      ctrlKey: true,
      description: 'Copy current color to clipboard',
      handler: () => {
        if (currentColor) {
          navigator.clipboard.writeText(currentColor.hex)
          announce(ANNOUNCEMENT_MESSAGES.COPIED)
        }
      },
    },
  ], [handleImageReset, handleExportPalette, currentColor, announce])
  
  // Register keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: true,
  })

  return (
    <ToolWrapper
      title="Color Picker"
      description="Extract colors from images by clicking anywhere on the canvas"
      icon={<Palette className="h-6 w-6" />}
      isClientSide={true}
      keyboardShortcuts={keyboardShortcuts}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Upload an image (PNG, JPG, or WEBP format, max 10MB)</li>
              <li>Click anywhere on the image to extract the color at that point</li>
              <li>View the color in HEX, RGB, and HSL formats</li>
              <li>Copy any format to your clipboard with one click</li>
              <li>Build a palette by picking multiple colors (up to 10)</li>
              <li>Export your palette as a JSON file for use in your projects</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Zoom controls for precise color selection</li>
              <li>Color history with quick re-selection</li>
              <li>Export palette as JSON</li>
              <li>100% client-side - your images never leave your browser</li>
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
            description="Select a PNG, JPG, or WEBP image to start picking colors"
            multiple={false}
          />
        )}

        {/* Canvas Section */}
        {imageSrc && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Canvas - full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 order-1 lg:order-1">
              <ColorCanvas
                imageSrc={imageSrc}
                onColorPick={handleColorPick}
                onImageReset={handleImageReset}
              />
            </div>

            {/* Color Display and History - stacked vertically on mobile, sidebar on desktop */}
            <div className="space-y-4 order-2 lg:order-2">
              <ColorDisplay color={currentColor} />
              <ColorHistory
                colors={colorHistory}
                onColorSelect={handleColorSelect}
                onExport={handleExportPalette}
                onClear={handleClearHistory}
              />
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  )
}
