/**
 * Mockup Template Library
 * 
 * This module provides access to all mockup templates and their metadata.
 * Templates are organized by category and include design area coordinates
 * and perspective transform parameters for realistic mockup generation.
 * 
 * Requirements: 7.2, 7.3
 */

export interface DesignArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PerspectiveTransform {
  enabled: boolean;
  params: {
    rotationX?: number;
    rotationY?: number;
    rotationZ?: number;
    perspective?: number;
    scale?: number;
    skewX?: number;
    skewY?: number;
    curvature?: number;
    transformOrigin?: string;
  };
}

export interface MockupTemplate {
  id: string;
  name: string;
  category: 'device' | 'print' | 'apparel';
  width: number;
  height: number;
  designArea: DesignArea;
  perspectiveTransform: PerspectiveTransform;
  description: string;
  // Additional metadata for enhanced functionality
  tags?: string[];
  aspectRatio?: number;
  minImageSize?: { width: number; height: number };
  maxImageSize?: { width: number; height: number };
}

export type TemplateCategory = 'device' | 'print' | 'apparel';

export interface TemplateCategoryInfo {
  name: string;
  description: string;
  count: number;
  icon: string;
  templates?: MockupTemplate[];
}

export interface TemplateGroup {
  category: TemplateCategory;
  info: TemplateCategoryInfo;
  templates: MockupTemplate[];
}

/**
 * Load template metadata from JSON file
 */
export async function loadTemplate(templateId: string): Promise<MockupTemplate | null> {
  try {
    // Use dynamic import to avoid issues with server/client context
    const fs = await import('fs/promises');
    const path = await import('path');

    const filePath = path.join(process.cwd(), 'public', 'mockup-templates', `${templateId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to load template ${templateId}:`, error);
    return null;
  }
}

/**
 * Load all templates for a specific category
 * Requirement 7.3: Group templates by category
 */
export async function loadTemplatesByCategory(category: TemplateCategory): Promise<MockupTemplate[]> {
  const templateIds = getTemplateIdsByCategory(category);
  const templates: MockupTemplate[] = [];
  
  for (const id of templateIds) {
    const template = await loadTemplate(id);
    if (template) {
      // Ensure template has category metadata
      template.category = category;
      templates.push(template);
    }
  }
  
  return templates;
}

/**
 * Load templates grouped by category
 * Requirement 7.3: Group templates by category for UI display
 */
export async function loadTemplatesGroupedByCategory(): Promise<TemplateGroup[]> {
  const categories: TemplateCategory[] = ['device', 'print', 'apparel'];
  const groups: TemplateGroup[] = [];
  
  for (const category of categories) {
    const templates = await loadTemplatesByCategory(category);
    const categoryInfo = getTemplateCategoriesInfo()[category];
    
    groups.push({
      category,
      info: {
        ...categoryInfo,
        count: templates.length,
        templates
      },
      templates
    });
  }
  
  return groups;
}

/**
 * Load all available templates
 */
export async function loadAllTemplates(): Promise<MockupTemplate[]> {
  const allTemplateIds = [
    ...getTemplateIdsByCategory('device'),
    ...getTemplateIdsByCategory('print'),
    ...getTemplateIdsByCategory('apparel')
  ];
  
  const templates: MockupTemplate[] = [];
  
  for (const id of allTemplateIds) {
    const template = await loadTemplate(id);
    if (template) {
      templates.push(template);
    }
  }
  
  return templates;
}

/**
 * Get template IDs by category
 */
export function getTemplateIdsByCategory(category: TemplateCategory): string[] {
  const templateMap: Record<TemplateCategory, string[]> = {
    device: [
      'iphone-14-pro',
      'android-phone',
      'ipad-air',
      'ipad-pro',
      'macbook-pro'
    ],
    print: [
      'business-card',
      'poster-a4',
      'poster-a3',
      'flyer',
      'banner'
    ],
    apparel: [
      't-shirt-front',
      'hoodie-front',
      'cap',
      'mug',
      'tote-bag'
    ]
  };
  
  return templateMap[category] || [];
}

/**
 * Get all available template IDs
 */
export function getAllTemplateIds(): string[] {
  return [
    ...getTemplateIdsByCategory('device'),
    ...getTemplateIdsByCategory('print'),
    ...getTemplateIdsByCategory('apparel')
  ];
}

/**
 * Get template categories with counts and metadata
 * Requirement 7.3: Provide category information for grouping
 */
export function getTemplateCategoriesInfo(): Record<TemplateCategory, TemplateCategoryInfo> {
  return {
    device: {
      name: 'Devices',
      description: 'Smartphones, tablets, laptops and other digital devices',
      count: getTemplateIdsByCategory('device').length,
      icon: '📱'
    },
    print: {
      name: 'Print Materials',
      description: 'Business cards, posters, flyers and printed materials',
      count: getTemplateIdsByCategory('print').length,
      icon: '📄'
    },
    apparel: {
      name: 'Apparel & Products',
      description: 'T-shirts, hoodies, mugs and branded merchandise',
      count: getTemplateIdsByCategory('apparel').length,
      icon: '👕'
    }
  };
}

/**
 * Get category information for a specific category
 */
export function getCategoryInfo(category: TemplateCategory): TemplateCategoryInfo {
  return getTemplateCategoriesInfo()[category];
}

/**
 * Calculate design area aspect ratio
 */
export function getDesignAreaAspectRatio(designArea: DesignArea): number {
  return designArea.width / designArea.height;
}

/**
 * Check if template supports perspective transform
 */
export function supportsPerspectiveTransform(template: MockupTemplate): boolean {
  return template.perspectiveTransform.enabled;
}

/**
 * Get template image URL (SVG or PNG)
 */
export function getTemplateImageUrl(templateId: string, format: 'svg' | 'png' = 'svg'): string {
  return `/mockup-templates/${templateId}.${format}`;
}

/**
 * Validate design area coordinates
 */
export function validateDesignArea(designArea: DesignArea, templateSize: { width: number; height: number }): boolean {
  return (
    designArea.x >= 0 &&
    designArea.y >= 0 &&
    designArea.x + designArea.width <= templateSize.width &&
    designArea.y + designArea.height <= templateSize.height &&
    designArea.width > 0 &&
    designArea.height > 0
  );
}

/**
 * Get recommended image dimensions for a template
 */
export function getRecommendedImageDimensions(template: MockupTemplate): { width: number; height: number } {
  const { designArea } = template;
  const aspectRatio = getDesignAreaAspectRatio(designArea);
  
  // Recommend dimensions based on design area size and aspect ratio
  let recommendedWidth = designArea.width;
  let recommendedHeight = designArea.height;
  
  // Scale up for better quality if design area is small
  if (designArea.width < 300) {
    recommendedWidth = 300;
    recommendedHeight = Math.round(300 / aspectRatio);
  }
  
  return {
    width: recommendedWidth,
    height: recommendedHeight
  };
}

/**
 * Template quality levels for different use cases
 */
export const TEMPLATE_QUALITY_PRESETS = {
  preview: { scale: 0.5, quality: 0.7 },
  standard: { scale: 1.0, quality: 0.85 },
  high: { scale: 1.5, quality: 0.95 },
  print: { scale: 2.0, quality: 1.0 }
} as const;

export type QualityPreset = keyof typeof TEMPLATE_QUALITY_PRESETS;

/**
 * Enhanced template loading with metadata validation
 * Requirement 7.2: Ensure template metadata includes all required fields
 */
export async function loadTemplateWithValidation(templateId: string): Promise<MockupTemplate | null> {
  const template = await loadTemplate(templateId);
  
  if (!template) {
    return null;
  }
  
  // Validate required metadata fields
  if (!validateTemplateMetadata(template)) {
    console.error(`Template ${templateId} has invalid metadata`);
    return null;
  }
  
  // Calculate additional metadata
  template.aspectRatio = getDesignAreaAspectRatio(template.designArea);
  
  return template;
}

/**
 * Validate template metadata completeness
 * Requirement 7.2: Ensure all required metadata is present
 */
export function validateTemplateMetadata(template: Partial<MockupTemplate>): template is MockupTemplate {
  const required = ['id', 'name', 'category', 'width', 'height', 'designArea', 'perspectiveTransform', 'description'];
  
  for (const field of required) {
    if (!(field in template) || template[field as keyof MockupTemplate] === undefined) {
      console.error(`Template missing required field: ${field}`);
      return false;
    }
  }
  
  // Validate design area
  if (!validateDesignArea(template.designArea!, { width: template.width!, height: template.height! })) {
    console.error('Template has invalid design area coordinates');
    return false;
  }
  
  // Validate category
  if (!['device', 'print', 'apparel'].includes(template.category!)) {
    console.error(`Template has invalid category: ${template.category}`);
    return false;
  }
  
  return true;
}

/**
 * Search templates by name or description
 */
export async function searchTemplates(query: string): Promise<MockupTemplate[]> {
  const allTemplates = await loadAllTemplates();
  const searchTerm = query.toLowerCase();
  
  return allTemplates.filter(template => 
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.category.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get templates by aspect ratio range
 */
export async function getTemplatesByAspectRatio(
  minRatio: number, 
  maxRatio: number
): Promise<MockupTemplate[]> {
  const allTemplates = await loadAllTemplates();
  
  return allTemplates.filter(template => {
    const ratio = getDesignAreaAspectRatio(template.designArea);
    return ratio >= minRatio && ratio <= maxRatio;
  });
}

/**
 * Get templates that support perspective transform
 */
export async function getPerspectiveTemplates(): Promise<MockupTemplate[]> {
  const allTemplates = await loadAllTemplates();
  return allTemplates.filter(template => supportsPerspectiveTransform(template));
}

/**
 * Get template statistics
 */
export async function getTemplateStatistics() {
  const allTemplates = await loadAllTemplates();
  const categories = getTemplateCategoriesInfo();
  
  const stats = {
    total: allTemplates.length,
    byCategory: {} as Record<TemplateCategory, number>,
    withPerspective: allTemplates.filter(t => supportsPerspectiveTransform(t)).length,
    averageDesignAreaSize: 0,
    aspectRatios: {
      portrait: 0,
      landscape: 0,
      square: 0
    }
  };
  
  // Count by category
  for (const category of Object.keys(categories) as TemplateCategory[]) {
    stats.byCategory[category] = allTemplates.filter(t => t.category === category).length;
  }
  
  // Calculate average design area size
  const totalArea = allTemplates.reduce((sum, t) => 
    sum + (t.designArea.width * t.designArea.height), 0
  );
  stats.averageDesignAreaSize = totalArea / allTemplates.length;
  
  // Count aspect ratios
  allTemplates.forEach(template => {
    const ratio = getDesignAreaAspectRatio(template.designArea);
    if (ratio < 0.9) {
      stats.aspectRatios.portrait++;
    } else if (ratio > 1.1) {
      stats.aspectRatios.landscape++;
    } else {
      stats.aspectRatios.square++;
    }
  });
  
  return stats;
}