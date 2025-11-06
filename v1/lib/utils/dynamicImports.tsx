/**
 * Dynamic Import Utilities
 * 
 * This module provides utilities for implementing code splitting through dynamic imports.
 * It helps reduce initial bundle size by loading components only when needed.
 */

import dynamic from 'next/dynamic'

import { ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Loading component for dynamic imports
 */
export const DynamicLoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center h-32 border rounded-lg bg-muted/20">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
)

/**
 * Canvas loading component for heavy canvas-based tools
 */
export const CanvasLoadingSpinner = ({ message = 'Loading canvas...' }: { message?: string }) => (
  <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
)

/**
 * Tool component loading placeholder
 */
export const ToolLoadingPlaceholder = ({ toolName }: { toolName: string }) => (
  <div className="p-6 border rounded-lg bg-card animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 bg-muted rounded" />
      <div className="h-6 bg-muted rounded w-32" />
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-32 bg-muted rounded w-full" />
    </div>
  </div>
)

/**
 * Configuration for dynamic imports with optimized loading states
 */
export interface DynamicImportConfig {
  loading?: ComponentType
  ssr?: boolean
}

/**
 * Create a dynamic import with standardized loading state
 */
export function createDynamicImport<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  config: DynamicImportConfig = {}
) {
  return dynamic(importFn, {
    loading: config.loading || (() => <DynamicLoadingSpinner />),
    ssr: config.ssr ?? false, // Most tools are client-side only
  })
}

/**
 * Create a dynamic import for canvas-based components
 */
export function createCanvasDynamicImport<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  toolName?: string
) {
  return dynamic(importFn, {
    loading: () => <CanvasLoadingSpinner message={`Loading ${toolName || 'canvas'}...`} />,
    ssr: false, // Canvas components are always client-side
  })
}

/**
 * Create a dynamic import for tool pages
 */
export function createToolDynamicImport<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  toolName: string
) {
  return dynamic(importFn, {
    loading: () => <ToolLoadingPlaceholder toolName={toolName} />,
    ssr: false, // Tools are client-side
  })
}

/**
 * Preload a dynamic component
 */
export function preloadComponent(importFn: () => Promise<any>) {
  // Trigger the import but don't wait for it
  importFn().catch(() => {
    // Silently fail - preloading is optional
  })
}

/**
 * Preload multiple components
 */
export function preloadComponents(importFns: Array<() => Promise<any>>) {
  importFns.forEach(preloadComponent)
}

/**
 * Common dynamic imports for frequently used heavy components
 */
export const DynamicComponents = {
  // Image processing components
  ImageCanvas: createCanvasDynamicImport(
    () => import('@/components/shared/ResponsiveCanvas').then(mod => ({ default: mod.ResponsiveCanvas })),
    'image canvas'
  ),
  
  // File uploader (heavy due to drag-drop and validation)
  FileUploader: createDynamicImport(
    () => import('@/components/shared/FileUploader').then(mod => ({ default: mod.FileUploader }))
  ),
  
  // Processing overlay (includes animations)
  ProcessingOverlay: createDynamicImport(
    () => import('@/components/shared/ProcessingOverlay').then(mod => ({ default: mod.ProcessingOverlay }))
  ),
  
  // Comparison slider (heavy due to interaction logic)
  ComparisonSlider: createDynamicImport(
    () => import('@/components/shared/ComparisonSlider').then(mod => ({ default: mod.ComparisonSlider }))
  ),
}

/**
 * Tool-specific dynamic imports
 */
export const ToolComponents = {
  ColorPicker: {
    Canvas: createCanvasDynamicImport(
      () => import('@/app/(tools)/color-picker/components/ColorCanvas').then(mod => ({ default: mod.ColorCanvas })),
      'color picker'
    ),
    Display: createDynamicImport(
      () => import('@/app/(tools)/color-picker/components/ColorDisplay').then(mod => ({ default: mod.ColorDisplay }))
    ),
    History: createDynamicImport(
      () => import('@/app/(tools)/color-picker/components/ColorHistory').then(mod => ({ default: mod.ColorHistory }))
    ),
  },
  
  ImageCropper: {
    Canvas: createCanvasDynamicImport(
      () => import('@/app/(tools)/image-cropper/components/CropCanvas').then(mod => ({ default: mod.CropCanvas })),
      'image cropper'
    ),
    Controls: createDynamicImport(
      () => import('@/app/(tools)/image-cropper/components/CropControls').then(mod => ({ default: mod.default }))
    ),
    AspectRatioSelector: createDynamicImport(
      () => import('@/app/(tools)/image-cropper/components/AspectRatioSelector').then(mod => ({ default: mod.default }))
    ),
  },
}

/**
 * Route-based preloading for likely next pages
 */
export const RoutePreloader = {
  preloadToolComponents: (currentTool: string) => {
    // Preload related tools based on current tool
    const relatedTools: Record<string, string[]> = {
      'color-picker': ['image-cropper', 'gradient-generator'],
      'image-cropper': ['image-resizer', 'format-converter'],
      'image-resizer': ['image-compressor', 'format-converter'],
      'format-converter': ['image-compressor', 'image-resizer'],
      'qr-generator': ['gradient-generator'],
      'gradient-generator': ['color-picker'],
      'image-compressor': ['image-resizer', 'format-converter'],
      'background-remover': ['image-upscaler', 'mockup-generator'],
      'image-upscaler': ['background-remover', 'image-compressor'],
      'mockup-generator': ['background-remover', 'image-upscaler'],
    }
    
    const related = relatedTools[currentTool] || []
    
    // Preload related tool components
    related.forEach(toolName => {
      preloadComponent(() => import(`@/app/(tools)/${toolName}/page`))
    })
  },
}