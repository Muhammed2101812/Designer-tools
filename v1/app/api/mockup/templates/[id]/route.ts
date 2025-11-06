import { NextRequest, NextResponse } from 'next/server'
import { 
  loadTemplate, 
  loadTemplateWithValidation,
  validateTemplateMetadata,
  getTemplateImageUrl
} from '@/lib/mockup/templates'

/**
 * GET /api/mockup/templates/[id]
 * 
 * Get individual template metadata by ID
 * 
 * Query parameters:
 * - validate: Validate template metadata (true/false)
 * - format: Image format for template URL (svg/png)
 * 
 * Requirements: 7.2
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const validate = searchParams.get('validate') === 'true'
    const format = searchParams.get('format') as 'svg' | 'png' || 'svg'
    
    const templateId = params.id
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }
    
    // Load template with optional validation
    const template = validate 
      ? await loadTemplateWithValidation(templateId)
      : await loadTemplate(templateId)
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Add image URLs to response
    const templateWithUrls = {
      ...template,
      imageUrl: getTemplateImageUrl(templateId, format),
      svgUrl: getTemplateImageUrl(templateId, 'svg'),
      pngUrl: getTemplateImageUrl(templateId, 'png'),
      isValid: validateTemplateMetadata(template)
    }
    
    return NextResponse.json({ 
      template: templateWithUrls,
      metadata: {
        aspectRatio: template.designArea.width / template.designArea.height,
        designAreaSize: template.designArea.width * template.designArea.height,
        supportsPerspective: template.perspectiveTransform.enabled,
        templateSize: template.width * template.height
      }
    })
    
  } catch (error) {
    console.error(`Error loading template ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    )
  }
}