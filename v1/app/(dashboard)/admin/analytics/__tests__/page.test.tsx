/**
 * Admin Analytics Page Tests
 * 
 * Tests the admin analytics page functionality including:
 * - Admin access control
 * - Analytics data display
 * - Component rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'
import AdminAnalyticsPage from '../page'
import { fetchAdminAnalytics } from '@/lib/analytics/queries'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/analytics/queries', () => ({
  fetchAdminAnalytics: vi.fn(),
}))

// Mock the admin components
vi.mock('@/components/admin/StatsCard', () => ({
  StatsCard: ({ title, value }: any) => `${title}: ${value}`,
}))

vi.mock('@/components/admin/ToolUsageChart', () => ({
  ToolUsageChart: ({ data }: any) => `Chart with ${data.length} tools`,
}))

vi.mock('@/components/admin/RetentionChart', () => ({
  RetentionChart: ({ data }: any) => `Retention chart with ${data.length} points`,
}))

vi.mock('@/components/admin/ConversionFunnel', () => ({
  ConversionFunnel: ({ data }: any) => `Funnel with ${data.length} stages`,
}))

const mockCreateClient = vi.mocked(createClient)
const mockFetchAdminAnalytics = vi.mocked(fetchAdminAnalytics)
const mockRedirect = vi.mocked(redirect)

describe('AdminAnalyticsPage', () => {
  const mockAnalyticsData = {
    totalUsers: 1250,
    dailyActiveUsers: 85,
    totalUsage: 3420,
    successRate: 94.2,
    conversionRate: 12.5,
    revenue: 2850,
    toolUsage: [
      { toolName: 'background-remover', count: 1200, percentage: 35.1 },
      { toolName: 'image-upscaler', count: 800, percentage: 23.4 },
      { toolName: 'image-compressor', count: 600, percentage: 17.5 },
    ],
    retentionData: [
      { day: 1, percentage: 85 },
      { day: 7, percentage: 45 },
      { day: 30, percentage: 25 },
    ],
    conversionFunnel: [
      { stage: 'Signups', count: 1000, percentage: 100 },
      { stage: 'First Tool Use', count: 750, percentage: 75 },
      { stage: 'Subscription', count: 125, percentage: 12.5 },
    ],
    dailyActiveUsersChart: [],
    processingTimeStats: [
      { tool_name: 'background-remover', avg_processing_time_ms: 2500, total_operations: 1200 },
    ],
    successRateStats: [
      { tool_name: 'background-remover', success_rate: 95.5, total_operations: 1200 },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects non-authenticated users to login', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    }
    mockCreateClient.mockResolvedValue(mockSupabase as any)

    await AdminAnalyticsPage()

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('redirects non-admin users to dashboard', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      user_metadata: { role: 'user' },
    }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    }
    mockCreateClient.mockResolvedValue(mockSupabase as any)

    await AdminAnalyticsPage()

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('allows admin users to access the page', async () => {
    const mockUser = {
      id: 'admin-123',
      email: 'admin@designkit.com',
      user_metadata: { role: 'admin' },
    }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    }
    mockCreateClient.mockResolvedValue(mockSupabase as any)
    mockFetchAdminAnalytics.mockResolvedValue(mockAnalyticsData)

    const result = await AdminAnalyticsPage()

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('allows users with admin role in metadata', async () => {
    const mockUser = {
      id: 'admin-123',
      email: 'test@example.com',
      user_metadata: { role: 'admin' },
    }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    }
    mockCreateClient.mockResolvedValue(mockSupabase as any)
    mockFetchAdminAnalytics.mockResolvedValue(mockAnalyticsData)

    const result = await AdminAnalyticsPage()

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(result).toBeDefined()
  })
})

describe('Analytics Data Integration', () => {
  it('should handle analytics data fetching errors gracefully', async () => {
    const mockUser = {
      id: 'admin-123',
      email: 'admin@designkit.com',
      user_metadata: { role: 'admin' },
    }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    }
    mockCreateClient.mockResolvedValue(mockSupabase as any)
    mockFetchAdminAnalytics.mockRejectedValue(new Error('Database connection failed'))

    await expect(AdminAnalyticsPage()).rejects.toThrow('Failed to load analytics data')
  })
})