/**
 * Optimized Image component with lazy loading and progressive enhancement
 * Uses Next.js Image component with additional performance optimizations
 */

'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import { useProgressiveImage } from '@/lib/utils/progressiveLoading'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
  blurDataURL?: string
  priority?: boolean
  quality?: number
  sizes?: string
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  onLoad?: () => void
  onError?: () => void
  lazy?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  blurDataURL,
  priority = false,
  quality = 85,
  sizes,
  fill = false,
  objectFit = 'cover',
  onLoad,
  onError,
  lazy = true,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  // Use progressive loading for non-priority images
  const { src: progressiveSrc, isLoading } = useProgressiveImage(
    src,
    placeholder
  )

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    onError?.()
  }, [onError])

  // Generate blur data URL if not provided
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL
    
    // Generate a simple blur data URL
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>`
    ).toString('base64')}`
  }

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="h-8 w-8 bg-muted-foreground/20 rounded mx-auto mb-2" />
          <p className="text-xs">Failed to load image</p>
        </div>
      </div>
    )
  }

  const imageProps = {
    src: priority ? src : progressiveSrc || src,
    alt,
    onLoad: handleLoad,
    onError: handleError,
    quality,
    className: cn(
      'transition-opacity duration-300',
      isLoaded ? 'opacity-100' : 'opacity-0',
      className
    ),
    placeholder: (blurDataURL || placeholder) ? 'blur' as const : undefined,
    blurDataURL: getBlurDataURL(),
    priority,
    sizes,
    ...props,
  }

  if (fill) {
    return (
      <div className="relative overflow-hidden">
        <Image
          {...imageProps}
          fill
          style={{ objectFit }}
          loading={lazy && !priority ? 'lazy' : 'eager'}
        />
        {!isLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Image
        {...imageProps}
        width={width}
        height={height}
        loading={lazy && !priority ? 'lazy' : 'eager'}
      />
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  )
}

/**
 * Optimized avatar component with fallback
 */
interface OptimizedAvatarProps {
  src?: string
  alt: string
  size?: number
  className?: string
  fallback?: string
}

export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
  fallback,
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground rounded-full',
          className
        )}
        style={{ width: size, height: size }}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      onError={() => setHasError(true)}
      quality={90}
      priority={false}
    />
  )
}

/**
 * Optimized hero image with responsive sizes
 */
interface OptimizedHeroImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function OptimizedHeroImage({
  src,
  alt,
  className = '',
  priority = true,
}: OptimizedHeroImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={className}
      priority={priority}
      quality={90}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
      objectFit="cover"
    />
  )
}

/**
 * Optimized thumbnail grid component
 */
interface OptimizedThumbnailProps {
  src: string
  alt: string
  size?: number
  className?: string
  onClick?: () => void
}

export function OptimizedThumbnail({
  src,
  alt,
  size = 120,
  className = '',
  onClick,
}: OptimizedThumbnailProps) {
  return (
    <div
      className={cn(
        'cursor-pointer transition-transform hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-lg"
        quality={80}
        sizes={`${size}px`}
        lazy={true}
      />
    </div>
  )
}