# Error Handling System

This document describes the comprehensive error handling system implemented in Design Kit.

## Overview

The error handling system provides:
- Custom error classes for different error types
- User-friendly error messages
- Toast notifications for errors
- Browser compatibility checks
- Clipboard fallback for unsupported browsers
- Loading states and spinners
- Network error retry logic
- Comprehensive error logging

## Custom Error Classes

All custom errors extend from `AppError` and are located in `types/errors.ts`:

### AppError
Base error class with error code and HTTP status code.

```typescript
throw new AppError('Something went wrong', 'CUSTOM_ERROR', 500)
```

### ValidationError
For input validation failures.

```typescript
throw new ValidationError('Email format is invalid')
```

### FileValidationError
For file upload validation failures (size, type, etc.).

```typescript
throw new FileValidationError('File size exceeds 10MB')
```

### NetworkError
For network request failures. Includes `retryable` flag.

```typescript
throw new NetworkError('Request failed', true) // retryable
```

### BrowserCompatibilityError
For unsupported browser features.

```typescript
throw new BrowserCompatibilityError(
  'Canvas not supported',
  'canvas'
)
```

### ImageProcessingError
For image processing failures.

```typescript
throw new ImageProcessingError('Failed to load image')
```

### ClipboardError
For clipboard operation failures.

```typescript
throw new ClipboardError('Failed to copy to clipboard')
```

### QuotaExceededError
For API quota limit errors.

```typescript
throw new QuotaExceededError('Daily limit reached')
```

### AuthenticationError
For authentication failures.

```typescript
throw new AuthenticationError('Login required')
```

## Error Handling Utilities

Located in `lib/utils/errorHandling.ts`:

### handleErrorWithToast()
Automatically logs error and shows user-friendly toast notification.

```typescript
try {
  await riskyOperation()
} catch (error) {
  handleErrorWithToast(error, toast, 'MyComponent')
}
```

### logError()
Logs error to console with context.

```typescript
logError(error, 'MyComponent.handleClick')
```

### createRetryHandler()
Creates a retry wrapper for network requests.

```typescript
const fetchWithRetry = createRetryHandler(
  async () => fetch('/api/data'),
  3, // max retries
  1000 // initial delay ms
)

const data = await fetchWithRetry()
```

### withErrorHandling()
Wraps async functions with automatic error handling.

```typescript
const safeFunction = withErrorHandling(
  async (param) => {
    // Your logic
  },
  (error) => {
    // Custom error handler
  }
)
```

### isRetryableError()
Checks if an error can be retried.

```typescript
if (isRetryableError(error)) {
  // Show retry button
}
```

### getErrorDisplayInfo()
Converts any error to user-friendly display information.

```typescript
const info = getErrorDisplayInfo(error)
// { title: 'Error', message: 'User-friendly message', variant: 'destructive' }
```

## Browser Compatibility Checks

Located in `lib/utils/browserCompat.ts`:

### ensureCanvasSupport()
Throws error if Canvas is not supported.

```typescript
try {
  ensureCanvasSupport()
  // Canvas is supported
} catch (error) {
  // Show error to user
}
```

### ensureFileReaderSupport()
Throws error if FileReader is not supported.

```typescript
ensureFileReaderSupport()
```

### checkClipboardSupport()
Returns boolean for clipboard API support.

```typescript
if (checkClipboardSupport()) {
  await navigator.clipboard.writeText(text)
} else {
  // Show fallback modal
}
```

### Other Checks
- `checkLocalStorageSupport()`
- `checkSessionStorageSupport()`
- `getBrowserFeatures()` - Returns all feature support status
- `getBrowserName()` - Returns user-friendly browser name
- `isMobileBrowser()` - Checks if mobile device

## UI Components

### LoadingSpinner
Shows loading state during async operations.

```typescript
import { LoadingSpinner } from '@/components/ui/loading-spinner'

<LoadingSpinner 
  size="default" 
  text="Loading image..." 
  centered 
/>
```

Sizes: `sm`, `default`, `lg`, `xl`

### ClipboardFallback
Modal for manual copying when clipboard API fails.

```typescript
import { ClipboardFallback } from '@/components/shared/ClipboardFallback'

const [fallbackOpen, setFallbackOpen] = useState(false)
const [fallbackValue, setFallbackValue] = useState('')

<ClipboardFallback
  open={fallbackOpen}
  onOpenChange={setFallbackOpen}
  value={fallbackValue}
  label="HEX Color"
/>
```

## Usage Patterns

### File Upload Error Handling

```typescript
const handleFileSelect = (file: File) => {
  try {
    ensureFileReaderSupport()
    
    const reader = new FileReader()
    reader.onload = (e) => {
      // Process file
    }
    reader.onerror = () => {
      const error = new ImageProcessingError('Failed to read file')
      handleErrorWithToast(error, toast, 'FileUpload')
    }
    reader.readAsDataURL(file)
  } catch (error) {
    handleErrorWithToast(error, toast, 'FileUpload')
  }
}
```

### Canvas Error Handling

```typescript
useEffect(() => {
  try {
    ensureCanvasSupport()
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new BrowserCompatibilityError(
        'Canvas context not available',
        'canvas'
      )
    }
    
    // Draw on canvas
  } catch (error) {
    logError(error, 'ColorCanvas')
    setError(error.message)
  }
}, [])
```

### Clipboard with Fallback

```typescript
const copyToClipboard = async (text: string) => {
  try {
    if (!checkClipboardSupport()) {
      setFallbackValue(text)
      setFallbackOpen(true)
      return
    }
    
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copied!' })
  } catch (error) {
    logError(error, 'copyToClipboard')
    setFallbackValue(text)
    setFallbackOpen(true)
  }
}
```

### Network Request with Retry

```typescript
const fetchData = async () => {
  const fetchWithRetry = createRetryHandler(
    async () => {
      const res = await fetch('/api/data')
      if (!res.ok) {
        throw new NetworkError('Request failed', res.status >= 500)
      }
      return res.json()
    },
    3,
    1000
  )
  
  try {
    const data = await fetchWithRetry()
    return data
  } catch (error) {
    handleErrorWithToast(error, toast, 'fetchData')
  }
}
```

## Best Practices

1. **Always use try-catch** for async operations
2. **Log errors** with context using `logError()`
3. **Show user-friendly messages** using `handleErrorWithToast()`
4. **Check browser compatibility** before using features
5. **Provide fallbacks** for unsupported features
6. **Use loading states** during async operations
7. **Make errors retryable** when appropriate
8. **Test error scenarios** in development

## Testing Error Handling

To test error scenarios:

1. **File validation**: Try uploading files that are too large or wrong type
2. **Browser compatibility**: Test in older browsers or disable features in DevTools
3. **Network errors**: Use DevTools to throttle or block network requests
4. **Clipboard**: Test in browsers with clipboard API disabled
5. **Image processing**: Try corrupted or invalid image files

## Error Messages

All error messages should be:
- **User-friendly**: Avoid technical jargon
- **Actionable**: Tell users what to do next
- **Specific**: Explain what went wrong
- **Consistent**: Use similar language across the app

Good: "File size exceeds 10MB. Please choose a smaller image."
Bad: "ETOOBIG: File size validation failed"

## Future Enhancements

- Sentry integration for production error tracking
- Error boundary components for React error handling
- Offline detection and handling
- Rate limiting error handling
- More granular error codes for analytics
