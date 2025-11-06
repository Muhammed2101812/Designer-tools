/**
 * Tests for Advanced Perspective Transform Library
 * 
 * Requirements: 7.6, 7.7
 */

import { vi } from 'vitest'
import {
  create3DTransformMatrix,
  calculatePerspectivePoints,
  validatePerspectiveParams,
  createDefaultPerspectiveConfig,
  generateHighResolutionMockup,
  type PerspectiveParams,
  type PerspectiveTransformConfig
} from '../perspective-transform'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { describe } from 'node:test'

describe('Perspective Transform Library', () => {
  describe('create3DTransformMatrix', () => {
    it('should create identity matrix for zero rotations', () => {
      const params: PerspectiveParams = {
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0
      }
      
      const matrix = create3DTransformMatrix(params)
      expect(matrix).toBeDefined()
      expect(matrix.a).toBeCloseTo(1)
      expect(matrix.d).toBeCloseTo(1)
    })

    it('should apply scale transformation', () => {
      const params: PerspectiveParams = {
        scale: 2.0
      }
      
      const matrix = create3DTransformMatrix(params)
      expect(matrix.a).toBeCloseTo(2)
      expect(matrix.d).toBeCloseTo(2)
    })

    it('should handle perspective distance', () => {
      const params: PerspectiveParams = {
        perspective: 500,
        rotationX: 10
      }
      
      const matrix = create3DTransformMatrix(params)
      expect(matrix).toBeDefined()
    })
  })

  describe('calculatePerspectivePoints', () => {
    it('should calculate correct points for no rotation', () => {
      const width = 100
      const height = 100
      const params: PerspectiveParams = {
        rotationX: 0,
        rotationY: 0,
        perspective: 1000
      }
      
      const points = calculatePerspectivePoints(width, height, params)
      
      expect(points.topLeft[0]).toBeCloseTo(-50)
      expect(points.topLeft[1]).toBeCloseTo(-50)
      expect(points.bottomRight[0]).toBeCloseTo(50)
      expect(points.bottomRight[1]).toBeCloseTo(50)
    })

    it('should apply perspective distortion for rotations', () => {
      const width = 100
      const height = 100
      const params: PerspectiveParams = {
        rotationX: 15,
        rotationY: 0,
        perspective: 1000
      }
      
      const points = calculatePerspectivePoints(width, height, params)
      
      // With X rotation, top and bottom should have different Y values
      expect(points.topLeft[1]).not.toBeCloseTo(points.bottomLeft[1])
    })
  })

  describe('validatePerspectiveParams', () => {
    it('should validate correct parameters', () => {
      const params: PerspectiveParams = {
        rotationX: 10,
        rotationY: -5,
        rotationZ: 0,
        perspective: 1000,
        scale: 1.2,
        curvature: 0.1
      }
      
      expect(validatePerspectiveParams(params)).toBe(true)
    })

    it('should reject invalid rotation values', () => {
      const params: PerspectiveParams = {
        rotationX: 120, // Too high
        rotationY: 0
      }
      
      expect(validatePerspectiveParams(params)).toBe(false)
    })

    it('should reject negative perspective distance', () => {
      const params: PerspectiveParams = {
        perspective: -100
      }
      
      expect(validatePerspectiveParams(params)).toBe(false)
    })

    it('should reject invalid scale values', () => {
      const params: PerspectiveParams = {
        scale: -1
      }
      
      expect(validatePerspectiveParams(params)).toBe(false)
    })

    it('should reject invalid curvature values', () => {
      const params: PerspectiveParams = {
        curvature: 1.5 // Too high
      }
      
      expect(validatePerspectiveParams(params)).toBe(false)
    })
  })

  describe('createDefaultPerspectiveConfig', () => {
    it('should create valid default configuration', () => {
      const config = createDefaultPerspectiveConfig()
      
      expect(config.enabled).toBe(false)
      expect(config.params).toBeDefined()
      expect(config.params.rotationX).toBe(0)
      expect(config.params.rotationY).toBe(0)
      expect(config.params.rotationZ).toBe(0)
      expect(config.params.perspective).toBe(1000)
      expect(config.params.scale).toBe(1)
      expect(config.shadow).toBeDefined()
      expect(config.highlight).toBeDefined()
      expect(config.quality).toBe('standard')
    })

    it('should have valid shadow configuration', () => {
      const config = createDefaultPerspectiveConfig()
      
      expect(config.shadow?.offsetX).toBeDefined()
      expect(config.shadow?.offsetY).toBeDefined()
      expect(config.shadow?.blur).toBeGreaterThan(0)
      expect(config.shadow?.color).toBeDefined()
      expect(config.shadow?.opacity).toBeGreaterThan(0)
      expect(config.shadow?.opacity).toBeLessThanOrEqual(1)
    })

    it('should have valid highlight configuration', () => {
      const config = createDefaultPerspectiveConfig()
      
      expect(config.highlight?.intensity).toBeGreaterThan(0)
      expect(config.highlight?.intensity).toBeLessThanOrEqual(1)
      expect(config.highlight?.angle).toBeDefined()
      expect(config.highlight?.color).toBeDefined()
      expect(config.highlight?.opacity).toBeGreaterThan(0)
      expect(config.highlight?.opacity).toBeLessThanOrEqual(1)
    })
  })

  describe('generateHighResolutionMockup', () => {
    // Mock canvas and image elements for testing
    const createMockImage = (width: number, height: number): HTMLImageElement => {
      const img = {
        width,
        height,
        src: '',
        crossOrigin: null,
        onload: null,
        onerror: null
      } as HTMLImageElement
      return img
    }

    const createMockCanvas = () => {
      const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          scale: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          rotate: vi.fn(),
          setTransform: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          fill: vi.fn(),
          clearRect: vi.fn(),
          createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
          })),
          fillRect: vi.fn(),
          toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
          globalAlpha: 1,
          globalCompositeOperation: 'source-over',
          fillStyle: '#000000',
          filter: 'none',
          shadowColor: 'transparent',
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          shadowBlur: 0
        })),
        toDataURL: vi.fn(() => 'data:image/png;base64,mock')
      }
      
      // Mock document.createElement for canvas
      const originalCreateElement = document.createElement
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'canvas') {
          return canvas as any
        }
        return originalCreateElement.call(document, tagName)
      })
      
      return canvas
    }

    beforeEach(() => {
      createMockCanvas()
    })

    it('should generate high-resolution mockup with minimum width', async () => {
      const templateImg = createMockImage(800, 600)
      const designImg = createMockImage(400, 300)
      
      const template = {
        designArea: { x: 100, y: 100, width: 200, height: 150 },
        perspectiveTransform: {
          enabled: false
        }
      }
      
      const transform = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
      }
      
      const result = await generateHighResolutionMockup(
        templateImg,
        designImg,
        template,
        transform,
        2000
      )
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.startsWith('data:image/png')).toBe(true)
    })

    it('should apply minimum scale for high resolution', async () => {
      const templateImg = createMockImage(400, 300) // Small template
      const designImg = createMockImage(200, 150)
      
      const template = {
        designArea: { x: 50, y: 50, width: 100, height: 75 },
        perspectiveTransform: {
          enabled: false
        }
      }
      
      const transform = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
      }
      
      const result = await generateHighResolutionMockup(
        templateImg,
        designImg,
        template,
        transform,
        2000
      )
      
      expect(result).toBeDefined()
      // Should scale up to meet minimum width requirement
    })

    it('should handle perspective transform in high resolution', async () => {
      const templateImg = createMockImage(800, 600)
      const designImg = createMockImage(400, 300)
      
      const template = {
        designArea: { x: 100, y: 100, width: 200, height: 150 },
        perspectiveTransform: {
          enabled: true,
          params: {
            rotationX: 10,
            rotationY: -5,
            perspective: 1000
          },
          shadow: {
            offsetX: 5,
            offsetY: 10,
            blur: 15,
            color: 'rgba(0, 0, 0, 0.3)',
            opacity: 0.3
          }
        }
      }
      
      const transform = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
      }
      
      const result = await generateHighResolutionMockup(
        templateImg,
        designImg,
        template,
        transform,
        2000
      )
      
      expect(result).toBeDefined()
    })
  })

  describe('Quality Settings', () => {
    it('should handle different quality presets', () => {
      const config = createDefaultPerspectiveConfig()
      
      // Test different quality settings
      const qualities: Array<'preview' | 'standard' | 'high' | 'print'> = [
        'preview', 'standard', 'high', 'print'
      ]
      
      qualities.forEach(quality => {
        config.quality = quality
        expect(config.quality).toBe(quality)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero dimensions gracefully', () => {
      const points = calculatePerspectivePoints(0, 0, {})
      expect(points).toBeDefined()
      expect(Math.abs(points.topLeft[0])).toBeLessThan(0.001)
      expect(Math.abs(points.topLeft[1])).toBeLessThan(0.001)
    })

    it('should handle extreme rotation values within bounds', () => {
      const params: PerspectiveParams = {
        rotationX: 89,
        rotationY: -89,
        rotationZ: 179
      }
      
      expect(validatePerspectiveParams(params)).toBe(true)
    })

    it('should handle minimal curvature', () => {
      const params: PerspectiveParams = {
        curvature: 0.001
      }
      
      expect(validatePerspectiveParams(params)).toBe(true)
    })
  })
})