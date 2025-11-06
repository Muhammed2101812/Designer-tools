/**
 * API Route: Check User Quota
 * 
 * Checks if the authenticated user has remaining API quota for today.
 * Returns quota information including current usage, daily limit, and plan details.
 * 
 * @route GET /api/tools/check-quota
 * @auth Required
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================
// Types
// ============================================

interface QuotaResponse {
  canUse: boolean
  currentUsage: number
  dailyLimit: number
  remaining: number
  plan: string
  resetAt: string
}

interface ErrorResponse {
  error: string
  code: string
}

// ============================================
// Constants
// ============================================

const PLAN_LIMITS = {
  free: 10,
  premium: 500,
  pro: 2000,
} as const

// ============================================
// Helper Functions
// ============================================

/**
 * Gets the reset time for daily quota (midnight UTC)
 */
function getQuotaResetTime(): string {
  const tomorrow = new Date()
  tomorrow.setUTCHours(24, 0, 0, 0)
  return tomorrow.toISOString()
}

/**
 * Gets daily limit based on user plan
 */
function getDailyLimit(plan: string): number {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
}

// ============================================
// Route Handler
// ============================================

/**
 * GET /api/tools/check-quota
 * 
 * Checks user's remaining API quota for today
 * 
 * @returns QuotaResponse with quota information
 * @throws 401 if user is not authenticated
 * @throws 500 if database query fails
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }
    
    // Get user's profile to determine plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND',
        },
        { status: 404 }
      )
    }
    
    const plan = profile.plan || 'free'
    const dailyLimit = getDailyLimit(plan)
    
    // Call database function to check quota
    const { data: canUseData, error: canUseError } = await supabase.rpc(
      'can_use_api_tool',
      { p_user_id: user.id }
    )
    
    if (canUseError) {
      console.error('Error checking quota:', canUseError)
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Failed to check quota',
          code: 'QUOTA_CHECK_FAILED',
        },
        { status: 500 }
      )
    }
    
    const canUse = canUseData as boolean
    
    // Get current usage for today
    const { data: limitData, error: limitError } = await supabase
      .from('daily_limits')
      .select('api_tools_count')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle()

    // If no record exists or error, usage is 0
    const currentUsage = limitData?.api_tools_count || 0
    const remaining = Math.max(0, dailyLimit - currentUsage)
    
    // Return quota information
    const response: QuotaResponse = {
      canUse,
      currentUsage,
      dailyLimit,
      remaining,
      plan,
      resetAt: getQuotaResetTime(),
    }
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Unexpected error in check-quota:', error)
    
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
