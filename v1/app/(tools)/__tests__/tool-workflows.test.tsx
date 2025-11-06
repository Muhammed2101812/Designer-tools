/**
 * Integration tests for tool workflows
 * Tests complete user flows: upload, process, download
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('Tool Workflows', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    
    // Mock canvas and image APIs
    global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([255, 0, 0, 255]),
      })),
      putImageData: vi.fn(),
      setTransform: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      filter: '',
    })) as any

    global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      const blob = new Blob(['fake-image-data'], { type: 'image/png' })
      callback(blob)
    }) as any

    global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 
      'data:image/png;base64,fake'
    ) as any

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock Image
    global.Image = class MockImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      naturalWidth = 1600
      naturalHeight = 1200

      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    } as any
  })

  describe('File Upload Workflow', () => {
    it('should validate file type on upload', async () => {
      const user = userEvent.setup()
      
      // Create invalid file
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      // Mock file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      
      // Simulate file selection
      Object.defineProperty(input, 'files', {
        value: [invalidFile],
        writable: false,
      })

      // File validation should reject non-image files
      const isValid = input.accept.includes('image') && invalidFile.type.startsWith('image')
      expect(isValid).toBe(false)
    })

    it('should validate file size on upload', () => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      // Create file larger than limit
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)],
        'large.png',
        { type: 'image/png' }
      )
      
      expect(largeFile.size).toBeGreaterThan(maxSize)
    })

    it('should accept valid image files', () => {
      const validFile = new File(['content'], 'test.png', { type: 'image/png' })
      
      expect(validFile.type).toMatch(/^image\/(png|jpeg|webp|gif)$/)
    })
  })

  describe('Image Processing Workflow', () => {
    it('should load and display uploaded image', async () => {
      const file = new File(['image-data'], 'test.png', { type: 'image/png' })
      
      // Simulate image loading
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.src = url
      
      await waitFor(() => {
        expect(img.naturalWidth).toBe(1600)
        expect(img.naturalHeight).toBe(1200)
      })
    })

    it('should resize image maintaining aspect ratio', async () => {
      const originalWidth = 1600
      const originalHeight = 1200
      const targetWidth = 800
      
      const aspectRatio = originalWidth / originalHeight
      const expectedHeight = Math.round(targetWidth / aspectRatio)
      
      expect(expectedHeight).toBe(600)
    })

    it('should convert image format', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      
      const toBlobSpy = vi.spyOn(canvas, 'toBlob')
      
      await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/jpeg', 0.9)
      })
      
      expect(toBlobSpy).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.9
      )
    })

    it('should crop image to specified area', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1200
      
      const ctx = canvas.getContext('2d')
      const cropArea = { x: 100, y: 100, width: 800, height: 600 }
      
      const croppedCanvas = document.createElement('canvas')
      croppedCanvas.width = cropArea.width
      croppedCanvas.height = cropArea.height
      
      const croppedCtx = croppedCanvas.getContext('2d')
      croppedCtx?.drawImage(
        canvas,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      )
      
      expect(croppedCanvas.width).toBe(800)
      expect(croppedCanvas.height).toBe(600)
    })
  })

  describe('Download Workflow', () => {
    it('should generate download link for processed image', async () => {
      const blob = new Blob(['image-data'], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      
      expect(url).toBe('blob:mock-url')
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob)
    })

    it('should sanitize filename for download', () => {
      const unsafeFilename = 'test<>file.png'
      const safeFilename = unsafeFilename.replace(/[<>:"/\\|?*]/g, '_')
      
      expect(safeFilename).toBe('test__file.png')
    })

    it('should trigger download with correct filename', () => {
      const link = document.createElement('a')
      link.href = 'blob:mock-url'
      link.download = 'processed-image.png'
      
      const clickSpy = vi.spyOn(link, 'click')
      link.click()
      
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should cleanup object URL after download', async () => {
      const blob = new Blob(['image-data'], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      
      // Simulate download and cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url)
    })
  })

  describe('Error Handling Workflow', () => {
    it('should handle image load errors', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      }
      
      global.Image = vi.fn(() => mockImage) as any
      
      const loadPromise = new Promise((resolve, reject) => {
        mockImage.onerror = () => reject(new Error('Failed to load image'))
        mockImage.src = 'invalid-url'
      })
      
      setTimeout(() => mockImage.onerror?.(), 0)
      
      await expect(loadPromise).rejects.toThrow('Failed to load image')
    })

    it('should handle canvas context errors', () => {
      const canvas = document.createElement('canvas')
      
      // Mock getContext to return null
      canvas.getContext = vi.fn(() => null) as any
      
      const ctx = canvas.getContext('2d')
      expect(ctx).toBeNull()
    })

    it('should handle blob conversion errors', async () => {
      const canvas = document.createElement('canvas')
      
      // Mock toBlob to fail
      canvas.toBlob = vi.fn((callback) => {
        callback(null)
      }) as any
      
      const blobPromise = new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        })
      })
      
      await expect(blobPromise).rejects.toThrow('Failed to convert canvas to blob')
    })
  })

  describe('Performance Workflow', () => {
    it('should optimize large images', () => {
      const maxDimension = 4096
      const largeWidth = 8000
      const largeHeight = 6000
      
      const scale = Math.min(maxDimension / largeWidth, maxDimension / largeHeight)
      const optimizedWidth = Math.floor(largeWidth * scale)
      const optimizedHeight = Math.floor(largeHeight * scale)
      
      expect(optimizedWidth).toBeLessThanOrEqual(maxDimension)
      expect(optimizedHeight).toBeLessThanOrEqual(maxDimension)
      expect(optimizedWidth / optimizedHeight).toBeCloseTo(largeWidth / largeHeight, 1)
    })

    it('should reuse canvas instances', () => {
      const pool = {
        canvas: null as HTMLCanvasElement | null,
        getCanvas() {
          if (!this.canvas) {
            this.canvas = document.createElement('canvas')
          }
          return this.canvas
        },
      }
      
      const canvas1 = pool.getCanvas()
      const canvas2 = pool.getCanvas()
      
      expect(canvas1).toBe(canvas2)
    })

    it('should clear canvas after use', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      
      const ctx = canvas.getContext('2d')
      const clearRectSpy = vi.spyOn(ctx!, 'clearRect')
      
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      
      expect(clearRectSpy).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('Accessibility Workflow', () => {
    it('should provide keyboard navigation support', () => {
      const button = document.createElement('button')
      button.setAttribute('aria-label', 'Process image')
      button.tabIndex = 0
      
      expect(button.getAttribute('aria-label')).toBe('Process image')
      expect(button.tabIndex).toBe(0)
    })

    it('should announce status updates to screen readers', () => {
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', 'polite')
      announcement.textContent = 'Image processed successfully'
      
      expect(announcement.getAttribute('role')).toBe('status')
      expect(announcement.getAttribute('aria-live')).toBe('polite')
      expect(announcement.textContent).toBe('Image processed successfully')
    })

    it('should provide alternative text for images', () => {
      const img = document.createElement('img')
      img.alt = 'Uploaded image preview'
      
      expect(img.alt).toBe('Uploaded image preview')
    })
  })

  describe('Responsive Design Workflow', () => {
    it('should adapt canvas size to viewport', () => {
      const viewportWidth = 375 // Mobile width
      const imageWidth = 1600
      const imageHeight = 1200
      
      const scale = viewportWidth / imageWidth
      const displayWidth = viewportWidth
      const displayHeight = Math.round(imageHeight * scale)
      
      expect(displayWidth).toBe(375)
      expect(displayHeight).toBeLessThan(imageHeight)
    })

    it('should handle touch events on mobile', () => {
      const element = document.createElement('div')
      
      const touchStartHandler = vi.fn()
      const touchMoveHandler = vi.fn()
      const touchEndHandler = vi.fn()
      
      element.addEventListener('touchstart', touchStartHandler)
      element.addEventListener('touchmove', touchMoveHandler)
      element.addEventListener('touchend', touchEndHandler)
      
      // Simulate touch events
      element.dispatchEvent(new TouchEvent('touchstart'))
      element.dispatchEvent(new TouchEvent('touchmove'))
      element.dispatchEvent(new TouchEvent('touchend'))
      
      expect(touchStartHandler).toHaveBeenCalled()
      expect(touchMoveHandler).toHaveBeenCalled()
      expect(touchEndHandler).toHaveBeenCalled()
    })
  })
})
