import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Email preferences schema for validation
const EmailPreferencesSchema = z.object({
  marketing_emails: z.boolean(),
  quota_warnings: z.boolean(),
  subscription_updates: z.boolean(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get existing email preferences
    const { data: preferences, error } = await supabase
      .from('email_preferences' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle() to avoid 406 error

    if (error) {
      console.error('Email preferences fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email preferences' },
        { status: 500 }
      )
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPreferences = {
        user_id: user.id,
        marketing_emails: true,
        quota_warnings: true,
        subscription_updates: true,
      }

      const { data: newPreferences, error: createError } = await supabase
        .from('email_preferences' as any)
        .insert(defaultPreferences)
        .select()
        .maybeSingle()

      if (createError) {
        console.error('Email preferences creation error:', createError)
        return NextResponse.json(
          { error: 'Failed to create email preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json(newPreferences)
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Email preferences GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = EmailPreferencesSchema.parse(body)

    // Update email preferences using upsert
    const { data: preferences, error } = await supabase
      .from('email_preferences' as any)
      .upsert({
        user_id: user.id,
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Email preferences update error:', error)
      return NextResponse.json(
        { error: 'Failed to update email preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Email preferences PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}