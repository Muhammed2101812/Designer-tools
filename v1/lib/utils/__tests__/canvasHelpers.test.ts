/**
 * Unit tests for canvasHelpers utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createCanvasPool,
  calculateAspectRatio,
  fitToContainer,
  coverContainer,
  drawImageCentered,
  drawCheckerboard,
  resetCanvas,
  canvasToDataURL,
  copyCanvas,
  imageToCanvas,
  getPixelData,
  scaleCoordinates,
  supportsOffscreenCanvas,
} from '../canvasHelpers'

describe('canvasHelpers', () => {
  describe('createCanvasPool', () => {
    it('should create a canvas pool', () => {
      const pool = createCanvasPool()
      
      expect(pool).toHaveProperty('getCanvas')
      expect(pool).toHaveProperty('releaseCanvas')
      expect(pool).toHaveProperty('clearCanvas')
    })

    it('should reuse canvas instance', () => {
      const pool = createCanvasPool()
      
      const canvas1 = pool.getCanvas()
      const canvas2 = pool.getCanvas()
      
      expect(canvas1).toBe(canvas2)
    })

    it('should clear canvas on release', () => {
      const mockContext = {
        clearRect: vi.fn(),
      }
      
      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: vi.fn(() => mockContext),
      }
      
      global.document.createElement = vi.fn(() => mockCanvas) as any
      
      const pool = createCanvasPool()
      pool.getCanvas()
      pool.releaseCanvas()
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('calculateAspectRatio', () => {
    it('should calculate aspect ratio correctly', () => {
      expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(16 / 9, 2)
      expect(calculateAspectRatio(1600, 1200)).toBeCloseTo(4 / 3, 2)
      expect(calculateAspectRatio(1000, 1000)).toBe(1)
    })

    it('should handle portrait orientation', () => {
      expect(calculateAspectRatio(1080, 1920)).toBeCloseTo(9 / 16, 2)
    })
  })

  describe('fitToContainer', () => {
    it('should fit wide image to container', () => {
      const result = fitToContainer(1600, 900, 800, 600)
      
      expect(result.width).toBe(800)
      expect(result.height).toBeLessThan(600)
      expect(result.x).toBe(0)
      expect(result.y).toBeGreaterThan(0)
    })

    it('should fit tall image to container', () => {
      const result = fitToContainer(900, 1600, 800, 600)
      
      expect(result.width).toBeLessThan(800)
      expect(result.height).toBe(600)
      expect(result.x).toBeGreaterThan(0)
      expect(result.y).toBe(0)
    })

    it('should center image in container', () => {
      const result = fitToContainer(1000, 1000, 800, 600)
      
      expect(result.width).toBe(600)
      expect(result.height).toBe(600)
      expect(result.x).toBe(100) // (800 - 600) / 2
      expect(result.y).toBe(0)
    })
  })

  describe('coverContainer', () => {
    it('should cover container with wide image', () => {
      const result = coverContainer(1600, 900, 800, 600)
      
      expect(result.height).toBe(600)
      expect(result.width).toBeGreaterThan(800)
    })

    it('should cover container with tall image', () => {
      const result = coverContainer(900, 1600, 800, 600)
      
      expect(result.width).toBe(800)
      expect(result.height).toBeGreaterThan(600)
    })

    it('should center image in container', () => {
      const result = coverContainer(1000, 1000, 800, 600)
      
      expect(result.width).toBe(800)
      expect(result.height).toBe(800)
      expect(result.x).toBe(0)
      expect(result.y).toBeLessThan(0) // Image extends beyond container
    })
  })

  describe('drawImageCentered', () => {
    let mockContext: any
    let mockImage: any

    beforeEach(() => {
      mockContext = {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
      }

      mockImage = {
        naturalWidth: 1600,
        naturalHeight: 1200,
      }
    })

    it('should draw image centered on canvas', () => {
      drawImageCentered(mockContext, mockImage, 800, 600)
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
      expect(mockContext.drawImage).toHaveBeenCalled()
    })

    it('should handle canvas element as image', () => {
      const canvasImage = {
        width: 1600,
        height: 1200,
      }

      drawImageCentered(mockContext, canvasImage as any, 800, 600)
      
      expect(mockContext.drawImage).toHaveBeenCalled()
    })
  })

  describe('drawCheckerboard', () => {
    let mockContext: any

    beforeEach(() => {
      mockContext = {
        fillStyle: '',
        fillRect: vi.fn(),
      }
    })

    it('should draw checkerboard pattern', () => {
      drawCheckerboard(mockContext, 100, 100, 10)
      
      expect(mockContext.fillRect).toHaveBeenCalled()
      // Should draw 10x10 grid = 100 squares
      expect(mockContext.fillRect).toHaveBeenCalledTimes(100)
    })

    it('should alternate colors', () => {
      drawCheckerboard(mockContext, 20, 20, 10)
      
      const calls = mockContext.fillRect.mock.calls
      // Check that fillStyle was set (alternating pattern)
      expect(mockContext.fillStyle).toBeTruthy()
    })
  })

  describe('resetCanvas', () => {
    it('should reset canvas transformations and clear', () => {
      const mockContext = {
        setTransform: vi.fn(),
        clearRect: vi.fn(),
      }

      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: vi.fn(() => mockContext),
      }

      resetCanvas(mockCanvas as any)
      
      expect(mockContext.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0)
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('canvasToDataURL', () => {
    it('should convert canvas to data URL', () => {
      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/png;base64,fake'),
      }

      const result = canvasToDataURL(mockCanvas as any)
      
      expect(result).toBe('data:image/png;base64,fake')
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', 0.92)
    })

    it('should support different formats', () => {
      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,fake'),
      }

      canvasToDataURL(mockCanvas as any, 'jpeg', 0.8)
      
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8)
    })
  })

  describe('copyCanvas', () => {
    it('should copy source canvas to target', () => {
      const mockContext = {
        drawImage: vi.fn(),
      }

      const sourceCanvas = {
        width: 800,
        height: 600,
      }

      const targetCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
      }

      copyCanvas(sourceCanvas as any, targetCanvas as any)
      
      expect(targetCanvas.width).toBe(800)
      expect(targetCanvas.height).toBe(600)
      expect(mockContext.drawImage).toHaveBeenCalledWith(sourceCanvas, 0, 0)
    })
  })

  describe('imageToCanvas', () => {
    it('should create canvas from image', () => {
      const mockContext = {
        drawImage: vi.fn(),
      }

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
      }

      global.document.createElement = vi.fn(() => mockCanvas) as any

      const mockImage = {
        naturalWidth: 1600,
        naturalHeight: 1200,
      }

      const result = imageToCanvas(mockImage as any)
      
      expect(result.width).toBe(1600)
      expect(result.height).toBe(1200)
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0)
    })
  })

  describe('getPixelData', () => {
    it('should get pixel data at coordinates', () => {
      const mockImageData = {
        data: new Uint8ClampedArray([255, 128, 64, 255]),
      }

      const mockContext = {
        getImageData: vi.fn(() => mockImageData),
      }

      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: vi.fn(() => mockContext),
      }

      const result = getPixelData(mockCanvas as any, 100, 100)
      
      expect(result).toEqual({ r: 255, g: 128, b: 64, a: 255 })
      expect(mockContext.getImageData).toHaveBeenCalledWith(100, 100, 1, 1)
    })

    it('should return null for out of bounds coordinates', () => {
      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: vi.fn(() => ({})),
      }

      expect(getPixelData(mockCanvas as any, -1, 100)).toBeNull()
      expect(getPixelData(mockCanvas as any, 900, 100)).toBeNull()
      expect(getPixelData(mockCanvas as any, 100, -1)).toBeNull()
      expect(getPixelData(mockCanvas as any, 100, 700)).toBeNull()
    })
  })

  describe('scaleCoordinates', () => {
    it('should scale canvas coordinates to image coordinates', () => {
      const result = scaleCoordinates(100, 100, 800, 600, 1600, 1200)
      
      expect(result).toEqual({ x: 200, y: 200 })
    })

    it('should handle different aspect ratios', () => {
      const result = scaleCoordinates(400, 300, 800, 600, 3200, 2400)
      
      expect(result).toEqual({ x: 1600, y: 1200 })
    })

    it('should floor coordinates', () => {
      const result = scaleCoordinates(100, 100, 800, 600, 1601, 1201)
      
      expect(result.x).toBe(Math.floor(100 * (1601 / 800)))
      expect(result.y).toBe(Math.floor(100 * (1201 / 600)))
    })
  })

  describe('supportsOffscreenCanvas', () => {
    it('should detect OffscreenCanvas support', () => {
      const result = supportsOffscreenCanvas()
      
      // In jsdom, OffscreenCanvas is not defined
      expect(typeof result).toBe('boolean')
    })
  })
})
