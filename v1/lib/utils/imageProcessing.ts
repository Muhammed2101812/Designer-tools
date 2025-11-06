/**
 * Image processing utilities for client-side image manipulation
 * Handles resizing, format conversion, and canvas operations
 */

import { getCanvasPool } from './canvasPool'

export interface ResizeOptions {
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  quality?: number
  usePool?: boolean // Whether to use canvas pooling
}

export interface ConversionOptions {
  format: 'png' | 'jpeg' | 'webp'
  quality?: number // 0-1 for lossy formats
}

export interface ImageDimensions {
  width: number
  height: number
}

/**
 * Loads an image from a File or Blob
 * @param file - File or Blob to load
 * @returns Promise resolving to HTMLImageElement
 */
export async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
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
 * Calculates target dimensions while maintaining aspect ratio
 * @param original - Original dimensions
 * @param target - Target dimensions (width and/or height)
 * @returns Calculated dimensions
 */
export function calculateDimensions(
  original: ImageDimensions,
  target: Partial<ImageDimensions>
): ImageDimensions {
  const { width: origWidth, height: origHeight } = original
  const { width: targetWidth, height: targetHeight } = target

  // If both dimensions provided, return as-is
  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight }
  }

  const aspectRatio = origWidth / origHeight

  // Calculate based on provided dimension
  if (targetWidth) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    }
  }

  if (targetHeight) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    }
  }

  // No target dimensions provided, return original
  return { width: origWidth, height: origHeight }
}

/**
 * Resizes an image using canvas with chunked processing to prevent long tasks
 * @param image - HTMLImageElement to resize
 * @param options - Resize options
 * @returns Canvas with resized image
 */
export function resizeImage(
  image: HTMLImageElement,
  options: ResizeOptions
): HTMLCanvasElement {
  const { width, height, maintainAspectRatio = true, usePool = false } = options

  const originalDims = {
    width: image.naturalWidth,
    height: image.naturalHeight,
  }

  // Optimize canvas size for large images
  const optimizedOriginal = getOptimalCanvasSize(originalDims.width, originalDims.height)

  let targetDims: ImageDimensions

  if (maintainAspectRatio) {
    targetDims = calculateDimensions(optimizedOriginal, { width, height })
  } else {
    targetDims = {
      width: width || optimizedOriginal.width,
      height: height || optimizedOriginal.height,
    }
  }

  // Optimize target dimensions as well
  const optimizedTarget = getOptimalCanvasSize(targetDims.width, targetDims.height)

  // Get canvas from pool or create new one
  const canvas = usePool
    ? getCanvasPool().getCanvas(optimizedTarget.width, optimizedTarget.height)
    : document.createElement('canvas')

  if (!usePool) {
    canvas.width = optimizedTarget.width
    canvas.height = optimizedTarget.height
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Use chunked processing for large images to prevent long tasks
  const totalPixels = optimizedTarget.width * optimizedTarget.height
  
  if (totalPixels > 1000000) { // More than 1MP - use chunked processing
    return resizeImageChunked(image, canvas, ctx, optimizedTarget)
  } else {
    // Small image - process directly
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, optimizedTarget.width, optimizedTarget.height)
    return canvas
  }
}

/**
 * Resize image using chunked processing to prevent UI blocking
 */
function resizeImageChunked(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  targetSize: ImageDimensions
): HTMLCanvasElement {
  const CHUNK_HEIGHT = 50 // Smaller chunks - process 50 rows at a time
  let currentY = 0
  
  const processChunk = () => {
    const startTime = performance.now()
    
    // Smaller time budget - max 5ms per chunk to avoid long tasks
    while (currentY < targetSize.height && (performance.now() - startTime) < 5) {
      const chunkHeight = Math.min(CHUNK_HEIGHT, targetSize.height - currentY)
      
      // Calculate source coordinates
      const sourceY = (currentY / targetSize.height) * image.height
      const sourceHeight = (chunkHeight / targetSize.height) * image.height
      
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      ctx.drawImage(
        image,
        0, sourceY, image.width, sourceHeight,
        0, currentY, targetSize.width, chunkHeight
      )
      
      currentY += chunkHeight
    }
    
    if (currentY < targetSize.height) {
      // Schedule next chunk with shorter timeout
      if ('requestIdleCallback' in window) {
        requestIdleCallback(processChunk, { timeout: 16 }) // ~1 frame
      } else {
        setTimeout(processChunk, 0)
      }
    }
  }
  
  processChunk()
  return canvas
}

/**
 * Converts canvas to Blob with specified format and quality
 * @param canvas - Canvas to convert
 * @param options - Conversion options
 * @returns Promise resolving to Blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  options: ConversionOptions
): Promise<Blob> {
  const { format, quality = 0.92 } = options

  const mimeType = `image/${format}`

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      mimeType,
      format === 'jpeg' || format === 'webp' ? quality : undefined
    )
  })
}

/**
 * Converts an image file to a different format
 * @param file - Source image file
 * @param options - Conversion options
 * @returns Promise resolving to converted Blob
 */
export async function convertImageFormat(
  file: File,
  options: ConversionOptions
): Promise<Blob> {
  const image = await loadImage(file)
  
  // Optimize canvas size for large images
  const optimizedSize = getOptimalCanvasSize(image.naturalWidth, image.naturalHeight)
  
  const pool = getCanvasPool()
  const canvas = pool.getCanvas(optimizedSize.width, optimizedSize.height)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    pool.releaseCanvas(canvas)
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(image, 0, 0, optimizedSize.width, optimizedSize.height)

  const blob = await canvasToBlob(canvas, options)
  
  // Release canvas back to pool
  pool.releaseCanvas(canvas)

  return blob
}

/**
 * Resizes an image file and returns as Blob
 * @param file - Source image file
 * @param options - Resize and conversion options
 * @returns Promise resolving to resized Blob
 */
export async function resizeImageFile(
  file: File,
  options: ResizeOptions & { format?: 'png' | 'jpeg' | 'webp' }
): Promise<Blob> {
  const image = await loadImage(file)
  const canvas = resizeImage(image, options)

  // Determine output format
  const format = options.format || getImageFormat(file.type)
  const quality = options.quality !== undefined ? options.quality : 0.92

  return canvasToBlob(canvas, { format, quality })
}

/**
 * Extracts format from MIME type
 * @param mimeType - MIME type string
 * @returns Image format
 */
export function getImageFormat(mimeType: string): 'png' | 'jpeg' | 'webp' {
  if (mimeType.includes('png')) return 'png'
  if (mimeType.includes('webp')) return 'webp'
  return 'jpeg'
}

/**
 * Gets optimal canvas size for large images to prevent memory issues
 * @param width - Original width
 * @param height - Original height
 * @param maxDimension - Maximum allowed dimension (default 4096)
 * @returns Optimal dimensions
 */
export function getOptimalCanvasSize(
  width: number,
  height: number,
  maxDimension = 4096
): ImageDimensions {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const scale = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
  }
}

/**
 * Crops an image from canvas
 * @param canvas - Source canvas
 * @param cropArea - Crop area coordinates and dimensions
 * @param usePool - Whether to use canvas pooling
 * @returns New canvas with cropped image
 */
export function cropImage(
  canvas: HTMLCanvasElement,
  cropArea: { x: number; y: number; width: number; height: number },
  usePool = false
): HTMLCanvasElement {
  const { x, y, width, height } = cropArea

  // Optimize crop dimensions
  const optimizedSize = getOptimalCanvasSize(width, height)

  const croppedCanvas = usePool
    ? getCanvasPool().getCanvas(optimizedSize.width, optimizedSize.height)
    : document.createElement('canvas')

  if (!usePool) {
    croppedCanvas.width = optimizedSize.width
    croppedCanvas.height = optimizedSize.height
  }

  const ctx = croppedCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(
    canvas,
    x,
    y,
    width,
    height,
    0,
    0,
    optimizedSize.width,
    optimizedSize.height
  )

  return croppedCanvas
}

/**
 * Rotates an image on canvas
 * @param canvas - Source canvas
 * @param degrees - Rotation angle in degrees
 * @returns New canvas with rotated image
 */
export function rotateImage(
  canvas: HTMLCanvasElement,
  degrees: number
): HTMLCanvasElement {
  const radians = (degrees * Math.PI) / 180

  // Calculate new canvas dimensions after rotation
  const sin = Math.abs(Math.sin(radians))
  const cos = Math.abs(Math.cos(radians))
  const newWidth = canvas.width * cos + canvas.height * sin
  const newHeight = canvas.width * sin + canvas.height * cos

  const rotatedCanvas = document.createElement('canvas')
  rotatedCanvas.width = newWidth
  rotatedCanvas.height = newHeight

  const ctx = rotatedCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Move to center, rotate, then draw
  ctx.translate(newWidth / 2, newHeight / 2)
  ctx.rotate(radians)
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)

  return rotatedCanvas
}
