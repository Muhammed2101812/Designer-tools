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
  
  BackgroundRemover: dynamic(() => import('@/app/(tools)/background-remover/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
  
  ImageUpscaler: dynamic(() => import('@/app/(tools)/image-upscaler/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
  
  MockupGenerator: dynamic(() => import('@/app/(tools)/mockup-generator/page'), {
    loading: ToolLoadingSkeleton,
    ssr: false,
  }),
}

/**
 * Dynamic imports for heavy tool components
 * Used within tool pages for further code splitting
 */
export const DynamicToolComponents = {
  // Color Picker components
  ColorCanvas: dynamic(() => import('@/app/(tools)/color-picker/components/ColorCanvas').then(mod => ({ default: mod.ColorCanvas })), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // Image Cropper components
  CropCanvas: dynamic(() => import('@/app/(tools)/image-cropper/components/CropCanvas').then(mod => ({ default: mod.CropCanvas })), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // Image Resizer components
  ResizeCanvas: dynamic(() => import('@/app/(tools)/image-resizer/components/ResizeCanvas').then(mod => ({ default: mod.ResizeCanvas })), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // Format Converter components
  ConversionPreview: dynamic(() => import('@/app/(tools)/format-converter/components/ConversionPreview'), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // QR Generator components
  QRCanvas: dynamic(() => import('@/app/(tools)/qr-generator/components/QRCanvas'), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // Gradient Generator components
  GradientCanvas: dynamic(() => import('@/app/(tools)/gradient-generator/components/GradientCanvas'), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // Image Compressor components
  CompressionCanvas: dynamic(() => import('@/app/(tools)/image-compressor/components/CompressionCanvas').then(mod => ({ default: mod.CompressionCanvas })), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // Background Remover components
  RemovalPreview: dynamic(() => import('@/app/(tools)/background-remover/components/RemovalPreview').then(mod => ({ default: mod.RemovalPreview })), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // Image Upscaler components
  UpscalePreview: dynamic(() => import('@/app/(tools)/image-upscaler/components/UpscalePreview').then(mod => ({ default: mod.UpscalePreview })), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
    ssr: false,
  }),
  
  // Mockup Generator components
  MockupCanvas: dynamic(() => import('@/app/(tools)/mockup-generator/components/MockupCanvas').then(mod => ({ default: mod.MockupCanvas })), {
    loading: function LoadingComponent() {
      return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    },
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
