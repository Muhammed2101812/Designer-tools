import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from '../authStore'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { clearAllSessionData } from '@/lib/utils/sessionStorage'

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  },
}))

vi.mock('@/lib/utils/sessionStorage', () => ({
  clearAllSessionData: vi.fn(),
}))

describe('Authentication Flow Tests', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  const mockProfile = {
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    plan: 'free',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the store
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Store Initialization', () => {
    it('should initialize with loading state', () => {
      const state = useAuthStore.getState()
      expect(state.loading).toBe(true)
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
    })

    it('should handle successful initialization with valid session', async () => {
      // Mock session response
      const mockSession: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock profile fetch
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      } as any)

      // Initialize store
      await useAuthStore.getState().initialize()

      // Check that state is updated correctly
      const state = useAuthStore.getState()
      expect(state.loading).toBe(false)
      expect(state.user).toEqual(mockUser)
      expect(state.profile).toEqual(mockProfile)
    })

    it('should handle initialization with no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.loading).toBe(false)
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
    })

    it('should handle session error during initialization', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error', code: 'session_error' },
      })

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.loading).toBe(false)
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
    })

    it('should handle profile fetch error gracefully', async () => {
      const mockSession: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock profile fetch error
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found', code: 'not_found' },
            }),
          })),
        })),
      } as any)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.loading).toBe(false)
      expect(state.user).toEqual(mockUser)
      // Profile should remain null if fetch fails
      expect(state.profile).toBeNull()
    })
  })

  describe('User Authentication', () => {
    it('should set user correctly', () => {
      useAuthStore.getState().setUser(mockUser)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
    })

    it('should set profile correctly', () => {
      useAuthStore.getState().setProfile(mockProfile)

      const state = useAuthStore.getState()
      expect(state.profile).toEqual(mockProfile)
    })

    it('should clear user and profile on logout', async () => {
      // Set initial state
      useAuthStore.setState({
        user: mockUser,
        profile: mockProfile,
        loading: false,
      })

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      })

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(clearAllSessionData).toHaveBeenCalled()
    })

    it('should handle logout error gracefully', async () => {
      useAuthStore.setState({
        user: mockUser,
        profile: mockProfile,
        loading: false,
      })

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Sign out failed', code: 'signout_error' },
      })

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(clearAllSessionData).toHaveBeenCalled()
    })
  })

  describe('Session State Management', () => {
    it('should update loading state correctly', () => {
      useAuthStore.getState().setLoading(true)
      expect(useAuthStore.getState().loading).toBe(true)

      useAuthStore.getState().setLoading(false)
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('should persist user and profile data', () => {
      useAuthStore.getState().setUser(mockUser)
      useAuthStore.getState().setProfile(mockProfile)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.profile).toEqual(mockProfile)
    })
  })

  describe('Security Considerations', () => {
    it('should clear session data on logout', async () => {
      await useAuthStore.getState().logout()

      expect(clearAllSessionData).toHaveBeenCalled()
    })

    it('should not persist loading state', () => {
      // This tests that the partialize function works correctly
      useAuthStore.getState().setLoading(true)
      
      // The loading state should not be persisted
      const persistedState = useAuthStore.persist.getOptions().partialize?.(useAuthStore.getState())
      expect(persistedState).not.toHaveProperty('loading')
      expect(persistedState).toHaveProperty('user')
      expect(persistedState).toHaveProperty('profile')
    })
  })
})