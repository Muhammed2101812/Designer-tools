import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useRouter } from 'next/navigation'
import { useRateLimitError, createRateLimitAwareFetch } from '../useRateLimitError'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

const mockPush = vi.fn()
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

;(useRouter as any).mockReturnValue(mockRouter)

describe('useRateLimitError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with no error', () => {
    const { result } = renderHook(() => useRateLimitError())
    
    expect(result.current.error).toBeNull()
    expect(result.current.showDialog).toBe(false)
    expect(result.current.canRetry).toBe(false)
    expect(result.current.timeRemaining).toBe(0)
  })

  it('handles rate limit error correctly', () => {
    const { result } = renderHook(() => useRateLimitError())
    
    const errorData = {
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
      message: 'Rate limit exceeded',
    }
    
    act(() => {
      result.current.handleRateLimitError(errorData)
    })
    
    expect(result.current.error).toEqual(errorData)
    expect(result.current.showDialog).toBe(true)
  })

  it('clears error correctly', () => {
    const { result } = renderHook(() => useRateLimitError())
    
    const errorData = {
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
    }
    
    act(() => {
      result.current.handleRateLimitError(errorData)
    })
    
    expect(result.current.error).toEqual(errorData)
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBeNull()
    expect(result.current.showDialog).toBe(false)
  })

  it('calls custom retry callback', () => {
    const onRetry = vi.fn()
    const { result } = renderHook(() => useRateLimitError({ onRetry }))
    
    act(() => {
      result.current.retry()
    })
    
    expect(onRetry).toHaveBeenCalled()
  })

  it('calls custom upgrade callback', () => {
    const onUpgrade = vi.fn()
    const { result } = renderHook(() => useRateLimitError({ onUpgrade }))
    
    act(() => {
      result.current.upgrade()
    })
    
    expect(onUpgrade).toHaveBeenCalled()
  })

  it('navigates to pricing page when no custom upgrade callback', () => {
    const { result } = renderHook(() => useRateLimitError())
    
    act(() => {
      result.current.upgrade()
    })
    
    expect(mockPush).toHaveBeenCalledWith('/pricing')
  })

  it('calculates canRetry correctly', () => {
    const { result } = renderHook(() => useRateLimitError())
    
    // Future reset time - cannot retry
    const futureErrorData = {
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
    }
    
    act(() => {
      result.current.handleRateLimitError(futureErrorData)
    })
    
    expect(result.current.canRetry).toBe(false)
    
    // Past reset time - can retry
    const pastErrorData = {
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) - 10,
    }
    
    act(() => {
      result.current.handleRateLimitError(pastErrorData)
    })
    
    expect(result.current.canRetry).toBe(true)
  })

  it('calculates time remaining correctly', () => {
    const { result } = renderHook(() => useRateLimitError())
    
    const resetTime = Math.floor(Date.now() / 1000) + 60
    const errorData = {
      limit: 10,
      remaining: 0,
      reset: resetTime,
    }
    
    act(() => {
      result.current.handleRateLimitError(errorData)
    })
    
    expect(result.current.timeRemaining).toBeCloseTo(60, 0)
  })

  it('parses rate limit error from response correctly', async () => {
    const { result } = renderHook(() => useRateLimitError())
    
    const mockResponse = {
      status: 429,
      headers: {
        get: vi.fn((header) => {
          switch (header) {
            case 'X-RateLimit-Limit':
              return '10'
            case 'X-RateLimit-Remaining':
              return '0'
            case 'X-RateLimit-Reset':
              return '60' // seconds from now
            default:
              return null
          }
        }),
      },
      json: vi.fn().mockResolvedValue({
        error: 'Rate limit exceeded',
      }),
    } as unknown as Response
    
    const error = await result.current.parseRateLimitError(mockResponse)
    
    expect(error).toEqual({
      limit: 10,
      remaining: 0,
      reset: expect.any(Number),
      message: 'Rate limit exceeded',
    })
  })

  it('returns null for non-429 responses', async () => {
    const { result } = renderHook(() => useRateLimitError())
    
    const mockResponse = {
      status: 200,
    } as Response
    
    const error = await result.current.parseRateLimitError(mockResponse)
    
    expect(error).toBeNull()
  })

  it('handles response parsing errors gracefully', async () => {
    const { result } = renderHook(() => useRateLimitError())
    
    const mockResponse = {
      status: 429,
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as unknown as Response
    
    const error = await result.current.parseRateLimitError(mockResponse)
    
    expect(error).toEqual({
      limit: 0,
      remaining: 0,
      reset: expect.any(Number),
      message: 'Rate limit exceeded. Please try again later.',
    })
  })

  it('handles response with handleResponse method', async () => {
    const { result } = renderHook(() => useRateLimitError())
    
    const mockResponse = {
      status: 429,
      headers: {
        get: vi.fn((header) => {
          switch (header) {
            case 'X-RateLimit-Limit':
              return '10'
            case 'X-RateLimit-Remaining':
              return '0'
            case 'X-RateLimit-Reset':
              return '60'
            default:
              return null
          }
        }),
      },
      json: vi.fn().mockResolvedValue({
        error: 'Rate limit exceeded',
      }),
    } as unknown as Response
    
    const handledResponse = await result.current.handleResponse(mockResponse)
    
    expect(handledResponse).toBe(mockResponse)
    expect(result.current.error).toBeTruthy()
    expect(result.current.showDialog).toBe(true)
  })
})

describe('createRateLimitAwareFetch', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('calls onRateLimitError for 429 responses', async () => {
    const onRateLimitError = vi.fn()
    const rateLimitAwareFetch = createRateLimitAwareFetch(onRateLimitError)
    
    const mockResponse = {
      status: 429,
      headers: {
        get: vi.fn((header) => {
          switch (header) {
            case 'X-RateLimit-Limit':
              return '10'
            case 'X-RateLimit-Remaining':
              return '0'
            case 'X-RateLimit-Reset':
              return '60'
            default:
              return null
          }
        }),
      },
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue({
          error: 'Rate limit exceeded',
        }),
      }),
    } as unknown as Response
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)
    
    const response = await rateLimitAwareFetch('/api/test')
    
    expect(response).toBe(mockResponse)
    expect(onRateLimitError).toHaveBeenCalledWith({
      limit: 10,
      remaining: 0,
      reset: expect.any(Number),
      message: 'Rate limit exceeded',
    })
  })

  it('does not call onRateLimitError for non-429 responses', async () => {
    const onRateLimitError = vi.fn()
    const rateLimitAwareFetch = createRateLimitAwareFetch(onRateLimitError)
    
    const mockResponse = {
      status: 200,
    } as Response
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)
    
    const response = await rateLimitAwareFetch('/api/test')
    
    expect(response).toBe(mockResponse)
    expect(onRateLimitError).not.toHaveBeenCalled()
  })

  it('handles JSON parsing errors gracefully', async () => {
    const onRateLimitError = vi.fn()
    const rateLimitAwareFetch = createRateLimitAwareFetch(onRateLimitError)
    
    const mockResponse = {
      status: 429,
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      }),
    } as unknown as Response
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)
    
    const response = await rateLimitAwareFetch('/api/test')
    
    expect(response).toBe(mockResponse)
    expect(onRateLimitError).toHaveBeenCalledWith({
      limit: 0,
      remaining: 0,
      reset: expect.any(Number),
      message: 'Rate limit exceeded. Please try again later.',
    })
  })
})