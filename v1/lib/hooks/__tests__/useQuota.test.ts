/**
 * Tests for useQuota hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useQuota } from '../useQuota'
import { useAuthStore } from '@/store/authStore'

// Mock the auth store
vi.mock('@/store/authStore')
const mockUseAuthStore = vi.mocked(useAuthStore)

// Mock fetch
global.fetch = vi.fn()
const mockFetch = vi.mocked(global.fetch)

describe('useQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      initialize: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should fetch quota data on mount', async () => {
    const mockQuotaData = {
      canUse: true,
      currentUsage: 5,
      dailyLimit: 10,
      remaining: 5,
      plan: 'free',
      resetAt: '2024-01-02T00:00:00.000Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    } as Response)

    const { result } = renderHook(() => useQuota())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.quota).toEqual(mockQuotaData)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.canUseApi).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/tools/check-quota', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  })

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useQuota())

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
      expect(result.current.quota).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should perform optimistic updates', async () => {
    const mockQuotaData = {
      canUse: true,
      currentUsage: 5,
      dailyLimit: 10,
      remaining: 5,
      plan: 'free',
      resetAt: '2024-01-02T00:00:00.000Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    } as Response)

    const { result } = renderHook(() => useQuota())

    await waitFor(() => {
      expect(result.current.quota).toEqual(mockQuotaData)
    })

    // Perform optimistic update
    act(() => {
      result.current.optimisticUpdate()
    })

    expect(result.current.quota).toEqual({
      ...mockQuotaData,
      currentUsage: 6,
      remaining: 4,
      canUse: true, // Still can use since remaining > 1
    })
  })

  it('should revert optimistic updates', async () => {
    const mockQuotaData = {
      canUse: true,
      currentUsage: 5,
      dailyLimit: 10,
      remaining: 5,
      plan: 'free',
      resetAt: '2024-01-02T00:00:00.000Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    } as Response)

    const { result } = renderHook(() => useQuota())

    await waitFor(() => {
      expect(result.current.quota).toEqual(mockQuotaData)
    })

    // Perform optimistic update
    act(() => {
      result.current.optimisticUpdate()
    })

    // Revert optimistic update
    act(() => {
      result.current.revertOptimisticUpdate()
    })

    expect(result.current.quota).toEqual(mockQuotaData)
  })

  it('should confirm usage and update quota', async () => {
    const mockQuotaData = {
      canUse: true,
      currentUsage: 5,
      dailyLimit: 10,
      remaining: 5,
      plan: 'free',
      resetAt: '2024-01-02T00:00:00.000Z',
    }

    const mockIncrementResponse = {
      success: true,
      currentUsage: 6,
      dailyLimit: 10,
      remaining: 4,
    }

    // Mock initial quota fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    } as Response)

    const { result } = renderHook(() => useQuota())

    await waitFor(() => {
      expect(result.current.quota).toEqual(mockQuotaData)
    })

    // Mock increment usage API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIncrementResponse,
    } as Response)

    // Confirm usage
    await act(async () => {
      await result.current.confirmUsage('test-tool', { fileSizeMb: 1.5 })
    })

    expect(mockFetch).toHaveBeenLastCalledWith('/api/tools/increment-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toolName: 'test-tool',
        success: true,
        fileSizeMb: 1.5,
      }),
    })

    expect(result.current.quota).toEqual({
      ...mockQuotaData,
      currentUsage: 6,
      remaining: 4,
      canUse: true,
    })
  })

  it('should not fetch when user is not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      initialize: vi.fn(),
    })

    const { result } = renderHook(() => useQuota())

    expect(result.current.quota).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should call onQuotaUpdate callback when quota changes', async () => {
    const mockQuotaData = {
      canUse: true,
      currentUsage: 5,
      dailyLimit: 10,
      remaining: 5,
      plan: 'free',
      resetAt: '2024-01-02T00:00:00.000Z',
    }

    const onQuotaUpdate = vi.fn()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    } as Response)

    renderHook(() => useQuota({ onQuotaUpdate }))

    await waitFor(() => {
      expect(onQuotaUpdate).toHaveBeenCalledWith(mockQuotaData)
    })
  })

  it('should call onQuotaExceeded when quota is exceeded', async () => {
    const mockQuotaData = {
      canUse: false,
      currentUsage: 10,
      dailyLimit: 10,
      remaining: 0,
      plan: 'free',
      resetAt: '2024-01-02T00:00:00.000Z',
    }

    const onQuotaExceeded = vi.fn()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    } as Response)

    renderHook(() => useQuota({ onQuotaExceeded }))

    await waitFor(() => {
      expect(onQuotaExceeded).toHaveBeenCalled()
    })
  })

  it('should disable auto-refresh when refreshInterval is 0', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useQuota({ refreshInterval: 0 }))

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(60000) // 1 minute
    })

    // Should only have been called once (initial fetch)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})