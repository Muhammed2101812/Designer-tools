import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
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

describe('Email Preferences Management', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  const mockPreferences = {
    id: 'pref-123',
    user_id: 'user-123',
    marketing_emails: true,
    quota_warnings: true,
    subscription_updates: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/user/email-preferences', () => {
    it('should return existing email preferences for authenticated user', async () => {
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
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*')
    })

    it('should create default preferences when none exist', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // First call returns no data (PGRST116 error - no rows found)
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const defaultPreferences = {
        ...mockPreferences,
        marketing_emails: true,
        quota_warnings: true,
        subscription_updates: true,
      }

      // Second call (insert) returns new preferences
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: defaultPreferences,
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.marketing_emails).toBe(true)
      expect(data.quota_warnings).toBe(true)
      expect(data.subscription_updates).toBe(true)
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        marketing_emails: true,
        quota_warnings: true,
        subscription_updates: true,
      })
    })

    it('should return 401 for unauthenticated requests', async () => {
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

    it('should handle database errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'CONNECTION_ERROR', message: 'Database connection failed' },
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch email preferences')
    })

    it('should handle default preferences creation errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // First call returns no data
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      // Insert fails
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create email preferences')
    })

    it('should handle authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/user/email-preferences', () => {
    it('should update email preferences successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const updatedPreferences = {
        ...mockPreferences,
        marketing_emails: false,
        quota_warnings: false,
        subscription_updates: true,
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
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        marketing_emails: false,
        quota_warnings: false,
        subscription_updates: true,
        updated_at: expect.any(String),
      })
    })

    it('should handle partial updates correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const updatedPreferences = {
        ...mockPreferences,
        marketing_emails: false,
      }

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedPreferences,
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: false,
          quota_warnings: true,
          subscription_updates: true,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.marketing_emails).toBe(false)
    })

    it('should return 401 for unauthenticated requests', async () => {
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

    it('should validate request data and return 400 for invalid input', async () => {
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
      expect(Array.isArray(data.details)).toBe(true)
    })

    it('should validate all required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: true,
          // Missing quota_warnings and subscription_updates
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should handle database update errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
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

    it('should handle malformed JSON gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: 'invalid json',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle empty request body', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({}),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should include updated_at timestamp in upsert', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const updatedPreferences = {
        ...mockPreferences,
        marketing_emails: false,
        updated_at: new Date().toISOString(),
      }

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedPreferences,
        error: null,
      })

      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: false,
          quota_warnings: true,
          subscription_updates: true,
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        marketing_emails: false,
        quota_warnings: true,
        subscription_updates: true,
        updated_at: expect.any(String),
      })
    })
  })

  describe('Email Preferences Data Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('should accept valid boolean values', async () => {
      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: mockPreferences,
        error: null,
      })

      const validInputs = [
        { marketing_emails: true, quota_warnings: true, subscription_updates: true },
        { marketing_emails: false, quota_warnings: false, subscription_updates: false },
        { marketing_emails: true, quota_warnings: false, subscription_updates: true },
      ]

      for (const input of validInputs) {
        const request = new NextRequest('http://localhost/api/user/email-preferences', {
          method: 'PUT',
          body: JSON.stringify(input),
        })

        const response = await PUT(request)
        expect(response.status).toBe(200)
      }
    })

    it('should reject non-boolean values', async () => {
      const invalidInputs = [
        { marketing_emails: 'true', quota_warnings: true, subscription_updates: true },
        { marketing_emails: 1, quota_warnings: true, subscription_updates: true },
        { marketing_emails: true, quota_warnings: 'false', subscription_updates: true },
        { marketing_emails: true, quota_warnings: true, subscription_updates: null },
        { marketing_emails: [], quota_warnings: true, subscription_updates: true },
        { marketing_emails: {}, quota_warnings: true, subscription_updates: true },
      ]

      for (const input of invalidInputs) {
        const request = new NextRequest('http://localhost/api/user/email-preferences', {
          method: 'PUT',
          body: JSON.stringify(input),
        })

        const response = await PUT(request)
        expect(response.status).toBe(400)
      }
    })

    it('should reject extra fields', async () => {
      const request = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: true,
          quota_warnings: true,
          subscription_updates: true,
          extra_field: 'should not be allowed',
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should require all three preference fields', async () => {
      const incompleteInputs = [
        { marketing_emails: true },
        { quota_warnings: true },
        { subscription_updates: true },
        { marketing_emails: true, quota_warnings: true },
        { marketing_emails: true, subscription_updates: true },
        { quota_warnings: true, subscription_updates: true },
      ]

      for (const input of incompleteInputs) {
        const request = new NextRequest('http://localhost/api/user/email-preferences', {
          method: 'PUT',
          body: JSON.stringify(input),
        })

        const response = await PUT(request)
        expect(response.status).toBe(400)
      }
    })
  })

  describe('Email Preferences Integration Scenarios', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('should handle user with no existing preferences (first time setup)', async () => {
      // GET request - no preferences exist
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const defaultPreferences = {
        ...mockPreferences,
        marketing_emails: true,
        quota_warnings: true,
        subscription_updates: true,
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: defaultPreferences,
        error: null,
      })

      const getRequest = new NextRequest('http://localhost/api/user/email-preferences')
      const getResponse = await GET(getRequest)
      const getData = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getData.marketing_emails).toBe(true)
      expect(getData.quota_warnings).toBe(true)
      expect(getData.subscription_updates).toBe(true)

      // PUT request - update preferences
      vi.clearAllMocks()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const updatedPreferences = {
        ...defaultPreferences,
        marketing_emails: false,
      }

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedPreferences,
        error: null,
      })

      const putRequest = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: false,
          quota_warnings: true,
          subscription_updates: true,
        }),
      })

      const putResponse = await PUT(putRequest)
      const putData = await putResponse.json()

      expect(putResponse.status).toBe(200)
      expect(putData.marketing_emails).toBe(false)
    })

    it('should handle concurrent requests gracefully', async () => {
      // Simulate concurrent GET and PUT requests
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockPreferences,
        error: null,
      })

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: { ...mockPreferences, marketing_emails: false },
        error: null,
      })

      const getRequest = new NextRequest('http://localhost/api/user/email-preferences')
      const putRequest = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: false,
          quota_warnings: true,
          subscription_updates: true,
        }),
      })

      // Execute both requests
      const [getResponse, putResponse] = await Promise.all([
        GET(getRequest),
        PUT(putRequest),
      ])

      expect(getResponse.status).toBe(200)
      expect(putResponse.status).toBe(200)
    })

    it('should maintain data consistency across operations', async () => {
      // Initial state
      let currentPreferences = { ...mockPreferences }

      // GET - fetch current preferences
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: currentPreferences,
        error: null,
      })

      const getRequest = new NextRequest('http://localhost/api/user/email-preferences')
      const getResponse = await GET(getRequest)
      const getData = await getResponse.json()

      expect(getData).toEqual(currentPreferences)

      // PUT - update preferences
      vi.clearAllMocks()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      currentPreferences = {
        ...currentPreferences,
        marketing_emails: false,
        quota_warnings: false,
      }

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: currentPreferences,
        error: null,
      })

      const putRequest = new NextRequest('http://localhost/api/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          marketing_emails: false,
          quota_warnings: false,
          subscription_updates: true,
        }),
      })

      const putResponse = await PUT(putRequest)
      const putData = await putResponse.json()

      expect(putData.marketing_emails).toBe(false)
      expect(putData.quota_warnings).toBe(false)
      expect(putData.subscription_updates).toBe(true)

      // GET again - verify changes persisted
      vi.clearAllMocks()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: currentPreferences,
        error: null,
      })

      const getRequest2 = new NextRequest('http://localhost/api/user/email-preferences')
      const getResponse2 = await GET(getRequest2)
      const getData2 = await getResponse2.json()

      expect(getData2.marketing_emails).toBe(false)
      expect(getData2.quota_warnings).toBe(false)
      expect(getData2.subscription_updates).toBe(true)
    })
  })
})