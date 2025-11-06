'use client'

import * as React from 'react'
import type { GradientConfig } from '../page'
import { 
  useRenderPerformance, 
  useStableCallback, 
  useStableMemo 
} from '@/lib/utils/reactOptimizations'

interface GradientCanvasProps {
  config: GradientConfig
  canvasRef: React.RefObject<HTMLCanvasElement>
}

const GradientCanvas = React.memo(function GradientCanvas({ config, canvasRef }: GradientCanvasProps) {
  // Performance monitoring
  useRenderPerformance('GradientCanvas', 16)
  
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Memoized canvas dimensions to prevent re-creation
  const canvasDimensions = useStableMemo(() => ({
    width: 800,
    height: 600
  }), [], 'GradientCanvas.dimensions')

  // Memoized sorted color stops to prevent re-sorting on every render
  const sortedColorStops = useStableMemo(() => {
    return [...config.colorStops].sort((a, b) => a.position - b.position)
  }, [config.colorStops], 'GradientCanvas.sortedStops')

  // Render gradient on canvas whenever config changes
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvasDimensions.width
    canvas.height = canvasDimensions.height

    // Create gradient
    let gradient: CanvasGradient

    if (config.type === 'linear') {
      // Calculate gradient direction based on angle
      const angleRad = (config.angle * Math.PI) / 180
      const x1 = canvasDimensions.width / 2 - (Math.cos(angleRad) * canvasDimensions.width) / 2
      const y1 = canvasDimensions.height / 2 - (Math.sin(angleRad) * canvasDimensions.height) / 2
      const x2 = canvasDimensions.width / 2 + (Math.cos(angleRad) * canvasDimensions.width) / 2
      const y2 = canvasDimensions.height / 2 + (Math.sin(angleRad) * canvasDimensions.height) / 2

      gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    } else {
      // Radial gradient from center
      const centerX = canvasDimensions.width / 2
      const centerY = canvasDimensions.height / 2
      const radius = Math.min(canvasDimensions.width, canvasDimensions.height) / 2

      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    }

    // Add color stops
    sortedColorStops.forEach((stop) => {
      gradient.addColorStop(stop.position / 100, stop.color)
    })

    // Fill canvas with gradient
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height)
  }, [config, canvasRef, canvasDimensions, sortedColorStops])

  return (
    <div ref={containerRef} className="border rounded-lg bg-card p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Preview</h3>
        <p className="text-sm text-muted-foreground">
          {config.type === 'linear' 
            ? `Linear gradient at ${config.angle}°` 
            : 'Radial gradient from center'}
        </p>
      </div>
      <div className="relative w-full aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'auto' }}
        />
      </div>
    </div>
  )
})

export default GradientCanvas
