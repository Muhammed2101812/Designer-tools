'use client'

import * as React from 'react'
import { Upload, X, File as FileIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  validateFile,
  formatFileSize,
  getAcceptedTypesLabel,
  type FileValidationOptions,
} from '@/lib/utils/fileValidation'
import { validateFileMagicNumber } from '@/lib/utils/fileSecurity'
import { FileValidationError } from '@/types/errors'
import { logError } from '@/lib/utils/errorHandling'
import { 
  useRenderPerformance, 
  useStableCallback, 
  useStableMemo 
} from '@/lib/utils/reactOptimizations'

export interface FileUploaderProps {
  /**
   * Callback when file(s) are selected and validated
   */
  onFileSelect: (files: File | File[]) => void
  
  /**
   * Accepted file types (MIME types or extensions)
   * Example: "image/png,image/jpeg,image/webp" or ".png,.jpg,.webp"
   */
  accept?: string
  
  /**
   * Maximum file size in megabytes
   * @default 10
   */
  maxSize?: number
  
  /**
   * Description text shown in the upload area
   */
  description?: string
  
  /**
   * Whether to allow multiple file selection
   * @default false
   */
  multiple?: boolean
  
  /**
   * Additional CSS classes for the container
   */
  className?: string
  
  /**
   * Disabled state
   */
  disabled?: boolean
}

export const FileUploader = React.memo(function FileUploader({
  onFileSelect,
  accept,
  maxSize = 10,
  description,
  multiple = false,
  className,
  disabled = false,
}: FileUploaderProps) {
  // Performance monitoring
  useRenderPerformance('FileUploader', 16)
  
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dragCounter = React.useRef(0)

  // Memoized validation options to prevent re-creation
  const validationOptions: FileValidationOptions = useStableMemo(() => ({
    accept,
    maxSize,
  }), [accept, maxSize], 'FileUploader.validationOptions')

  const handleFiles = useStableCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError(null)
    const fileArray = Array.from(files)

    try {
      // Validate each file
      const validatedFiles: File[] = []
      
      for (const file of fileArray) {
        // Basic validation (type and size)
        const validation = validateFile(file, validationOptions)
        
        if (!validation.valid) {
          const error = new FileValidationError(validation.error || 'Invalid file')
          logError(error, 'FileUploader')
          setError(validation.error || 'Invalid file')
          return
        }
        
        // Magic number validation for images
        if (file.type.startsWith('image/')) {
          const magicValidation = await validateFileMagicNumber(file)
          if (!magicValidation.valid) {
            const error = new FileValidationError(
              magicValidation.error || 'File signature validation failed'
            )
            logError(error, 'FileUploader')
            setError(magicValidation.error || 'File signature validation failed')
            return
          }
        }
        
        validatedFiles.push(file)
      }

      // If multiple is false, only take the first file
      const filesToSet = multiple ? validatedFiles : [validatedFiles[0]]
      
      setSelectedFiles(filesToSet)
      
      // Call the callback with single file or array based on multiple prop
      if (multiple) {
        onFileSelect(filesToSet)
      } else {
        onFileSelect(filesToSet[0])
      }
    } catch (error) {
      logError(error, 'FileUploader')
      setError('Failed to process file. Please try again.')
    }
  }, [validationOptions, multiple, onFileSelect])

  const handleDragEnter = useStableCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current++
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
    }
  }, [])

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current--
    
    if (dragCounter.current === 0) {
      setIsDragActive(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragActive(false)
    dragCounter.current = 0
    
    if (disabled) return

    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  /**
   * Handle keyboard events for file upload area
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    
    // Allow Enter or Space to trigger file selection
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleBrowseClick()
    }
  }

  const handleClearFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setError(null)
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // If all files are cleared, we don't call onFileSelect
    // The parent component should handle the empty state
  }

  const handleClearAll = () => {
    setSelectedFiles([])
    setError(null)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const acceptedTypesLabel = getAcceptedTypesLabel(accept)

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Area */}
      {selectedFiles.length === 0 && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          className={cn(
            'relative flex flex-col items-center justify-center',
            'rounded-lg border-2 border-dashed',
            'px-4 py-8 sm:px-6 sm:py-10 transition-colors',
            'cursor-pointer hover:bg-muted/50 active:bg-muted/70',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'touch-manipulation',
            'min-h-[200px] sm:min-h-[240px]',
            isDragActive && 'border-primary bg-primary/5',
            !isDragActive && 'border-muted-foreground/25',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={!disabled ? handleBrowseClick : undefined}
          aria-label={`Upload file area. ${description || ''} Press Enter or Space to select files.`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInputChange}
            disabled={disabled}
            aria-hidden="true"
            tabIndex={-1}
          />
          
          <Upload
            className={cn(
              'h-10 w-10 sm:h-12 sm:w-12 mb-4',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-hidden="true"
          />
          
          <div className="text-center max-w-sm">
            <p className="text-sm sm:text-base font-medium mb-1">
              {isDragActive ? (
                'Drop your file here'
              ) : (
                <>
                  <span className="text-primary">Tap to upload</span>
                  <span className="hidden sm:inline"> or drag and drop</span>
                </>
              )}
            </p>
            
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {description}
              </p>
            )}
            
            <p className="text-xs sm:text-sm text-muted-foreground">
              {acceptedTypesLabel} (max {maxSize}MB)
              {multiple && ' • Multiple files allowed'}
            </p>
          </div>
        </div>
      )}

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2" role="list" aria-label="Selected files">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={cn(
                'flex items-center justify-between',
                'rounded-lg border bg-muted/50 px-4 py-3',
                'transition-colors hover:bg-muted'
              )}
              role="listitem"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground" aria-label={`File size: ${formatFileSize(file.size)}`}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleClearFile(index)}
                className="flex-shrink-0"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          
          {multiple && selectedFiles.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="w-full"
            >
              Clear All
            </Button>
          )}
          
          {!multiple && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBrowseClick}
              className="w-full"
            >
              Choose Different File
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
})
