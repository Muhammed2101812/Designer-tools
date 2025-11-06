/**
 * Error Handling Usage Examples
 * 
 * This file demonstrates how to use the error handling system
 * in tool pages and components.
 */

'use client'

import { useState } from 'react'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { retry, retryFetch } from '@/lib/utils/retry'
import {
  showSuccessToast,
  showErrorToast,
  showProcessingToast,
  showProcessingCompleteToast,
} from '@/lib/utils/toast-helpers'
import {
  FileValidationError,
  FileSizeError,
  FileTypeError,
  ImageProcessingError,
  NetworkError,
} from '@/lib/utils/errors'

// ============================================
// Example 1: Basic Error Handling in a Tool
// ============================================

export function ExampleToolWithErrorHandling() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)

  // Set up error handler with retry support
  const { handleError } = useErrorHandler({
    logErrors: true,
    showToast: true,
    onRetry: async () => {
      // Retry the last operation
      if (file) {
        await processImage(file)
      }
    },
  })

  const processImage = async (imageFile: File) => {
    setProcessing(true)
    const toastId = showProcessingToast('Processing your image...')

    try {
      // Validate file
      if (imageFile.size > 10 * 1024 * 1024) {
        throw new FileSizeError(imageFile.size, 10)
      }

      if (!imageFile.type.startsWith('image/')) {
        throw new FileTypeError(imageFile.type, ['PNG', 'JPG', 'WEBP'])
      }

      // Process image (example)
      const result = await processImageWithAPI(imageFile)

      // Show success
      showProcessingCompleteToast(() => {
        downloadResult(result)
      })
    } catch (error) {
      // Handle error with toast and logging
      handleError(error, {
        tool: 'example-tool',
        fileSize: imageFile.size,
        fileType: imageFile.type,
      })
    } finally {
      setProcessing(false)
    }
  }

  return null // Component JSX here
}

// ============================================
// Example 2: Network Request with Retry
// ============================================

export async function exampleAPICallWithRetry(imageFile: File) {
  try {
    // Use retry wrapper for network requests
    const response = await retry(
      async () => {
        const formData = new FormData()
        formData.append('image', imageFile)

        const res = await fetch('/api/tools/process', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          throw new NetworkError(
            `HTTP ${res.status}: ${res.statusText}`,
            res.status
          )
        }

        return res
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        onRetry: (error, attempt, delay) => {
          console.log(`Retry attempt ${attempt} after ${delay}ms`)
        },
      }
    )

    return await response.json()
  } catch (error) {
    // Error will be thrown after all retries exhausted
    throw error
  }
}

// ============================================
// Example 3: Fetch with Automatic Retry
// ============================================

export async function exampleFetchWithRetry() {
  try {
    const response = await retryFetch(
      '/api/tools/check-quota',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
      }
    )

    return await response.json()
  } catch (error) {
    throw error
  }
}

// ============================================
// Example 4: Client-Side Image Processing with Error Handling
// ============================================

export async function exampleImageProcessing(file: File) {
  try {
    // Load image
    const img = await loadImage(file)

    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new ImageProcessingError(
        'Failed to get canvas context',
        'Your browser does not support canvas. Please upgrade your browser.'
      )
    }

    // Process image
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new ImageProcessingError(
            'Failed to convert canvas to blob',
            'Image processing failed. Please try again.'
          ))
        },
        'image/png',
        1.0
      )
    })

    return blob
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new ImageProcessingError(
      'Unknown error',
      'Image processing failed. Please try again.'
    )
  }
}

// ============================================
// Example 5: Form Validation with Custom Errors
// ============================================

export function validateImageFile(file: File, maxSizeMB: number = 10) {
  // Check file type
  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    throw new FileTypeError(file.type, ['PNG', 'JPG', 'WEBP', 'GIF'])
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    throw new FileSizeError(file.size, maxSizeMB)
  }

  return true
}

// ============================================
// Helper Functions
// ============================================

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(
        new ImageProcessingError(
          'Failed to load image',
          'Failed to load image. Please ensure the file is a valid image.'
        )
      )
    }

    img.src = url
  })
}

async function processImageWithAPI(file: File): Promise<Blob> {
  // Placeholder for actual API call
  return new Blob()
}

function downloadResult(blob: Blob) {
  // Placeholder for download logic
}
