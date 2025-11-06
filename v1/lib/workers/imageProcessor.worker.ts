/**
 * Web Worker for heavy image processing operations
 * Prevents UI blocking during intensive computations
 */

interface WorkerMessage {
  type: 'resize' | 'compress' | 'convert' | 'crop' | 'rotate'
  imageData: ImageData
  options: any
  id: string
}

interface WorkerResponse {
  type: 'complete' | 'error' | 'progress'
  data?: ImageData
  error?: string
  progress?: number
  id: string
}

/**
 * Resize image data
 */
function resizeImageData(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const { width: srcWidth, height: srcHeight, data: srcData } = imageData

  // Create output image data
  const outputData = new ImageData(targetWidth, targetHeight)
  const destData = outputData.data

  // Calculate scale factors
  const scaleX = srcWidth / targetWidth
  const scaleY = srcHeight / targetHeight

  // Bicubic interpolation for better quality
  for (let destY = 0; destY < targetHeight; destY++) {
    for (let destX = 0; destX < targetWidth; destX++) {
      // Map destination pixel to source
      const srcX = destX * scaleX
      const srcY = destY * scaleY

      // Get surrounding pixels for interpolation
      const x0 = Math.floor(srcX)
      const y0 = Math.floor(srcY)
      const x1 = Math.min(x0 + 1, srcWidth - 1)
      const y1 = Math.min(y0 + 1, srcHeight - 1)

      // Calculate interpolation weights
      const xWeight = srcX - x0
      const yWeight = srcY - y0

      // Get pixel indices
      const idx00 = (y0 * srcWidth + x0) * 4
      const idx10 = (y0 * srcWidth + x1) * 4
      const idx01 = (y1 * srcWidth + x0) * 4
      const idx11 = (y1 * srcWidth + x1) * 4

      // Bilinear interpolation for each channel
      const destIdx = (destY * targetWidth + destX) * 4

      for (let c = 0; c < 4; c++) {
        const top = srcData[idx00 + c] * (1 - xWeight) + srcData[idx10 + c] * xWeight
        const bottom = srcData[idx01 + c] * (1 - xWeight) + srcData[idx11 + c] * xWeight
        destData[destIdx + c] = top * (1 - yWeight) + bottom * yWeight
      }
    }

    // Report progress every 10%
    if (destY % Math.floor(targetHeight / 10) === 0) {
      self.postMessage({
        type: 'progress',
        progress: (destY / targetHeight) * 100,
        id: '',
      } as WorkerResponse)
    }
  }

  return outputData
}

/**
 * Crop image data
 */
function cropImageData(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): ImageData {
  const { width: srcWidth, data: srcData } = imageData

  const outputData = new ImageData(width, height)
  const destData = outputData.data

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const srcIdx = ((y + row) * srcWidth + (x + col)) * 4
      const destIdx = (row * width + col) * 4

      destData[destIdx] = srcData[srcIdx]
      destData[destIdx + 1] = srcData[srcIdx + 1]
      destData[destIdx + 2] = srcData[srcIdx + 2]
      destData[destIdx + 3] = srcData[srcIdx + 3]
    }
  }

  return outputData
}

/**
 * Rotate image data
 */
function rotateImageData(imageData: ImageData, degrees: number): ImageData {
  const { width, height, data: srcData } = imageData
  const radians = (degrees * Math.PI) / 180

  // Calculate new dimensions
  const sin = Math.abs(Math.sin(radians))
  const cos = Math.abs(Math.cos(radians))
  const newWidth = Math.round(width * cos + height * sin)
  const newHeight = Math.round(width * sin + height * cos)

  const outputData = new ImageData(newWidth, newHeight)
  const destData = outputData.data

  const centerX = width / 2
  const centerY = height / 2
  const newCenterX = newWidth / 2
  const newCenterY = newHeight / 2

  for (let destY = 0; destY < newHeight; destY++) {
    for (let destX = 0; destX < newWidth; destX++) {
      // Map destination pixel back to source
      const dx = destX - newCenterX
      const dy = destY - newCenterY

      const srcX = Math.round(dx * Math.cos(-radians) - dy * Math.sin(-radians) + centerX)
      const srcY = Math.round(dx * Math.sin(-radians) + dy * Math.cos(-radians) + centerY)

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIdx = (srcY * width + srcX) * 4
        const destIdx = (destY * newWidth + destX) * 4

        destData[destIdx] = srcData[srcIdx]
        destData[destIdx + 1] = srcData[srcIdx + 1]
        destData[destIdx + 2] = srcData[srcIdx + 2]
        destData[destIdx + 3] = srcData[srcIdx + 3]
      }
    }
  }

  return outputData
}

/**
 * Handle incoming messages
 */
self.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
  const { type, imageData, options, id } = e.data

  try {
    let result: ImageData

    switch (type) {
      case 'resize':
        result = resizeImageData(imageData, options.width, options.height)
        break

      case 'crop':
        result = cropImageData(imageData, options.x, options.y, options.width, options.height)
        break

      case 'rotate':
        result = rotateImageData(imageData, options.degrees)
        break

      default:
        throw new Error(`Unknown operation type: ${type}`)
    }

    self.postMessage({
      type: 'complete',
      data: result,
      id,
    } as WorkerResponse)
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      id,
    } as WorkerResponse)
  }
})

// Export empty object for TypeScript
export {}
