import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, userRateLimiter, addRateLimitHeaders } from '@/lib/utils/rateLimit'

/**
 * Get user profile information
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting (30 requests per minute for authenticated users)
  const rateLimitResult = await rateLimit(
    request,
    {
      maxRequests: 30,
      windowSeconds: 60,
      errorMessage: 'Too many profile requests. Please try again later.',
    },
    userRateLimiter
  )

  if (!rateLimitResult.success) {
    return rateLimitResult.response!
  }

  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate query parameters to prevent XSS
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Sanitize any query parameters (reject if they contain script tags or javascript:)
    for (const [key, value] of Object.entries(queryParams)) {
      if (typeof value === 'string' && (
        value.includes('<script') ||
        value.includes('javascript:') ||
        value.includes('onerror=') ||
        value.includes('onload=')
      )) {
        return NextResponse.json(
          { error: 'Invalid request parameters' },
          { status: 400 }
        )
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      profile
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    })

    // Add rate limit headers
    return addRateLimitHeaders(response, rateLimitResult.result)

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Update user profile information
 */
export async function PUT(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(
    request,
    {
      maxRequests: 10,
      windowSeconds: 60,
      errorMessage: 'Too many profile update requests. Please try again later.',
    },
    userRateLimiter
  )

  if (!rateLimitResult.success) {
    return rateLimitResult.response!
  }

  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate and sanitize input
    const allowedFields = ['full_name', 'avatar_url']
    const updateData: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Basic input sanitization
        if (typeof body[field] === 'string') {
          updateData[field] = body[field].trim().slice(0, 255)
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .maybeSingle()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      message: 'Profile updated successfully',
      profile
    })

    // Add rate limit headers
    return addRateLimitHeaders(response, rateLimitResult.result)

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}