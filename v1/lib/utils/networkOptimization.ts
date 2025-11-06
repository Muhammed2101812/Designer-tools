/**
 * Network Optimization Utilities
 * Handles network errors, retries, and connection monitoring
 */

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryCondition?: (error: Error) => boolean
}

interface NetworkStatus {
  isOnline: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
}

/**
 * Enhanced fetch with automatic retry and error handling
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => isRetryableError(error)
  } = retryOptions

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxRetries || !retryCondition(lastError)) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )

      console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, lastError.message)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const retryableErrors = [
    'fetch',
    'network',
    'timeout',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_TIMED_OUT'
  ]

  const errorMessage = error.message.toLowerCase()
  return retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError.toLowerCase())
  )
}

/**
 * Get current network status
 */
export function getNetworkStatus(): NetworkStatus {
  const status: NetworkStatus = {
    isOnline: navigator.onLine
  }

  // Add connection info if available
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    status.effectiveType = connection?.effectiveType
    status.downlink = connection?.downlink
    status.rtt = connection?.rtt
  }

  return status
}

/**
 * Monitor network status changes
 */
export function monitorNetworkStatus(
  onStatusChange: (status: NetworkStatus) => void
): () => void {
  const handleOnline = () => onStatusChange(getNetworkStatus())
  const handleOffline = () => onStatusChange(getNetworkStatus())

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Monitor connection changes if available
  let connectionListener: (() => void) | null = null
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    connectionListener = () => onStatusChange(getNetworkStatus())
    connection?.addEventListener('change', connectionListener)
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (connectionListener && 'connection' in navigator) {
      const connection = (navigator as any).connection
      connection?.removeEventListener('change', connectionListener)
    }
  }
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(urls: string[]): Promise<void[]> {
  const preloadPromises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to preload: ${url}`))
      document.head.appendChild(link)
    })
  })

  return Promise.allSettled(preloadPromises).then(() => [])
}

/**
 * Optimize resource loading based on network conditions
 */
export function optimizeResourceLoading(): {
  shouldPreload: boolean
  shouldCompress: boolean
  maxConcurrentRequests: number
} {
  const networkStatus = getNetworkStatus()
  
  // Default values for unknown connections
  let shouldPreload = true
  let shouldCompress = false
  let maxConcurrentRequests = 6

  if (networkStatus.effectiveType) {
    switch (networkStatus.effectiveType) {
      case 'slow-2g':
      case '2g':
        shouldPreload = false
        shouldCompress = true
        maxConcurrentRequests = 2
        break
      case '3g':
        shouldPreload = false
        shouldCompress = true
        maxConcurrentRequests = 4
        break
      case '4g':
      default:
        shouldPreload = true
        shouldCompress = false
        maxConcurrentRequests = 6
        break
    }
  }

  return {
    shouldPreload,
    shouldCompress,
    maxConcurrentRequests
  }
}

/**
 * Create a network-aware fetch function
 */
export function createNetworkAwareFetch() {
  const networkSettings = optimizeResourceLoading()
  
  return async (url: string, options: RequestInit = {}) => {
    const retryOptions: RetryOptions = {
      maxRetries: networkSettings.maxConcurrentRequests > 4 ? 3 : 1,
      baseDelay: networkSettings.shouldCompress ? 2000 : 1000
    }

    return fetchWithRetry(url, options, retryOptions)
  }
}

/**
 * Handle RSC (React Server Components) errors
 */
export function handleRSCError(error: Error): void {
  console.error('RSC Error:', error)
  
  // Check if it's a network-related RSC error
  if (error.message.includes('RSC') || error.message.includes('Server Component')) {
    // Attempt to refresh the page after a short delay
    setTimeout(() => {
      if (confirm('A server error occurred. Would you like to refresh the page?')) {
        window.location.reload()
      }
    }, 1000)
  }
}

/**
 * Optimize script loading to prevent network errors
 */
export function optimizeScriptLoading(
  scriptUrl: string,
  options: {
    async?: boolean
    defer?: boolean
    timeout?: number
    retries?: number
  } = {}
): Promise<void> {
  const {
    async = true,
    defer = true,
    timeout = 10000,
    retries = 2
  } = options

  return new Promise((resolve, reject) => {
    let attempts = 0

    const loadScript = () => {
      attempts++
      
      const script = document.createElement('script')
      script.src = scriptUrl
      script.async = async
      script.defer = defer

      const timeoutId = setTimeout(() => {
        script.remove()
        if (attempts <= retries) {
          console.warn(`Script loading timeout (attempt ${attempts}/${retries + 1}), retrying: ${scriptUrl}`)
          setTimeout(loadScript, 1000 * attempts) // Exponential backoff
        } else {
          reject(new Error(`Script loading failed after ${retries + 1} attempts: ${scriptUrl}`))
        }
      }, timeout)

      script.onload = () => {
        clearTimeout(timeoutId)
        resolve()
      }

      script.onerror = () => {
        clearTimeout(timeoutId)
        script.remove()
        
        if (attempts <= retries) {
          console.warn(`Script loading error (attempt ${attempts}/${retries + 1}), retrying: ${scriptUrl}`)
          setTimeout(loadScript, 1000 * attempts)
        } else {
          reject(new Error(`Script loading failed after ${retries + 1} attempts: ${scriptUrl}`))
        }
      }

      document.head.appendChild(script)
    }

    loadScript()
  })
}