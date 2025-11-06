'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileImage } from 'lucide-react'

export interface QRPreviewProps {
  dataUrl: string | null
  onDownloadPNG: () => void
  onDownloadSVG: () => void
  hasContent: boolean
}

export default function QRPreview({
  dataUrl,
  onDownloadPNG,
  onDownloadSVG,
  hasContent,
}: QRPreviewProps) {
  return (
    <div className="border rounded-lg bg-card p-4">
      <h2 className="text-lg font-semibold mb-4">Download</h2>
      
      {!hasContent ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileImage className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Generate a QR code to download</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={onDownloadPNG}
            disabled={!dataUrl}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          
          <Button
            onClick={onDownloadSVG}
            disabled={!hasContent}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Download SVG
          </Button>

          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>PNG:</strong> Raster format, best for web and print
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>SVG:</strong> Vector format, scales infinitely without quality loss
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
