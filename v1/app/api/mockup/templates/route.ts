import { NextRequest, NextResponse } from 'next/server'
import { 
  loadAllTemplates, 
  loadTemplatesGroupedByCategory,
  loadTemplatesByCategory,
  searchTemplates,
  getTemplateStatistics,
  type TemplateCategory 
} from '@/lib/mockup/templates'

/**
 * GET /api/mockup/templates
 * 
 * Query parameters:
 * - category: Filter by category (device, print, apparel)
 * - grouped: Return templates grouped by category (true/false)
 * - search: Search templates by name or description
 * - stats: Return template statistics (true/false)
 * 
 * Requirements: 7.2, 7.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as TemplateCategory | null
    const grouped = searchParams.get('grouped') === 'true'
    const search = searchParams.get('search')
    const stats = searchParams.get('stats') === 'true'
    
    // Return statistics
    if (stats) {
      const statistics = await getTemplateStatistics()
      return NextResponse.json({ statistics })
    }
    
    // Search templates
    if (search) {
      const templates = await searchTemplates(search)
      return NextResponse.json({ 
        templates,
        count: templates.length,
        query: search
      })
    }
    
    // Return grouped templates (Requirement 7.3)
    if (grouped) {
      const groups = await loadTemplatesGroupedByCategory()
      return NextResponse.json({ 
        groups,
        totalCategories: groups.length,
        totalTemplates: groups.reduce((sum, group) => sum + group.templates.length, 0)
      })
    }
    
    // Return templates by category
    if (category) {
      if (!['device', 'print', 'apparel'].includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category. Must be: device, print, or apparel' },
          { status: 400 }
        )
      }
      
      const templates = await loadTemplatesByCategory(category)
      return NextResponse.json({ 
        templates,
        category,
        count: templates.length
      })
    }
    
    // Return all templates
    const templates = await loadAllTemplates()
    return NextResponse.json({ 
      templates,
      count: templates.length
    })
    
  } catch (error) {
    console.error('Error loading templates:', error)
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    )
  }
}