/**
 * File security utilities for magic number validation and secure file handling
 */

/**
 * File magic numbers (file signatures) for validation
 * These are the first bytes of files that identify their true type
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/jpeg': [
    [0xff, 0xd8, 0xff, 0xe0], // JFIF
    [0xff, 0xd8, 0xff, 0xe1], // EXIF
    [0xff, 0xd8, 0xff, 0xe2], // Canon
    [0xff, 0xd8, 0xff, 0xe3], // Samsung
    [0xff, 0xd8, 0xff, 0xe8], // SPIFF
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (need to check WEBP at offset 8)
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'image/bmp': [[0x42, 0x4d]], // BM
  'image/svg+xml': [
    [0x3c, 0x3f, 0x78, 0x6d, 0x6c], // <?xml
    [0x3c, 0x73, 0x76, 0x67], // <svg
  ],
}

export interface MagicNumberValidationResult {
  valid: boolean
  detectedType?: string
  error?: string
}

/**
 * Validates file magic numbers (file signatures) to ensure file type matches content
 * This prevents malicious files from being disguised with fake extensions
 * 
 * @param file - File to validate
 * @param expectedType - Expected MIME type (optional, will validate against file.type if not provided)
 * @returns Validation result with detected type
 */
export async function validateFileMagicNumber(
  file: File,
  expectedType?: string
): Promise<MagicNumberValidationResult> {
  try {
    const typeToCheck = expectedType || file.type
    
    // Read first 12 bytes (enough for most signatures)
    const buffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // Get signatures for expected type
    const signatures = FILE_SIGNATURES[typeToCheck]
    
    if (!signatures) {
      // Type not in our validation list - allow it but warn
      return {
        valid: true,
        detectedType: typeToCheck,
      }
    }
    
    // Special handling for WEBP (RIFF container)
    if (typeToCheck === 'image/webp') {
      const isRiff = matchesSignature(bytes, signatures[0])
      if (!isRiff) {
        return {
          valid: false,
          error: 'File does not match WEBP signature',
        }
      }
      
      // Check for WEBP at offset 8
      if (bytes.length >= 12) {
        const webpSignature = [0x57, 0x45, 0x42, 0x50] // WEBP
        const webpBytes = bytes.slice(8, 12)
        const isWebp = webpSignature.every((byte, i) => webpBytes[i] === byte)
        
        if (!isWebp) {
          return {
            valid: false,
            error: 'File is RIFF but not WEBP format',
          }
        }
      }
      
      return {
        valid: true,
        detectedType: 'image/webp',
      }
    }
    
    // Check if file matches any of the signatures for this type
    const matches = signatures.some(signature => matchesSignature(bytes, signature))
    
    if (!matches) {
      // Try to detect actual type
      const detectedType = detectFileType(bytes)
      
      return {
        valid: false,
        detectedType,
        error: detectedType
          ? `File appears to be ${detectedType} but was declared as ${typeToCheck}`
          : `File does not match expected ${typeToCheck} signature`,
      }
    }
    
    return {
      valid: true,
      detectedType: typeToCheck,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate file',
    }
  }
}

/**
 * Checks if bytes match a signature
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false
  }
  
  return signature.every((byte, index) => bytes[index] === byte)
}

/**
 * Attempts to detect file type from magic numbers
 */
function detectFileType(bytes: Uint8Array): string | undefined {
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const signature of signatures) {
      if (matchesSignature(bytes, signature)) {
        return mimeType
      }
    }
  }
  
  return undefined
}

/**
 * Validates multiple files for magic numbers
 * Useful for batch uploads
 */
export async function validateFilesMagicNumbers(
  files: File[]
): Promise<Map<string, MagicNumberValidationResult>> {
  const results = new Map<string, MagicNumberValidationResult>()
  
  await Promise.all(
    files.map(async (file) => {
      const result = await validateFileMagicNumber(file)
      results.set(file.name, result)
    })
  )
  
  return results
}

/**
 * Secure canvas cleanup to prevent data leakage
 * Overwrites canvas data before releasing
 */
export function secureCanvasCleanup(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    // Overwrite canvas with black pixels
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  
  // Reset dimensions to free memory
  canvas.width = 0
  canvas.height = 0
}

/**
 * Sanitizes error objects for logging by removing sensitive data
 * Prevents file data, image data, and other sensitive information from being logged
 */
export function sanitizeErrorForLogging(
  error: Error,
  context?: Record<string, any>
): {
  message: string
  stack?: string
  context?: Record<string, any>
} {
  const sanitized: Record<string, any> = {}
  
  if (context) {
    // Copy context but remove sensitive fields
    for (const [key, value] of Object.entries(context)) {
      // Skip sensitive data
      if (
        key === 'fileData' ||
        key === 'imageData' ||
        key === 'blob' ||
        key === 'buffer' ||
        key === 'arrayBuffer' ||
        key === 'canvas' ||
        key === 'file' ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key')
      ) {
        sanitized[key] = '[REDACTED]'
      } else if (value instanceof Blob || value instanceof File) {
        sanitized[key] = `[${value.constructor.name}: ${value.size} bytes]`
      } else if (value instanceof HTMLCanvasElement) {
        sanitized[key] = `[Canvas: ${value.width}x${value.height}]`
      } else if (value instanceof ArrayBuffer) {
        sanitized[key] = `[ArrayBuffer: ${value.byteLength} bytes]`
      } else {
        sanitized[key] = value
      }
    }
  }
  
  return {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    context: Object.keys(sanitized).length > 0 ? sanitized : undefined,
  }
}

/**
 * Checks if the current environment is using HTTPS
 * In production, this should always be true
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') {
    return true // Server-side is considered secure
  }
  
  return window.isSecureContext || window.location.protocol === 'https:'
}

/**
 * Enforces HTTPS in production by redirecting if necessary
 * Should be called in middleware or app initialization
 */
export function enforceHttps(): void {
  if (typeof window === 'undefined') {
    return // Server-side, handled by middleware
  }
  
  if (
    process.env.NODE_ENV === 'production' &&
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost'
  ) {
    // Redirect to HTTPS
    window.location.href = window.location.href.replace('http://', 'https://')
  }
}

/**
 * Validates that a file is an image by checking both MIME type and magic numbers
 * Provides comprehensive validation for image uploads
 */
export async function validateImageFile(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  // Check MIME type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File is not an image',
    }
  }
  
  // Validate magic numbers
  const magicResult = await validateFileMagicNumber(file)
  
  if (!magicResult.valid) {
    return {
      valid: false,
      error: magicResult.error || 'File signature validation failed',
    }
  }
  
  return { valid: true }
}

/**
 * Securely clears sensitive data from memory
 * Useful for clearing file buffers, image data, etc.
 */
export function secureClearBuffer(buffer: ArrayBuffer | Uint8Array): void {
  const view = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
  
  // Overwrite with zeros
  for (let i = 0; i < view.length; i++) {
    view[i] = 0
  }
}

/**
 * Creates a secure blob URL with automatic cleanup
 * Returns both the URL and a cleanup function
 */
export function createSecureBlobURL(
  blob: Blob
): { url: string; cleanup: () => void } {
  const url = URL.createObjectURL(blob)
  
  const cleanup = () => {
    URL.revokeObjectURL(url)
  }
  
  return { url, cleanup }
}

/**
 * Validates file size against plan limits
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const fileSizeMB = file.size / (1024 * 1024)
  
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds limit (${maxSizeMB}MB)`,
    }
  }
  
  return { valid: true }
}

/**
 * Comprehensive file validation combining all security checks
 */
export async function validateFileSecurely(
  file: File,
  options: {
    maxSizeMB?: number
    allowedTypes?: string[]
    validateMagicNumbers?: boolean
  } = {}
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  // Size validation
  if (options.maxSizeMB) {
    const sizeResult = validateFileSize(file, options.maxSizeMB)
    if (!sizeResult.valid && sizeResult.error) {
      errors.push(sizeResult.error)
    }
  }
  
  // Type validation
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some(type => {
      if (type.includes('/')) {
        return file.type === type
      }
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    })
    
    if (!isAllowed) {
      errors.push(
        `File type not allowed. Accepted types: ${options.allowedTypes.join(', ')}`
      )
    }
  }
  
  // Magic number validation
  if (options.validateMagicNumbers !== false) {
    const magicResult = await validateFileMagicNumber(file)
    if (!magicResult.valid && magicResult.error) {
      errors.push(magicResult.error)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
