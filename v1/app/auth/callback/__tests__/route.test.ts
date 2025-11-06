import { NextRequest } from 'next/server'
import { GET } from '../route'
import { vi } from 'vitest'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  },
}))

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/error-logger', () => ({
  reportError: vi.fn(),
}))

describe('Auth Callback Route', () => {
  const mockSupabase = {
    auth: {
      exchangeCodeForSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(),
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  it('should handle missing authorization code', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback')
    
    const response = await GET(request)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/login')
    expect(response.headers.get('location')).toContain('error=invalid_request')
  })

  it('should handle OAuth errors', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20access')
    
    const response = await GET(request)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/login')
    expect(response.headers.get('location')).toContain('error=oauth_failed')
  })

  it('should redirect to return_to parameter on successful auth', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback?code=test_code&return_to=/dashboard')
    
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'test_token' } },
      error: null,
    })
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test_user', email: 'test@example.com' } },
      error: null,
    })
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { id: 'test_user', plan: 'free' },
      error: null,
    })
    
    const response = await GET(request)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
  })

  it('should prevent open redirects', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback?code=test_code&return_to=https://evil.com/steal-data')
    
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'test_token' } },
      error: null,
    })
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test_user', email: 'test@example.com' } },
      error: null,
    })
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { id: 'test_user', plan: 'free' },
      error: null,
    })
    
    const response = await GET(request)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
  })

  it('should create profile for new OAuth users', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback?code=test_code')
    
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'test_token' } },
      error: null,
    })
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { 
        user: { 
          id: 'test_user', 
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: 'https://example.com/avatar.jpg'
          }
        } 
      },
      error: null,
    })
    
    // Simulate no existing profile
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: null,
    })
    
    const mockInsert = vi.fn()
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: mockInsert.mockResolvedValue({ error: null }),
    })
    
    const response = await GET(request)
    
    expect(mockInsert).toHaveBeenCalledWith({
      id: 'test_user',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      plan: 'free',
    })
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
  })
})