/**
 * File download utilities for handling blob downloads, filename sanitization, and format helpers
 */

export interface DownloadOptions {
  fileName: string
  mimeType?: string
}

/**
 * Triggers a download of a Blob or File
 * @param blob - Blob or File to download
 * @param fileName - Name for the downloaded file
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = sanitizeFileName(fileName)
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    // Clean up the object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}

/**
 * Downloads a data URL as a file
 * @param dataUrl - Data URL string
 * @param fileName - Name for the downloaded file
 */
export function downloadDataURL(dataUrl: string, fileName: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = sanitizeFileName(fileName)
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Downloads canvas as an image file
 * @param canvas - Canvas element to download
 * @param fileName - Name for the downloaded file
 * @param format - Image format (default 'png')
 * @param quality - Quality for lossy formats (0-1, default 0.92)
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  fileName: string,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.92
): void {
  canvas.toBlob(
    (blob) => {
      if (blob) {
        downloadBlob(blob, fileName)
      }
    },
    `image/${format}`,
    format === 'jpeg' || format === 'webp' ? quality : undefined
  )
}

/**
 * Sanitizes a filename by removing invalid characters
 * @param fileName - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFileName(fileName: string): string {
  // Remove or replace invalid characters
  let sanitized = fileName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Replace invalid chars with underscore
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+/, '') // Remove leading dots
    .trim()

  // Ensure filename is not empty
  if (!sanitized) {
    sanitized = 'download'
  }

  // Limit length (255 is common filesystem limit)
  if (sanitized.length > 255) {
    const ext = getFileExtension(sanitized)
    const nameWithoutExt = sanitized.slice(0, sanitized.length - ext.length - 1)
    sanitized = nameWithoutExt.slice(0, 255 - ext.length - 1) + '.' + ext
  }

  return sanitized
}

/**
 * Generates a filename with timestamp
 * @param baseName - Base name for the file
 * @param extension - File extension (without dot)
 * @returns Filename with timestamp
 */
export function generateTimestampedFileName(
  baseName: string,
  extension: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `${baseName}_${timestamp}.${extension}`
}

/**
 * Gets file extension from filename
 * @param fileName - Filename
 * @returns Extension without dot, or empty string if no extension
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return ''
  }
  return fileName.slice(lastDot + 1).toLowerCase()
}

/**
 * Changes file extension
 * @param fileName - Original filename
 * @param newExtension - New extension (without dot)
 * @returns Filename with new extension
 */
export function changeFileExtension(
  fileName: string,
  newExtension: string
): string {
  const lastDot = fileName.lastIndexOf('.')
  const nameWithoutExt = lastDot !== -1 ? fileName.slice(0, lastDot) : fileName
  return `${nameWithoutExt}.${newExtension}`
}

/**
 * Gets MIME type from file extension
 * @param extension - File extension (with or without dot)
 * @returns MIME type string
 */
export function getMimeTypeFromExtension(extension: string): string {
  const ext = extension.startsWith('.') ? extension.slice(1) : extension
  const lowerExt = ext.toLowerCase()

  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
  }

  return mimeTypes[lowerExt] || 'application/octet-stream'
}

/**
 * Gets file extension from MIME type
 * @param mimeType - MIME type string
 * @returns File extension without dot
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
  }

  return extensionMap[mimeType.toLowerCase()] || 'bin'
}

/**
 * Creates a filename from original file with new format
 * @param originalFileName - Original filename
 * @param newFormat - New format (png, jpeg, webp, etc.)
 * @returns New filename with updated extension
 */
export function createConvertedFileName(
  originalFileName: string,
  newFormat: string
): string {
  const nameWithoutExt = originalFileName.replace(/\.[^.]+$/, '')
  return `${nameWithoutExt}.${newFormat}`
}

/**
 * Creates a filename with suffix
 * @param originalFileName - Original filename
 * @param suffix - Suffix to add (e.g., '_resized', '_cropped')
 * @returns New filename with suffix
 */
export function addFileNameSuffix(
  originalFileName: string,
  suffix: string
): string {
  const ext = getFileExtension(originalFileName)
  const nameWithoutExt = originalFileName.slice(
    0,
    originalFileName.length - ext.length - 1
  )
  return `${nameWithoutExt}${suffix}.${ext}`
}

/**
 * Validates if a filename is safe
 * @param fileName - Filename to validate
 * @returns True if filename is safe
 */
export function isValidFileName(fileName: string): boolean {
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidChars.test(fileName)) {
    return false
  }

  // Check for reserved names (Windows)
  const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
  if (reservedNames.test(nameWithoutExt)) {
    return false
  }

  // Check length
  if (fileName.length === 0 || fileName.length > 255) {
    return false
  }

  return true
}

/**
 * Converts a File to Blob
 * @param file - File object
 * @returns Blob
 */
export function fileToBlob(file: File): Blob {
  return new Blob([file], { type: file.type })
}

/**
 * Creates a File from Blob
 * @param blob - Blob object
 * @param fileName - Name for the file
 * @param options - File options
 * @returns File object
 */
export function blobToFile(
  blob: Blob,
  fileName: string,
  options?: FilePropertyBag
): File {
  return new File([blob], fileName, {
    type: blob.type,
    ...options,
  })
}

/**
 * Reads a file as data URL
 * @param file - File or Blob to read
 * @returns Promise resolving to data URL string
 */
export function readAsDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Reads a file as array buffer
 * @param file - File or Blob to read
 * @returns Promise resolving to ArrayBuffer
 */
export function readAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as array buffer'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Estimates download time based on file size
 * @param fileSizeBytes - File size in bytes
 * @param speedMbps - Connection speed in Mbps (default 10)
 * @returns Estimated time in seconds
 */
export function estimateDownloadTime(
  fileSizeBytes: number,
  speedMbps = 10
): number {
  const fileSizeMb = fileSizeBytes / (1024 * 1024)
  const timeSeconds = (fileSizeMb * 8) / speedMbps
  return Math.ceil(timeSeconds)
}
