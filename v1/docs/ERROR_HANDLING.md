# Error Handling Guide

This guide explains the comprehensive error handling system implemented in Design Kit.

## Overview

The error handling system provides:

- **Structured Error Types**: Custom error classes for different failure scenarios
- **User-Friendly Messages**: Automatic conversion of technical errors to user-friendly messages
- **Toast Notifications**: Consistent toast notifications for success and error states
- **Retry Functionality**: Automatic retry with exponential backoff for network errors
- **Browser Compatibility Checks**: Detection and warnings for unsupported browsers
- **Error Logging**: Secure logging without sensitive data
- **Quota Protection**: API errors don't decrement user quota

## Error Types

### Base Error Class

```typescript
import { AppError } from '@/lib/utils/errors'

// All custom errors extend AppError
class AppError extends Error {
  userMessage: string    // User-friendly message
  code: string          // Error code for tracking
  recoverable: boolean  // Whether user can retry
}
```

### File Validation Errors

```typescript
import { FileSizeError, FileTypeError } from '@/lib/utils/errors'

// File too large
throw new FileSizeError(fileSize, maxSize)
// Message: "File size (15.2MB) exceeds your plan limit (10MB). Upgrade to process larger files."

// Invalid file type
throw new FileTypeError('image/bmp', ['PNG', 'JPG', 'WEBP'])
// Message: "Invalid file type. Accepted formats: PNG, JPG, WEBP"
```

### Image Processing Errors

```typescript
import { ImageLoadError, ImageDimensionError, CanvasError } from '@/lib/utils/errors'

// Failed to load image
throw new ImageLoadError('Corrupted file')

// Image too large
throw new ImageDimensionError(8000, 6000, 4096)

// Canvas operation failed
throw new CanvasError('toBlob')
```

### Network Errors

```typescript
import { NetworkError, APIError } from '@/lib/utils/errors'

// Generic network error
throw new NetworkError('Connection failed', 0)

// API-specific error
throw new APIError('Rate limit exceeded', 429, 'Remove.bg')
```

### Quota Errors

```typescript
import { QuotaExceededError } from '@/lib/utils/errors'

// Quota exhausted
throw new QuotaExceededError('Premium')
// Message: "Daily quota exhausted. Upgrade to Premium for more operations."
```

### Browser Compatibility Errors

```typescript
import { BrowserCompatibilityError } from '@/lib/utils/errors'

// Missing browser feature
throw new BrowserCompatibilityError('Canvas API')
// Message: "Your browser doesn't support Canvas API. Please upgrade to a modern browser."
```

## Toast Notifications

### Success Toasts

```typescript
import { showSuccessToast, showFileUploadedToast, showProcessingCompleteToast } from '@/lib/utils/toast-helpers'

// Generic success
showSuccessToast('Operation completed successfully')

// File uploaded
showFileUploadedToast('image.png')

// Processing complete with download action
showProcessingCompleteToast(() => {
  downloadFile()
})
```

### Error Toasts

```typescript
import { showErrorToast, showNetworkErrorToast } from '@/lib/utils/toast-helpers'

// Show error with automatic retry button
showErrorToast(error, {
  onRetry: async () => {
    await retryOperation()
  }
})

// Network error with retry
showNetworkErrorToast(async () => {
  await retryNetworkRequest()
})
```

### Warning and Info Toasts

```typescript
import { showWarningToast, showInfoToast, showQuotaWarningToast } from '@/lib/utils/toast-helpers'

// Warning
showWarningToast('File size is large. Processing may take longer.')

// Info
showInfoToast('Processing started in background')

// Quota warning
showQuotaWarningToast(2, () => {
  router.push('/pricing')
})
```

## Error Handler Hook

### Basic Usage

```typescript
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'

function MyComponent() {
  const { handleError, retry, isRetrying } = useErrorHandler({
    logErrors: true,
    showToast: true,
    onRetry: async () => {
      await retryOperation()
    }
  })

  const processFile = async (file: File) => {
    try {
      // Process file
      const result = await processImage(file)
      showSuccessToast('Processing complete')
    } catch (error) {
      // Automatically shows toast, logs error, and provides retry option
      handleError(error, { fileName: file.name })
    }
  }

  return (
    <button onClick={retry} disabled={isRetrying}>
      {isRetrying ? 'Retrying...' : 'Retry'}
    </button>
  )
}
```

### Async Operation Wrapper

```typescript
import { useAsyncError } from '@/lib/hooks/useErrorHandler'

function MyComponent() {
  const { execute, isLoading, data } = useAsyncError(
    async (file: File) => {
      return await processImage(file)
    },
    {
      logErrors: true,
      showToast: true,
    }
  )

  return (
    <button onClick={() => execute(file)} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Process'}
    </button>
  )
}
```

## Retry Logic

### Basic Retry

```typescript
import { retry } from '@/lib/utils/retry'

const result = await retry(
  async () => {
    return await fetchData()
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
)
```

### Retry with Progress

```typescript
import { retryWithProgress } from '@/lib/utils/retry'

const result = await retryWithProgress(
  async () => {
    return await processImage()
  },
  (attempt, maxAttempts, delay) => {
    console.log(`Attempt ${attempt}/${maxAttempts}, waiting ${delay}ms`)
  },
  { maxAttempts: 3 }
)
```

### Retry Fetch Requests

```typescript
import { retryFetch } from '@/lib/utils/retry'

const response = await retryFetch('/api/tools/process', {
  method: 'POST',
  body: formData,
}, {
  maxAttempts: 3,
  initialDelay: 1000,
})
```

## Browser Compatibility

### Check Required Features

```typescript
import { checkRequiredFeatures, assertBrowserCompatibility } from '@/lib/utils/browser-compat'

// Check features
const { supported, missing } = checkRequiredFeatures()
if (!supported) {
  console.error('Missing features:', missing)
}

// Assert compatibility (throws error if unsupported)
try {
  assertBrowserCompatibility()
} catch (error) {
  // Show upgrade message
}
```

### Display Compatibility Warning

```typescript
import { BrowserCompatibilityWarning } from '@/components/shared/BrowserCompatibilityWarning'

function Layout() {
  return (
    <>
      <BrowserCompatibilityWarning />
      {/* Rest of layout */}
    </>
  )
}
```

## Error Logging

### Log Errors

```typescript
import { logError, reportError, storeErrorForDebug } from '@/lib/utils/error-logger'

try {
  await processImage()
} catch (error) {
  // Log to console (development only)
  logError(error, { tool: 'image-resizer' })
  
  // Store in session storage for debugging
  storeErrorForDebug(error, { tool: 'image-resizer' })
  
  // Report to external service (production)
  await reportError(error, { tool: 'image-resizer' })
}
```

### Setup Global Error Handler

```typescript
import { setupGlobalErrorHandler } from '@/lib/utils/error-logger'

// In root layout or app initialization
useEffect(() => {
  setupGlobalErrorHandler()
}, [])
```

## Error Boundary

### Wrap Components

```typescript
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Caught by boundary:', error)
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### HOC Pattern

```typescript
import { withErrorBoundary } from '@/components/shared/ErrorBoundary'

const SafeComponent = withErrorBoundary(MyComponent)
```

## API Route Error Handling

### Proper Error Handling Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // Check quota BEFORE processing
    const canUse = await checkQuota(userId)
    if (!canUse) {
      return NextResponse.json(
        { error: 'Quota exceeded', code: 'QUOTA_EXCEEDED' },
        { status: 403 }
      )
    }

    // Process request
    const result = await processImage(file)

    // Increment quota ONLY after success
    await incrementUsage(userId)

    return NextResponse.json({ result })
  } catch (error) {
    // Log error (without sensitive data)
    logError(error)

    // Return error (quota NOT incremented)
    return NextResponse.json(
      { error: 'Processing failed', code: 'PROCESSING_ERROR' },
      { status: 500 }
    )
  }
}
```

## Best Practices

### 1. Always Use Structured Errors

```typescript
// ❌ Bad
throw new Error('File too large')

// ✅ Good
throw new FileSizeError(fileSize, maxSize)
```

### 2. Provide Context When Logging

```typescript
// ❌ Bad
logError(error)

// ✅ Good
logError(error, {
  tool: 'image-resizer',
  fileName: file.name,
  fileSize: file.size,
})
```

### 3. Show User-Friendly Messages

```typescript
// ❌ Bad
toast.error(error.message) // Technical message

// ✅ Good
showErrorToast(error) // Automatically uses user-friendly message
```

### 4. Provide Retry Options for Recoverable Errors

```typescript
// ❌ Bad
showErrorToast(error)

// ✅ Good
showErrorToast(error, {
  onRetry: async () => {
    await retryOperation()
  }
})
```

### 5. Don't Charge Quota on Errors

```typescript
// ❌ Bad
await incrementUsage(userId)
try {
  await processImage()
} catch (error) {
  // User charged even though processing failed
}

// ✅ Good
try {
  await processImage()
  await incrementUsage(userId) // Only charge on success
} catch (error) {
  // User not charged
}
```

### 6. Sanitize Errors Before Logging

```typescript
// ❌ Bad
console.error('Error:', error, { fileData: blob })

// ✅ Good
logError(error, { fileName: file.name }) // fileData automatically removed
```

## Testing Error Handling

### Test Error Scenarios

```typescript
describe('Error Handling', () => {
  it('shows error toast on file validation failure', async () => {
    const largeFile = new File(['x'.repeat(20 * 1024 * 1024)], 'large.png')
    
    await expect(processFile(largeFile)).rejects.toThrow(FileSizeError)
    expect(toast.error).toHaveBeenCalled()
  })

  it('retries on network error', async () => {
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new NetworkError('Timeout'))
      .mockResolvedValueOnce({ ok: true })

    const result = await retry(mockFetch, { maxAttempts: 2 })
    
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('does not charge quota on error', async () => {
    const mockProcess = jest.fn().mockRejectedValue(new Error('Failed'))
    
    await expect(processWithQuota(mockProcess)).rejects.toThrow()
    expect(incrementUsage).not.toHaveBeenCalled()
  })
})
```

## Summary

The error handling system provides:

✅ Structured error types with user-friendly messages  
✅ Consistent toast notifications  
✅ Automatic retry with exponential backoff  
✅ Browser compatibility detection  
✅ Secure error logging without sensitive data  
✅ Quota protection (no charge on errors)  
✅ Error boundaries for React errors  
✅ Comprehensive testing support  

For more examples, see `lib/utils/error-handling-example.tsx`.
