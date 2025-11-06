/**
 * Template Metadata System Tests
 * Requirements: 7.2, 7.3
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadTemplate,
  loadTemplatesByCategory,
  loadTemplatesGroupedByCategory,
  validateTemplateMetadata,
  getTemplateCategoriesInfo,
  getDesignAreaAspectRatio,
  supportsPerspectiveTransform,
  type MockupTemplate,
  type TemplateCategory
} from '../templates'
import {
  createTemplateMetadata,
  validateTemplateMetadataComprehensive,
  generateTemplateReport,
  batchValidateTemplates
} from '../metadata-manager'

// Mock fetch for testing
global.fetch = vi.fn()

const mockTemplate: MockupTemplate = {
  id: 'test-template',
  name: 'Test Template',
  category: 'device',
  width: 800,
  height: 600,
  designArea: {
    x: 100,
    y: 100,
    width: 600,
    height: 400
  },
  perspectiveTransform: {
    enabled: true,
    params: {
      rotationX: 5,
      rotationY: -2,
      perspective: 1000
    }
  },
  description: 'A test template for unit testing',
  aspectRatio: 1.5
}

describe('Template Metadata System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Template Loading', () => {
    it('should load template metadata successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplate
      } as Response)

      const template = await loadTemplate('test-template')
      
      expect(template).toEqual(mockTemplate)
      expect(mockFetch).toHaveBeenCalledWith('/mockup-templates/test-template.json')
    })

    it('should return null for non-existent template', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as Response)

      const template = await loadTemplate('non-existent')
      
      expect(template).toBeNull()
    })

    it('should load templates by category', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTemplate
      } as Response)

      const templates = await loadTemplatesByCategory('device')
      
      expect(templates).toHaveLength(5) // 5 device templates expected
      expect(templates[0]).toHaveProperty('category', 'device')
    })

    it('should load templates grouped by category', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTemplate
      } as Response)

      const groups = await loadTemplatesGroupedByCategory()
      
      expect(groups).toHaveLength(3) // device, print, apparel
      expect(groups[0]).toHaveProperty('category')
      expect(groups[0]).toHaveProperty('templates')
      expect(groups[0]).toHaveProperty('info')
    })
  })

  describe('Template Validation', () => {
    it('should validate complete template metadata', () => {
      const isValid = validateTemplateMetadata(mockTemplate)
      expect(isValid).toBe(true)
    })

    it('should reject template with missing required fields', () => {
      const incompleteTemplate = { ...mockTemplate }
      delete (incompleteTemplate as any).designArea
      
      const isValid = validateTemplateMetadata(incompleteTemplate)
      expect(isValid).toBe(false)
    })

    it('should reject template with invalid design area', () => {
      const invalidTemplate = {
        ...mockTemplate,
        designArea: {
          x: -10, // Invalid negative x
          y: 100,
          width: 600,
          height: 400
        }
      }
      
      const isValid = validateTemplateMetadata(invalidTemplate)
      expect(isValid).toBe(false)
    })

    it('should perform comprehensive validation', () => {
      const result = validateTemplateMetadataComprehensive(mockTemplate)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should detect validation errors in comprehensive check', () => {
      const invalidTemplate = {
        ...mockTemplate,
        width: -100, // Invalid negative width
        category: 'invalid' as TemplateCategory
      }
      
      const result = validateTemplateMetadataComprehensive(invalidTemplate)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Template Metadata Creation', () => {
    it('should create template metadata with required fields', () => {
      const template = createTemplateMetadata({
        id: 'new-template',
        name: 'New Template',
        category: 'print',
        width: 1000,
        height: 800,
        designArea: {
          x: 50,
          y: 50,
          width: 900,
          height: 700
        },
        description: 'A newly created template'
      })

      expect(template).toHaveProperty('id', 'new-template')
      expect(template).toHaveProperty('category', 'print')
      expect(template).toHaveProperty('aspectRatio')
      expect(template.perspectiveTransform.enabled).toBe(false)
    })

    it('should create template with perspective transform', () => {
      const template = createTemplateMetadata({
        id: 'perspective-template',
        name: 'Perspective Template',
        category: 'device',
        width: 800,
        height: 600,
        designArea: { x: 100, y: 100, width: 600, height: 400 },
        perspectiveTransform: {
          enabled: true,
          params: { rotationX: 10, rotationY: 5 }
        },
        description: 'Template with perspective transform'
      })

      expect(template.perspectiveTransform.enabled).toBe(true)
      expect(template.perspectiveTransform.params.rotationX).toBe(10)
    })
  })

  describe('Template Utilities', () => {
    it('should calculate design area aspect ratio', () => {
      const ratio = getDesignAreaAspectRatio(mockTemplate.designArea)
      expect(ratio).toBe(1.5) // 600/400
    })

    it('should detect perspective transform support', () => {
      const supports = supportsPerspectiveTransform(mockTemplate)
      expect(supports).toBe(true)

      const noPerspectiveTemplate = {
        ...mockTemplate,
        perspectiveTransform: { enabled: false, params: {} }
      }
      const doesNotSupport = supportsPerspectiveTransform(noPerspectiveTemplate)
      expect(doesNotSupport).toBe(false)
    })

    it('should get category information', () => {
      const categories = getTemplateCategoriesInfo()
      
      expect(categories).toHaveProperty('device')
      expect(categories).toHaveProperty('print')
      expect(categories).toHaveProperty('apparel')
      
      expect(categories.device).toHaveProperty('name', 'Devices')
      expect(categories.device).toHaveProperty('count', 5)
      expect(categories.device).toHaveProperty('icon', '📱')
    })
  })

  describe('Template Reports', () => {
    it('should generate comprehensive template report', () => {
      const report = generateTemplateReport(mockTemplate)
      
      expect(report).toHaveProperty('id', 'test-template')
      expect(report).toHaveProperty('validation')
      expect(report).toHaveProperty('metrics')
      expect(report).toHaveProperty('recommendations')
      
      expect(report.metrics).toHaveProperty('templateSize')
      expect(report.metrics).toHaveProperty('designArea')
      expect(report.metrics).toHaveProperty('perspective')
    })

    it('should batch validate multiple templates', () => {
      const templates = [
        mockTemplate,
        { ...mockTemplate, id: 'template-2', name: 'Template 2' },
        { ...mockTemplate, id: 'invalid', width: -100 } // Invalid template
      ]
      
      const result = batchValidateTemplates(templates)
      
      expect(result.summary.total).toBe(3)
      expect(result.summary.valid).toBe(2)
      expect(result.summary.invalid).toBe(1)
      expect(result.results).toHaveLength(3)
    })
  })

  describe('Category Management', () => {
    it('should provide correct template counts per category', () => {
      const categories = getTemplateCategoriesInfo()
      
      // Based on the template IDs defined in the system
      expect(categories.device.count).toBe(5)
      expect(categories.print.count).toBe(5)
      expect(categories.apparel.count).toBe(5)
    })

    it('should have proper category descriptions', () => {
      const categories = getTemplateCategoriesInfo()
      
      expect(categories.device.description).toContain('digital devices')
      expect(categories.print.description).toContain('printed materials')
      expect(categories.apparel.description).toContain('merchandise')
    })
  })
})