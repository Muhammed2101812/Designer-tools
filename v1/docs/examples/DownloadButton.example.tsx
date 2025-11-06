/**
 * DownloadButton Component Examples
 * 
 * This file demonstrates various usage patterns for the DownloadButton component.
 */

import { DownloadButton } from './DownloadButton'

// Example 1: Download from Blob
export function DownloadFromBlob() {
  const blob = new Blob(['Hello, World!'], { type: 'text/plain' })
  
  return (
    <DownloadButton
      fileName="hello.txt"
      fileData={blob}
      fileType="text/plain"
    />
  )
}

// Example 2: Download from data URL
export function DownloadFromDataURL() {
  const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  
  return (
    <DownloadButton
      fileName="pixel.png"
      fileData={dataUrl}
      fileType="image/png"
    />
  )
}

// Example 3: With callbacks
export function WithCallbacks() {
  const blob = new Blob(['Sample content'], { type: 'text/plain' })
  
  const handleStart = () => {
    console.log('Download started')
  }
  
  const handleComplete = () => {
    console.log('Download completed')
    // Could track analytics, update UI, etc.
  }
  
  return (
    <DownloadButton
      fileName="sample.txt"
      fileData={blob}
      fileType="text/plain"
      onDownloadStart={handleStart}
      onDownloadComplete={handleComplete}
    />
  )
}

// Example 4: Different variants
export function DifferentVariants() {
  const blob = new Blob(['Content'], { type: 'text/plain' })
  
  return (
    <div className="flex gap-2">
      <DownloadButton
        fileName="file.txt"
        fileData={blob}
        fileType="text/plain"
        variant="default"
      />
      
      <DownloadButton
        fileName="file.txt"
        fileData={blob}
        fileType="text/plain"
        variant="outline"
      />
      
      <DownloadButton
        fileName="file.txt"
        fileData={blob}
        fileType="text/plain"
        variant="secondary"
      />
    </div>
  )
}

// Example 5: Icon only
export function IconOnly() {
  const blob = new Blob(['Content'], { type: 'text/plain' })
  
  return (
    <DownloadButton
      fileName="file.txt"
      fileData={blob}
      fileType="text/plain"
      size="icon"
      iconOnly
    />
  )
}

// Example 6: In a tool result section
export function InToolResult() {
  // Simulated processed image
  const processedImageBlob = new Blob([], { type: 'image/png' })
  
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <img src="/placeholder.png" alt="Processed result" />
      </div>
      
      <div className="flex gap-2">
        <DownloadButton
          fileName="processed-image.png"
          fileData={processedImageBlob}
          fileType="image/png"
          className="flex-1"
        />
        
        <button className="px-4 py-2 border rounded-md">
          Process Another
        </button>
      </div>
    </div>
  )
}
