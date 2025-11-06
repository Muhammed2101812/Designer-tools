import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================
// Schema Validation
// ============================================

const createFeedbackSchema = z.object({
  category: z.enum(['bug', 'feature_request', 'improvement', 'question', 'general']),
  rating: z.number().min(1).max(5).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  page_url: z.string().optional(),
  user_agent: z.string().optional(),
})

const updateStatusSchema = z.object({
  feedback_id: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'wont_fix']),
  admin_notes: z.string().optional(),
})

// ============================================
// GET - Get user's feedback
// ============================================

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's feedback
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*, feedback_attachments(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST - Create feedback
// ============================================

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get user (optional - anonymous feedback allowed)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse and validate request
    const body = await req.json()
    const result = createFeedbackSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const { category, rating, subject, message, page_url, user_agent } = result.data

    // Create feedback
    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id || null,
        category,
        rating: rating || null,
        subject,
        message,
        page_url: page_url || null,
        user_agent: user_agent || null,
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating feedback:', error)
      return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
    }

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error('Feedback POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// PATCH - Update feedback status (admin only)
// ============================================

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check
    // For now, only allow if user has specific admin email or role in profiles table

    // Parse and validate request
    const body = await req.json()
    const result = updateStatusSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const { feedback_id, status, admin_notes } = result.data

    // Update using function
    const { data, error } = await supabase.rpc('update_feedback_status', {
      p_feedback_id: feedback_id,
      p_status: status,
      p_admin_notes: admin_notes || null,
    })

    if (error) {
      console.error('Error updating feedback status:', error)
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Feedback PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
