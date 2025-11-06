'use client'

import * as React from 'react'
import QRCode from 'qrcode'
import { AlertCircle, QrCode } from 'lucide-react'
import type { QRConfig } from '../page'

export interface QRCanvasProps {
  config: QRConfig
  onQRGenerated: (dataUrl: string) => void
}

export default function QRCanvas({ config, onQRGenerated }: QRCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !config.content) {
        setError(null)
        return
      }

      try {
        setError(null)

        // Generate QR code on canvas
        await QRCode.toCanvas(canvasRef.current, config.content, {
          width: config.size,
          margin: 2,
          color: {
            dark: config.foregroundColor,
            light: config.backgroundColor,
          },
          errorCorrectionLevel: config.errorCorrectionLevel,
        })

        // Get data URL for download
        const dataUrl = canvasRef.current.toDataURL('image/png')
        onQRGenerated(dataUrl)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code'
        setError(errorMessage)
        console.error('QR generation error:', err)
      }
    }

    generateQR()
  }, [config, onQRGenerated])

  return (
    <div className="border rounded-lg bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">QR Code</h2>
      
      <div className="flex items-center justify-center min-h-[300px] bg-muted/20 rounded-lg p-4">
        {!config.content ? (
          <div className="text-center text-muted-foreground">
            <QrCode className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Enter text or URL to generate QR code</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Failed to generate QR code</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
            style={{
              imageRendering: 'pixelated',
            }}
            aria-label="Generated QR code"
          />
        )}
      </div>

      {config.content && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Content:</p>
          <p className="text-sm font-mono break-all">{config.content}</p>
        </div>
      )}
    </div>
  )
}
