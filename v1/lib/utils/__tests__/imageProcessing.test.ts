/**
 * Unit tests for imageProcessing utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  calculateDimensions,
  getImageFormat,
  getOptimalCanvasSize,
  loadImage,
  resizeImage,
  canvasToBlob,
  convertImageFormat,
  cropImage,
  rotateImage,
} from '../imageProcessing'

describe('imageProcessing', () => {
  describe('calculateDimensions', () => {
    it('should maintain aspect ratio when only width is provided', () => {
      const result = calculateDimensions(
        { width: 1600, height: 1200 },
        { width: 800 }
      )
      expect(result).toEqual({ width: 800, height: 600 })
    })

    it('should maintain aspect ratio when only height is provided', () => {
      const result = calculateDimensions(
        { width: 1600, height: 1200 },
        { height: 600 }
      )
      expect(result).toEqual({ width: 800, height: 600 })
    })

    it('should return both dimensions when both are provided', () => {
      const result = calculateDimensions(
        { width: 1600, height: 1200 },
        { width: 800, height: 400 }
      )
      expect(result).toEqual({ width: 800, height: 400 })
    })

    it('should return original dimensions when no target provided', () => {
      const result = calculateDimensions({ width: 1600, height: 1200 }, {})
      expect(result).toEqual({ width: 1600, height: 1200 })
    })

    it('should handle portrait images correctly', () => {
      const result = calculateDimensions(
        { width: 1200, height: 1600 },
        { width: 600 }
      )
      expect(result).toEqual({ width: 600, height: 800 })
    })
  })

  describe('getImageFormat', () => {
    it('should extract png format from MIME type', () => {
      expect(getImageFormat('image/png')).toBe('png')
    })

    it('should extract webp format from MIME type', () => {
      expect(getImageFormat('image/webp')).toBe('webp')
    })

    it('should default to jpeg for unknown formats', () => {
      expect(getImageFormat('image/jpeg')).toBe('jpeg')
      expect(getImageFormat('image/jpg')).toBe('jpeg')
      expect(getImageFormat('image/unknown')).toBe('jpeg')
    })
  })

  describe('getOptimalCanvasSize', () => {
    it('should return original size when within limits', () => {
      const result = getOptimalCanvasSize(1920, 1080)
      expect(result).toEqual({ width: 1920, height: 1080 })
    })

    it('should scale down large images proportionally', () => {
      const result = getOptimalCanvasSize(8192, 4096)
      expect(result.width).toBeLessThanOrEqual(4096)
      expect(result.height).toBeLessThanOrEqual(4096)
      expect(result.width / result.height).toBeCloseTo(2, 1)
    })

    it('should respect custom max dimension', () => {
      const result = getOptimalCanvasSize(4000, 3000, 2000)
      expect(result.width).toBeLessThanOrEqual(2000)
      expect(result.height).toBeLessThanOrEqual(2000)
    })

    it('should handle portrait images correctly', () => {
      const result = getOptimalCanvasSize(4096, 8192)
      expect(result.width).toBeLessThanOrEqual(4096)
      expect(result.height).toBeLessThanOrEqual(4096)
    })
  })

  describe('loadImage', () => {
    it('should load image from blob', async () => {
      const blob = new Blob(['fake-image-data'], { type: 'image/png' })
      
      // Mock Image
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      }
      
      global.Image = vi.fn(() => mockImage) as any
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()

      const loadPromise = loadImage(blob)
      
      // Simulate successful load
      setTimeout(() => mockImage.onload?.(), 0)
      
      await expect(loadPromise).resolves.toBeDefined()
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob)
    })

    it('should reject on image load error', async () => {
      const blob = new Blob(['fake-image-data'], { type: 'image/png' })
      
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      }
      
      global.Image = vi.fn(() => mockImage) as any
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()

      const loadPromise = loadImage(blob)
      
      // Simulate error
      setTimeout(() => mockImage.onerror?.(), 0)
      
      await expect(loadPromise).rejects.toThrow('Failed to load image')
    })
  })

  describe('resizeImage', () => {
    let mockCanvas: any
    let mockContext: any

    beforeEach(() => {
      mockContext = {
        drawImage: vi.fn(),
        clearRect: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: '',
      }

      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
      }

      global.document.createElement = vi.fn(() => mockCanvas) as any
    })

    it('should resize image maintaining aspect ratio', () => {
      const mockImage = {
        naturalWidth: 1600,
        naturalHeight: 1200,
      } as HTMLImageElement

      const result = resizeImage(mockImage, {
        width: 800,
        maintainAspectRatio: true,
      })

      expect(result.width).toBe(800)
      expect(result.height).toBe(600)
      expect(mockContext.drawImage).toHaveBeenCalled()
    })

    it('should resize without maintaining aspect ratio', () => {
      const mockImage = {
        naturalWidth: 1600,
        naturalHeight: 1200,
      } as HTMLImageElement

      const result = resizeImage(mockImage, {
        width: 800,
        height: 400,
        maintainAspectRatio: false,
      })

      expect(result.width).toBe(800)
      expect(result.height).toBe(400)
    })

    it('should enable image smoothing for quality', () => {
      const mockImage = {
        naturalWidth: 1600,
        naturalHeight: 1200,
      } as HTMLImageElement

      resizeImage(mockImage, { width: 800 })

      expect(mockContext.imageSmoothingEnabled).toBe(true)
      expect(mockContext.imageSmoothingQuality).toBe('high')
    })
  })

  describe('cropImage', () => {
    let mockCanvas: any
    let mockContext: any

    beforeEach(() => {
      mockContext = {
        drawImage: vi.fn(),
      }

      mockCanvas = {
        width: 1600,
        height: 1200,
        getContext: vi.fn(() => mockContext),
      }

      global.document.createElement = vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
      })) as any
    })

    it('should crop image to specified area', () => {
      const cropArea = { x: 100, y: 100, width: 800, height: 600 }
      
      const result = cropImage(mockCanvas, cropArea)

      expect(result.width).toBe(800)
      expect(result.height).toBe(600)
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockCanvas,
        100,
        100,
        800,
        600,
        0,
        0,
        800,
        600
      )
    })

    it('should optimize large crop areas', () => {
      const cropArea = { x: 0, y: 0, width: 8000, height: 6000 }
      
      const result = cropImage(mockCanvas, cropArea)

      expect(result.width).toBeLessThanOrEqual(4096)
      expect(result.height).toBeLessThanOrEqual(4096)
    })
  })

  describe('rotateImage', () => {
    let mockCanvas: any
    let mockContext: any

    beforeEach(() => {
      mockContext = {
        translate: vi.fn(),
        rotate: vi.fn(),
        drawImage: vi.fn(),
      }

      mockCanvas = {
        width: 800,
        height: 600,
        getContext: vi.fn(() => mockContext),
      }

      global.document.createElement = vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
      })) as any
    })

    it('should rotate image by 90 degrees', () => {
      const result = rotateImage(mockCanvas, 90)

      expect(mockContext.translate).toHaveBeenCalled()
      expect(mockContext.rotate).toHaveBeenCalledWith((90 * Math.PI) / 180)
      expect(mockContext.drawImage).toHaveBeenCalled()
    })

    it('should calculate new dimensions after rotation', () => {
      const result = rotateImage(mockCanvas, 45)

      // For 45 degree rotation, new dimensions should be larger
      expect(result.width).toBeGreaterThan(mockCanvas.width)
      expect(result.height).toBeGreaterThan(mockCanvas.height)
    })
  })

  describe('canvasToBlob', () => {
    it('should convert canvas to blob with specified format', async () => {
      const mockBlob = new Blob(['fake-data'], { type: 'image/png' })
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(mockBlob)),
      } as any

      const result = await canvasToBlob(mockCanvas, {
        format: 'png',
        quality: 0.9,
      })

      expect(result).toBe(mockBlob)
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        undefined
      )
    })

    it('should apply quality for lossy formats', async () => {
      const mockBlob = new Blob(['fake-data'], { type: 'image/jpeg' })
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(mockBlob)),
      } as any

      await canvasToBlob(mockCanvas, { format: 'jpeg', quality: 0.8 })

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.8
      )
    })

    it('should reject when blob conversion fails', async () => {
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(null)),
      } as any

      await expect(
        canvasToBlob(mockCanvas, { format: 'png' })
      ).rejects.toThrow('Failed to convert canvas to blob')
    })
  })
})
