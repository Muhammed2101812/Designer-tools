/**
 * Dynamic imports for heavy UI components
 * Implements component-level code splitting with Suspense boundaries
 */

import React, { Suspense, ComponentType, ReactNode } from 'react'
import { createDynamicComponent } from './dynamicLoading'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

/**
 * Lightweight placeholder for heavy tool interfaces
 */
export const ToolInterfacePlaceholder = ({ toolName }: { toolName: string }) => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header area */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-10 bg-muted rounded w-32" />
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas/main area */}
        <div className="lg:col-span-2">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading {toolName}...</p>
            </div>
          </div>
        </div>
        
        {/* Controls area */}
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Canvas component placeholder
 */
export const CanvasPlaceholder = () => {
  return (
    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading canvas...</p>
      </div>
    </div>
  )
}

/**
 * File uploader placeholder
 */
export const FileUploaderPlaceholder = () => {
  return (
    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
      <div className="text-center animate-pulse">
        <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-4" />
        <div className="h-4 bg-muted rounded w-48 mx-auto mb-2" />
        <div className="h-3 bg-muted rounded w-32 mx-auto" />
      </div>
    </div>
  )
}

/**
 * Comparison slider placeholder
 */
export const ComparisonSliderPlaceholder = () => {
  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-muted animate-pulse" />
        <div className="w-1 bg-primary" />
        <div className="flex-1 bg-muted/80 animate-pulse" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  )
}

// Dynamic component imports with appropriate loading states

/**
 * Heavy canvas components (client-side only)
 */
export const DynamicColorCanvas = createDynamicComponent(
  'Color Canvas',
  '@/app/(tools)/color-picker/components/ColorCanvas',
  {
    ssr: false,
    loading: CanvasPlaceholder,
  }
)

export const DynamicCropCanvas = createDynamicComponent(
  'Crop Canvas',
  '@/app/(tools)/image-cropper/components/CropCanvas',
  {
    ssr: false,
    loading: CanvasPlaceholder,
  }
)

/**
 * File processing components
 */
export const DynamicFileUploader = createDynamicComponent(
  'File Uploader',
  '@/components/shared/FileUploader',
  {
    loading: FileUploaderPlaceholder,
  }
)

export const DynamicComparisonSlider = createDynamicComponent(
  'Comparison Slider',
  '@/components/shared/ComparisonSlider',
  {
    loading: ComparisonSliderPlaceholder,
  }
)

/**
 * Heavy UI components
 */
export const DynamicUpgradeDialog = createDynamicComponent(
  'Upgrade Dialog',
  '@/components/shared/UpgradeDialog',
  {
    loading: () => {
      return <div className="h-0" />
    }, // Invisible loading for dialogs
  }
)

export const DynamicUsageIndicator = createDynamicComponent(
  'Usage Indicator',
  '@/components/shared/UsageIndicator',
  {
    loading: () => {
      return <div className="h-4 bg-muted rounded-full animate-pulse" />
    },
  }
)

/**
 * Tool-specific heavy components
 */
export const DynamicColorDisplay = createDynamicComponent(
  'Color Display',
  '@/app/(tools)/color-picker/components/ColorDisplay',
  {
    loading: () => {
      return (
        <div className="p-4 border rounded-lg bg-card animate-pulse">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-24 w-full mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      )
    },
  }
)

export const DynamicColorHistory = createDynamicComponent(
  'Color History',
  '@/app/(tools)/color-picker/components/ColorHistory',
  {
    loading: () => {
      return (
        <div className="p-4 border rounded-lg bg-card animate-pulse">
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-9" />
            <Skeleton className="flex-1 h-9" />
          </div>
        </div>
      )
    },
  }
)

/**
 * Wrapper component with Suspense boundary
 */
export function withSuspense<T extends object>(
  Component: ComponentType<T>,
  fallback?: ReactNode
): ComponentType<T> {
  return function SuspenseWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <div>Loading...</div>}>
        <Component {...props} />
      </Suspense>
    )
  }
}

/**
 * Create a lazy-loaded component with Suspense boundary
 */
export function createLazyComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ReactNode
): ComponentType<T> {
  const LazyComponent = createDynamicComponent('Component', importFn as any, {
    loading: () => {
      return fallback || <div>Loading...</div>
    },
  })
  
  return withSuspense(LazyComponent, fallback)
}