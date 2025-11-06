/**
 * Error Handling Examples
 * 
 * This file demonstrates how to use the error handling utilities
 * throughout the application.
 */

import * as React from 'react'
import { toast } from '@/lib/hooks/use-toast'
import {
  FileValidationError,
  NetworkError,
  ImageProcessingError,
  ClipboardError,
  BrowserCompatibilityError,
} from '@/types/errors'
import {
  handleErrorWithToast,
  createRetryHandler,
  withErrorHandling,
  isRetryableError,
  logError,
} from '@/lib/utils/errorHandling'
import {
  ensureCanvasSupport,
  ensureFileReaderSupport,
  checkClipboardSupport,
} from '@/lib/utils/browserCompat'

// ============================================================================
// Example 1: Basic Error Handling with Toast
// ============================================================================

async function uploadFile(file: File) {
  try {
    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      throw new FileValidationError('File size exceeds 10MB')
    }

    // Process file
    const result = await processFile(file)
    return result
  } catch (error) {
    // Automatically log and show toast with user-friendly message
    handleErrorWithToast(error, toast, 'uploadFile')
    throw error
  }
}

// ============================================================================
// Example 2: Browser Compatibility Checks
// ============================================================================

function initializeColorPicker() {
  try {
    // Check if browser supports required features
    ensureCanvasSupport()
    ensureFileReaderSupport()

    // Initialize the tool
    return true
  } catch (error) {
    if (error instanceof BrowserCompatibilityError) {
      handleErrorWithToast(error, toast, 'initializeColorPicker')
      return false
    }
    throw error
  }
}

// ============================================================================
// Example 3: Clipboard with Fallback
// ============================================================================

async function copyToClipboard(text: string, showFallback: () => void) {
  try {
    // Check if clipboard API is available
    if (!checkClipboardSupport()) {
      // Show fallback modal for manual copying
      showFallback()
      return
    }

    await navigator.clipboard.writeText(text)
    
    toast({
      title: 'Copied!',
      description: 'Value copied to clipboard',
    })
  } catch (error) {
    logError(error, 'copyToClipboard')
    // Show fallback modal on error
    showFallback()
  }
}

// ============================================================================
// Example 4: Network Requests with Retry
// ============================================================================

async function fetchData(url: string) {
  const fetchWithRetry = createRetryHandler(
    async () => {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new NetworkError(
          `Request failed with status ${response.status}`,
          response.status >= 500 // Retry on server errors
        )
      }
      
      return response.json()
    },
    3, // Max 3 retries
    1000 // 1 second initial delay
  )

  try {
    return await fetchWithRetry()
  } catch (error) {
    handleErrorWithToast(error, toast, 'fetchData')
    throw error
  }
}

// ============================================================================
// Example 5: Wrapping Functions with Error Handling
// ============================================================================

const processImageWithErrorHandling = withErrorHandling(
  async (file: File) => {
    // Your image processing logic
    const result = await processImage(file)
    return result
  },
  (error) => {
    // Custom error handler
    handleErrorWithToast(error, toast, 'processImage')
  }
)

// Usage
async function handleImageUpload(file: File) {
  try {
    const result = await processImageWithErrorHandling(file)
    toast({
      title: 'Success',
      description: 'Image processed successfully',
    })
    return result
  } catch (error) {
    // Error already handled by wrapper
    return null
  }
}

// ============================================================================
// Example 6: Custom Error Handling in Components
// ============================================================================

function MyComponent() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleAction = async () => {
    setLoading(true)
    setError(null)

    try {
      await someAsyncOperation()
      
      toast({
        title: 'Success',
        description: 'Operation completed',
      })
    } catch (err) {
      // Log error
      logError(err, 'MyComponent.handleAction')
      
      // Set local error state
      if (err instanceof FileValidationError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
      
      // Also show toast
      handleErrorWithToast(err, toast, 'MyComponent.handleAction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
      <button onClick={handleAction} disabled={loading}>
        {loading ? 'Processing...' : 'Start'}
      </button>
    </div>
  )
}

// ============================================================================
// Example 7: Checking if Error is Retryable
// ============================================================================

async function handleNetworkRequest(url: string) {
  try {
    const response = await fetch(url)
    return response.json()
  } catch (error) {
    if (isRetryableError(error)) {
      // Show retry option to user
      toast({
        title: 'Network Error',
        description: 'Connection failed. Please try again.',
      })
    } else {
      // Non-retryable error
      handleErrorWithToast(error, toast, 'handleNetworkRequest')
    }
  }
}

// ============================================================================
// Helper Functions (for examples)
// ============================================================================

async function processFile(file: File): Promise<any> {
  // Placeholder
  return {}
}

async function processImage(file: File): Promise<any> {
  // Placeholder
  return {}
}

async function someAsyncOperation(): Promise<void> {
  // Placeholder
}

export {}
