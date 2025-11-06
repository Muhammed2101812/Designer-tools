'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { Palette, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'

// Dynamic imports for code splitting
const GradientCanvas = dynamic(() => import('./components/GradientCanvas'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading gradient generator...</p>
      </div>
    </div>
  ),
  ssr: false,
})

const ColorStopEditor = dynamic(() => import('./components/ColorStopEditor'), {
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

const CSSCodeDisplay = dynamic(() => import('./components/CSSCodeDisplay'), {
  loading: () => (
    <div className="p-4 border rounded-lg bg-card animate-pulse">
      <div className="h-6 bg-muted rounded w-24 mb-3" />
      <div className="h-20 bg-muted rounded mb-3" />
      <div className="h-9 bg-muted rounded" />
    </div>
  ),
})

export interface ColorStop {
  id: string
  color: string
  position: number
}

export interface GradientConfig {
  type: 'linear' | 'radial'
  angle: number
  colorStops: ColorStop[]
}

export default function GradientGeneratorPage() {
  const [gradientConfig, setGradientConfig] = React.useState<GradientConfig>({
    type: 'linear',
    angle: 90,
    colorStops: [
      { id: '1', color: '#ff0000', position: 0 },
      { id: '2', color: '#0000ff', position: 100 },
    ],
  })

  const [cssCode, setCssCode] = React.useState<string>('')
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Generate CSS code whenever gradient config changes
  React.useEffect(() => {
    const stops = gradientConfig.colorStops
      .sort((a, b) => a.position - b.position)
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(', ')

    let css = ''
    if (gradientConfig.type === 'linear') {
      css = `background: linear-gradient(${gradientConfig.angle}deg, ${stops});`
    } else {
      css = `background: radial-gradient(circle, ${stops});`
    }

    setCssCode(css)
  }, [gradientConfig])

  const handleConfigChange = React.useCallback((updates: Partial<GradientConfig>) => {
    setGradientConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleColorStopsChange = React.useCallback((colorStops: ColorStop[]) => {
    setGradientConfig((prev) => ({ ...prev, colorStops }))
  }, [])

  const handleDownloadPNG = React.useCallback(() => {
    if (!canvasRef.current) return

    try {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `gradient-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Gradient Downloaded',
        description: 'PNG file saved successfully',
      })
    } catch (error) {
      handleErrorWithToast(error, toast, 'GradientGenerator.handleDownloadPNG')
    }
  }, [])

  return (
    <ToolWrapper
      title="Gradient Generator"
      description="Create beautiful CSS gradients with real-time preview"
      icon={<Palette className="h-6 w-6" />}
      isClientSide={true}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Choose gradient type (linear or radial)</li>
              <li>Add, remove, or edit color stops (2-10 colors)</li>
              <li>Adjust color positions by dragging or entering values</li>
              <li>Set gradient angle for linear gradients</li>
              <li>Copy CSS code or export as PNG image</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Gradient Types:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Linear:</strong> Colors transition in a straight line at a specified angle</li>
              <li><strong>Radial:</strong> Colors radiate from the center outward in a circular pattern</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Real-time gradient preview</li>
              <li>Support for 2-10 color stops</li>
              <li>Copy CSS code with one click</li>
              <li>Export as high-quality PNG (800x600)</li>
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
            <GradientCanvas
              config={gradientConfig}
              canvasRef={canvasRef}
            />
          </div>

          {/* Controls and CSS Display - stacked vertically on mobile, sidebar on desktop */}
          <div className="space-y-4 order-2 lg:order-2">
            <ColorStopEditor
              config={gradientConfig}
              onConfigChange={handleConfigChange}
              onColorStopsChange={handleColorStopsChange}
            />
            <CSSCodeDisplay
              cssCode={cssCode}
              onDownloadPNG={handleDownloadPNG}
            />
          </div>
        </div>
      </div>
    </ToolWrapper>
  )
}
