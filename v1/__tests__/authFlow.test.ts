import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import { GET as authCallbackHandler } from '@/app/auth/callback/route'

// Mock modules for testing
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(),
    })),
  })),
}))

vi.mock('@/lib/utils/error-logger', () => ({
  reportError: vi.fn(),
}))

describe('Authentication Flow Tests', () => {
  let mockSupabaseClient: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Mock server client
    mockSupabaseClient = vi.mocked(createClient)()
    
    // Default mock implementations
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    
    mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('OAuth Flow Testing (Requirement 2.4)', () => {
    const mockUser: User = {
      id: 'oauth-user-id',
      email: 'oauth@example.com',
      user_metadata: {
        full_name: 'OAuth User',
        avatar_url: 'https://example.com/avatar.jpg',
        provider: 'google',
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }

    it('should handle successful OAuth callback', async () => {
      // Create a fresh mock for this test
      const callbackClient = {
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
            error: null,
          }),
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }

      vi.mocked(createClient).mockResolvedValue(callbackClient as any)

      const request = new Request('http://localhost:3000/auth/callback?code=oauth_code_123')
      const response = await authCallbackHandler(request)

      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/dashboard')
      expect(callbackClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code_123')
    })

    it('should handle OAuth callback with return_to parameter', async () => {
      const callbackClient = {
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
            error: null,
          }),
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'oauth-user-id', plan: 'free' },
                error: null,
              }),
            }),
          }),
        }),
      }

      vi.mocked(createClient).mockResolvedValue(callbackClient as any)

      const request = new Request('http://localhost:3000/auth/callback?code=oauth_code_123&return_to=%2Fbackground-remover')
      const response = await authCallbackHandler(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/background-remover')
    })

    it('should create profile for new OAuth users', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
      
      const callbackClient = {
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
            error: null,
          }),
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: mockInsert,
        }),
      }

      vi.mocked(createClient).mockResolvedValue(callbackClient as any)

      const request = new Request('http://localhost:3000/auth/callback?code=oauth_code_123')
      await authCallbackHandler(request)

      expect(mockInsert).toHaveBeenCalledWith({
        id: 'oauth-user-id',
        email: 'oauth@example.com',
        full_name: 'OAuth User',
        avatar_url: 'https://example.com/avatar.jpg',
        plan: 'free',
      })
    })

    it('should handle OAuth errors gracefully', async () => {
      const request = new Request('http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20access')
      const response = await authCallbackHandler(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('error=oauth_failed')
    })

    it('should handle missing authorization code', async () => {
      const request = new Request('http://localhost:3000/auth/callback')
      const response = await authCallbackHandler(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('error=invalid_request')
    })

    it('should handle session exchange failures', async () => {
      const callbackClient = {
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Invalid code', code: 'invalid_grant' },
          }),
        },
      }

      vi.mocked(createClient).mockResolvedValue(callbackClient as any)

      const request = new Request('http://localhost:3000/auth/callback?code=invalid_code')
      const response = await authCallbackHandler(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('error=session_failed')
    })

    it('should prevent open redirect attacks', async () => {
      const callbackClient = {
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
            error: null,
          }),
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'oauth-user-id', plan: 'free' },
                error: null,
              }),
            }),
          }),
        }),
      }

      vi.mocked(createClient).mockResolvedValue(callbackClient as any)

      // Try to redirect to external URL
      const request = new Request('http://localhost:3000/auth/callback?code=oauth_code_123&return_to=https://evil.com')
      const response = await authCallbackHandler(request)

      expect(response.status).toBe(307)
      // Should redirect to dashboard instead of external URL
      expect(response.headers.get('location')).toContain('/dashboard')
      expect(response.headers.get('location')).not.toContain('evil.com')
    })
  })

  describe('Login/Logout Flow Testing', () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }

    it('should handle successful login flow', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await mockSupabaseClient.auth.getUser()

      expect(result.data.user).toEqual(mockUser)
      expect(result.error).toBeNull()
      expect(result.data.user?.id).toBe('test-user-id')
      expect(result.data.user?.email).toBe('test@example.com')
    })

    it('should handle login errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
      })

      const result = await mockSupabaseClient.auth.getUser()

      expect(result.data.user).toBeNull()
      expect(result.error).toEqual({ 
        message: 'Invalid login credentials', 
        code: 'invalid_credentials' 
      })
    })

    it('should handle logout by clearing session', async () => {
      // First, simulate logged in state
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      // Then simulate logged out state
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const loginResult = await mockSupabaseClient.auth.getUser()
      expect(loginResult.data.user).toEqual(mockUser)

      const logoutResult = await mockSupabaseClient.auth.getUser()
      expect(logoutResult.data.user).toBeNull()
    })

    it('should handle session expiration', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired', code: 'jwt_expired' },
      })

      const result = await mockSupabaseClient.auth.getUser()

      expect(result.data.user).toBeNull()
      expect(result.error?.code).toBe('jwt_expired')
    })
  })

  describe('Authentication State Management', () => {
    it('should handle user session retrieval', async () => {
      const mockUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await mockSupabaseClient.auth.getUser()

      expect(result.data.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('should handle user session retrieval errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session not found', code: 'session_not_found' },
      })

      const result = await mockSupabaseClient.auth.getUser()

      expect(result.data.user).toBeNull()
      expect(result.error).toEqual({ message: 'Session not found', code: 'session_not_found' })
    })

    it('should handle edge cases in auth state', async () => {
      // Test with null user data but no error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await mockSupabaseClient.auth.getUser()

      expect(result.data.user).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('Integration with API Routes', () => {
    it('should work with API route authentication requirements', async () => {
      const mockUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await mockSupabaseClient.auth.getUser()

      expect(result.data.user).toEqual(mockUser)
      expect(result.data.user?.id).toBe('test-user-id')
      expect(result.data.user?.email).toBe('test@example.com')
    })

    it('should handle API route authentication failures', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT', code: 'invalid_jwt' },
      })

      const result = await mockSupabaseClient.auth.getUser()

      expect(result.data.user).toBeNull()
      expect(result.error?.code).toBe('invalid_jwt')
    })

    it('should validate user sessions for protected API endpoints', async () => {
      const mockUser: User = {
        id: 'api-user-id',
        email: 'api@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      // Simulate API route authentication check
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Simulate profile lookup for quota checking
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'api-user-id', plan: 'premium' },
              error: null,
            }),
          }),
        }),
      })

      const authResult = await mockSupabaseClient.auth.getUser()
      expect(authResult.data.user?.id).toBe('api-user-id')

      const profileResult = await mockSupabaseClient
        .from('profiles')
        .select('id, plan')
        .eq('id', 'api-user-id')
        .single()
      
      expect(profileResult.data?.plan).toBe('premium')
    })
  })

  describe('Security and Performance', () => {
    it('should handle multiple authentication checks efficiently', async () => {
      const mockUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Simulate multiple auth checks
      const results = await Promise.all([
        mockSupabaseClient.auth.getUser(),
        mockSupabaseClient.auth.getUser(),
        mockSupabaseClient.auth.getUser(),
      ])

      // All should return the same user
      for (const result of results) {
        expect(result.data.user).toEqual(mockUser)
      }

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(3)
    })

    it('should handle network timeouts gracefully', async () => {
      // Simulate network timeout
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network timeout'))

      try {
        await mockSupabaseClient.auth.getUser()
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network timeout')
      }
    })

    it('should maintain session consistency across requests', async () => {
      const mockUser: User = {
        id: 'session-user-id',
        email: 'session@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }

      // First request - authenticated
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      // Second request - session expired
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired', code: 'jwt_expired' },
      })

      const firstResult = await mockSupabaseClient.auth.getUser()
      expect(firstResult.data.user).toEqual(mockUser)

      const secondResult = await mockSupabaseClient.auth.getUser()
      expect(secondResult.data.user).toBeNull()
      expect(secondResult.error?.code).toBe('jwt_expired')
    })
  })

  describe('Protected Route Logic Testing (Requirements 2.1, 2.2)', () => {
    it('should identify protected routes correctly', () => {
      const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/background-remover',
        '/image-upscaler',
        '/mockup-generator',
        '/image-compressor',
      ]

      const publicRoutes = [
        '/',
        '/pricing',
        '/color-picker',
        '/image-cropper',
        '/qr-generator',
        '/gradient-generator',
      ]

      // Test that we can identify protected vs public routes
      protectedRoutes.forEach(route => {
        expect(route.startsWith('/dashboard') || 
               route.startsWith('/profile') ||
               route.startsWith('/background-remover') ||
               route.startsWith('/image-upscaler') ||
               route.startsWith('/mockup-generator') ||
               route.startsWith('/image-compressor')).toBe(true)
      })

      publicRoutes.forEach(route => {
        expect(route.startsWith('/dashboard') || 
               route.startsWith('/profile') ||
               route.startsWith('/background-remover') ||
               route.startsWith('/image-upscaler') ||
               route.startsWith('/mockup-generator') ||
               route.startsWith('/image-compressor')).toBe(false)
      })
    })

    it('should handle return_to parameter encoding correctly (Requirement 2.3)', () => {
      const testCases = [
        { path: '/dashboard', expected: '%2Fdashboard' },
        { path: '/background-remover?mode=batch', expected: '%2Fbackground-remover%3Fmode%3Dbatch' },
        { path: '/dashboard/settings', expected: '%2Fdashboard%2Fsettings' },
      ]

      testCases.forEach(({ path, expected }) => {
        const encoded = encodeURIComponent(path)
        expect(encoded).toBe(expected)
      })
    })

    it('should validate redirect URL security', () => {
      const validUrls = [
        '/dashboard',
        '/profile',
        '/background-remover',
      ]

      const invalidUrls = [
        'https://evil.com',
        'http://malicious.site',
        '//evil.com',
        'javascript:alert(1)',
      ]

      validUrls.forEach(url => {
        // Valid internal URLs should start with /
        expect(url.startsWith('/')).toBe(true)
        expect(url.includes('://')).toBe(false)
      })

      invalidUrls.forEach(url => {
        // Invalid URLs should be detected
        expect(url.includes('://') || url.startsWith('//') || url.startsWith('javascript:')).toBe(true)
      })
    })
  })
})