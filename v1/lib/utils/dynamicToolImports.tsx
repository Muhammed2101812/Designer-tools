/**
 * Dynamic imports for tool pages
 * Enables code splitting and lazy loading
 */

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

/**
 * Loading component for tool pages
 */
function ToolLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading tool...</p>
      </div>
    </div>
  )
}

/**
 * Dynamic imports for all tool pages
 * Each tool is loaded only when accessed
 */
export const DynamicToolPages = {
  ColorPicker: dynamic(() => import('@/app/(tools)/color-picker/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
  
  ImageCropper: dynamic(() => import('@/app/(tools)/image-cropper/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
  
  ImageResizer: dynamic(() => import('@/app/(tools)/image-resizer/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
  
  FormatConverter: dynamic(() => import('@/app/(tools)/format-converter/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
  
  QRGenerator: dynamic(() => import('@/app/(tools)/qr-generator/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
  
  GradientGenerator: dynamic(() => import('@/app/(tools)/gradient-generator/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
  
  ImageCompressor: dynamic(() => import('@/app/(tools)/image-compressor/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
}

/**
 * Preload a tool page
 * Useful for prefetching when user hovers over tool card
 */
export function preloadToolPage(toolId: string): void {
  // Dynamic components don't have preload method, so we'll use a different approach
  // The prefetch={false} on Link components handles this better
  // This function is kept for API compatibility but doesn't do anything
  // In production, Next.js will handle prefetching automatically
}
