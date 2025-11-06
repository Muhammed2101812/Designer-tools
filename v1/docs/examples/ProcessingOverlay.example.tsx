/**
 * ProcessingOverlay Component Examples
 * 
 * This file demonstrates various usage patterns for the ProcessingOverlay component.
 */

import { useState } from 'react'
import { ProcessingOverlay } from './ProcessingOverlay'
import { Button } from '@/components/ui/button'

// Example 1: Simple indeterminate loading
export function SimpleLoading() {
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handleProcess = () => {
    setIsProcessing(true)
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
    }, 3000)
  }
  
  return (
    <>
      <Button onClick={handleProcess}>Start Processing</Button>
      
      <ProcessingOverlay
        isProcessing={isProcessing}
        message="Processing your image..."
      />
    </>
  )
}

// Example 2: With progress tracking
export function WithProgress() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const handleProcess = () => {
    setIsProcessing(true)
    setProgress(0)
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
  }
  
  return (
    <>
      <Button onClick={handleProcess}>Start Processing</Button>
      
      <ProcessingOverlay
        isProcessing={isProcessing}
        progress={progress}
        message="Upscaling your image..."
      />
    </>
  )
}

// Example 3: With cancel functionality
export function WithCancel() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const handleProcess = () => {
    setIsProcessing(true)
    setProgress(0)
    
    // Simulate processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          return 100
        }
        return prev + 5
      })
    }, 300)
    
    // Store interval ID for cancellation
    ;(window as any).processingInterval = interval
  }
  
  const handleCancel = () => {
    clearInterval((window as any).processingInterval)
    setIsProcessing(false)
    setProgress(0)
    console.log('Processing cancelled')
  }
  
  return (
    <>
      <Button onClick={handleProcess}>Start Processing</Button>
      
      <ProcessingOverlay
        isProcessing={isProcessing}
        progress={progress}
        message="Removing background..."
        onCancel={handleCancel}
      />
    </>
  )
}

// Example 4: Different messages based on progress
export function DynamicMessages() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const getMessage = () => {
    if (progress < 30) return 'Uploading image...'
    if (progress < 70) return 'Processing with AI...'
    if (progress < 100) return 'Finalizing result...'
    return 'Complete!'
  }
  
  const handleProcess = () => {
    setIsProcessing(true)
    setProgress(0)
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsProcessing(false), 500)
          return 100
        }
        return prev + 2
      })
    }, 100)
  }
  
  return (
    <>
      <Button onClick={handleProcess}>Start Processing</Button>
      
      <ProcessingOverlay
        isProcessing={isProcessing}
        progress={progress}
        message={getMessage()}
      />
    </>
  )
}

// Example 5: Without backdrop
export function WithoutBackdrop() {
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handleProcess = () => {
    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 3000)
  }
  
  return (
    <>
      <Button onClick={handleProcess}>Start Processing</Button>
      
      <ProcessingOverlay
        isProcessing={isProcessing}
        message="Processing..."
        showBackdrop={false}
      />
    </>
  )
}

// Example 6: In API tool workflow
export function InAPIToolWorkflow() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const processImage = async () => {
    setIsProcessing(true)
    setProgress(0)
    
    try {
      // Upload
      setProgress(20)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Process
      setProgress(50)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Download result
      setProgress(80)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProgress(100)
      setTimeout(() => setIsProcessing(false), 500)
    } catch (error) {
      console.error('Processing failed:', error)
      setIsProcessing(false)
    }
  }
  
  const handleCancel = () => {
    setIsProcessing(false)
    setProgress(0)
    // Cancel API request
  }
  
  return (
    <>
      <Button onClick={processImage}>Remove Background</Button>
      
      <ProcessingOverlay
        isProcessing={isProcessing}
        progress={progress}
        message="Removing background with AI..."
        onCancel={handleCancel}
      />
    </>
  )
}
