/**
 * Performance-optimized ToolWrapper with lazy-loaded components
 * Implements Suspense boundaries and progressive loading
 */

'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from './Breadcrumb'
import { getToolByPath } from '@/config/tools'
import { useIsMobile } from '@/lib/utils/responsive'
import type { KeyboardShortcut } from '@/lib/hooks/useKeyboardShortcuts'

// Lazy load heavy components
const LazyRelatedTools = React.lazy(() => import('./RelatedTools').then(mod => ({ default: mod.RelatedTools })))
const LazyKeyboardShortcuts = React.lazy(() => import('./KeyboardShortcuts').then(mod => ({ default: mod.KeyboardShortcuts })))
const LazyDialog = React.lazy(() => import('@/components/ui/dialog').then(mod => ({
  default: mod.Dialog,
})))
const LazyDialogContent = React.lazy(() => import('@/components/ui/dialog').then(mod => ({
  default: mod.DialogContent,
})))
const LazyDialogDescription = React.lazy(() => import('@/components/ui/dialog').then(mod => ({
  default: mod.DialogDescription,
})))
const LazyDialogHeader = React.lazy(() => import('@/components/ui/dialog').then(mod => ({
  default: mod.DialogHeader,
})))
const LazyDialogTitle = React.lazy(() => import('@/components/ui/dialog').then(mod => ({
  default: mod.DialogTitle,
})))
const LazyDialogTrigger = React.lazy(() => import('@/components/ui/dialog').then(mod => ({
  default: mod.DialogTrigger,
})))
const LazyBottomSheet = React.lazy(() => import('@/components/ui/bottom-sheet').then(mod => ({
  default: mod.BottomSheet,
})))

// Lightweight loading components
const DialogPlaceholder = () => <div className="h-0" />
const RelatedToolsPlaceholder = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-muted rounded w-32 mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded-lg" />
      ))}
    </div>
  </div>
)

export interface OptimizedToolWrapperProps {
  title: string
  description: string
  icon?: React.ReactNode
  children: React.ReactNode
  showBackButton?: boolean
  isClientSide?: boolean
  className?: string
  infoContent?: React.ReactNode
  keyboardShortcuts?: KeyboardShortcut[]
  showRelatedTools?: boolean
}

export function OptimizedToolWrapper({
  title,
  description,
  icon,
  children,
  showBackButton = true,
  isClientSide = false,
  className,
  infoContent,
  keyboardShortcuts = [],
  showRelatedTools = true,
}: OptimizedToolWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  
  // State for progressive loading
  const [showInfo, setShowInfo] = React.useState(false)
  const [loadRelatedTools, setLoadRelatedTools] = React.useState(false)
  
  // Get current tool info
  const currentTool = React.useMemo(() => getToolByPath(pathname), [pathname])
  
  // Load related tools after main content is loaded
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoadRelatedTools(true)
    }, 2000) // Load after 2 seconds
    
    return () => clearTimeout(timer)
  }, [])
  
  const handleBack = React.useCallback(() => {
    router.back()
  }, [router])
  
  const handleInfoToggle = React.useCallback(() => {
    setShowInfo(prev => !prev)
  }, [])

  return (
    <div className={cn('container mx-auto px-4 py-6 space-y-6', className)}>
      {/* Header Section - Always loaded immediately */}
      <div className="flex flex-col space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center space-x-2"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <Breadcrumb />
          </div>
          
          {/* Info Button - Lazy load dialog */}
          {infoContent && (
            <React.Suspense fallback={<DialogPlaceholder />}>
              {isMobile ? (
                <LazyBottomSheet
                  open={showInfo}
                  onOpenChange={setShowInfo}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleInfoToggle}
                      className="flex items-center space-x-2"
                      aria-label="Tool information"
                    >
                      <Info className="h-4 w-4" />
                      <span className="hidden sm:inline">Info</span>
                    </Button>
                  }
                  title={`About ${title}`}
                  description={description}
                >
                  <div className="space-y-4">
                    {infoContent}
                    {keyboardShortcuts.length > 0 && (
                      <React.Suspense fallback={<div>Loading shortcuts...</div>}>
                        <LazyKeyboardShortcuts shortcuts={keyboardShortcuts} />
                      </React.Suspense>
                    )}
                  </div>
                </LazyBottomSheet>
              ) : (
                <LazyDialog open={showInfo} onOpenChange={setShowInfo}>
                  <LazyDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      aria-label="Tool information"
                    >
                      <Info className="h-4 w-4" />
                      <span className="hidden sm:inline">Info</span>
                    </Button>
                  </LazyDialogTrigger>
                  <LazyDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <LazyDialogHeader>
                      <LazyDialogTitle className="flex items-center space-x-2">
                        {icon}
                        <span>About {title}</span>
                      </LazyDialogTitle>
                      <LazyDialogDescription>{description}</LazyDialogDescription>
                    </LazyDialogHeader>
                    <div className="space-y-4">
                      {infoContent}
                      {keyboardShortcuts.length > 0 && (
                        <React.Suspense fallback={<div>Loading shortcuts...</div>}>
                          <LazyKeyboardShortcuts shortcuts={keyboardShortcuts} />
                        </React.Suspense>
                      )}
                    </div>
                  </LazyDialogContent>
                </LazyDialog>
              )}
            </React.Suspense>
          )}
        </div>

        {/* Tool Header */}
        <div className="flex items-center space-x-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-1">{description}</p>
            {isClientSide && (
              <div className="flex items-center space-x-2 mt-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  Privacy-first • Files never leave your browser
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Always loaded immediately */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Related Tools - Lazy loaded after delay */}
      {showRelatedTools && currentTool && (
        <div className="border-t pt-6">
          <React.Suspense fallback={<RelatedToolsPlaceholder />}>
            {loadRelatedTools && <LazyRelatedTools currentTool={currentTool} />}
          </React.Suspense>
        </div>
      )}
    </div>
  )
}