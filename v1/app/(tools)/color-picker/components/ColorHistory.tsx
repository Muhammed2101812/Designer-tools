'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Trash2 } from 'lucide-react'
import type { Color } from '@/types'

export interface ColorHistoryProps {
  /**
   * Array of picked colors (max 10)
   */
  colors: Color[]
  
  /**
   * Callback when a color is selected from history
   */
  onColorSelect: (color: Color) => void
  
  /**
   * Callback when export palette is clicked
   */
  onExport: () => void
  
  /**
   * Callback when clear history is clicked
   */
  onClear: () => void
}

export const ColorHistory = React.memo(function ColorHistory({
  colors,
  onColorSelect,
  onExport,
  onClear,
}: ColorHistoryProps) {
  const [showClearDialog, setShowClearDialog] = React.useState(false)

  /**
   * Handle export palette button click
   */
  const handleExport = () => {
    onExport()
  }

  /**
   * Handle clear history button click - show confirmation dialog
   */
  const handleClearClick = () => {
    setShowClearDialog(true)
  }

  /**
   * Handle confirmed clear action
   */
  const handleConfirmClear = () => {
    onClear()
    setShowClearDialog(false)
  }

  /**
   * Handle cancel clear action
   */
  const handleCancelClear = () => {
    setShowClearDialog(false)
  }

  // Empty state when no colors in history
  if (colors.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" id="color-history-heading">Color History</h3>
          <span className="text-xs text-muted-foreground" aria-label="0 of 10 colors saved">0/10</span>
        </div>
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          Pick colors to build your palette
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" id="color-history-heading">Color History</h3>
          <span 
            className="text-xs text-muted-foreground"
            aria-label={`${colors.length} of 10 colors saved`}
          >
            {colors.length}/10
          </span>
        </div>

        {/* Color Grid */}
        <div 
          className="grid grid-cols-5 gap-2 mb-4"
          role="list"
          aria-labelledby="color-history-heading"
          aria-label={`Color palette with ${colors.length} saved colors`}
        >
          {colors.map((color, index) => (
            <button
              key={`${color.hex}-${color.timestamp}`}
              role="listitem"
              onClick={() => onColorSelect(color)}
              className="aspect-square rounded-md border-2 border-border hover:border-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] min-w-[44px]"
              style={{ backgroundColor: color.hex }}
              aria-label={`Select color ${color.hex}, RGB ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}. Color ${index + 1} of ${colors.length}`}
              title={`${color.hex} - Click to select`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2" role="group" aria-label="Palette actions">
          <Button
            variant="outline"
            size="default"
            onClick={handleExport}
            disabled={colors.length === 0}
            aria-label={`Export palette with ${colors.length} colors as JSON file`}
            className="flex-1 h-11 sm:h-9"
          >
            <Download className="h-5 w-5 sm:h-4 sm:w-4 mr-2" aria-hidden="true" />
            <span className="text-sm">Export Palette</span>
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={handleClearClick}
            aria-label={`Clear all ${colors.length} colors from history`}
            className="flex-1 h-11 sm:h-9"
          >
            <Trash2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2" aria-hidden="true" />
            <span className="text-sm">Clear History</span>
          </Button>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Color History?</DialogTitle>
            <DialogDescription>
              This will remove all {colors.length} color{colors.length !== 1 ? 's' : ''} from your history.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelClear}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClear}>
              Clear History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})
