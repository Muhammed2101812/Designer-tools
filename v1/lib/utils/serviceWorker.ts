/**
 * Service Worker registration and management utilities
 * Handles service worker lifecycle and caching strategies
 */

/**
 * Register service worker for static asset caching
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('Service Worker registered successfully:', registration.scope)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            showUpdateNotification(registration)
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/**
 * Show update notification when new service worker is available
 */
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // You can integrate this with your toast system
  if (confirm('A new version is available. Reload to update?')) {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }
}

/**
 * Preload critical resources using service worker
 */
export function preloadCriticalResources(urls: string[]): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls,
    })
  }
}

/**
 * Check if service worker is supported and active
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
}

/**
 * Get service worker registration status
 */
export async function getServiceWorkerStatus(): Promise<{
  supported: boolean
  registered: boolean
  active: boolean
}> {
  if (!isServiceWorkerSupported()) {
    return { supported: false, registered: false, active: false }
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    return {
      supported: true,
      registered: !!registration,
      active: !!registration?.active,
    }
  } catch {
    return { supported: true, registered: false, active: false }
  }
}

/**
 * Clear all service worker caches
 */
export async function clearServiceWorkerCaches(): Promise<void> {
  if (!isServiceWorkerSupported()) return

  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    console.log('All service worker caches cleared')
  } catch (error) {
    console.error('Failed to clear service worker caches:', error)
  }
}

/**
 * Update service worker and reload page
 */
export async function updateServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) return

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    }
  } catch (error) {
    console.error('Failed to update service worker:', error)
  }
}

/**
 * Initialize service worker with critical resource preloading
 */
export async function initializeServiceWorker(criticalResources: string[] = []): Promise<void> {
  const registration = await registerServiceWorker()
  
  if (registration && criticalResources.length > 0) {
    // Wait a bit for service worker to be ready
    setTimeout(() => {
      preloadCriticalResources(criticalResources)
    }, 1000)
  }
}

/**
 * Service worker event listeners for better UX
 */
export function setupServiceWorkerListeners(): void {
  if (!isServiceWorkerSupported()) return

  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed')
    // Optionally reload the page or show notification
  })

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('Service Worker: Cache updated for', event.data.url)
    }
  })
}

/**
 * Resource hints for critical resources
 */
export function addResourceHints(): void {
  if (typeof document === 'undefined') return

  const criticalResources = [
    // Critical CSS
    { href: '/_next/static/css/app.css', as: 'style' },
    
    // Critical fonts
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    
    // Critical images
    { href: '/favicon.ico', as: 'image' },
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource.href
    link.as = resource.as
    
    if (resource.type) {
      link.type = resource.type
    }
    
    if (resource.crossOrigin) {
      link.crossOrigin = resource.crossOrigin
    }
    
    document.head.appendChild(link)
  })
}

/**
 * Prefetch likely next pages based on current route
 */
export function prefetchLikelyPages(currentPath: string): void {
  if (typeof document === 'undefined') return

  const prefetchMap: Record<string, string[]> = {
    '/': ['/dashboard', '/pricing'],
    '/dashboard': ['/tools/color-picker', '/settings'],
    '/pricing': ['/dashboard', '/signup'],
    '/tools/color-picker': ['/tools/gradient-generator', '/tools/image-cropper'],
    '/tools/image-cropper': ['/tools/image-resizer', '/tools/format-converter'],
  }

  const pagesToPrefetch = prefetchMap[currentPath] || []

  pagesToPrefetch.forEach(path => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = path
    document.head.appendChild(link)
  })
}