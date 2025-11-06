/**
 * FileUploader Component Usage Examples
 * 
 * This file demonstrates various ways to use the FileUploader component.
 * Copy and adapt these examples for your specific use case.
 */

'use client'

import { useState } from 'react'
import { FileUploader } from './FileUploader'
import { toast } from '@/lib/hooks/use-toast'

// Example 1: Basic Image Upload (Single File)
export function BasicImageUpload() {
  const handleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file
    console.log('Selected file:', selectedFile)
    
    toast({
      title: 'File uploaded',
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`,
    })
  }

  return (
    <FileUploader
      onFileSelect={handleFileSelect}
      accept="image/png,image/jpeg,image/webp"
      maxSize={10}
      description="Upload an image to get started"
    />
  )
}

// Example 2: Multiple Files Upload
export function MultipleFilesUpload() {
  const [files, setFiles] = useState<File[]>([])

  const handleFileSelect = (selectedFiles: File | File[]) => {
    const fileArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles]
    setFiles(fileArray)
    
    toast({
      title: 'Files uploaded',
      description: `${fileArray.length} file(s) selected`,
    })
  }

  return (
    <div>
      <FileUploader
        onFileSelect={handleFileSelect}
        accept="image/*"
        maxSize={5}
        multiple
        description="Select multiple images"
      />
      
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Selected Files:</h3>
          <ul className="list-disc list-inside">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Example 3: With Image Preview
export function ImageUploadWithPreview() {
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file
    
    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
    
    toast({
      title: 'Image loaded',
      description: 'Preview generated successfully',
    })
  }

  return (
    <div className="space-y-4">
      <FileUploader
        onFileSelect={handleFileSelect}
        accept="image/png,image/jpeg,image/webp"
        maxSize={10}
        description="Upload an image to see preview"
      />
      
      {preview && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Preview:</h3>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto rounded"
          />
        </div>
      )}
    </div>
  )
}

// Example 4: PDF Upload
export function PDFUpload() {
  const handleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file
    
    // Process PDF file
    console.log('PDF file:', selectedFile)
    
    toast({
      title: 'PDF uploaded',
      description: selectedFile.name,
    })
  }

  return (
    <FileUploader
      onFileSelect={handleFileSelect}
      accept=".pdf,application/pdf"
      maxSize={20}
      description="Upload a PDF document"
    />
  )
}

// Example 5: Custom Size Limits
export function LargeFileUpload() {
  const handleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file
    
    toast({
      title: 'Large file uploaded',
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`,
    })
  }

  return (
    <FileUploader
      onFileSelect={handleFileSelect}
      accept="video/*"
      maxSize={100}
      description="Upload a video file (up to 100MB)"
    />
  )
}

// Example 6: Disabled State
export function DisabledUpload() {
  return (
    <FileUploader
      onFileSelect={() => {}}
      accept="image/*"
      disabled
      description="File upload is currently disabled"
    />
  )
}

// Example 7: Integration with Form
export function FormWithFileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')

  const handleFileSelect = (selectedFile: File | File[]) => {
    const file = Array.isArray(selectedFile) ? selectedFile[0] : selectedFile
    setFile(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file',
        variant: 'destructive',
      })
      return
    }

    // Process form submission
    console.log('Submitting:', { title, file })
    
    toast({
      title: 'Success',
      description: 'Form submitted successfully',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Image
        </label>
        <FileUploader
          onFileSelect={handleFileSelect}
          accept="image/*"
          maxSize={10}
          description="Upload your image"
        />
      </div>
      
      <button
        type="submit"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Submit
      </button>
    </form>
  )
}
