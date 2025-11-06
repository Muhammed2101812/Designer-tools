import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  checkUserQuota, 
  incrementUserUsage, 
  getUserQuota,
  resetUserQuota,
  getDailyUsage,
  getQuotaResetTime,
  getUserPlan,
  updateUserPlan,
  getPlanQuota,
  canUserUseTool,
  incrementUserToolUsage,
  decrementUserToolUsage,
  clearUserQuotaCache,
  validateQuota,
  formatQuota,
  getQuotaStatus,
  checkQuotaThreshold,
  notifyQuotaWarning,
  enforceQuota,
  QuotaError,
  QuotaErrorType,
} from '../quota'

// Mock Supabase client
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
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    })),
    rpc: vi.fn(),
  })),
}))

describe('Quota Management Tests', () => {
  let mockSupabaseClient: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get mocked modules
    const supabaseModule = await import('@/lib/supabase/server')
    mockSupabaseClient = vi.mocked(supabaseModule.createClient)()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearUserQuotaCache()
  })

  describe('checkUserQuota', () => {
    it('should allow users within quota limit', async () => {
      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { plan: 'free' },
        error: null,
      })

      // Mock daily limits within quota
      mockSupabaseClient.from().rpc.mockResolvedValue({
        data: { api_tools_count: 5 }, // 5 out of 10 for free plan
        error: null,
      })

      await expect(checkUserQuota('test-user-id')).resolves.not.toThrow()
    })

    it('should reject users exceeding quota limit', async () => {
      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { plan: 'free' },
        error: null,
      })

      // Mock daily limits exceeding quota
      mockSupabaseClient.from().rpc.mockResolvedValue({
        data: { api_tools_count: 15 }, // 15 out of 10 for free plan - exceeds quota
        error: null,
      })

      await expect(checkUserQuota('test-user-id')).rejects.toThrow(QuotaError)
      await expect(checkUserQuota('test-user-id')).rejects.toThrow('Daily quota exceeded')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      await expect(checkUserQuota('test-user-id')).rejects.toThrow(QuotaError)
      await expect(checkUserQuota('test-user-id')).rejects.toThrow('Failed to check quota')
    })

    it('should handle missing user profile gracefully', async () => {
      // Mock missing user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null,
      })

      await expect(checkUserQuota('test-user-id')).rejects.toThrow(QuotaError)
      await expect(checkUserQuota('test-user-id')).rejects.toThrow('User profile not found')
    })

    it('should work with different plan quotas', async () => {
      // Test premium plan quota
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'premium' },
        error: null,
      })

      // Mock daily limits within premium quota
      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: { api_tools_count: 250 }, // 250 out of 500 for premium plan
        error: null,
      })

      await expect(checkUserQuota('test-user-id')).resolves.not.toThrow()

      // Test pro plan quota
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'pro' },
        error: null,
      })

      // Mock daily limits within pro quota
      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: { api_tools_count: 1500 }, // 1500 out of 2000 for pro plan
        error: null,
      })

      await expect(checkUserQuota('test-user-id')).resolves.not.toThrow()
    })
  })

  describe('incrementUserUsage', () => {
    it('should increment user usage successfully', async () => {
      // Mock successful database operations
      mockSupabaseClient.from().upsert.mockResolvedValue({
        error: null,
      })

      mockSupabaseClient.from().insert.mockResolvedValue({
        error: null,
      })

      const result = await incrementUserUsage('test-user-id', 'background-remover')
      expect(result).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error on daily limits update
      mockSupabaseClient.from().upsert.mockResolvedValue({
        error: { message: 'Database error' },
      })

      const result = await incrementUserUsage('test-user-id', 'background-remover')
      expect(result).toBe(true) // Should still return true even on error
    })

    it('should work with different tool names', async () => {
      // Mock successful database operations
      mockSupabaseClient.from().upsert.mockResolvedValue({
        error: null,
      })

      mockSupabaseClient.from().insert.mockResolvedValue({
        error: null,
      })

      // Test with background remover
      const result1 = await incrementUserUsage('test-user-id', 'background-remover')
      expect(result1).toBe(true)

      // Test with image upscaler
      const result2 = await incrementUserUsage('test-user-id', 'image-upscaler')
      expect(result2).toBe(true)

      // Test with custom tool
      const result3 = await incrementUserUsage('test-user-id', 'custom-tool')
      expect(result3).toBe(true)
    })
  })

  describe('getUserQuota', () => {
    it('should return quota information for valid user', async () => {
      // Mock user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'premium', quota_reset_date: '2023-12-01T00:00:00Z' },
        error: null,
      })

      // Mock daily limits
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { api_tools_count: 250, date: '2023-11-30' },
        error: null,
      })

      const quota = await getUserQuota('test-user-id')
      
      expect(quota).toEqual({
        plan: 'premium',
        dailyLimit: 500,
        currentUsage: 250,
        remaining: 250,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: expect.any(Number),
      })
    })

    it('should handle missing daily limits gracefully', async () => {
      // Mock user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free', quota_reset_date: '2023-12-01T00:00:00Z' },
        error: null,
      })

      // Mock missing daily limits
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const quota = await getUserQuota('test-user-id')
      
      expect(quota).toEqual({
        plan: 'free',
        dailyLimit: 10,
        currentUsage: 0,
        remaining: 10,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: expect.any(Number),
      })
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      })

      await expect(getUserQuota('test-user-id')).rejects.toThrow(QuotaError)
      await expect(getUserQuota('test-user-id')).rejects.toThrow('Failed to fetch user quota')
    })
  })

  describe('resetUserQuota', () => {
    it('should reset user quota successfully', async () => {
      // Mock successful database operations
      mockSupabaseClient.from().delete().eq().single.mockResolvedValue({
        error: null,
      })

      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        error: null,
      })

      const result = await resetUserQuota('test-user-id')
      expect(result).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().delete().eq().single.mockResolvedValue({
        error: { message: 'Database error' },
      })

      const result = await resetUserQuota('test-user-id')
      expect(result).toBe(false) // Should return false on error
    })
  })

  describe('getDailyUsage', () => {
    it('should return daily usage for valid user', async () => {
      // Mock daily limits
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { api_tools_count: 250 },
        error: null,
      })

      const usage = await getDailyUsage('test-user-id')
      expect(usage).toBe(250)
    })

    it('should return 0 for missing daily limits', async () => {
      // Mock missing daily limits
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null,
      })

      const usage = await getDailyUsage('test-user-id')
      expect(usage).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      await expect(getDailyUsage('test-user-id')).rejects.toThrow(QuotaError)
      await expect(getDailyUsage('test-user-id')).rejects.toThrow('Failed to fetch daily usage')
    })
  })

  describe('getQuotaResetTime', () => {
    it('should return quota reset time for valid user', async () => {
      // Mock user profile with reset date
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { quota_reset_date: '2023-12-01T00:00:00Z' },
        error: null,
      })

      const resetTime = await getQuotaResetTime('test-user-id')
      expect(resetTime).toBeGreaterThanOrEqual(Date.now())
    })

    it('should return default reset time for missing profile', async () => {
      // Mock missing user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null,
      })

      const resetTime = await getQuotaResetTime('test-user-id')
      expect(resetTime).toBeGreaterThanOrEqual(Date.now())
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      await expect(getQuotaResetTime('test-user-id')).rejects.toThrow(QuotaError)
      await expect(getQuotaResetTime('test-user-id')).rejects.toThrow('Failed to fetch quota reset time')
    })
  })

  describe('getUserPlan', () => {
    it('should return user plan for valid user', async () => {
      // Mock user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { plan: 'premium' },
        error: null,
      })

      const plan = await getUserPlan('test-user-id')
      expect(plan).toBe('premium')
    })

    it('should return free plan for missing profile', async () => {
      // Mock missing user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null,
      })

      const plan = await getUserPlan('test-user-id')
      expect(plan).toBe('free')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      await expect(getUserPlan('test-user-id')).rejects.toThrow(QuotaError)
      await expect(getUserPlan('test-user-id')).rejects.toThrow('Failed to fetch user plan')
    })
  })

  describe('updateUserPlan', () => {
    it('should update user plan successfully', async () => {
      // Mock successful database operation
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        error: null,
      })

      const result = await updateUserPlan('test-user-id', 'premium')
      expect(result).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        error: { message: 'Database error' },
      })

      const result = await updateUserPlan('test-user-id', 'premium')
      expect(result).toBe(false)
    })

    it('should validate plan values', async () => {
      // Mock successful database operation
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        error: null,
      })

      // Valid plans
      await expect(updateUserPlan('test-user-id', 'free')).resolves.toBe(true)
      await expect(updateUserPlan('test-user-id', 'premium')).resolves.toBe(true)
      await expect(updateUserPlan('test-user-id', 'pro')).resolves.toBe(true)

      // Invalid plan
      await expect(updateUserPlan('test-user-id', 'invalid')).rejects.toThrow(QuotaError)
      await expect(updateUserPlan('test-user-id', 'invalid')).rejects.toThrow('Invalid plan')
    })
  })

  describe('getPlanQuota', () => {
    it('should return quota for valid plans', () => {
      expect(getPlanQuota('free')).toBe(10)
      expect(getPlanQuota('premium')).toBe(500)
      expect(getPlanQuota('pro')).toBe(2000)
    })

    it('should return default quota for invalid plans', () => {
      expect(getPlanQuota('invalid')).toBe(10)
      expect(getPlanQuota('')).toBe(10)
      expect(getPlanQuota(null as any)).toBe(10)
    })
  })

  describe('canUserUseTool', () => {
    it('should return true for users within quota', async () => {
      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free' },
        error: null,
      })

      // Mock daily limits within quota
      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: { api_tools_count: 5 }, // 5 out of 10 for free plan
        error: null,
      })

      const result = await canUserUseTool('test-user-id')
      expect(result).toBe(true)
    })

    it('should return false for users exceeding quota', async () => {
      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free' },
        error: null,
      })

      // Mock daily limits exceeding quota
      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: { api_tools_count: 15 }, // 15 out of 10 for free plan
        error: null,
      })

      const result = await canUserUseTool('test-user-id')
      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const result = await canUserUseTool('test-user-id')
      expect(result).toBe(false)
    })
  })

  describe('incrementUserToolUsage', () => {
    it('should increment tool usage successfully', async () => {
      // Mock successful database operation
      mockSupabaseClient.from().insert.mockResolvedValue({
        error: null,
      })

      const result = await incrementUserToolUsage('test-user-id', 'background-remover')
      expect(result).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().insert.mockResolvedValue({
        error: { message: 'Database error' },
      })

      const result = await incrementUserToolUsage('test-user-id', 'background-remover')
      expect(result).toBe(false)
    })
  })

  describe('decrementUserToolUsage', () => {
    it('should decrement tool usage successfully', async () => {
      // Mock successful database operation
      mockSupabaseClient.from().delete.mockResolvedValue({
        error: null,
      })

      const result = await decrementUserToolUsage('test-user-id', 'background-remover')
      expect(result).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().delete.mockResolvedValue({
        error: { message: 'Database error' },
      })

      const result = await decrementUserToolUsage('test-user-id', 'background-remover')
      expect(result).toBe(false)
    })
  })

  describe('validateQuota', () => {
    it('should validate valid quota data', () => {
      const quota = {
        plan: 'premium',
        dailyLimit: 500,
        currentUsage: 250,
        remaining: 250,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: Date.now() + 86400000,
      }

      const result = validateQuota(quota)
      expect(result).toEqual({ valid: true })
    })

    it('should reject invalid quota data', () => {
      // Invalid plan
      const result1 = validateQuota({
        plan: 'invalid',
        dailyLimit: 500,
        currentUsage: 250,
        remaining: 250,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: Date.now() + 86400000,
      })
      expect(result1.valid).toBe(false)
      expect(result1.error).toBe('Invalid plan')

      // Negative usage
      const result2 = validateQuota({
        plan: 'free',
        dailyLimit: 10,
        currentUsage: -5,
        remaining: 15,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: Date.now() + 86400000,
      })
      expect(result2.valid).toBe(false)
      expect(result2.error).toBe('Invalid usage data')

      // Inconsistent remaining
      const result3 = validateQuota({
        plan: 'free',
        dailyLimit: 10,
        currentUsage: 5,
        remaining: 3, // Should be 5 (10 - 5)
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: Date.now() + 86400000,
      })
      expect(result3.valid).toBe(false)
      expect(result3.error).toBe('Inconsistent quota data')
    })
  })

  describe('formatQuota', () => {
    it('should format quota data correctly', () => {
      const quota = {
        plan: 'premium',
        dailyLimit: 500,
        currentUsage: 250,
        remaining: 250,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: Date.now() + 86400000,
      }

      const result = formatQuota(quota)
      expect(result).toEqual({
        plan: 'premium',
        dailyLimit: 500,
        currentUsage: 250,
        remaining: 250,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: expect.any(Number),
        percentage: 50,
        status: 'normal',
      })
    })

    it('should format quota with warning status', () => {
      const quota = {
        plan: 'free',
        dailyLimit: 10,
        currentUsage: 8,
        remaining: 2,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: Date.now() + 86400000,
      }

      const result = formatQuota(quota)
      expect(result.status).toBe('warning')
      expect(result.percentage).toBe(80)
    })

    it('should format quota with critical status', () => {
      const quota = {
        plan: 'free',
        dailyLimit: 10,
        currentUsage: 10,
        remaining: 0,
        resetDate: '2023-12-01T00:00:00Z',
        resetTime: Date.now() + 86400000,
      }

      const result = formatQuota(quota)
      expect(result.status).toBe('critical')
      expect(result.percentage).toBe(100)
    })
  })

  describe('getQuotaStatus', () => {
    it('should return normal status for low usage', () => {
      const status = getQuotaStatus(5, 10)
      expect(status).toBe('normal')
    })

    it('should return warning status for medium usage', () => {
      const status = getQuotaStatus(8, 10)
      expect(status).toBe('warning')
    })

    it('should return critical status for high usage', () => {
      const status = getQuotaStatus(10, 10)
      expect(status).toBe('critical')
    })

    it('should handle edge cases', () => {
      expect(getQuotaStatus(0, 10)).toBe('normal')
      expect(getQuotaStatus(10, 10)).toBe('critical')
      expect(getQuotaStatus(11, 10)).toBe('critical')
    })
  })

  describe('checkQuotaThreshold', () => {
    it('should return true when approaching quota limit', () => {
      const result = checkQuotaThreshold(8, 10, 0.8)
      expect(result).toBe(true)
    })

    it('should return false when not approaching quota limit', () => {
      const result = checkQuotaThreshold(5, 10, 0.8)
      expect(result).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(checkQuotaThreshold(0, 10, 0.8)).toBe(false)
      expect(checkQuotaThreshold(10, 10, 0.8)).toBe(true)
      expect(checkQuotaThreshold(11, 10, 0.8)).toBe(true)
    })
  })

  describe('notifyQuotaWarning', () => {
    it('should send quota warning notification', async () => {
      // Mock email client
      const emailClientModule = await import('@/lib/email/client')
      vi.mocked(emailClientModule.sendQuotaWarning).mockResolvedValue({
        success: true,
      })

      // Mock user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { email: 'test@example.com', full_name: 'Test User', plan: 'free' },
        error: null,
      })

      // Mock daily limits
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { api_tools_count: 8 },
        error: null,
      })

      const result = await notifyQuotaWarning('test-user-id')
      expect(result).toBe(true)
    })

    it('should handle missing user profile gracefully', async () => {
      // Mock missing user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await notifyQuotaWarning('test-user-id')
      expect(result).toBe(false)
    })

    it('should handle email sending errors gracefully', async () => {
      // Mock email client error
      const emailClientModule = await import('@/lib/email/client')
      vi.mocked(emailClientModule.sendQuotaWarning).mockResolvedValue({
        success: false,
        error: 'Email service error',
      })

      // Mock user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { email: 'test@example.com', full_name: 'Test User', plan: 'free' },
        error: null,
      })

      // Mock daily limits
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { api_tools_count: 8 },
        error: null,
      })

      const result = await notifyQuotaWarning('test-user-id')
      expect(result).toBe(false)
    })
  })

  describe('enforceQuota', () => {
    it('should allow operations when within quota', async () => {
      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free' },
        error: null,
      })

      // Mock daily limits within quota
      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: { api_tools_count: 5 }, // 5 out of 10 for free plan
        error: null,
      })

      await expect(enforceQuota('test-user-id')).resolves.not.toThrow()
    })

    it('should reject operations when exceeding quota', async () => {
      // Mock user profile with free plan
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { plan: 'free' },
        error: null,
      })

      // Mock daily limits exceeding quota
      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: { api_tools_count: 15 }, // 15 out of 10 for free plan
        error: null,
      })

      await expect(enforceQuota('test-user-id')).rejects.toThrow(QuotaError)
      await expect(enforceQuota('test-user-id')).rejects.toThrow('Daily quota exceeded')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      })

      await expect(enforceQuota('test-user-id')).rejects.toThrow(QuotaError)
      await expect(enforceQuota('test-user-id')).rejects.toThrow('Failed to enforce quota')
    })
  })

  describe('QuotaError', () => {
    it('should create quota error with correct properties', () => {
      const error = new QuotaError(
        QuotaErrorType.EXCEEDED,
        'Daily quota exceeded',
        403,
        { currentUsage: 15, dailyLimit: 10 }
      )

      expect(error.type).toBe(QuotaErrorType.EXCEEDED)
      expect(error.message).toBe('Daily quota exceeded')
      expect(error.statusCode).toBe(403)
      expect(error.context).toEqual({ currentUsage: 15, dailyLimit: 10 })
    })

    it('should be instance of Error', () => {
      const error = new QuotaError(
        QuotaErrorType.EXCEEDED,
        'Daily quota exceeded',
        403
      )

      expect(error instanceof Error).toBe(true)
      expect(error instanceof QuotaError).toBe(true)
    })
  })
})