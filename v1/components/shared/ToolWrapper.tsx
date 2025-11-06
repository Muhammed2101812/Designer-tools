'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from './Breadcrumb'
import { RelatedTools } from './RelatedTools'
import { getToolByPath } from '@/config/tools'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useIsMobile } from '@/lib/utils/responsive'
import type { KeyboardShortcut } from '@/lib/hooks/useKeyboardShortcuts'
import { 
  useRenderPerformance, 
  useStableCallback, 
  useStableMemo 
} from '@/lib/utils/reactOptimizations'

export interface ToolWrapperProps {
  /**
   * The title of the tool displayed at the top
   */
  title: string
  
  /**
   * A brief description of what the tool does
   */
  description: string
  
  /**
   * Optional icon component or element to display next to the title
   */
  icon?: React.ReactNode
  
  /**
   * The main content of the tool
   */
  children: React.ReactNode
  
  /**
   * Whether to show the back navigation button
   * @default true
   */
  showBackButton?: boolean
  
  /**
   * Optional content to display in the info modal
   * If provided, an info button will be shown
   */
  infoContent?: React.ReactNode
  
  /**
   * Optional keyboard shortcuts to display in the info modal
   */
  keyboardShortcuts?: KeyboardShortcut[]
  
  /**
   * Additional CSS classes for the wrapper container
   */
  className?: string
  
  /**
   * Whether this is a client-side tool (shows privacy notice)
   * @default true
   */
  isClientSide?: boolean
  
  /**
   * Whether to show breadcrumb navigation
   * @default true
   */
  showBreadcrumb?: boolean
  
  /**
   * Whether to show related tools section
   * @default true
   */
  showRelatedTools?: boolean
}

export const ToolWrapper = React.memo(function ToolWrapper({
  title,
  description,
  icon,
  children,
  showBackButton = true,
  infoContent,
  keyboardShortcuts,
  className,
  isClientSide = true,
  showBreadcrumb = true,
  showRelatedTools = true,
}: ToolWrapperProps) {
  // Performance monitoring
  useRenderPerformance('ToolWrapper', 16)
  
  const router = useRouter()
  const pathname = usePathname()
  const [isInfoOpen, setIsInfoOpen] = React.useState(false)
  const isMobile = useIsMobile()

  // Memoized current tool to prevent re-computation
  const currentTool = useStableMemo(() => {
    return pathname ? getToolByPath(pathname) : null
  }, [pathname], 'ToolWrapper.currentTool')

  const handleBack = useStableCallback(() => {
    router.push('/#tools')
  }, [router])
  
  // Memoized breadcrumb items to prevent re-creation
  const breadcrumbItems = useStableMemo(() => [
    { label: 'Tools', href: '/#tools' },
    { label: title, href: pathname || '#' },
  ], [title, pathname], 'ToolWrapper.breadcrumbItems')

  // Info content component for reuse in both dialog and bottom sheet - memoized
  const InfoContent = useStableCallback(() => (
    <div className="space-y-6">
      {infoContent}
      
      {/* Keyboard Shortcuts Section - hide on mobile */}
      {keyboardShortcuts && keyboardShortcuts.length > 0 && !isMobile && (
        <div className="pt-4 border-t">
          <KeyboardShortcuts shortcuts={keyboardShortcuts} />
        </div>
      )}
    </div>
  ), [infoContent, keyboardShortcuts, isMobile])

  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {/* Header Section */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          {showBreadcrumb && (
            <div className="mb-4">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
                aria-label="Navigate back to tools page"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {icon && (
                  <div className="flex-shrink-0 text-primary" aria-hidden="true">
                    {icon}
                  </div>
                )}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
                  {title}
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>

            {/* Info Button - Desktop Dialog or Mobile Bottom Sheet */}
            {infoContent && (
              <>
                {!isMobile ? (
                  <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        aria-label={`Open ${title} instructions and information`}
                      >
                        <Info className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent 
                      className="max-w-2xl max-h-[80vh] overflow-y-auto"
                      aria-describedby="dialog-description"
                    >
                      <DialogHeader>
                        <DialogTitle>{title} - Instructions</DialogTitle>
                        <DialogDescription id="dialog-description">
                          Learn how to use this tool effectively
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <InfoContent />
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => setIsInfoOpen(true)}
                      aria-label={`Open ${title} instructions and information`}
                    >
                      <Info className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <BottomSheet
                      open={isInfoOpen}
                      onClose={() => setIsInfoOpen(false)}
                      title={`${title} - Instructions`}
                    >
                      <InfoContent />
                    </BottomSheet>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 lg:px-8" id="main-content" tabIndex={-1}>
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>

        {/* Related Tools Section */}
        {showRelatedTools && currentTool && (
          <div className="w-full max-w-7xl mx-auto mt-12">
            <RelatedTools currentToolId={currentTool.id} />
          </div>
        )}
      </main>

      {/* Privacy Notice Footer */}
      {isClientSide && (
        <footer className="border-t bg-muted/50 mt-auto" role="contentinfo">
          <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <p className="text-xs sm:text-sm text-center text-muted-foreground" role="status">
              <span aria-label="Privacy notice">🔒 All processing happens in your browser. Your files never leave your device.</span>
            </p>
          </div>
        </footer>
      )}
    </div>
  )
})
