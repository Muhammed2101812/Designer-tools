/**
 * Hook for lazy loading images
 * Uses Intersection Observer API for performance
 */

import { useEffect, useRef, useState } from 'react'

interface UseLazyImageOptions {
  threshold?: number
  rootMargin?: string
  placeholder?: string
}

export function useLazyImage(
  src: string,
  options: UseLazyImageOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E',
  } = options

  const [imageSrc, setImageSrc] = useState<string>(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately
      setImageSrc(src)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load the image
            const img = new Image()
            
            img.onload = () => {
              setImageSrc(src)
              setIsLoaded(true)
              observer.disconnect()
            }
            
            img.onerror = () => {
              setIsError(true)
              observer.disconnect()
            }
            
            img.src = src
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [src, threshold, rootMargin])

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError,
  }
}

/**
 * Lazy Image component
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  threshold?: number
  rootMargin?: string
  placeholder?: string
}

export function LazyImage({
  src,
  alt,
  threshold,
  rootMargin,
  placeholder,
  className,
  ...props
}: LazyImageProps) {
  const { imgRef, imageSrc, isLoaded, isError } = useLazyImage(src, {
    threshold,
    rootMargin,
    placeholder,
  })

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      data-loaded={String(isLoaded)}
      data-error={String(isError)}
      loading="lazy"
      {...props}
    />
  )
}
