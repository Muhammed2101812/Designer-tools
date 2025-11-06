/**
 * Dynamic loading utilities for route-based code splitting
 * Implements preloading strategies and loading states for tool pages
 */

import dynamic from 'next/dynamic'
import React, { ComponentType, ReactElement } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Loading component for tool pages
 */
export const ToolPageLoader = ({ toolName }: { toolName: string }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-lg font-medium">Loading {toolName}...</p>
          <p className="text-sm text-muted-foreground">Preparing your design tool</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Generic loading component for heavy components
 */
export const ComponentLoader = ({ name }: { name: string }) => {
  return (
    <div className="flex items-center justify-center h-32 border rounded-lg bg-muted/20">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading {name}...</p>
      </div>
    </div>
  )
}

/**
 * Create a dynamically imported tool page with loading state
 */
export function createDynamicToolPage(
  toolName: string,
  importPath: string
): ComponentType<any> {
  return dynamic(() => import(importPath), {
    loading: () => {
      return <ToolPageLoader toolName={toolName} />
    },
    ssr: false, // Tools are client-side only
  })
}

/**
 * Create a dynamically imported component with loading state
 */
export function createDynamicComponent<T = {}>(
  componentName: string,
  importPath: string,
  options: {
    ssr?: boolean
    loading?: () => ReactElement
  } = {}
): ComponentType<T> {
  const { ssr = true, loading } = options
  
  return dynamic(() => import(importPath), {
    loading: loading || (() => {
      return <ComponentLoader name={componentName} />
    }),
    ssr,
  })
}

/**
 * Preload a route for better perceived performance
 */
export async function preloadRoute(routePath: string): Promise<void> {
  try {
    // Use Next.js router prefetch for route preloading
    const { useRouter } = await import('next/navigation')
    // Note: This is a utility function, actual preloading happens in components
  } catch (error) {
    console.warn('Failed to preload route:', routePath, error)
  }
}

/**
 * Tool navigation patterns for intelligent preloading
 * Based on common user workflows
 */
export const TOOL_NAVIGATION_PATTERNS = {
  // Users often go from color picker to gradient generator
  'color-picker': ['gradient-generator', 'image-cropper'],
  
  // Image editing workflow
  'image-cropper': ['image-resizer', 'format-converter'],
  'image-resizer': ['image-compressor', 'format-converter'],
  'format-converter': ['image-compressor'],
  
  // Background removal workflow
  'background-remover': ['mockup-generator', 'image-compressor'],
  
  // QR and mockup generation
  'qr-generator': ['mockup-generator'],
  'mockup-generator': ['image-compressor'],
  
  // Upscaling workflow
  'image-upscaler': ['image-compressor', 'format-converter'],
  
  // Compression is often the final step
  'image-compressor': ['format-converter'],
  
  // Gradient to color picker
  'gradient-generator': ['color-picker'],
} as const

/**
 * Get likely next routes based on current tool
 */
export function getLikelyNextRoutes(currentTool: string): string[] {
  const patterns = TOOL_NAVIGATION_PATTERNS[currentTool as keyof typeof TOOL_NAVIGATION_PATTERNS]
  return patterns ? [...patterns] : []
}

/**
 * Preload likely next routes based on user navigation patterns
 */
export function preloadLikelyRoutes(currentTool: string): void {
  const likelyRoutes = getLikelyNextRoutes(currentTool)
  
  likelyRoutes.forEach(route => {
    // Use requestIdleCallback for non-blocking preloading
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        // Preload the route component
        import(`@/app/(tools)/${route}/page`).catch(() => {
          // Silently fail - preloading is optional
        })
      })
    }
  })
}