/**
 * Tests for useApiTool hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useApiTool } from '../useApiTool'
import { useAuthStore } from '@/store/authStore'

// Mock the auth store
vi.mock('@/store/authStore')
const mockUseAuthStore = vi.mocked(useAuthStore)

// Mock the useQuota hook
vi.mock('../useQuota')
import { useQuota } from '../useQuota'
const mockUseQuota = vi.mocked(useQuota)

describe('useApiTool', () => {
  const mockQuotaHook = {
    quota: {
      canUse: true,
      currentUsage: 5,
      dailyLimit: 10,
      remaining: 5,
      plan: 'free',
      resetAt: '2024-01-02T00:00:00.000Z',
    },
    isLoading: false,
    error: null,
    refreshQuota: vi.fn(),
    optimisticUpdate: vi.fn(),
    revertOptimisticUpdate: vi.fn(),
    confirmUsage: vi.fn(),
    canUseApi: true,
    lastUpdated: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseAuthStore.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      initialize: vi.fn(),
    })

    mockUseQuota.mockReturnValue(mockQuotaHook)
  })

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useApiTool({ toolName: 'test-tool' }))

    expect(result.current.state.isProcessing).toBe(false)
    expect(result.current.state.canUseApi).toBe(true)
    expect(result.current.state.quota).toEqual(mockQuotaHook.quota)
    expect(result.current.state.operationError).toBeNull()
  })

  it('should execute operation successfully', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success-result')
    const onOperationStart = vi.fn()
    const onOperationSuccess = vi.fn()

    const { result } = renderHook(() => 
      useApiTool({ 
        toolName: 'test-tool',
        onOperationStart,
        onOperationSuccess,
      })
    )

    let operationResult: string
    await act(async () => {
      operationResult = await result.current.actions.executeOperation(mockOperation, {
        fileSizeMb: 2.5,
      })
    })

    expect(operationResult!).toBe('success-result')
    expect(onOperationStart).toHaveBeenCalled()
    expect(onOperationSuccess).toHaveBeenCalledWith('success-result')
    expect(mockQuotaHook.optimisticUpdate).toHaveBeenCalled()
    expect(mockQuotaHook.confirmUsage).toHaveBeenCalledWith('test-tool', {
      fileSizeMb: 2.5,
      processingTimeMs: expect.any(Number),
    })
    expect(result.current.state.isProcessing).toBe(false)
  })

  it('should handle operation failure', async () => {
    const mockError = new Error('Operation failed')
    const mockOperation = vi.fn().mockRejectedValue(mockError)
    const onOperationError = vi.fn()

    const { result } = renderHook(() => 
      useApiTool({ 
        toolName: 'test-tool',
        onOperationError,
      })
    )

    await act(async () => {
      try {
        await result.current.actions.executeOperation(mockOperation)
      } catch (error) {
        expect(error).toBe(mockError)
      }
    })

    expect(onOperationError).toHaveBeenCalledWith(mockError)
    expect(mockQuotaHook.revertOptimisticUpdate).toHaveBeenCalled()
    expect(result.current.state.operationError).toBe('Operation failed')
    expect(result.current.state.isProcessing).toBe(false)
  })

  it('should prevent operation when user is not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      initialize: vi.fn(),
    })

    const mockOperation = vi.fn()
    const { result } = renderHook(() => useApiTool({ toolName: 'test-tool' }))

    expect(result.current.actions.checkCanOperate()).toBe(false)
    expect(result.current.state.operationError).toBe('Authentication required')

    await act(async () => {
      try {
        await result.current.actions.executeOperation(mockOperation)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    expect(mockOperation).not.toHaveBeenCalled()
  })

  it('should prevent operation when quota is exceeded', async () => {
    mockUseQuota.mockReturnValue({
      ...mockQuotaHook,
      canUseApi: false,
      quota: {
        ...mockQuotaHook.quota!,
        canUse: false,
        remaining: 0,
      },
    })

    const mockOperation = vi.fn()
    const onQuotaExceeded = vi.fn()

    const { result } = renderHook(() => 
      useApiTool({ 
        toolName: 'test-tool',
        onQuotaExceeded,
      })
    )

    expect(result.current.actions.checkCanOperate()).toBe(false)
    expect(result.current.state.operationError).toBe('Daily quota exceeded')
    expect(onQuotaExceeded).toHaveBeenCalled()

    await act(async () => {
      try {
        await result.current.actions.executeOperation(mockOperation)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    expect(mockOperation).not.toHaveBeenCalled()
  })

  it('should prevent concurrent operations', async () => {
    const mockOperation = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() => useApiTool({ toolName: 'test-tool' }))

    // Start first operation
    const promise1 = act(async () => {
      return result.current.actions.executeOperation(mockOperation)
    })

    // Try to start second operation while first is running
    expect(result.current.state.isProcessing).toBe(true)
    expect(result.current.actions.checkCanOperate()).toBe(false)
    expect(result.current.state.operationError).toBe('Operation already in progress')

    await promise1
  })

  it('should clear operation error', () => {
    const { result } = renderHook(() => useApiTool({ toolName: 'test-tool' }))

    // Set an error
    act(() => {
      result.current.state.operationError = 'Test error'
    })

    // Clear the error
    act(() => {
      result.current.actions.clearError()
    })

    expect(result.current.state.operationError).toBeNull()
  })

  it('should refresh quota', async () => {
    const { result } = renderHook(() => useApiTool({ toolName: 'test-tool' }))

    await act(async () => {
      await result.current.actions.refreshQuota()
    })

    expect(mockQuotaHook.refreshQuota).toHaveBeenCalled()
  })

  it('should pass options to useQuota hook', () => {
    const onQuotaExceeded = jest.fn()
    
    renderHook(() => 
      useApiTool({ 
        toolName: 'test-tool',
        refreshInterval: 60000,
        onQuotaExceeded,
      })
    )

    expect(mockUseQuota).toHaveBeenCalledWith({
      refreshInterval: 60000,
      onQuotaExceeded,
    })
  })
})