/**
 * API Route: Increment Usage
 * 
 * Increments the authenticated user's API tool usage count for today.
 * Should be called after successful API tool operations.
 * 
 * @route POST /api/tools/increment-usage
 * @auth Required
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndSendQuotaWarning } from '@/lib/email/send'

// ============================================
// Types
// ============================================

interface IncrementUsageRequest {
  toolName: string
  fileSizeMb?: number
  processingTimeMs?: number
  success?: boolean
  errorMessage?: string
}

interface IncrementUsageResponse {
  success: boolean
  currentUsage: number
  dailyLimit: number
  remaining: number
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
 * Gets daily limit based on user plan
 */
function getDailyLimit(plan: string): number {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
}

/**
 * Validates request body
 */
function validateRequestBody(body: unknown): body is IncrementUsageRequest {
  if (!body || typeof body !== 'object') {
    return false
  }
  
  const req = body as Partial<IncrementUsageRequest>
  
  // toolName is required
  if (!req.toolName || typeof req.toolName !== 'string') {
    return false
  }
  
  // Optional fields validation
  if (req.fileSizeMb !== undefined && typeof req.fileSizeMb !== 'number') {
    return false
  }
  
  if (req.processingTimeMs !== undefined && typeof req.processingTimeMs !== 'number') {
    return false
  }
  
  if (req.success !== undefined && typeof req.success !== 'boolean') {
    return false
  }
  
  if (req.errorMessage !== undefined && typeof req.errorMessage !== 'string') {
    return false
  }
  
  return true
}

// ============================================
// Route Handler
// ============================================

/**
 * POST /api/tools/increment-usage
 * 
 * Increments user's API tool usage count and logs the operation
 * 
 * @body IncrementUsageRequest - Tool usage details
 * @returns IncrementUsageResponse with updated quota information
 * @throws 400 if request body is invalid
 * @throws 401 if user is not authenticated
 * @throws 403 if user has exceeded quota
 * @throws 500 if database operation fails
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      )
    }
    
    // Validate request body
    if (!validateRequestBody(body)) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid request body. toolName is required.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      )
    }
    
    const { toolName, fileSizeMb, processingTimeMs, success = true, errorMessage } = body
    
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
    
    // Check if user can use API tool (has quota remaining)
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
    
    if (!canUse) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Daily quota exceeded',
          code: 'QUOTA_EXCEEDED',
        },
        { status: 403 }
      )
    }
    
    // Increment usage count
    const { data: limitData, error: incrementError } = await supabase.rpc(
      'increment_api_usage',
      { p_user_id: user.id }
    )
    
    if (incrementError) {
      console.error('Error incrementing usage:', incrementError)
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Failed to increment usage',
          code: 'INCREMENT_FAILED',
        },
        { status: 500 }
      )
    }
    
    // Log tool usage for analytics
    const { error: logError } = await supabase.from('tool_usage').insert({
      user_id: user.id,
      tool_name: toolName,
      is_api_tool: true,
      file_size_mb: fileSizeMb,
      processing_time_ms: processingTimeMs,
      success,
      error_message: errorMessage,
    })
    
    if (logError) {
      // Log error but don't fail the request
      console.error('Error logging tool usage:', logError)
    }
    
    // Get updated usage count
    const currentUsage = (limitData as { api_tools_count: number })?.api_tools_count || 0
    const remaining = Math.max(0, dailyLimit - currentUsage)

    // Check if we should send quota warning email (at 80% and 100%)
    // This runs asynchronously to avoid blocking the response
    checkAndSendQuotaWarning(user.id, currentUsage, dailyLimit).catch((error) => {
      console.error('Error checking/sending quota warning:', error)
      // Don't fail the request if email sending fails
    })

    // Return success response
    const response: IncrementUsageResponse = {
      success: true,
      currentUsage,
      dailyLimit,
      remaining,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Unexpected error in increment-usage:', error)
    
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
