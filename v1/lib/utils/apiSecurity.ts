import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ipRateLimiter, userRateLimiter, apiToolRateLimiter, checkRateLimit, RATE_LIMIT_CONFIGS, RateLimitConfig, RateLimitResult } from './rateLimit';
import { reportError } from './error-logger';

// App Router API Security Functions
export type ApiErrorType = 
  | 'VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMIT'
  | 'BAD_REQUEST'
  | 'INTERNAL'
  | 'METHOD_NOT_ALLOWED';

export class ApiError extends Error {
  type: ApiErrorType;
  statusCode: number;
  context?: Record<string, any>;

  constructor(
    type: ApiErrorType,
    message: string,
    statusCode: number,
    context?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    
    // Set the prototype explicitly for proper inheritance
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface ApiRouteConfig {
  requireAuth?: boolean;
  allowedMethods?: string[];
  rateLimit?: 'guest' | 'free' | 'premium' | 'pro' | 'strict' | RateLimitConfig | false;
  rateLimitIdentifier?: (request: NextRequest, user?: any) => string | Promise<string>;
  errorContext?: Record<string, any>;
}

export interface ApiSecurityResult {
  success: boolean;
  user?: any;
  rateLimit?: RateLimitResult;
  response?: NextResponse;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Complete API security wrapper for app router routes
 */
export async function withApiSecurity<T = any>(
  request: NextRequest,
  handler: (req: NextRequest, user?: any) => Promise<T>,
  config: ApiRouteConfig = {}
): Promise<NextResponse> {
  const {
    requireAuth = true,
    allowedMethods = ['POST'],
    rateLimit = 'free',
    rateLimitIdentifier,
    errorContext = {}
  } = config;

  try {
    // Method validation
    if (allowedMethods && !allowedMethods.includes(request.method || '')) {
      throw new ApiError(
        'METHOD_NOT_ALLOWED',
        `Method ${request.method} not allowed. Allowed: ${allowedMethods.join(', ')}`,
        405
      );
    }

    // Authentication check
    let user = null;
    if (requireAuth) {
      const supabase = await createClient();
      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (error || !authUser) {
        throw new ApiError(
          'AUTHENTICATION',
          'Authentication required',
          401
        );
      }

      user = authUser;
    }

    // Rate limiting
    let rateLimitResult: RateLimitResult | undefined;
    if (rateLimit !== false) {
      let identifier: string;

      if (rateLimitIdentifier) {
        identifier = await rateLimitIdentifier(request, user);
      } else {
        // Default identifier based on auth status
        if (user) {
          identifier = `user_${user.id}`;
        } else {
          // Get IP for unauthenticated requests
          const forwardedFor = request.headers.get('x-forwarded-for');
          identifier = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        }
      }

      // Get rate limit config
      let rateLimitConfig: RateLimitConfig;
      if (typeof rateLimit === 'string') {
        rateLimitConfig = RATE_LIMIT_CONFIGS[rateLimit];
      } else if (typeof rateLimit === 'object') {
        rateLimitConfig = rateLimit;
      } else {
        // Default to free tier
        rateLimitConfig = RATE_LIMIT_CONFIGS.free;
      }

      // Check rate limit
      rateLimitResult = await checkRateLimit(identifier, rateLimitConfig);

      if (!rateLimitResult.success) {
        throw new ApiError(
          'RATE_LIMIT',
          rateLimitConfig.errorMessage || 'Rate limit exceeded',
          429,
          { limit: rateLimitResult.limit, remaining: rateLimitResult.remaining, reset: rateLimitResult.reset }
        );
      }
    }

    // Execute handler
    const result = await handler(request, user);

    // Create response with rate limit headers if available
    const response = NextResponse.json(
      { success: true, ...result },
      { 
        status: 200,
        headers: rateLimitResult 
          ? getRateLimitHeaders(rateLimitResult) 
          : undefined
      }
    );

    return response;
  } catch (error) {
    return handleApiError(error, { ...errorContext, requestUrl: request.url });
  }
}

/**
 * Manual security check function for more granular control
 */
export async function secureApiRoute(
  request: NextRequest,
  config: ApiRouteConfig = {}
): Promise<ApiSecurityResult> {
  const {
    requireAuth = true,
    allowedMethods = ['POST'],
    rateLimit = 'free',
    rateLimitIdentifier,
    errorContext = {}
  } = config;

  // Method validation
  if (allowedMethods && !allowedMethods.includes(request.method || '')) {
    const error = new ApiError(
      'METHOD_NOT_ALLOWED',
      `Method ${request.method} not allowed. Allowed: ${allowedMethods.join(', ')}`,
      405
    );
    const response = handleApiError(error, errorContext);
    return { success: false, response };
  }

  // Authentication check
  let user = null;
  if (requireAuth) {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      const error = new ApiError(
        'AUTHENTICATION',
        'Authentication required',
        401
      );
      const response = handleApiError(error, errorContext);
      return { success: false, response };
    }

    user = authUser;
  }

  // Rate limiting
  let rateLimitResult: RateLimitResult | undefined;
  if (rateLimit !== false) {
    let identifier: string;

    if (rateLimitIdentifier) {
      identifier = await rateLimitIdentifier(request, user);
    } else {
      // Default identifier based on auth status
      if (user) {
        identifier = `user_${user.id}`;
      } else {
        // Get IP for unauthenticated requests
        const forwardedFor = request.headers.get('x-forwarded-for');
        identifier = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
      }
    }

    // Get rate limit config
    let rateLimitConfig: RateLimitConfig;
    if (typeof rateLimit === 'string') {
      rateLimitConfig = RATE_LIMIT_CONFIGS[rateLimit];
    } else if (typeof rateLimit === 'object') {
      rateLimitConfig = rateLimit;
    } else {
      // Default to free tier
      rateLimitConfig = RATE_LIMIT_CONFIGS.free;
    }

    // Check rate limit
    rateLimitResult = await checkRateLimit(identifier, rateLimitConfig);

    if (!rateLimitResult.success) {
      const error = new ApiError(
        'RATE_LIMIT',
        rateLimitConfig.errorMessage || 'Rate limit exceeded',
        429,
        { limit: rateLimitResult.limit, remaining: rateLimitResult.remaining, reset: rateLimitResult.reset }
      );
      const response = handleApiError(error, errorContext);
      return { success: false, response };
    }
  }

  return { success: true, user, rateLimit: rateLimitResult };
}

/**
 * Validate request body with custom validator
 */
export async function validateRequestBody<T = any>(
  request: NextRequest,
  validator?: (data: any) => true | string
): Promise<T> {
  let body: any;
  
  try {
    body = await request.json();
  } catch (error) {
    throw new ApiError(
      'VALIDATION',
      'Invalid JSON in request body',
      400
    );
  }

  if (validator) {
    const validation = validator(body);
    if (validation !== true) {
      throw new ApiError(
        'VALIDATION',
        validation || 'Invalid request body',
        400
      );
    }
  }

  return body;
}

/**
 * Validate required query parameters
 */
export function validateQueryParams(
  request: NextRequest,
  requiredParams: string[]
): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};

  for (const param of requiredParams) {
    const value = url.searchParams.get(param);
    if (value === null) {
      throw new ApiError(
        'VALIDATION',
        `Missing required query parameter: ${param}`,
        400
      );
    }
    params[param] = value;
  }

  return params;
}

/**
 * Create success response with proper headers
 */
export function createSuccessResponse<T>(
  data: T,
  options: {
    status?: number;
    headers?: Record<string, string>;
    rateLimit?: RateLimitResult;
  } = {}
): NextResponse {
  const { status = 200, headers = {}, rateLimit } = options;
  
  // Add rate limit headers if provided
  const responseHeaders = { ...headers };
  if (rateLimit) {
    Object.assign(responseHeaders, getRateLimitHeaders(rateLimit));
  }

  return NextResponse.json(
    { success: true, ...data },
    { status, headers: responseHeaders }
  );
}

/**
 * Check if user has available API quota
 */
export async function checkUserQuota(userId: string): Promise<void> {
  const supabase = await createClient();
  
  // Get user's plan and daily limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    throw new ApiError(
      'NOT_FOUND',
      'User profile not found',
      404
    );
  }

  const plan = profile.plan || 'free';
  const maxQuota = plan === 'free' ? 10 : plan === 'premium' ? 500 : 2000;

  // Get current usage for today
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyLimit } = await supabase
    .from('daily_limits')
    .select('api_tools_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const currentUsage = dailyLimit?.api_tools_count || 0;
  
  if (currentUsage >= maxQuota) {
    throw new ApiError(
      'QUOTA_EXCEEDED',
      `Daily quota exceeded. Quota resets daily.`,
      429,
      { maxQuota, currentUsage }
    );
  }
}

/**
 * Increment user's API usage after successful operation
 */
export async function incrementUserUsage(userId: string, toolName: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Insert or update daily limit
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('daily_limits')
    .upsert({
      user_id: userId,
      date: today,
      api_tools_count: 1
    }, {
      onConflict: 'user_id,date'
    });
  
  if (error) {
    console.error('Error incrementing user usage:', error);
    return false;
  }
  
  // Also insert into tool_usage for analytics
  const { error: toolError } = await supabase
    .from('tool_usage')
    .insert({
      user_id: userId,
      tool_name: toolName,
      is_api_tool: true,
      success: true,
      created_at: new Date().toISOString()
    });
  
  if (toolError) {
    console.error('Error recording tool usage:', toolError);
    // Don't fail the operation if just tool usage recording fails
  }
  
  return true;
}

/**
 * Standardized API error handler for app router
 */
export function handleApiError(
  error: any,
  context?: Record<string, any>
): NextResponse {
  let statusCode = 500;
  let message = 'Internal server error';
  let type: ApiErrorType = 'INTERNAL';

  // Handle different error types
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    type = error.type;
  } else if (error.status) {
    statusCode = error.status;
    message = error.message || 'API Error';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message || 'API Error';
  }

  // Log the error
  reportError(
    new Error(`API Error: ${message} (Type: ${type}, Status: ${statusCode})`),
    type,
    { ...context, statusCode, type, originalError: error }
  );

  // Prepare response body
  const responseBody: any = {
    error: {
      type,
      message,
      status: statusCode,
    }
  };

  // Add additional data for specific error types
  if (error.context) {
    responseBody.error.context = error.context;
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    responseBody.error.stack = error.stack;
  }

  // Create headers with rate limit info if available
  const headers: Record<string, string> = {};
  if (type === 'RATE_LIMIT' && error.context) {
    headers['X-RateLimit-Limit'] = error.context.limit?.toString() || 'unknown';
    headers['X-RateLimit-Remaining'] = error.context.remaining?.toString() || 'unknown';
    headers['X-RateLimit-Reset'] = error.context.reset?.toString() || 'unknown';
    headers['Retry-After'] = error.context.reset ? 
      Math.floor(error.context.reset - Date.now() / 1000).toString() : '60';
  }

  return NextResponse.json(responseBody, {
    status: statusCode,
    headers
  });
}

/**
 * Get rate limit headers as an object
 */
function getRateLimitHeaders(rateLimitResult: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.reset.toString(),
  };
}

/**
 * Get retry after value in seconds
 */
export function getRetryAfterSeconds(rateLimitResult: RateLimitResult): number {
  const resetTime = new Date(rateLimitResult.reset * 1000); // Convert to milliseconds
  const now = new Date();
  const diffSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
  
  // Return at least 1 second to avoid negative values
  return Math.max(1, diffSeconds);
}

// Pages Router API Security Functions (existing)
/**
 * Secure API route wrapper that handles authentication, rate limiting, and method control
 */
export const secureApiRoutePages = async (
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>,
  options: {
    requireAuth?: boolean;
    rateLimitType?: 'ip' | 'user' | 'api';
    requireMethod?: string | string[];
  } = {}
) => {
  const { requireAuth = true, rateLimitType = 'user', requireMethod } = options;

  // Method validation
  if (requireMethod) {
    const methods = Array.isArray(requireMethod) ? requireMethod : [requireMethod];
    if (!methods.includes(req.method || '')) {
      return handleApiErrorPages(res, {
        message: 'Method not allowed',
        status: 405,
        type: 'METHOD_NOT_ALLOWED'
      });
    }
  }

  // Rate limiting
  let identifier = req.ip || 'unknown';
  if (rateLimitType === 'user' && requireAuth) {
    // For user-based rate limiting, we need to get the user ID
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return handleApiErrorPages(res, {
        message: 'Authentication required for rate limiting',
        status: 401,
        type: 'AUTH_REQUIRED'
      });
    }
    
    identifier = `user_${user.id}`;
  } else if (rateLimitType === 'api') {
    identifier = `api_${req.url || 'unknown'}`;
  }

  try {
    const rateLimitResult = await rateLimiter.rateLimit(identifier, rateLimitType);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimitResult.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());
    
    if (!rateLimitResult.success) {
      return handleApiErrorPages(res, {
        message: 'Rate limit exceeded',
        status: 429,
        type: 'RATE_LIMIT_EXCEEDED'
      });
    }
  } catch (error) {
    // If rate limiting fails, log the error but continue with the request
    reportError(error as Error, 'RATE_LIMIT_ERROR');
  }

  // Authentication check
  if (requireAuth) {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return handleApiErrorPages(res, {
        message: 'Authentication required',
        status: 401,
        type: 'UNAUTHORIZED'
      });
    }
  }

  try {
    return await handler(req, res);
  } catch (error) {
    return handleApiErrorPages(res, error);
  }
};

/**
 * Standardized API error handler for pages router
 */
export const handleApiErrorPages = (
  res: NextApiResponse,
  error: any
) => {
  let status = 500;
  let message = 'Internal server error';
  let type = 'INTERNAL_ERROR';

  // Handle different error types
  if (error.status) {
    status = error.status;
  } else if (error.statusCode) {
    status = error.statusCode;
  }

  if (error.message) {
    message = error.message;
  }

  if (error.type) {
    type = error.type;
  }

  // Log the error
  reportError(
    new Error(`API Error: ${message} (Type: ${type}, Status: ${status})`),
    type,
    { status, type, originalError: error }
  );

  res.status(status).json({
    error: {
      type,
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

/**
 * Example usage documentation:
 * 
 * // App Router
 * import { withApiSecurity } from '@/lib/utils/apiSecurity';
 * 
 * export async function POST(request: NextRequest) {
 *   return withApiSecurity(
 *     request,
 *     async (req, user) => {
 *       // Your actual API logic here
 *       return { success: true };
 *     },
 *     {
 *       requireAuth: true,
 *       rateLimit: 'free',
 *       allowedMethods: ['POST']
 *     }
 *   );
 * }
 * 
 * // Pages Router
 * import { secureApiRoutePages, handleApiErrorPages } from '@/lib/utils/apiSecurity';
 * 
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   return secureApiRoutePages(
 *     req, 
 *     res, 
 *     async (req, res) => {
 *       // Your actual API logic here
 *       res.status(200).json({ success: true });
 *     },
 *     {
 *       requireAuth: true,
 *       rateLimitType: 'user',
 *       requireMethod: 'POST'
 *     }
 *   );
 * }
 */