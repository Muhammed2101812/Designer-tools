import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, userRateLimiter, addRateLimitHeaders } from '@/lib/utils/rateLimit'

/**
 * Create Stripe checkout session
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (30 requests per minute for authenticated users)
  const rateLimitResult = await rateLimit(
    request,
    {
      maxRequests: 30,
      windowSeconds: 60,
      errorMessage: 'Too many checkout requests. Please try again later.',
    },
    userRateLimiter
  )

  if (!rateLimitResult.success) {
    return rateLimitResult.response!
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate plan parameter
    const validPlans = ['premium', 'pro']
    if (!body.plan || !validPlans.includes(body.plan)) {
      return NextResponse.json(
        { error: 'Invalid plan parameter' },
        { status: 400 }
      )
    }

    // Sanitize plan input
    const plan = body.plan.toLowerCase().trim()

    // Mock Stripe checkout session creation
    const checkoutSession = {
      id: `cs_mock_${Date.now()}`,
      url: `https://checkout.stripe.com/pay/cs_mock_${Date.now()}`,
      plan,
      user_id: user.id,
      created: new Date().toISOString()
    }

    const response = NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      plan: checkoutSession.plan
    })

    // Add rate limit headers
    return addRateLimitHeaders(response, rateLimitResult.result)

  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}