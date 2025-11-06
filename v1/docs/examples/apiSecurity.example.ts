/**
 * API Security Examples
 * Practical examples of using API security utilities
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  withApiSecurity,
  secureApiRoute,
  handleApiError,
  checkUserQuota,
  incrementUserUsage,
  validateRequestBody,
  validateQueryParams,
  createSuccessResponse,
  ApiError,
  ApiErrorType,
} from './apiSecurity'

// ============================================================================
// Example 1: Simple Protected Route
// ============================================================================

/**
 * Basic authenticated route with default settings
 * - Requires authentication
 * - POST method only
 * - Free tier rate limiting (60 req/min)
 */
export async function example1_SimpleProtectedRoute(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      return {
        message: `Hello ${user!.email}`,
        userId: user!.id,
      }
    },
    {
      requireAuth: true,
      allowedMethods: ['POST'],
      rateLimit: 'free',
    }
  )
}

// ============================================================================
// Example 2: API Tool with Quota Management
// ============================================================================

/**
 * API tool route with quota checking and usage tracking
 * - Checks quota before processing
 * - Increments usage after success
 * - Strict rate limiting (5 req/min)
 */
export async function example2_ApiToolWithQuota(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Validate request body
      const body = await validateRequestBody(req, (data) => {
        if (!data.imageUrl) {
          return 'imageUrl is required'
        }
        if (typeof data.imageUrl !== 'string') {
          return 'imageUrl must be a string'
        }
        return true
      })
      
      // Check if user has quota available
      await checkUserQuota(user!.id)
      
      // Process the image (simulated)
      const result = await processImage(body.imageUrl)
      
      // Increment usage after successful processing
      await incrementUserUsage(user!.id, 'background-remover')
      
      return {
        success: true,
        result,
        remainingQuota: result.remainingQuota,
      }
    },
    {
      requireAuth: true,
      allowedMethods: ['POST'],
      rateLimit: 'strict', // 5 requests per minute for expensive operations
      errorContext: {
        toolName: 'background-remover',
        endpoint: '/api/tools/background-remover',
      },
    }
  )
}

// ============================================================================
// Example 3: Public Route with IP Rate Limiting
// ============================================================================

/**
 * Public contact form endpoint
 * - No authentication required
 * - IP-based rate limiting
 * - Input validation
 */
export async function example3_PublicRoute(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req) => {
      // Validate contact form data
      const body = await validateRequestBody(req, (data) => {
        if (!data.email || !data.message) {
          return 'Email and message are required'
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
          return 'Invalid email address'
        }
        
        if (data.message.length < 10) {
          return 'Message must be at least 10 characters'
        }
        
        return true
      })
      
      // Send email (simulated)
      await sendContactEmail(body.email, body.message)
      
      return {
        success: true,
        message: 'Your message has been sent',
      }
    },
    {
      requireAuth: false,
      allowedMethods: ['POST'],
      rateLimit: 'guest', // IP-based, 30 req/min
      errorContext: { endpoint: 'contact-form' },
    }
  )
}

// ============================================================================
// Example 4: Admin Route with Role Check
// ============================================================================

/**
 * Admin-only analytics endpoint
 * - Requires authentication
 * - Additional role check
 * - Manual security checks for custom logic
 */
export async function example4_AdminRoute(request: NextRequest) {
  try {
    // Run security checks
    const security = await secureApiRoute(request, {
      requireAuth: true,
      allowedMethods: ['GET'],
      rateLimit: 'premium',
    })
    
    if (!security.success) {
      return security.response
    }
    
    const user = security.user!
    
    // Additional role check (custom logic)
    // Note: In a real implementation, you would have a role column in profiles
    // or a separate admin_users table. This is just an example.
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()
    
    // Example: Check if user email is in admin list
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(profile?.email || '')) {
      throw new ApiError(
        ApiErrorType.AUTHORIZATION,
        'Admin access required',
        403
      )
    }
    
    // Get analytics data
    const analytics = await getAnalyticsData()
    
    return createSuccessResponse(analytics, {
      rateLimit: security.rateLimit,
    })
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'admin-analytics',
      userId: request.headers.get('x-user-id'),
    })
  }
}

// ============================================================================
// Example 5: Webhook Handler (No Auth, Custom Rate Limit)
// ============================================================================

/**
 * Stripe webhook handler
 * - No authentication (verified by signature)
 * - Custom rate limit identifier
 * - Special error handling
 */
export async function example5_WebhookHandler(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req) => {
      const body = await req.text()
      const signature = req.headers.get('stripe-signature')
      
      if (!signature) {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Missing stripe-signature header',
          400
        )
      }
      
      // Verify webhook signature (simulated)
      const event = await verifyStripeWebhook(body, signature)
      
      // Process webhook event
      await handleStripeEvent(event)
      
      return { received: true }
    },
    {
      requireAuth: false,
      allowedMethods: ['POST'],
      rateLimit: {
        maxRequests: 100,
        windowSeconds: 60,
        identifier: () => 'stripe-webhook', // Single identifier for all webhook requests
        errorMessage: 'Webhook rate limit exceeded',
      },
      errorContext: { endpoint: 'stripe-webhook' },
    }
  )
}

// ============================================================================
// Example 6: Batch Processing with Custom Rate Limit
// ============================================================================

/**
 * Batch image processing endpoint
 * - Custom rate limit per tool
 * - Validates batch size
 * - Checks quota for each item
 */
export async function example6_BatchProcessing(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Validate batch request
      const body = await validateRequestBody(req, (data) => {
        if (!Array.isArray(data.images)) {
          return 'images must be an array'
        }
        
        if (data.images.length === 0) {
          return 'images array cannot be empty'
        }
        
        if (data.images.length > 10) {
          return 'Maximum 10 images per batch'
        }
        
        return true
      })
      
      // Check quota for batch size
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      
      const { data: dailyLimit } = await supabase
        .from('daily_limits')
        .select('api_tools_count')
        .eq('user_id', user!.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single()
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user!.id)
        .single()
      
      const plan = profile?.plan || 'free'
      const maxQuota = plan === 'free' ? 10 : plan === 'premium' ? 500 : 2000
      const currentUsage = dailyLimit?.api_tools_count || 0
      const remaining = maxQuota - currentUsage
      
      if (remaining < body.images.length) {
        throw new ApiError(
          ApiErrorType.QUOTA_EXCEEDED,
          `Insufficient quota. Need ${body.images.length}, have ${remaining}`,
          429
        )
      }
      
      // Process batch
      const results = await Promise.all(
        body.images.map((img: string) => processImage(img))
      )
      
      // Increment usage for each processed image
      for (let i = 0; i < body.images.length; i++) {
        await incrementUserUsage(user!.id, 'batch-processor')
      }
      
      return {
        success: true,
        processed: results.length,
        results,
      }
    },
    {
      requireAuth: true,
      allowedMethods: ['POST'],
      rateLimit: {
        maxRequests: 5,
        windowSeconds: 3600, // 5 batches per hour
        errorMessage: 'Batch processing limit reached. Try again in an hour.',
      },
      rateLimitIdentifier: async (req, user) => {
        // Separate rate limit per tool
        return `batch:${user!.id}:processor`
      },
      errorContext: { toolName: 'batch-processor' },
    }
  )
}

// ============================================================================
// Example 7: Query Parameter Validation
// ============================================================================

/**
 * User statistics endpoint with query parameters
 * - Validates required query params
 * - Date range validation
 */
export async function example7_QueryParamValidation(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Validate required query parameters
      const params = validateQueryParams(req, ['startDate', 'endDate'])
      
      // Additional validation
      const startDate = new Date(params.startDate)
      const endDate = new Date(params.endDate)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Invalid date format',
          400
        )
      }
      
      if (startDate > endDate) {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'startDate must be before endDate',
          400
        )
      }
      
      // Get statistics
      const stats = await getUserStats(user!.id, startDate, endDate)
      
      return {
        success: true,
        stats,
        period: {
          start: params.startDate,
          end: params.endDate,
        },
      }
    },
    {
      requireAuth: true,
      allowedMethods: ['GET'],
      rateLimit: 'free',
    }
  )
}

// ============================================================================
// Example 8: Multiple Method Handler
// ============================================================================

/**
 * RESTful resource endpoint supporting multiple methods
 * - GET: Retrieve resource
 * - POST: Create resource
 * - PUT: Update resource
 * - DELETE: Delete resource
 */
export async function example8_MultipleMethodHandler(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      const method = req.method
      
      switch (method) {
        case 'GET':
          return await getResource(user!.id)
        
        case 'POST':
          const createBody = await validateRequestBody(req, (data) => {
            if (!data.name) return 'name is required'
            return true
          })
          return await createResource(user!.id, createBody)
        
        case 'PUT':
          const updateBody = await validateRequestBody(req, (data) => {
            if (!data.id) return 'id is required'
            return true
          })
          return await updateResource(user!.id, updateBody)
        
        case 'DELETE':
          const deleteParams = validateQueryParams(req, ['id'])
          return await deleteResource(user!.id, deleteParams.id)
        
        default:
          throw new ApiError(
            ApiErrorType.BAD_REQUEST,
            'Unsupported method',
            405
          )
      }
    },
    {
      requireAuth: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      rateLimit: 'free',
    }
  )
}

// ============================================================================
// Helper Functions (Simulated)
// ============================================================================

async function processImage(imageUrl: string) {
  // Simulate image processing
  await new Promise(resolve => setTimeout(resolve, 100))
  return {
    success: true,
    processedUrl: imageUrl + '-processed',
    remainingQuota: 8,
  }
}

async function sendContactEmail(email: string, message: string) {
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 50))
  console.log(`Email sent to ${email}: ${message}`)
}

async function getAnalyticsData() {
  // Simulate analytics data retrieval
  return {
    totalUsers: 1000,
    activeUsers: 500,
    apiCalls: 10000,
  }
}

async function verifyStripeWebhook(body: string, signature: string) {
  // Simulate webhook verification
  return {
    type: 'checkout.session.completed',
    data: { object: {} },
  }
}

async function handleStripeEvent(event: any) {
  // Simulate event handling
  console.log('Processing event:', event.type)
}

async function getUserStats(userId: string, startDate: Date, endDate: Date) {
  // Simulate stats retrieval
  return {
    totalOperations: 50,
    successRate: 0.95,
    averageProcessingTime: 1.2,
  }
}

async function getResource(userId: string) {
  return { id: '1', name: 'Resource', userId }
}

async function createResource(userId: string, data: any) {
  return { id: '2', ...data, userId }
}

async function updateResource(userId: string, data: any) {
  return { id: data.id, ...data, userId }
}

async function deleteResource(userId: string, id: string) {
  return { success: true, id }
}
