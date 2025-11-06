/**
 * Canvas helper utilities for efficient canvas operations
 * Includes canvas pooling, dimension calculations, and drawing utilities
 */

export interface CanvasPool {
  canvas: HTMLCanvasElement | null
  getCanvas: () => HTMLCanvasElement
  releaseCanvas: () => void
  clearCanvas: () => void
}

/**
 * Creates a reusable canvas pool to avoid creating multiple canvas instances
 * @returns Canvas pool object
 */
export function createCanvasPool(): CanvasPool {
  let canvas: HTMLCanvasElement | null = null

  return {
    canvas,

    getCanvas(): HTMLCanvasElement {
      if (!canvas) {
        canvas = document.createElement('canvas')
      }
      return canvas
    },

    releaseCanvas(): void {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    },

    clearCanvas(): void {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        canvas.width = 0
        canvas.height = 0
      }
    },
  }
}

/**
 * Creates an offscreen canvas for better performance
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns OffscreenCanvas or regular canvas as fallback
 */
export function createOffscreenCanvas(
  width: number,
  height: number
): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  // Fallback to regular canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Calculates aspect ratio from dimensions
 * @param width - Width
 * @param height - Height
 * @returns Aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

/**
 * Calculates dimensions to fit within a container while maintaining aspect ratio
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param containerWidth - Container width
 * @param containerHeight - Container height
 * @returns Fitted dimensions
 */
export function fitToContainer(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number; x: number; y: number } {
  const imageAspect = imageWidth / imageHeight
  const containerAspect = containerWidth / containerHeight

  let width: number
  let height: number

  if (imageAspect > containerAspect) {
    // Image is wider than container
    width = containerWidth
    height = containerWidth / imageAspect
  } else {
    // Image is taller than container
    height = containerHeight
    width = containerHeight * imageAspect
  }

  // Center the image
  const x = (containerWidth - width) / 2
  const y = (containerHeight - height) / 2

  return { width, height, x, y }
}

/**
 * Calculates dimensions to cover a container while maintaining aspect ratio
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param containerWidth - Container width
 * @param containerHeight - Container height
 * @returns Cover dimensions
 */
export function coverContainer(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number; x: number; y: number } {
  const imageAspect = imageWidth / imageHeight
  const containerAspect = containerWidth / containerHeight

  let width: number
  let height: number

  if (imageAspect > containerAspect) {
    // Image is wider than container
    height = containerHeight
    width = containerHeight * imageAspect
  } else {
    // Image is taller than container
    width = containerWidth
    height = containerWidth / imageAspect
  }

  // Center the image
  const x = (containerWidth - width) / 2
  const y = (containerHeight - height) / 2

  return { width, height, x, y }
}

/**
 * Draws an image centered on canvas
 * @param ctx - Canvas context
 * @param image - Image to draw
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 */
export function drawImageCentered(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number
): void {
  const imageWidth = 'naturalWidth' in image ? image.naturalWidth : image.width
  const imageHeight = 'naturalHeight' in image ? image.naturalHeight : image.height

  const fitted = fitToContainer(imageWidth, imageHeight, canvasWidth, canvasHeight)

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.drawImage(image, fitted.x, fitted.y, fitted.width, fitted.height)
}

/**
 * Draws a checkerboard pattern (useful for transparent images)
 * @param ctx - Canvas context
 * @param width - Canvas width
 * @param height - Canvas height
 * @param squareSize - Size of each square (default 10)
 */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  squareSize = 10
): void {
  const lightColor = '#ffffff'
  const darkColor = '#e5e7eb'

  for (let y = 0; y < height; y += squareSize) {
    for (let x = 0; x < width; x += squareSize) {
      const isEven = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0
      ctx.fillStyle = isEven ? lightColor : darkColor
      ctx.fillRect(x, y, squareSize, squareSize)
    }
  }
}

/**
 * Clears canvas and resets transformations
 * @param canvas - Canvas element
 */
export function resetCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

/**
 * Gets canvas as data URL
 * @param canvas - Canvas element
 * @param format - Image format (default 'png')
 * @param quality - Quality for lossy formats (0-1)
 * @returns Data URL string
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.92
): string {
  const mimeType = `image/${format}`
  return canvas.toDataURL(mimeType, quality)
}

/**
 * Copies one canvas to another
 * @param source - Source canvas
 * @param target - Target canvas (will be resized to match source)
 */
export function copyCanvas(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement
): void {
  target.width = source.width
  target.height = source.height

  const ctx = target.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(source, 0, 0)
}

/**
 * Creates a canvas from an image element
 * @param image - Image element
 * @returns Canvas with image drawn
 */
export function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(image, 0, 0)
  return canvas
}

/**
 * Applies a filter to canvas
 * @param canvas - Canvas to apply filter to
 * @param filter - CSS filter string (e.g., 'blur(5px)', 'grayscale(100%)')
 * @returns New canvas with filter applied
 */
export function applyCanvasFilter(
  canvas: HTMLCanvasElement,
  filter: string
): HTMLCanvasElement {
  const filtered = document.createElement('canvas')
  filtered.width = canvas.width
  filtered.height = canvas.height

  const ctx = filtered.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.filter = filter
  ctx.drawImage(canvas, 0, 0)

  return filtered
}

/**
 * Gets pixel data from canvas at specific coordinates
 * @param canvas - Canvas element
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns RGBA values or null if out of bounds
 */
export function getPixelData(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): { r: number; g: number; b: number; a: number } | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return null
  }

  const imageData = ctx.getImageData(x, y, 1, 1)
  const [r, g, b, a] = imageData.data

  return { r, g, b, a }
}

/**
 * Scales canvas coordinates to image coordinates
 * @param canvasX - X coordinate on canvas
 * @param canvasY - Y coordinate on canvas
 * @param canvasWidth - Canvas display width
 * @param canvasHeight - Canvas display height
 * @param imageWidth - Actual image width
 * @param imageHeight - Actual image height
 * @returns Scaled coordinates
 */
export function scaleCoordinates(
  canvasX: number,
  canvasY: number,
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  const scaleX = imageWidth / canvasWidth
  const scaleY = imageHeight / canvasHeight

  return {
    x: Math.floor(canvasX * scaleX),
    y: Math.floor(canvasY * scaleY),
  }
}

/**
 * Checks if browser supports OffscreenCanvas
 * @returns True if OffscreenCanvas is supported
 */
export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined'
}

/**
 * Gets optimal context settings for image processing
 * @returns Context attributes
 */
export function getOptimalContextSettings(): CanvasRenderingContext2DSettings {
  return {
    alpha: true,
    desynchronized: false,
    colorSpace: 'srgb',
    willReadFrequently: false,
  }
}
