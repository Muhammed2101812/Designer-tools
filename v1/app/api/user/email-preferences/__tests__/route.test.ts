import { NextRequest } from 'next/server'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT } from '../route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('/api/user/email-preferences', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockPreferences = {
    id: 'pref-123',
    user_id: 'user-123',
    marketing_emails: true,
    quota_warnings: true,
    subscription_updates: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('GET', () => {
    it('should return existing email preferences', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockPreferences,
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockPreferences)
      expect(mockSupabase.from).toHaveBeenCalledWith('email_preferences')
    })

    it('should create default preferences if none exist', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // First call returns no data (PGRST116 error)
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Second call (insert) returns new preferences
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: {
          ...mockPreferences,
          marketing_emails: true,
          quota_warnings: true,
          subscription_updates: true,
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.marketing_emails).toBe(true)
      expect(data.quota_warnings).toBe(true)
      expect(data.subscription_updates).toBe(true)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 500 if database error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'SOME_ERROR', message: 'Database error' },
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch email preferences')
    })
  })

  describe('PUT', () => {
    it('should update email preferences successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const updatedPreferences = {
        ...mockPreferences,
        marketing_emails: false,
        quota_warnings: false,
      }

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedPreferences,
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: false,
          quota_warnings: false,
          subscription_updates: true,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.marketing_emails).toBe(false)
      expect(data.quota_warnings).toBe(false)
      expect(data.subscription_updates).toBe(true)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: false,
          quota_warnings: false,
          subscription_updates: true,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid request data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: 'invalid', // Should be boolean
          quota_warnings: true,
          subscription_updates: true,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should return 500 if database error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: false,
          quota_warnings: false,
          subscription_updates: true,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update email preferences')
    })
  })
})