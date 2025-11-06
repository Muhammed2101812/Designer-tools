/**
 * Tests for analytics query functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the environment and Supabase dependencies
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NODE_ENV: 'test'
  }
}))

// Mock the Supabase admin client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      gte: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        not: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      not: vi.fn(() => Promise.resolve({ data: [], error: null })),
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      lte: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  })),
  rpc: vi.fn(() => Promise.resolve({
    data: null,
    error: { message: 'RPC function not found' }
  }))
}

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient)
}))

describe('Analytics Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMostUsedTools', () => {
    it('should return empty array when no data', async () => {
      const { getMostUsedTools } = await import('../queries')
      const result = await getMostUsedTools()
      expect(result).toEqual([])
    })

    it('should handle custom days and limit parameters', async () => {
      const { getMostUsedTools } = await import('../queries')
      const result = await getMostUsedTools(7, 5)
      expect(result).toEqual([])
    })
  })

  describe('getDailyActiveUsers', () => {
    it('should return empty array when no data', async () => {
      const { getDailyActiveUsers } = await import('../queries')
      const result = await getDailyActiveUsers()
      expect(result).toEqual([])
    })

    it('should handle custom days parameter', async () => {
      const { getDailyActiveUsers } = await import('../queries')
      const result = await getDailyActiveUsers(7)
      expect(result).toEqual([])
    })
  })

  describe('getProcessingTimeStats', () => {
    it('should return empty array when no data', async () => {
      const { getProcessingTimeStats } = await import('../queries')
      const result = await getProcessingTimeStats()
      expect(result).toEqual([])
    })
  })

  describe('getSuccessRateStats', () => {
    it('should return empty array when no data', async () => {
      const { getSuccessRateStats } = await import('../queries')
      const result = await getSuccessRateStats()
      expect(result).toEqual([])
    })
  })

  describe('getRetentionMetrics', () => {
    it('should return empty array when no data', async () => {
      const { getRetentionMetrics } = await import('../queries')
      const result = await getRetentionMetrics()
      expect(result).toEqual([])
    })
  })

  describe('getConversionFunnelStats', () => {
    it('should return zero stats when no data', async () => {
      const { getConversionFunnelStats } = await import('../queries')
      const result = await getConversionFunnelStats()
      expect(result).toEqual({
        total_signups: 0,
        users_with_first_tool_use: 0,
        users_with_subscription: 0,
        signup_to_first_use_rate: 0,
        first_use_to_subscription_rate: 0,
        overall_conversion_rate: 0
      })
    })
  })

  describe('getToolUsageByDateRange', () => {
    it('should return usage data for date range', async () => {
      const { getToolUsageByDateRange } = await import('../queries')
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-03')
      
      const result = await getToolUsageByDateRange(startDate, endDate)
      
      expect(result).toHaveLength(3) // 3 days
      expect(result[0]).toEqual({
        date: '2024-01-01',
        usage_count: 0
      })
    })
  })

  describe('getAnalyticsSummary', () => {
    it('should return comprehensive analytics summary', async () => {
      const { getAnalyticsSummary } = await import('../queries')
      const result = await getAnalyticsSummary()
      
      expect(result).toHaveProperty('mostUsedTools')
      expect(result).toHaveProperty('dailyActiveUsers')
      expect(result).toHaveProperty('processingTimeStats')
      expect(result).toHaveProperty('successRateStats')
      expect(result).toHaveProperty('retentionMetrics')
      expect(result).toHaveProperty('conversionFunnel')
      expect(result).toHaveProperty('period')
      
      expect(result.period).toHaveProperty('days', 30)
      expect(result.period).toHaveProperty('startDate')
      expect(result.period).toHaveProperty('endDate')
    })
  })
})