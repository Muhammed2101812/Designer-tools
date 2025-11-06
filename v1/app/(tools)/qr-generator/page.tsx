'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { QrCode, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'

// Dynamic imports for code splitting
const QRCanvas = dynamic(() => import('./components/QRCanvas'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading QR generator...</p>
      </div>
    </div>
  ),
  ssr: false,
})

const QRCustomizer = dynamic(() => import('./components/QRCustomizer'), {
  loading: () => (
    <div className="p-4 border rounded-lg bg-card animate-pulse">
      <div className="h-6 bg-muted rounded w-32 mb-4" />
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  ),
})

const QRPreview = dynamic(() => import('./components/QRPreview'), {
  loading: () => (
    <div className="p-4 border rounded-lg bg-card animate-pulse">
      <div className="h-6 bg-muted rounded w-24 mb-3" />
      <div className="aspect-square bg-muted rounded mb-3" />
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-muted rounded" />
        <div className="flex-1 h-9 bg-muted rounded" />
      </div>
    </div>
  ),
})

export interface QRConfig {
  content: string
  size: number
  foregroundColor: string
  backgroundColor: string
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
}

export default function QRGeneratorPage() {
  const [qrConfig, setQrConfig] = React.useState<QRConfig>({
    content: '',
    size: 256,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    errorCorrectionLevel: 'M',
  })

  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null)

  const handleConfigChange = React.useCallback((updates: Partial<QRConfig>) => {
    setQrConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleQRGenerated = React.useCallback((dataUrl: string) => {
    setQrDataUrl(dataUrl)
  }, [])

  const handleDownloadPNG = React.useCallback(() => {
    if (!qrDataUrl) return

    try {
      const link = document.createElement('a')
      link.href = qrDataUrl
      link.download = `qr-code-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'QR Code Downloaded',
        description: 'PNG file saved successfully',
      })
    } catch (error) {
      handleErrorWithToast(error, toast, 'QRGenerator.handleDownloadPNG')
    }
  }, [qrDataUrl])

  const handleDownloadSVG = React.useCallback(async () => {
    if (!qrConfig.content) return

    try {
      // Dynamic import of qrcode for SVG generation
      const QRCode = (await import('qrcode')).default
      
      const svgString = await QRCode.toString(qrConfig.content, {
        type: 'svg',
        width: qrConfig.size,
        color: {
          dark: qrConfig.foregroundColor,
          light: qrConfig.backgroundColor,
        },
        errorCorrectionLevel: qrConfig.errorCorrectionLevel,
      })

      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qr-code-${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'QR Code Downloaded',
        description: 'SVG file saved successfully',
      })
    } catch (error) {
      handleErrorWithToast(error, toast, 'QRGenerator.handleDownloadSVG')
    }
  }, [qrConfig])

  return (
    <ToolWrapper
      title="QR Code Generator"
      description="Create customizable QR codes for URLs, text, and more"
      icon={<QrCode className="h-6 w-6" />}
      isClientSide={true}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Enter your text or URL (up to 500 characters)</li>
              <li>Customize the size, colors, and error correction level</li>
              <li>Preview your QR code in real-time</li>
              <li>Download as PNG or SVG format</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Error Correction Levels:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>L (Low):</strong> ~7% error recovery - smallest QR code</li>
              <li><strong>M (Medium):</strong> ~15% error recovery - balanced (recommended)</li>
              <li><strong>Q (Quartile):</strong> ~25% error recovery - more robust</li>
              <li><strong>H (High):</strong> ~30% error recovery - most reliable</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Real-time preview as you type</li>
              <li>Customizable colors and size</li>
              <li>Export as PNG or SVG</li>
              <li>100% client-side - no data sent to servers</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Canvas - full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <QRCanvas
              config={qrConfig}
              onQRGenerated={handleQRGenerated}
            />
          </div>

          {/* Customizer and Preview - stacked vertically on mobile, sidebar on desktop */}
          <div className="space-y-4 order-2 lg:order-2">
            <QRCustomizer
              config={qrConfig}
              onConfigChange={handleConfigChange}
            />
            <QRPreview
              dataUrl={qrDataUrl}
              onDownloadPNG={handleDownloadPNG}
              onDownloadSVG={handleDownloadSVG}
              hasContent={!!qrConfig.content}
            />
          </div>
        </div>
      </div>
    </ToolWrapper>
  )
}
