/**
 * Auth Pages Tests
 * 
 * Tests for authentication pages including OAuth buttons, return_to parameter handling,
 * and improved error messages.
 * 
 * Requirements: 2.4, 2.6
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import LoginPage from '../login/page'
import SignupPage from '../signup/page'
import ResetPasswordPage from '../reset-password/page'
import AuthErrorPage from '../auth-error/page'

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

// Mock Next.js hooks
const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockGet = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}))

// Mock toast hook
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGet.mockReturnValue(null)
})

describe('Auth Pages', () => {
  describe('LoginPage', () => {
    it('renders OAuth buttons', () => {
      mockGet.mockReturnValue(null)
      
      render(<LoginPage />)
      
      expect(screen.getByText('Continue with Google')).toBeInTheDocument()
      expect(screen.getByText('Continue with GitHub')).toBeInTheDocument()
    })

    it('handles return_to parameter in OAuth flow', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'return_to') return '/dashboard/settings'
        return null
      })
      
      render(<LoginPage />)
      
      const googleButton = screen.getByText('Continue with Google')
      fireEvent.click(googleButton)
      
      // Should include return_to in OAuth redirect
      expect(mockGet).toHaveBeenCalledWith('return_to')
    })

    it('displays improved error messages', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'oauth_failed'
        if (param === 'message') return 'OAuth authentication failed'
        return null
      })
      
      render(<LoginPage />)
      
      expect(screen.getByText(/Social login failed/)).toBeInTheDocument()
    })

    it('preserves return_to parameter in signup link', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'return_to') return '/dashboard/settings'
        return null
      })
      
      render(<LoginPage />)
      
      const signupLink = screen.getByText('Sign up')
      expect(signupLink.closest('a')).toHaveAttribute('href', '/signup?return_to=%2Fdashboard%2Fsettings')
    })
  })

  describe('SignupPage', () => {
    it('renders OAuth buttons', () => {
      mockGet.mockReturnValue(null)
      
      render(<SignupPage />)
      
      expect(screen.getByText('Continue with Google')).toBeInTheDocument()
      expect(screen.getByText('Continue with GitHub')).toBeInTheDocument()
    })

    it('handles return_to parameter in email signup', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'return_to') return '/dashboard/settings'
        return null
      })
      
      render(<SignupPage />)
      
      // Should include return_to in email redirect URL
      expect(mockGet).toHaveBeenCalledWith('return_to')
    })

    it('preserves return_to parameter in login link', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'return_to') return '/dashboard/settings'
        return null
      })
      
      render(<SignupPage />)
      
      const loginLink = screen.getByText('Login')
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login?return_to=%2Fdashboard%2Fsettings')
    })
  })

  describe('ResetPasswordPage', () => {
    it('renders reset password form', () => {
      render(<ResetPasswordPage />)
      
      expect(screen.getByText('Reset password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
      expect(screen.getByText('Send reset link')).toBeInTheDocument()
    })

    it('shows success state after email sent', async () => {
      const { supabase } = await import('@/lib/supabase/client')
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ error: null })
      
      render(<ResetPasswordPage />)
      
      const emailInput = screen.getByPlaceholderText('name@example.com')
      const submitButton = screen.getByText('Send reset link')
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Check your email')).toBeInTheDocument()
      })
    })
  })

  describe('AuthErrorPage', () => {
    it('displays generic error when no specific error provided', () => {
      mockGet.mockReturnValue(null)
      
      render(<AuthErrorPage />)
      
      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      expect(screen.getByText('Try Login Again')).toBeInTheDocument()
    })

    it('displays specific error for access_denied', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'access_denied'
        if (param === 'message') return 'User denied access'
        return null
      })
      
      render(<AuthErrorPage />)
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText(/You cancelled the authentication process/)).toBeInTheDocument()
    })

    it('displays specific error for server_error', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'server_error'
        if (param === 'message') return 'Internal server error'
        return null
      })
      
      render(<AuthErrorPage />)
      
      expect(screen.getByText('Server Error')).toBeInTheDocument()
      expect(screen.getByText(/Our authentication server is experiencing issues/)).toBeInTheDocument()
    })

    it('provides helpful action buttons', () => {
      mockGet.mockReturnValue(null)
      
      render(<AuthErrorPage />)
      
      expect(screen.getByText('Try Login Again')).toBeInTheDocument()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByText('Reset Password')).toBeInTheDocument()
    })
  })
})