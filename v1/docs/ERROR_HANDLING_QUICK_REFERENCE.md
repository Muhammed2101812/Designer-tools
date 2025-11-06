# Error Handling Quick Reference

Quick reference for using the error handling system in Design Kit.

## Import Statements

```typescript
// Error types
import {
  FileSizeError,
  FileTypeError,
  ImageProcessingError,
  NetworkError,
  QuotaExceededError,
} from '@/lib/utils/errors'

// Toast helpers
import {
  showSuccessToast,
  showErrorToast,
  showProcessingToast,
  showProcessingCompleteToast,
} from '@/lib/utils/toast-helpers'

// Error handler hook
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'

// Retry utilities
import { retry, retryFetch } from '@/lib/utils/retry'

// Browser compatibility
import { assertBrowserCompatibility } from '@/lib/utils/browser-compat'
```

## Common Patterns

### 1. File Upload with Validation

```typescript
const handleFileUpload = async (file: File) => {
  try {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      throw new FileTypeError(file.type, ['PNG', 'JPG', 'WEBP'])
    }

    // Validate file size
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new FileSizeError(file.size, 10)
    }

    // Process file
    showSuccessToast('File uploaded successfully')
  } catch (error) {
    showErrorToast(error)
  }
}
```

### 2. Image Processing with Error Handling

```typescript
const { handleError } = useErrorHandler({
  logErrors: true,
  showToast: true,
  onRetry: () => processImage(file),
})

const processImage = async (file: File) => {
  const toastId = showProcessingToast('Processing your image...')
  
  try {
    const result = await performProcessing(file)
    showProcessingCompleteToast(() => downloadResult(result))
  } catch (error) {
    handleError(error, { fileName: file.name })
  }
}
```

### 3. API Call with Retry

```typescript
const callAPI = async (file: File) => {
  try {
    const response = await retryFetch('/api/tools/process', {
      method: 'POST',
      body: formData,
    }, {
      maxAttempts: 3,
      initialDelay: 1000,
    })

    return await response.json()
  } catch (error) {
    showErrorToast(error, {
      onRetry: () => callAPI(file),
    })
  }
}
```

### 4. Browser Compatibility Check

```typescript
useEffect(() => {
  try {
    assertBrowserCompatibility()
  } catch (error) {
    showErrorToast(error)
    // Disable tool or show upgrade message
  }
}, [])
```

### 5. Quota Check

```typescript
const checkAndProcess = async () => {
  try {
    const hasQuota = await checkUserQuota()
    
    if (!hasQuota) {
      throw new QuotaExceededError('Premium')
    }

    await processImage()
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      showErrorToast(error, {
        onRetry: () => router.push('/pricing'),
      })
    } else {
      showErrorToast(error)
    }
  }
}
```

## Error Types Cheat Sheet

| Error Type | When to Use | Example |
|------------|-------------|---------|
| `FileSizeError` | File exceeds size limit | `throw new FileSizeError(fileSize, maxSize)` |
| `FileTypeError` | Invalid file type | `throw new FileTypeError(type, ['PNG', 'JPG'])` |
| `ImageProcessingError` | Image processing fails | `throw new ImageProcessingError('msg', 'user msg')` |
| `NetworkError` | Network request fails | `throw new NetworkError('msg', statusCode)` |
| `QuotaExceededError` | User quota exhausted | `throw new QuotaExceededError('Premium')` |
| `BrowserCompatibilityError` | Missing browser feature | `throw new BrowserCompatibilityError('Canvas')` |

## Toast Functions Cheat Sheet

| Function | Purpose | Example |
|----------|---------|---------|
| `showSuccessToast()` | Success message | `showSuccessToast('File uploaded')` |
| `showErrorToast()` | Error with retry | `showErrorToast(error, { onRetry })` |
| `showProcessingToast()` | Processing status | `showProcessingToast('Processing...')` |
| `showProcessingCompleteToast()` | Complete with action | `showProcessingCompleteToast(onDownload)` |
| `showQuotaWarningToast()` | Low quota warning | `showQuotaWarningToast(2, onUpgrade)` |
| `showNetworkErrorToast()` | Network error | `showNetworkErrorToast(onRetry)` |

## Retry Options

```typescript
{
  maxAttempts: 3,           // Maximum retry attempts
  initialDelay: 1000,       // Initial delay in ms
  maxDelay: 10000,          // Maximum delay in ms
  backoffMultiplier: 2,     // Exponential backoff multiplier
  timeout: 30000,           // Operation timeout in ms
  shouldRetry: (error) => { // Custom retry condition
    return error instanceof NetworkError
  },
  onRetry: (error, attempt, delay) => {
    console.log(`Retry ${attempt} after ${delay}ms`)
  }
}
```

## Browser Feature Checks

```typescript
import {
  hasCanvasSupport,
  hasFileAPISupport,
  hasWebWorkerSupport,
  checkRequiredFeatures,
} from '@/lib/utils/browser-compat'

// Check single feature
if (!hasCanvasSupport()) {
  throw new BrowserCompatibilityError('Canvas API')
}

// Check all required features
const { supported, missing } = checkRequiredFeatures()
if (!supported) {
  console.error('Missing:', missing)
}
```

## Error Boundary Usage

```typescript
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

// Wrap component
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom error handler
<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Caught:', error)
  }}
>
  <MyComponent />
</ErrorBoundary>
```

## Testing Error Handling

```typescript
import { describe, it, expect } from 'vitest'
import { FileSizeError } from '@/lib/utils/errors'

describe('File Upload', () => {
  it('throws error for large files', () => {
    const largeFile = new File(['x'.repeat(20 * 1024 * 1024)], 'large.png')
    
    expect(() => validateFile(largeFile)).toThrow(FileSizeError)
  })

  it('shows error toast', async () => {
    const { handleError } = useErrorHandler({ showToast: true })
    
    await handleError(new Error('Test'))
    
    expect(toast.error).toHaveBeenCalled()
  })
})
```

## Best Practices

### ✅ DO

- Use structured error types
- Provide user-friendly messages
- Log errors with context
- Offer retry for recoverable errors
- Check browser compatibility
- Sanitize sensitive data before logging

### ❌ DON'T

- Throw generic `Error` objects
- Show technical error messages to users
- Log sensitive data (file contents, API keys)
- Charge quota on API errors
- Ignore browser compatibility
- Retry non-recoverable errors

## Common Mistakes

### ❌ Bad: Generic Error

```typescript
throw new Error('File too large')
```

### ✅ Good: Structured Error

```typescript
throw new FileSizeError(fileSize, maxSize)
```

---

### ❌ Bad: Technical Message

```typescript
toast.error(error.message)
```

### ✅ Good: User-Friendly Message

```typescript
showErrorToast(error)
```

---

### ❌ Bad: Charge Quota on Error

```typescript
await incrementUsage()
try {
  await processImage()
} catch (error) {
  // User charged even though it failed
}
```

### ✅ Good: Charge Only on Success

```typescript
try {
  await processImage()
  await incrementUsage()
} catch (error) {
  // User not charged
}
```

## Need More Help?

See full documentation: `docs/ERROR_HANDLING.md`
See usage examples: `lib/utils/error-handling-example.tsx`
