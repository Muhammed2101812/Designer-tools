import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getRateLimitConfig } from '@/lib/utils/rateLimit'
import { createUserFriendlyRateLimitError } from '@/lib/utils/rateLimitErrorHandler'

/**
 * Example API route demonstrating rate limit error handling
 */
export async function POST(request: NextRequest) {
  try {
    // Get user information
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Determine user plan for appropriate rate limiting
    let userPlan: 'guest' | 'free' | 'premium' | 'pro' = 'guest'
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      
      userPlan = (profile?.plan as 'free' | 'premium' | 'pro') || 'free'
    }
    
    // Get rate limit configuration for user plan
    const rateLimitConfig = getRateLimitConfig(userPlan)
    
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, rateLimitConfig)
    
    if (!rateLimitResult.success) {
      // Return user-friendly rate limit error
      return createUserFriendlyRateLimitError(
        rateLimitResult.result.limit,
        rateLimitResult.result.remaining,
        rateLimitResult.result.reset,
        userPlan
      )
    }
    
    // Process the actual request
    const body = await request.json()
    
    // Your API logic here...
    
    return Response.json({
      success: true,
      message: 'Request processed successfully',
      data: body,
    })
    
  } catch (error) {
    console.error('API error:', error)
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}