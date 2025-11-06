/**
 * Client-side template utilities (no Node.js dependencies)
 * Requirements: 7.2, 7.3
 */

import type { MockupTemplate, TemplateCategory, TemplateGroup } from './templates'

// Re-export types for client use
export type { MockupTemplate, TemplateCategory, TemplateGroup }

export type Category = TemplateCategory

export const TEMPLATE_CATEGORIES: Category[] = ['device', 'print', 'apparel']

export interface TemplateLoadOptions {
  category?: TemplateCategory
  grouped?: boolean
  search?: string
  validate?: boolean
}

/**
 * Load templates with flexible options
 * Requirements: 7.2, 7.3
 */
export async function loadTemplates(options: TemplateLoadOptions = {}): Promise<{
  templates?: MockupTemplate[]
  groups?: TemplateGroup[]
  count: number
}> {
  try {
    const params = new URLSearchParams()
    
    if (options.category) params.set('category', options.category)
    if (options.grouped) params.set('grouped', 'true')
    if (options.search) params.set('search', options.search)
    if (options.validate) params.set('validate', 'true')
    
    const response = await fetch(`/api/mockup/templates?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch templates')
    }
    
    const data = await response.json()
    return {
      templates: data.templates,
      groups: data.groups,
      count: data.count || data.totalTemplates || 0
    }
  } catch (error) {
    console.error('Error loading templates:', error)
    return { count: 0 }
  }
}

/**
 * Load templates grouped by category
 * Requirement 7.3: Group templates by category for UI display
 */
export async function loadTemplatesGrouped(): Promise<TemplateGroup[]> {
  const result = await loadTemplates({ grouped: true })
  return result.groups || []
}

/**
 * Load all templates
 */
export async function loadAllTemplates(): Promise<MockupTemplate[]> {
  const result = await loadTemplates()
  return result.templates || []
}

/**
 * Load templates by category
 * Requirement 7.3: Filter templates by category
 */
export async function loadTemplatesByCategory(category: TemplateCategory): Promise<MockupTemplate[]> {
  const result = await loadTemplates({ category })
  return result.templates || []
}

/**
 * Search templates
 */
export async function searchTemplates(query: string): Promise<MockupTemplate[]> {
  const result = await loadTemplates({ search: query })
  return result.templates || []
}

/**
 * Load individual template by ID
 * Requirement 7.2: Load template with complete metadata
 */
export async function loadTemplate(id: string, validate = false): Promise<MockupTemplate | null> {
  try {
    const params = new URLSearchParams()
    if (validate) params.set('validate', 'true')
    
    const response = await fetch(`/api/mockup/templates/${id}?${params}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch template')
    }
    
    const data = await response.json()
    return data.template
  } catch (error) {
    console.error(`Error loading template ${id}:`, error)
    return null
  }
}

/**
 * Get all available template categories
 */
export function getTemplateCategories(): { id: string, name: string }[] {
  return [
    { id: 'device', name: 'Devices' },
    { id: 'print', name: 'Print' },
    { id: 'apparel', name: 'Apparel' }
  ]
}

/**
 * Get SVG file path for a template
 */
export function getTemplateSvgPath(templateId: string): string {
  return `/mockup-templates/${templateId}.svg`
}