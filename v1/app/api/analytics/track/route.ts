import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { AnalyticsEvent, EVENT_METADATA } from '@/lib/analytics/events'

// ============================================
// Schema Validation
// ============================================

const trackEventSchema = z.object({
  event: z.string(),
  properties: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  timestamp: z.string().optional(),
})

// ============================================
// Route Handler
// ============================================

/**
 * POST /api/analytics/track
 *
 * Track analytics events server-side
 * Stores events in the database for later analysis
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get user (optional - some events can be tracked anonymously)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse and validate request
    const body = await req.json()
    const result = trackEventSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const { event, properties = {}, timestamp } = result.data

    // Validate event exists
    if (!EVENT_METADATA[event as AnalyticsEvent]) {
      return NextResponse.json(
        { error: 'Unknown event type', event },
        { status: 400 }
      )
    }

    const eventMeta = EVENT_METADATA[event as AnalyticsEvent]

    // Create analytics event record
    const { error: insertError } = await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event_name: event,
      event_category: eventMeta.category,
      properties,
      timestamp: timestamp || new Date().toISOString(),
      session_id: req.headers.get('x-session-id') || null,
      page_url: properties.page_url || req.headers.get('referer') || null,
      user_agent: req.headers.get('user-agent') || null,
    })

    if (insertError) {
      console.error('Error inserting analytics event:', insertError)
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      )
    }

    // Return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics track error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
