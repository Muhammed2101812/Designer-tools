import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { 
  withApiSecurity,
  ApiError,
  ApiErrorType,
  validateRequestBody,
  validateQueryParams,
  createSuccessResponse,
  checkUserQuota,
  incrementUserUsage,
  secureApiRoute
} from '../apiSecurity'

// Mock NextRequest
const createMockRequest = (
  method: string = 'POST',
  ip: string = '192.168.1.1',
  headers: Record<string, string> = {},
  body?: any
) => {
  return {
    method,
    headers: new Headers(headers),
    ip,
    url: 'http://localhost:3000/api/test',
    json: vi.fn().mockResolvedValue(body || {}),
    formData: vi.fn().mockResolvedValue(new FormData()),
  } as unknown as NextRequest
}

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      rpc: vi.fn(() => ({
        error: null,
      })),
      insert: vi.fn(() => ({
        error: null,
      })),
      upsert: vi.fn(() => ({
        error: null,
      })),
    })),
  })),
}))

// Mock rate limiting
vi.mock('../rateLimit', () => ({
  rateLimiter: {
    rateLimit: vi.fn(),
  },
  checkRateLimit: vi.fn(),
  RATE_LIMIT_CONFIGS: {
    free: { maxRequests: 60, windowSeconds: 60 },
    premium: { maxRequests: 120, windowSeconds: 60 },
    pro: { maxRequests: 300, windowSeconds: 60 },
    strict: { maxRequests: 5, windowSeconds: 60 },
  },
  isRedisAvailable: vi.fn(() => false),
}))

// Mock error logger
vi.mock('../../error-logger', () => ({
  reportError: vi.fn(),
}))

describe('API Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('withApiSecurity', () => {
    it('should execute handler for authenticated user within rate limit', async () => {
      const request = createMockRequest('POST', '192.168.1.2')
      
      // Mock authenticated user
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { plan: 'free' },
                error: null,
              }),
            })),
          })),
          rpc: vi.fn(() => ({
            error: null,
          })),
        })),
      } as any)

      // Mock rate limiting to allow request
      const rateLimitModule = await import('../rateLimit')
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 60,
        remaining: 59,
        reset: Date.now() + 60000,
      })

      // Mock handler function
      const mockHandler = vi.fn().mockResolvedValue({ success: true, data: 'test' })

      // Execute withApiSecurity
      const response = await withApiSecurity(
        request,
        mockHandler,
        {
          requireAuth: true,
          allowedMethods: ['POST'],
          rateLimit: 'free',
        }
      )

      // Verify handler was called with correct parameters
      expect(mockHandler).toHaveBeenCalledWith(request, mockUser)
      
      // Verify response structure
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBe('test')
    })

    it('should reject unauthenticated requests when auth required', async () => {
      const request = createMockRequest('POST', '192.168.1.3')
      
      // Mock unauthenticated user
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      } as any)

      // Mock handler function
      const mockHandler = vi.fn().mockResolvedValue({ success: true })

      // Execute withApiSecurity
      const response = await withApiSecurity(
        request,
        mockHandler,
        {
          requireAuth: true,
          allowedMethods: ['POST'],
          rateLimit: 'free',
        }
      )

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.error.type).toBe('AUTHENTICATION')
      expect(data.error.message).toBe('Authentication required')
    })

    it('should reject requests with wrong HTTP method', async () => {
      const request = createMockRequest('GET', '192.168.1.4')
      
      // Mock authenticated user
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any)

      // Mock handler function
      const mockHandler = vi.fn().mockResolvedValue({ success: true })

      // Execute withApiSecurity - only POST allowed but GET sent
      const response = await withApiSecurity(
        request,
        mockHandler,
        {
          requireAuth: true,
          allowedMethods: ['POST'], // Only POST allowed
          rateLimit: 'free',
        }
      )

      const data = await response.json()
      expect(response.status).toBe(405)
      expect(data.error.type).toBe('METHOD_NOT_ALLOWED')
      expect(data.error.message).toContain('Method GET not allowed')
    })

    it('should block requests that exceed rate limit', async () => {
      const request = createMockRequest('POST', '192.168.1.5')
      
      // Mock authenticated user
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any)

      // Mock rate limiting to block request
      const rateLimitModule = await import('../rateLimit')
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
      })

      // Mock handler function
      const mockHandler = vi.fn().mockResolvedValue({ success: true })

      // Execute withApiSecurity
      const response = await withApiSecurity(
        request,
        mockHandler,
        {
          requireAuth: true,
          allowedMethods: ['POST'],
          rateLimit: 'strict', // Strict rate limit
        }
      )

      const data = await response.json()
      expect(response.status).toBe(429)
      expect(data.error.type).toBe('RATE_LIMIT')
      expect(data.error.message).toBe('Rate limit exceeded')
    })

    it('should allow unauthenticated requests when auth not required', async () => {
      const request = createMockRequest('POST', '192.168.1.6')
      
      // Mock rate limiting to allow request
      const rateLimitModule = await import('../rateLimit')
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 30,
        remaining: 29,
        reset: Date.now() + 60000,
      })

      // Mock handler function
      const mockHandler = vi.fn().mockResolvedValue({ success: true, message: 'Public API response' })

      // Execute withApiSecurity without auth requirement
      const response = await withApiSecurity(
        request,
        mockHandler,
        {
          requireAuth: false,
          allowedMethods: ['POST'],
          rateLimit: 'guest',
        }
      )

      // Verify handler was called with no user
      expect(mockHandler).toHaveBeenCalledWith(request, undefined)
      
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Public API response')
    })
  })

  describe('ApiError', () => {
    it('should create error with correct properties', () => {
      const error = new ApiError(
        ApiErrorType.VALIDATION,
        'Invalid input data',
        400,
        { field: 'email' }
      )

      expect(error.type).toBe(ApiErrorType.VALIDATION)
      expect(error.message).toBe('Invalid input data')
      expect(error.statusCode).toBe(400)
      expect(error.context).toEqual({ field: 'email' })
    })

    it('should be instance of Error', () => {
      const error = new ApiError(
        ApiErrorType.INTERNAL,
        'Server error',
        500
      )

      expect(error instanceof Error).toBe(true)
      expect(error instanceof ApiError).toBe(true)
    })
  })

  describe('validateRequestBody', () => {
    it('should validate valid request body', async () => {
      const request = createMockRequest('POST', '192.168.1.7', {}, { name: 'John', age: 30 })
      
      const validator = (data: any) => {
        if (!data.name) return 'Name is required'
        if (!data.age) return 'Age is required'
        if (typeof data.age !== 'number') return 'Age must be a number'
        return true
      }

      const result = await validateRequestBody(request, validator)
      
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should reject invalid request body', async () => {
      const request = createMockRequest('POST', '192.168.1.8', {}, { name: 'John' }) // Missing age
      
      const validator = (data: any) => {
        if (!data.name) return 'Name is required'
        if (!data.age) return 'Age is required'
        if (typeof data.age !== 'number') return 'Age must be a number'
        return true
      }

      await expect(validateRequestBody(request, validator)).rejects.toThrow('Age is required')
    })

    it('should handle invalid JSON', async () => {
      const request = createMockRequest('POST', '192.168.1.9')
      vi.mocked(request.json).mockRejectedValue(new Error('Invalid JSON'))
      
      await expect(validateRequestBody(request)).rejects.toThrow('Invalid JSON in request body')
    })
  })

  describe('validateQueryParams', () => {
    it('should validate required query parameters', () => {
      const request = createMockRequest('GET', '192.168.1.10', {}, undefined)
      vi.mocked(request.url).mockReturnValue('http://localhost:3000/api/test?userId=123&toolName=background-remover')
      
      const params = validateQueryParams(request, ['userId', 'toolName'])
      
      expect(params).toEqual({
        userId: '123',
        toolName: 'background-remover'
      })
    })

    it('should reject missing query parameters', () => {
      const request = createMockRequest('GET', '192.168.1.11', {}, undefined)
      vi.mocked(request.url).mockReturnValue('http://localhost:3000/api/test?userId=123')
      
      expect(() => validateQueryParams(request, ['userId', 'toolName']))
        .toThrow('Missing required query parameter: toolName')
    })
  })

  describe('createSuccessResponse', () => {
    it('should create success response with default status', () => {
      const response = createSuccessResponse({ message: 'Success' })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should create success response with custom status', () => {
      const response = createSuccessResponse(
        { message: 'Created' },
        { status: 201 }
      )
      
      expect(response.status).toBe(201)
    })

    it('should create success response with custom headers', () => {
      const response = createSuccessResponse(
        { message: 'Success' },
        { headers: { 'X-Custom-Header': 'test-value' } }
      )
      
      expect(response.headers.get('X-Custom-Header')).toBe('test-value')
    })
  })

  describe('checkUserQuota', () => {
    it('should allow users within quota', async () => {
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        from: vi.fn((table) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { plan: 'free' },
                    error: null,
                  }),
                })),
              }))
            }
          } else if (table === 'daily_limits') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { api_tools_count: 5 }, // 5 out of 10 for free plan
                    error: null,
                  }),
                })),
              }))
            }
          }
          return {}
        }),
      } as any)

      await expect(checkUserQuota('test-user-id')).resolves.not.toThrow()
    })

    it('should reject users exceeding quota', async () => {
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        from: vi.fn((table) => {
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { plan: 'free' },
                    error: null,
                  }),
                })),
              }))
            }
          } else if (table === 'daily_limits') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { api_tools_count: 15 }, // 15 out of 10 for free plan - exceeds quota
                    error: null,
                  }),
                })),
              }))
            }
          }
          return {}
        }),
      } as any)

      await expect(checkUserQuota('test-user-id')).rejects.toThrow('Daily quota exceeded')
    })
  })

  describe('incrementUserUsage', () => {
    it('should increment user usage successfully', async () => {
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        from: vi.fn((table) => {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }),
      } as any)

      const result = await incrementUserUsage('test-user-id', 'background-remover')
      
      expect(result).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        from: vi.fn((table) => {
          if (table === 'daily_limits') {
            return {
              upsert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
            }
          } else if (table === 'tool_usage') {
            return {
              insert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
            }
          }
          return {}
        }),
      } as any)

      const result = await incrementUserUsage('test-user-id', 'background-remover')
      
      // Should still return true even if database operation fails
      expect(result).toBe(true)
    })
  })

  describe('secureApiRoute', () => {
    it('should pass security checks for valid request', async () => {
      const request = createMockRequest('POST', '192.168.1.12')
      
      // Mock authenticated user
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { plan: 'free' },
                error: null,
              }),
            })),
          })),
        })),
      } as any)

      // Mock rate limiting to allow request
      const rateLimitModule = await import('../rateLimit')
      vi.mocked(rateLimitModule.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 60,
        remaining: 59,
        reset: Date.now() + 60000,
      })

      const result = await secureApiRoute(
        request,
        {
          requireAuth: true,
          allowedMethods: ['POST'],
          rateLimit: 'free',
        }
      )

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })

    it('should fail security checks for invalid request', async () => {
      const request = createMockRequest('GET', '192.168.1.13')
      
      // Mock authenticated user
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const supabaseModule = await import('@/lib/supabase/server')
      vi.mocked(supabaseModule.createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any)

      const result = await secureApiRoute(
        request,
        {
          requireAuth: true,
          allowedMethods: ['POST'], // Only POST allowed but GET sent
          rateLimit: 'free',
        }
      )

      expect(result.success).toBe(false)
      expect(result.response).toBeDefined()
      if (result.response) {
        const data = await result.response.json()
        expect(data.error.type).toBe('METHOD_NOT_ALLOWED')
      }
    })
  })
})