/**
 * Template Metadata Manager
 * 
 * Utilities for managing and validating mockup template metadata
 * Requirements: 7.2, 7.3
 */

import { MockupTemplate, TemplateCategory, DesignArea, PerspectiveTransform } from './templates'

export interface TemplateMetadataValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface TemplateCreationOptions {
  id: string
  name: string
  category: TemplateCategory
  width: number
  height: number
  designArea: DesignArea
  perspectiveTransform?: Partial<PerspectiveTransform>
  description: string
  tags?: string[]
}

/**
 * Create template metadata with validation
 * Requirement 7.2: Ensure proper metadata structure
 */
export function createTemplateMetadata(options: TemplateCreationOptions): MockupTemplate {
  const template: MockupTemplate = {
    id: options.id,
    name: options.name,
    category: options.category,
    width: options.width,
    height: options.height,
    designArea: options.designArea,
    perspectiveTransform: {
      enabled: options.perspectiveTransform?.enabled ?? false,
      params: options.perspectiveTransform?.params ?? {}
    },
    description: options.description,
    tags: options.tags,
    aspectRatio: options.designArea.width / options.designArea.height
  }
  
  return template
}

/**
 * Comprehensive template metadata validation
 * Requirement 7.2: Validate all metadata fields
 */
export function validateTemplateMetadataComprehensive(
  template: Partial<MockupTemplate>
): TemplateMetadataValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required fields validation
  const requiredFields = ['id', 'name', 'category', 'width', 'height', 'designArea', 'perspectiveTransform', 'description']
  
  for (const field of requiredFields) {
    if (!(field in template) || template[field as keyof MockupTemplate] === undefined) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors, warnings }
  }
  
  // Type and value validation
  if (typeof template.id !== 'string' || template.id.length === 0) {
    errors.push('ID must be a non-empty string')
  }
  
  if (typeof template.name !== 'string' || template.name.length === 0) {
    errors.push('Name must be a non-empty string')
  }
  
  if (!['device', 'print', 'apparel'].includes(template.category!)) {
    errors.push('Category must be one of: device, print, apparel')
  }
  
  if (typeof template.width !== 'number' || template.width <= 0) {
    errors.push('Width must be a positive number')
  }
  
  if (typeof template.height !== 'number' || template.height <= 0) {
    errors.push('Height must be a positive number')
  }
  
  // Design area validation
  if (template.designArea) {
    const { designArea } = template
    
    if (typeof designArea.x !== 'number' || designArea.x < 0) {
      errors.push('Design area X must be a non-negative number')
    }
    
    if (typeof designArea.y !== 'number' || designArea.y < 0) {
      errors.push('Design area Y must be a non-negative number')
    }
    
    if (typeof designArea.width !== 'number' || designArea.width <= 0) {
      errors.push('Design area width must be a positive number')
    }
    
    if (typeof designArea.height !== 'number' || designArea.height <= 0) {
      errors.push('Design area height must be a positive number')
    }
    
    // Check if design area fits within template bounds
    if (template.width && template.height) {
      if (designArea.x + designArea.width > template.width) {
        errors.push('Design area extends beyond template width')
      }
      
      if (designArea.y + designArea.height > template.height) {
        errors.push('Design area extends beyond template height')
      }
    }
    
    // Warnings for design area
    const designAreaRatio = designArea.width / designArea.height
    if (designAreaRatio < 0.1 || designAreaRatio > 10) {
      warnings.push('Design area has extreme aspect ratio')
    }
    
    const designAreaSize = designArea.width * designArea.height
    const templateSize = (template.width || 1) * (template.height || 1)
    const designAreaPercentage = (designAreaSize / templateSize) * 100
    
    if (designAreaPercentage < 10) {
      warnings.push('Design area is very small relative to template size')
    } else if (designAreaPercentage > 80) {
      warnings.push('Design area is very large relative to template size')
    }
  }
  
  // Perspective transform validation
  if (template.perspectiveTransform) {
    const { perspectiveTransform } = template
    
    if (typeof perspectiveTransform.enabled !== 'boolean') {
      errors.push('Perspective transform enabled must be a boolean')
    }
    
    if (perspectiveTransform.enabled && perspectiveTransform.params) {
      const { params } = perspectiveTransform
      
      // Validate rotation values (should be reasonable degrees)
      if (params.rotationX !== undefined && (params.rotationX < -180 || params.rotationX > 180)) {
        warnings.push('Rotation X value is outside typical range (-180 to 180)')
      }
      
      if (params.rotationY !== undefined && (params.rotationY < -180 || params.rotationY > 180)) {
        warnings.push('Rotation Y value is outside typical range (-180 to 180)')
      }
      
      if (params.rotationZ !== undefined && (params.rotationZ < -180 || params.rotationZ > 180)) {
        warnings.push('Rotation Z value is outside typical range (-180 to 180)')
      }
      
      // Validate perspective value
      if (params.perspective !== undefined && (params.perspective < 100 || params.perspective > 5000)) {
        warnings.push('Perspective value is outside typical range (100 to 5000)')
      }
    }
  }
  
  // Description validation
  if (typeof template.description !== 'string' || template.description.length < 10) {
    warnings.push('Description should be at least 10 characters long')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generate template metadata report
 * Requirement 7.2: Provide comprehensive metadata analysis
 */
export function generateTemplateReport(template: MockupTemplate) {
  const validation = validateTemplateMetadataComprehensive(template)
  const aspectRatio = template.designArea.width / template.designArea.height
  const designAreaSize = template.designArea.width * template.designArea.height
  const templateSize = template.width * template.height
  const designAreaPercentage = (designAreaSize / templateSize) * 100
  
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    validation,
    metrics: {
      templateSize: {
        width: template.width,
        height: template.height,
        totalPixels: templateSize
      },
      designArea: {
        x: template.designArea.x,
        y: template.designArea.y,
        width: template.designArea.width,
        height: template.designArea.height,
        aspectRatio,
        sizePercentage: designAreaPercentage
      },
      perspective: {
        enabled: template.perspectiveTransform.enabled,
        hasParams: Object.keys(template.perspectiveTransform.params).length > 0
      }
    },
    recommendations: generateRecommendations(template, validation)
  }
}

/**
 * Generate recommendations for template improvement
 */
function generateRecommendations(
  template: MockupTemplate, 
  validation: TemplateMetadataValidationResult
): string[] {
  const recommendations: string[] = []
  
  if (!validation.isValid) {
    recommendations.push('Fix validation errors before using this template')
  }
  
  const aspectRatio = template.designArea.width / template.designArea.height
  
  if (aspectRatio < 0.5) {
    recommendations.push('Consider using portrait-oriented designs for this template')
  } else if (aspectRatio > 2) {
    recommendations.push('Consider using landscape-oriented designs for this template')
  }
  
  if (!template.perspectiveTransform.enabled) {
    recommendations.push('Consider enabling perspective transform for more realistic mockups')
  }
  
  if (!template.tags || template.tags.length === 0) {
    recommendations.push('Add tags to improve template discoverability')
  }
  
  const designAreaSize = template.designArea.width * template.designArea.height
  const templateSize = template.width * template.height
  const designAreaPercentage = (designAreaSize / templateSize) * 100
  
  if (designAreaPercentage < 20) {
    recommendations.push('Design area might be too small - consider increasing size')
  }
  
  return recommendations
}

/**
 * Batch validate multiple templates
 */
export function batchValidateTemplates(templates: MockupTemplate[]) {
  const results = templates.map(template => ({
    id: template.id,
    name: template.name,
    validation: validateTemplateMetadataComprehensive(template)
  }))
  
  const summary = {
    total: templates.length,
    valid: results.filter(r => r.validation.isValid).length,
    invalid: results.filter(r => !r.validation.isValid).length,
    withWarnings: results.filter(r => r.validation.warnings.length > 0).length
  }
  
  return {
    results,
    summary
  }
}