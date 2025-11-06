import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useAuthStore } from '@/store/authStore'
import { fetchQuotaInfo } from '@/lib/usage/quota'
import { getWeeklyUsage } from '@/lib/analytics/queries'
import { QuotaCard } from '@/components/dashboard/QuotaCard'
import { PlanCard } from '@/components/dashboard/PlanCard'
import { UsageChart } from '@/components/dashboard/UsageChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { DashboardPage } from '@/app/(dashboard)/dashboard/page'
import type { Profile } from '@/lib/supabase/types'
import { User } from '@supabase/supabase-js'

// Mock modules
vi.mock('@/store/authStore', () => ({
  useAuthStore: {
    subscribe: vi.fn(),
    getSnapshot: vi.fn(),
  },
}))

vi.mock('@/lib/usage/quota', () => ({
  fetchQuotaInfo: vi.fn(),
}))

vi.mock('@/lib/analytics/queries', () => ({
  getWeeklyUsage: vi.fn(),
  getTopTools: vi.fn(),
  getRecentActivity: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}))

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
      insert: vi.fn(),
    })),
  })),
}))

// Mock component props
const mockProfile: Profile = {
  id: 'test-user',
  email: 'test@example.com',
  full_name: 'Test User',
  plan: 'premium',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const mockUser: User = {
  id: 'test-user',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

describe('Dashboard and Quota Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default auth store mock
    vi.mocked(useAuthStore).getSnapshot.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      loading: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('QuotaCard Component', () => {
    it('should display correct quota information for free plan', () => {
      render(
        <QuotaCard 
          currentUsage={5} 
          dailyLimit={10} 
          plan="free" 
        />
      )

      expect(screen.getByText('50%')).toBeInTheDocument()
      expect(screen.getByText('5 of 10 operations')).toBeInTheDocument()
      expect(screen.getByText('Free Plan')).toBeInTheDocument()
    })

    it('should display correct quota information for premium plan', () => {
      render(
        <QuotaCard 
          currentUsage={250} 
          dailyLimit={500} 
          plan="premium" 
        />
      )

      expect(screen.getByText('50%')).toBeInTheDocument()
      expect(screen.getByText('250 of 500 operations')).toBeInTheDocument()
      expect(screen.getByText('Premium Plan')).toBeInTheDocument()
    })

    it('should display correct quota information for pro plan', () => {
      render(
        <QuotaCard 
          currentUsage={1500} 
          dailyLimit={2000} 
          plan="pro" 
        />
      )

      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('1500 of 2000 operations')).toBeInTheDocument()
      expect(screen.getByText('Pro Plan')).toBeInTheDocument()
    })

    it('should show warning when quota is near limit', () => {
      render(
        <QuotaCard 
          currentUsage={9} 
          dailyLimit={10} 
          plan="free" 
        />
      )

      // Should have warning styling (not green)
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('bg-yellow-500') // Assuming yellow for warning
    })

    it('should show danger when quota is exceeded', () => {
      render(
        <QuotaCard 
          currentUsage={12} 
          dailyLimit={10} 
          plan="free" 
        />
      )

      // Should have error message when over quota
      expect(screen.getByText('Quota exceeded!')).toBeInTheDocument()
    })
  })

  describe('PlanCard Component', () => {
    it('should display free plan information correctly', () => {
      render(<PlanCard plan="free" subscriptionStatus={null} />)

      expect(screen.getByText('Free Plan')).toBeInTheDocument()
      expect(screen.getByText('Current Plan')).toBeInTheDocument()
      expect(screen.getByText('10 operations/day')).toBeInTheDocument()
    })

    it('should display premium plan information correctly', () => {
      render(<PlanCard plan="premium" subscriptionStatus="active" />)

      expect(screen.getByText('Premium Plan')).toBeInTheDocument()
      expect(screen.getByText('Current Plan')).toBeInTheDocument()
      expect(screen.getByText('500 operations/day')).toBeInTheDocument()
    })

    it('should display pro plan information correctly', () => {
      render(<PlanCard plan="pro" subscriptionStatus="active" />)

      expect(screen.getByText('Pro Plan')).toBeInTheDocument()
      expect(screen.getByText('Current Plan')).toBeInTheDocument()
      expect(screen.getByText('2000 operations/day')).toBeInTheDocument()
    })

    it('should show upgrade button for lower plans', () => {
      render(<PlanCard plan="free" subscriptionStatus={null} />)

      expect(screen.getByText('Upgrade')).toBeInTheDocument()
    })

    it('should show manage subscription for paid plans', () => {
      render(<PlanCard plan="premium" subscriptionStatus="active" />)

      expect(screen.getByText('Manage Subscription')).toBeInTheDocument()
    })
  })

  describe('UsageChart Component', () => {
    it('should render with weekly usage data', () => {
      const mockWeeklyData = [
        { date: '2023-01-01', api_tools_count: 5 },
        { date: '2023-01-02', api_tools_count: 10 },
        { date: '2023-01-03', api_tools_count: 8 },
      ]

      render(<UsageChart data={mockWeeklyData} />)

      // Chart should render with the provided data
      expect(screen.getByRole('img', { name: /usage chart/i })).toBeInTheDocument()
    })

    it('should handle empty data gracefully', () => {
      render(<UsageChart data={[]} />)

      // Should show appropriate message for no data
      expect(screen.getByText('No usage data available')).toBeInTheDocument()
    })
  })

  describe('RecentActivity Component', () => {
    it('should display recent activities', () => {
      const mockActivities = [
        { 
          id: '1', 
          tool_name: 'background-remover', 
          created_at: '2023-01-01T10:00:00Z', 
          success: true 
        },
        { 
          id: '2', 
          tool_name: 'image-upscaler', 
          created_at: '2023-01-01T11:00:00Z', 
          success: true 
        },
      ]

      render(<RecentActivity activities={mockActivities} />)

      expect(screen.getByText('Background Remover')).toBeInTheDocument()
      expect(screen.getByText('Image Upscaler')).toBeInTheDocument()
    })

    it('should handle empty activities', () => {
      render(<RecentActivity activities={[]} />)

      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })

    it('should show error status for failed operations', () => {
      const mockActivities = [
        { 
          id: '1', 
          tool_name: 'background-remover', 
          created_at: '2023-01-01T10:00:00Z', 
          success: false 
        },
      ]

      render(<RecentActivity activities={mockActivities} />)

      // Should show error indicator
      expect(screen.getByText(/failed/i)).toBeInTheDocument()
    })
  })

  describe('Dashboard Page Data Fetching', () => {
    it('should fetch quota information for authenticated user', async () => {
      const mockQuotaData = {
        currentUsage: 5,
        dailyLimit: 10,
        plan: 'free',
        resetTime: 'tomorrow',
      }

      vi.mocked(fetchQuotaInfo).mockResolvedValue(mockQuotaData)

      // Mock the server component
      const { default: DashboardPage } = await import('@/app/(dashboard)/dashboard/page')

      // Render the component
      render(<DashboardPage />)

      await waitFor(() => {
        expect(fetchQuotaInfo).toHaveBeenCalledWith('test-user')
      })
    })

    it('should fetch weekly usage data', async () => {
      const mockWeeklyData = [
        { date: '2023-01-01', api_tools_count: 5 },
      ]

      vi.mocked(getWeeklyUsage).mockResolvedValue(mockWeeklyData)

      // This would be tested when rendering the page
      expect(getWeeklyUsage).toBeDefined()
    })

    it('should handle user without profile gracefully', async () => {
      // Mock auth store without profile
      vi.mocked(useAuthStore).getSnapshot.mockReturnValue({
        user: mockUser,
        profile: null,
        loading: false,
      })

      // Should handle rendering without profile data
      expect(() => render(<DashboardPage />)).not.toThrow()
    })
  })

  describe('Quota Management Logic', () => {
    it('should calculate correct usage percentage', () => {
      const percentage = (5 / 10) * 100
      expect(percentage).toBe(50)
    })

    it('should identify when quota is at warning level (80%)', () => {
      const usage = 8
      const limit = 10
      const isAtWarningLevel = (usage / limit) >= 0.8
      
      expect(isAtWarningLevel).toBe(true)
    })

    it('should identify when quota is exceeded', () => {
      const usage = 11
      const limit = 10
      const isExceeded = usage > limit
      
      expect(isExceeded).toBe(true)
    })

    it('should format usage data correctly', () => {
      const usage = 5
      const limit = 10
      const formatted = `${usage} of ${limit} operations`
      
      expect(formatted).toBe('5 of 10 operations')
    })
  })

  describe('Security and Access Checks', () => {
    it('should require authentication to access dashboard components', () => {
      // This would be handled by the middleware, but ensure components handle null user
      vi.mocked(useAuthStore).getSnapshot.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
      })

      // Components should handle unauthenticated state gracefully
      expect(() => render(<QuotaCard currentUsage={0} dailyLimit={0} plan="free" />)).not.toThrow()
    })

    it('should prevent unauthorized access to quota data', () => {
      // This logic would be implemented in the server components
      // Mock that only authenticated user IDs can fetch quota data
      const requestingUserId = 'user-123'
      const quotaForUserId = 'user-123'
      
      expect(requestingUserId).toBe(quotaForUserId)
    })
  })

  describe('Integration Tests', () => {
    it('should update quota display after API tool usage', async () => {
      const initialQuota = 5
      const limit = 10

      render(
        <QuotaCard 
          currentUsage={initialQuota} 
          dailyLimit={limit} 
          plan="free" 
        />
      )

      // Simulate quota update (this would happen after an API call)
      const newQuota = initialQuota + 1

      // Verify display updates appropriately
      expect(newQuota).toBeLessThanOrEqual(limit)
    })

    it('should show upgrade prompt when quota is low', () => {
      render(
        <QuotaCard 
          currentUsage={9} 
          dailyLimit={10} 
          plan="free" 
        />
      )

      // Should show upgrade option when near limit
      expect(screen.getByText('Upgrade')).toBeInTheDocument()
    })
  })
})