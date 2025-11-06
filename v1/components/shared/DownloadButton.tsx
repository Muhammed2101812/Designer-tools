'use client'

import * as React from 'react'
import { Download, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/hooks/use-toast'

export interface DownloadButtonProps {
  /**
   * Name of the file to download (including extension)
   */
  fileName: string
  
  /**
   * File data as Blob or data URL string
   */
  fileData: Blob | string
  
  /**
   * MIME type of the file
   */
  fileType: string
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Button variant
   * @default "default"
   */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  
  /**
   * Button size
   * @default "default"
   */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Callback when download starts
   */
  onDownloadStart?: () => void
  
  /**
   * Callback when download completes
   */
  onDownloadComplete?: () => void
  
  /**
   * Show icon only (no text)
   * @default false
   */
  iconOnly?: boolean
}

/**
 * DownloadButton handles file downloads with progress indication and success feedback.
 * Supports both Blob objects and data URL strings.
 */
export function DownloadButton({
  fileName,
  fileData,
  fileType,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
  onDownloadStart,
  onDownloadComplete,
  iconOnly = false,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [downloadSuccess, setDownloadSuccess] = React.useState(false)
  const downloadLinkRef = React.useRef<HTMLAnchorElement>(null)
  
  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      // Call start callback
      onDownloadStart?.()
      
      // Create download URL
      let downloadUrl: string
      
      if (fileData instanceof Blob) {
        downloadUrl = URL.createObjectURL(fileData)
      } else if (typeof fileData === 'string') {
        // Assume it's a data URL
        downloadUrl = fileData
      } else {
        throw new Error('Invalid file data type')
      }
      
      // Create temporary link and trigger download
      const link = downloadLinkRef.current
      if (!link) {
        throw new Error('Download link not found')
      }
      
      link.href = downloadUrl
      link.download = fileName
      link.click()
      
      // Clean up object URL if it was created from Blob
      if (fileData instanceof Blob) {
        // Delay cleanup to ensure download starts
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl)
        }, 100)
      }
      
      // Show success state
      setDownloadSuccess(true)
      
      // Show success toast
      toast({
        title: 'Download started',
        description: `${fileName} is being downloaded.`,
      })
      
      // Call complete callback
      onDownloadComplete?.()
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setDownloadSuccess(false)
      }, 2000)
      
    } catch (error) {
      console.error('Download error:', error)
      
      toast({
        title: 'Download failed',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }
  
  const getButtonContent = () => {
    if (isDownloading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {!iconOnly && <span>Downloading...</span>}
        </>
      )
    }
    
    if (downloadSuccess) {
      return (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          {!iconOnly && <span>Downloaded!</span>}
        </>
      )
    }
    
    return (
      <>
        <Download className="h-4 w-4" aria-hidden="true" />
        {!iconOnly && <span>Download</span>}
      </>
    )
  }
  
  return (
    <>
      {/* Hidden download link */}
      <a
        ref={downloadLinkRef}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      
      {/* Download button */}
      <Button
        onClick={handleDownload}
        disabled={disabled || isDownloading || downloadSuccess}
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        aria-label={`Download ${fileName}`}
        aria-busy={isDownloading}
      >
        {getButtonContent()}
      </Button>
    </>
  )
}
