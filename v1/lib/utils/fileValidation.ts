/**
 * File validation utilities for upload components
 */

export interface FileValidationOptions {
  /**
   * Accepted file types (MIME types or extensions)
   * Example: "image/png,image/jpeg,.pdf"
   */
  accept?: string
  
  /**
   * Maximum file size in megabytes
   */
  maxSize?: number
  
  /**
   * Minimum file size in megabytes
   */
  minSize?: number
}

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates a file against the provided options
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const { accept, maxSize, minSize } = options

  // Validate file type
  if (accept) {
    const acceptedTypes = accept.split(',').map(type => type.trim())
    const fileType = file.type
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
    
    const isAccepted = acceptedTypes.some(acceptedType => {
      // Check MIME type
      if (acceptedType.includes('/')) {
        // Handle wildcards like "image/*"
        if (acceptedType.endsWith('/*')) {
          const baseType = acceptedType.split('/')[0]
          return fileType.startsWith(`${baseType}/`)
        }
        return fileType === acceptedType
      }
      // Check file extension
      return fileExtension === acceptedType.toLowerCase()
    })

    if (!isAccepted) {
      const readableTypes = acceptedTypes
        .map(type => type.includes('/') ? type.split('/')[1].toUpperCase() : type)
        .join(', ')
      return {
        valid: false,
        error: `Invalid file type. Accepted types: ${readableTypes}`
      }
    }
  }

  // Validate file size
  const fileSizeMB = file.size / (1024 * 1024)

  if (maxSize && fileSizeMB > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize}MB. Your file is ${fileSizeMB.toFixed(2)}MB`
    }
  }

  if (minSize && fileSizeMB < minSize) {
    return {
      valid: false,
      error: `File size must be at least ${minSize}MB`
    }
  }

  return { valid: true }
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Gets a readable list of accepted file types from accept string
 */
export function getAcceptedTypesLabel(accept?: string): string {
  if (!accept) return 'All files'

  const types = accept.split(',').map(type => {
    const trimmed = type.trim()
    if (trimmed.includes('/')) {
      // MIME type
      if (trimmed.endsWith('/*')) {
        return trimmed.split('/')[0].toUpperCase()
      }
      return trimmed.split('/')[1].toUpperCase()
    }
    // Extension
    return trimmed.replace('.', '').toUpperCase()
  })

  return types.join(', ')
}
