/**
 * Hook for using Web Worker for image processing
 * Prevents UI blocking during heavy operations
 */

import { useRef, useCallback, useEffect } from 'react'

interface WorkerMessage {
  type: 'resize' | 'compress' | 'convert' | 'crop' | 'rotate'
  imageData: ImageData
  options: any
  id: string
}

interface WorkerResponse {
  type: 'complete' | 'error' | 'progress'
  data?: ImageData
  error?: string
  progress?: number
  id: string
}

interface ProcessOptions {
  onProgress?: (progress: number) => void
  onComplete: (result: ImageData) => void
  onError?: (error: string) => void
}

export function useImageWorker() {
  const workerRef = useRef<Worker | null>(null)
  const callbacksRef = useRef<Map<string, ProcessOptions>>(new Map())

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Create worker from file
      workerRef.current = new Worker(
        new URL('../workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      )

      // Handle messages from worker
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { type, data, error, progress, id } = e.data
        const callbacks = callbacksRef.current.get(id)

        if (!callbacks) return

        switch (type) {
          case 'complete':
            if (data) {
              callbacks.onComplete(data)
            }
            callbacksRef.current.delete(id)
            break

          case 'error':
            if (callbacks.onError && error) {
              callbacks.onError(error)
            }
            callbacksRef.current.delete(id)
            break

          case 'progress':
            if (callbacks.onProgress && progress !== undefined) {
              callbacks.onProgress(progress)
            }
            break
        }
      }

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error)
        // Notify all pending callbacks
        callbacksRef.current.forEach((callbacks) => {
          if (callbacks.onError) {
            callbacks.onError('Worker error occurred')
          }
        })
        callbacksRef.current.clear()
      }
    } catch (error) {
      console.warn('Web Worker not supported:', error)
    }

    return () => {
      const currentCallbacks = callbacksRef.current
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      currentCallbacks.clear()
    }
  }, [])

  /**
   * Process image using worker
   */
  const processImage = useCallback(
    (
      type: 'resize' | 'crop' | 'rotate',
      imageData: ImageData,
      options: any,
      callbacks: ProcessOptions
    ) => {
      if (!workerRef.current) {
        // Fallback: process on main thread
        console.warn('Worker not available, processing on main thread')
        callbacks.onError?.('Worker not available')
        return
      }

      const id = Math.random().toString(36).substring(7)
      callbacksRef.current.set(id, callbacks)

      const message: WorkerMessage = {
        type,
        imageData,
        options,
        id,
      }

      workerRef.current.postMessage(message)
    },
    []
  )

  /**
   * Resize image using worker
   */
  const resizeImage = useCallback(
    (
      imageData: ImageData,
      width: number,
      height: number,
      callbacks: ProcessOptions
    ) => {
      processImage('resize', imageData, { width, height }, callbacks)
    },
    [processImage]
  )

  /**
   * Crop image using worker
   */
  const cropImage = useCallback(
    (
      imageData: ImageData,
      x: number,
      y: number,
      width: number,
      height: number,
      callbacks: ProcessOptions
    ) => {
      processImage('crop', imageData, { x, y, width, height }, callbacks)
    },
    [processImage]
  )

  /**
   * Rotate image using worker
   */
  const rotateImage = useCallback(
    (imageData: ImageData, degrees: number, callbacks: ProcessOptions) => {
      processImage('rotate', imageData, { degrees }, callbacks)
    },
    [processImage]
  )

  /**
   * Check if worker is available
   */
  const isWorkerAvailable = useCallback(() => {
    return workerRef.current !== null
  }, [])

  return {
    resizeImage,
    cropImage,
    rotateImage,
    isWorkerAvailable,
  }
}
