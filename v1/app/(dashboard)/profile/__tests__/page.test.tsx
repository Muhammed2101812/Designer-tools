import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ProfilePage from '../page'

// Mock the auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    },
    profile: {
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      plan: 'free',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    setProfile: vi.fn()
  })
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })
      })
    })
  }
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('ProfilePage', () => {
  it('renders profile page with user information', async () => {
    render(<ProfilePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Manage your account settings and preferences')).toBeInTheDocument()
    })
  })

  it('displays plan information section', async () => {
    render(<ProfilePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Plan Information')).toBeInTheDocument()
      expect(screen.getByText('free')).toBeInTheDocument()
    })
  })

  it('displays email preferences section', async () => {
    render(<ProfilePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Email Preferences')).toBeInTheDocument()
      expect(screen.getByText('Marketing Emails')).toBeInTheDocument()
      expect(screen.getByText('Quota Warnings')).toBeInTheDocument()
      expect(screen.getByText('Subscription Updates')).toBeInTheDocument()
    })
  })

  it('displays account details section', async () => {
    render(<ProfilePage />)
    
    await waitFor(() => {
      expect(screen.getByText('Account Details')).toBeInTheDocument()
      expect(screen.getByText('Member Since')).toBeInTheDocument()
    })
  })
})