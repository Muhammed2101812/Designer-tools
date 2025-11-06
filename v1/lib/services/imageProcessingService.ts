/**
 * Performance-optimized image processing service
 * Uses Web Workers and code splitting for heavy operations
 */

import { WorkerPool } from '@/lib/utils/codeSplitting'
import { getLongTaskMonitor } from '@/lib/utils/longTaskMonitor'
import { getCanvasPool } from '@/lib/utils/canvasPool'

interface ProcessingOptions {
  useWorker?: boolean
  quality?: number
  maxDimension?: number
  chunkSize?: number
}

interface CompressionResult {
  blob: Blob
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

interface ResizeResult {
  blob: Blob
  originalSize: number
  resizedSize: number
  dimensions: { width: number; height: number }
}

interface ColorAnalysisResult {
  dominantColors: Array<{
    rgb: { r: number; g: number; b: number }
    hex: string
    count: number
    percentage: number
  }>
  totalColors: number
  sampledPixels: number
}

class ImageProcessingService {
  private workerPool: WorkerPool | null = null
  private monitor = getLongTaskMonitor()
  private canvasPool = getCanvasPool()

  constructor() {
    // Initialize worker pool only in browser environment
    if (typeof window !== 'undefined') {
      try {
        this.workerPool = new WorkerPool('/workers/image-processing-worker.js', 2)
      } catch (error) {
        console.warn('Failed to initialize worker pool:', error)
      }
    }
  }

  /**
   * Compress image with performance monitoring
   */
  async compressImage(
    file: File, 
    options: ProcessingOptions = {}
  ): Promise<CompressionResult> {
    const { useWorker = true, quality = 0.8, maxDimension = 2048 } = options

    return this.monitor.measure('ImageProcessingService.compressImage', async () => {
      if (useWorker && this.workerPool) {
        try {
          const result = await this.workerPool.execute({
            type: 'compress',
            file,
            options: {
              quality,
              maxWidthOrHeight: maxDimension,
              useWebWorker: false // Already in worker
            }
          })

          if (result.success) {
            return {
              blob: result.data,
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              compressionRatio: result.compressionRatio
            }
          } else {
            throw new Error(result.error)
          }
        } catch (error) {
          console.warn('Worker compression failed, falling back to main thread:', error)
          return this.compressImageMainThread(file, { quality, maxDimension })
        }
      } else {
        return this.compressImageMainThread(file, { quality, maxDimension })
      }
    })
  }

  /**
   * Resize image with performance optimization
   */
  async resizeImage(
    file: File,
    width: number,
    height: number,
    options: ProcessingOptions = {}
  ): Promise<ResizeResult> {
    const { useWorker = true, quality = 0.92 } = options

    return this.monitor.measure('ImageProcessingService.resizeImage', async () => {
      if (useWorker && this.workerPool) {
        try {
          const result = await this.workerPool.execute({
            type: 'resize',
            file,
            width,
            height,
            quality
          })

          if (result.success) {
            return {
              blob: result.data,
              originalSize: result.originalSize,
              resizedSize: result.resizedSize,
              dimensions: { width, height }
            }
          } else {
            throw new Error(result.error)
          }
        } catch (error) {
          console.warn('Worker resize failed, falling back to main thread:', error)
          return this.resizeImageMainThread(file, width, height, quality)
        }
      } else {
        return this.resizeImageMainThread(file, width, height, quality)
      }
    })
  }

  /**
   * Analyze image colors with performance optimization
   */
  async analyzeColors(
    file: File,
    options: ProcessingOptions = {}
  ): Promise<ColorAnalysisResult> {
    const { useWorker = true } = options

    return this.monitor.measure('ImageProcessingService.analyzeColors', async () => {
      // Load image and get image data
      const imageData = await this.getImageData(file)

      if (useWorker && this.workerPool) {
        try {
          const result = await this.workerPool.execute({
            type: 'analyze',
            imageData
          })

          if (result.success) {
            return result.data
          } else {
            throw new Error(result.error)
          }
        } catch (error) {
          console.warn('Worker analysis failed, falling back to main thread:', error)
          return this.analyzeColorsMainThread(imageData)
        }
      } else {
        return this.analyzeColorsMainThread(imageData)
      }
    })
  }

  /**
   * Process multiple images in batch
   */
  async processBatch(
    operations: Array<{
      id: string
      type: 'compress' | 'resize' | 'analyze'
      file: File
      options?: any
    }>,
    options: ProcessingOptions = {}
  ): Promise<Array<{ id: string; result: any; error?: string }>> {
    const { useWorker = true, chunkSize = 5 } = options

    return this.monitor.measure('ImageProcessingService.processBatch', async () => {
      if (useWorker && this.workerPool) {
        try {
          // Process in chunks to avoid overwhelming the worker
          const results = []
          
          for (let i = 0; i < operations.length; i += chunkSize) {
            const chunk = operations.slice(i, i + chunkSize)
            
            const chunkResult = await this.workerPool.execute({
              type: 'batch',
              operations: chunk
            })

            if (chunkResult.success) {
              results.push(...chunkResult.data)
            } else {
              // Handle chunk failure
              chunk.forEach(op => {
                results.push({
                  id: op.id,
                  result: null,
                  error: chunkResult.error
                })
              })
            }

            // Small delay between chunks to prevent blocking
            if (i + chunkSize < operations.length) {
              await new Promise(resolve => setTimeout(resolve, 10))
            }
          }

          return results
        } catch (error) {
          console.warn('Worker batch processing failed:', error)
          // Fallback to sequential processing on main thread
          return this.processBatchMainThread(operations)
        }
      } else {
        return this.processBatchMainThread(operations)
      }
    })
  }

  /**
   * Main thread compression fallback
   */
  private async compressImageMainThread(
    file: File,
    options: { quality: number; maxDimension: number }
  ): Promise<CompressionResult> {
    // Dynamic import to avoid loading heavy library upfront
    const { default: imageCompression } = await import('browser-image-compression')

    const compressed = await imageCompression(file, {
      quality: options.quality,
      maxWidthOrHeight: options.maxDimension,
      useWebWorker: false
    })

    return {
      blob: compressed,
      originalSize: file.size,
      compressedSize: compressed.size,
      compressionRatio: (1 - compressed.size / file.size) * 100
    }
  }

  /**
   * Main thread resize fallback
   */
  private async resizeImageMainThread(
    file: File,
    width: number,
    height: number,
    quality: number
  ): Promise<ResizeResult> {
    const image = await this.loadImage(file)
    const canvas = this.canvasPool.getCanvas(width, height)
    const ctx = canvas.getContext('2d')!

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        'image/jpeg',
        quality
      )
    })

    this.canvasPool.releaseCanvas(canvas)

    return {
      blob,
      originalSize: file.size,
      resizedSize: blob.size,
      dimensions: { width, height }
    }
  }

  /**
   * Main thread color analysis fallback
   */
  private analyzeColorsMainThread(imageData: ImageData): ColorAnalysisResult {
    const data = imageData.data
    const colorMap = new Map<string, number>()
    const totalPixels = data.length / 4

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // Skip transparent pixels
      if (a < 128) continue

      // Quantize colors to reduce noise
      const qr = Math.round(r / 16) * 16
      const qg = Math.round(g / 16) * 16
      const qb = Math.round(b / 16) * 16

      const colorKey = `${qr},${qg},${qb}`
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
    }

    // Get dominant colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color, count]) => {
        const [r, g, b] = color.split(',').map(Number)
        return {
          rgb: { r, g, b },
          hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
          count,
          percentage: (count / (totalPixels / 4)) * 100
        }
      })

    return {
      dominantColors: sortedColors,
      totalColors: colorMap.size,
      sampledPixels: totalPixels / 4
    }
  }

  /**
   * Main thread batch processing fallback
   */
  private async processBatchMainThread(
    operations: Array<{
      id: string
      type: 'compress' | 'resize' | 'analyze'
      file: File
      options?: any
    }>
  ): Promise<Array<{ id: string; result: any; error?: string }>> {
    const results = []

    for (const operation of operations) {
      try {
        let result

        switch (operation.type) {
          case 'compress':
            result = await this.compressImageMainThread(operation.file, operation.options || {})
            break
          case 'resize':
            result = await this.resizeImageMainThread(
              operation.file,
              operation.options?.width || 800,
              operation.options?.height || 600,
              operation.options?.quality || 0.92
            )
            break
          case 'analyze':
            const imageData = await this.getImageData(operation.file)
            result = this.analyzeColorsMainThread(imageData)
            break
          default:
            throw new Error('Unknown operation type')
        }

        results.push({
          id: operation.id,
          result
        })
      } catch (error) {
        results.push({
          id: operation.id,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Yield control between operations
      await new Promise(resolve => setTimeout(resolve, 5))
    }

    return results
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Get image data from file
   */
  private async getImageData(file: File): Promise<ImageData> {
    const image = await this.loadImage(file)
    const canvas = this.canvasPool.getCanvas(image.naturalWidth, image.naturalHeight)
    const ctx = canvas.getContext('2d')!

    ctx.drawImage(image, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    this.canvasPool.releaseCanvas(canvas)
    return imageData
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.workerPool) {
      this.workerPool.terminate()
      this.workerPool = null
    }
  }
}

// Global service instance
let imageProcessingService: ImageProcessingService | null = null

/**
 * Get the global image processing service instance
 */
export function getImageProcessingService(): ImageProcessingService {
  if (!imageProcessingService) {
    imageProcessingService = new ImageProcessingService()

    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        imageProcessingService?.dispose()
      })
    }
  }

  return imageProcessingService
}

export type { ProcessingOptions, CompressionResult, ResizeResult, ColorAnalysisResult }