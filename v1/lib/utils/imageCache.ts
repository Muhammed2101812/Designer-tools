/**
 * Image caching utility using sessionStorage
 * Caches processed images to avoid re-processing
 */

const CACHE_KEY_PREFIX = 'tool_cache_'
const MAX_CACHE_SIZE = 5 * 1024 * 1024 // 5MB max cache size
const MAX_CACHE_ITEMS = 10

interface CacheEntry {
  data: string // Base64 data URL
  timestamp: number
  size: number
  toolId: string
  fileHash: string
}

/**
 * Generate a simple hash from file
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex.substring(0, 16) // Use first 16 chars
}

/**
 * Get cache key for a tool and file
 */
function getCacheKey(toolId: string, fileHash: string): string {
  return `${CACHE_KEY_PREFIX}${toolId}_${fileHash}`
}

/**
 * Get all cache keys
 */
function getAllCacheKeys(): string[] {
  const keys: string[] = []
  
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return keys
  }

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith(CACHE_KEY_PREFIX)) {
      keys.push(key)
    }
  }
  
  return keys
}

/**
 * Get total cache size
 */
function getCacheSize(): number {
  const keys = getAllCacheKeys()
  let totalSize = 0

  keys.forEach((key) => {
    try {
      const entry = JSON.parse(sessionStorage.getItem(key) || '{}') as CacheEntry
      totalSize += entry.size || 0
    } catch {
      // Invalid entry, ignore
    }
  })

  return totalSize
}

/**
 * Remove oldest cache entries to make space
 */
function evictOldEntries(spaceNeeded: number): void {
  const keys = getAllCacheKeys()
  const entries: Array<{ key: string; entry: CacheEntry }> = []

  // Parse all entries
  keys.forEach((key) => {
    try {
      const entry = JSON.parse(sessionStorage.getItem(key) || '{}') as CacheEntry
      entries.push({ key, entry })
    } catch {
      // Invalid entry, remove it
      sessionStorage.removeItem(key)
    }
  })

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.entry.timestamp - b.entry.timestamp)

  // Remove entries until we have enough space
  let freedSpace = 0
  for (const { key, entry } of entries) {
    if (freedSpace >= spaceNeeded) break
    
    sessionStorage.removeItem(key)
    freedSpace += entry.size || 0
  }
}

/**
 * Cache a processed image result
 */
export async function cacheImageResult(
  toolId: string,
  fileHash: string,
  blob: Blob
): Promise<void> {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }

  try {
    // Convert blob to base64
    const reader = new FileReader()
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const data = reader.result as string
        const size = data.length

        // Check if we need to evict entries
        const currentSize = getCacheSize()
        const totalKeys = getAllCacheKeys().length

        if (currentSize + size > MAX_CACHE_SIZE || totalKeys >= MAX_CACHE_ITEMS) {
          evictOldEntries(size)
        }

        // Store the entry
        const entry: CacheEntry = {
          data,
          timestamp: Date.now(),
          size,
          toolId,
          fileHash,
        }

        const key = getCacheKey(toolId, fileHash)
        
        try {
          sessionStorage.setItem(key, JSON.stringify(entry))
          resolve()
        } catch (error) {
          // Storage quota exceeded, clear cache and try again
          clearImageCache()
          try {
            sessionStorage.setItem(key, JSON.stringify(entry))
            resolve()
          } catch {
            // Still failed, give up
            reject(error)
          }
        }
      }

      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('Failed to cache image result:', error)
  }
}

/**
 * Get cached image result
 */
export function getCachedImageResult(
  toolId: string,
  fileHash: string
): string | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null
  }

  try {
    const key = getCacheKey(toolId, fileHash)
    const stored = sessionStorage.getItem(key)
    
    if (!stored) return null

    const entry = JSON.parse(stored) as CacheEntry
    
    // Check if entry is too old (older than 1 hour)
    const maxAge = 60 * 60 * 1000 // 1 hour
    if (Date.now() - entry.timestamp > maxAge) {
      sessionStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch (error) {
    console.warn('Failed to get cached image result:', error)
    return null
  }
}

/**
 * Clear all cached images
 */
export function clearImageCache(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }

  const keys = getAllCacheKeys()
  keys.forEach((key) => sessionStorage.removeItem(key))
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  count: number
  maxSize: number
  maxCount: number
} {
  return {
    size: getCacheSize(),
    count: getAllCacheKeys().length,
    maxSize: MAX_CACHE_SIZE,
    maxCount: MAX_CACHE_ITEMS,
  }
}
