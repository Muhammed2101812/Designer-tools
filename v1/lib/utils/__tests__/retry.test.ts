/**
 * Tests for retry utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  retry,
  withTimeout,
  isRetryableError,
  retryFetch,
} from '../retry'
import { NetworkError, TimeoutError } from '../errors'

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('succeeds on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success')

    const result = await retry(operation)

    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and succeeds', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new NetworkError('Failed'))
      .mockResolvedValueOnce('success')

    const promise = retry(operation, { maxAttempts: 3, initialDelay: 1000 })

    // Fast-forward through delays
    await vi.runAllTimersAsync()

    const result = await promise

    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('throws after max attempts', async () => {
    const error = new NetworkError('Failed')
    const operation = vi.fn().mockRejectedValue(error)

    const promise = retry(operation, { maxAttempts: 3, initialDelay: 100 })

    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow(error)
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('uses exponential backoff', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new NetworkError('Failed'))
      .mockRejectedValueOnce(new NetworkError('Failed'))
      .mockResolvedValueOnce('success')

    const onRetry = vi.fn()

    const promise = retry(operation, {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      onRetry,
    })

    await vi.runAllTimersAsync()

    await promise

    // Check delays: 1000ms, 2000ms
    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 1000)
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 2000)
  })

  it('respects maxDelay', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new NetworkError('Failed'))
      .mockRejectedValueOnce(new NetworkError('Failed'))
      .mockResolvedValueOnce('success')

    const onRetry = vi.fn()

    const promise = retry(operation, {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 10,
      maxDelay: 1500,
      onRetry,
    })

    await vi.runAllTimersAsync()

    await promise

    // Delays should be capped at 1500ms
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 1000)
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 1500)
  })

  it('respects custom shouldRetry function', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Not retryable'))

    const promise = retry(operation, {
      maxAttempts: 3,
      shouldRetry: () => false,
    })

    await expect(promise).rejects.toThrow('Not retryable')
    expect(operation).toHaveBeenCalledTimes(1)
  })
})

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves if operation completes in time', async () => {
    const operation = Promise.resolve('success')

    const result = await withTimeout(operation, 5000)

    expect(result).toBe('success')
  })

  it('throws TimeoutError if operation takes too long', async () => {
    const operation = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 10000)
    })

    const promise = withTimeout(operation, 5000, 'Test operation')

    vi.advanceTimersByTime(5000)

    await expect(promise).rejects.toThrow(TimeoutError)
    await expect(promise).rejects.toThrow('Test operation')
  })
})

describe('isRetryableError', () => {
  it('returns true for NetworkError with 5xx status', () => {
    const error = new NetworkError('Server error', 500)
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns false for NetworkError with 4xx status', () => {
    const error = new NetworkError('Bad request', 400)
    expect(isRetryableError(error)).toBe(false)
  })

  it('returns true for TimeoutError', () => {
    const error = new TimeoutError('Operation', 5000)
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns false for generic Error', () => {
    const error = new Error('Generic error')
    expect(isRetryableError(error)).toBe(false)
  })
})

describe('retryFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('succeeds on first attempt', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })

    const result = await retryFetch('/api/test')

    expect(result.ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on 5xx error', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' })
      .mockResolvedValueOnce({ ok: true, status: 200 })

    const promise = retryFetch('/api/test', {}, { maxAttempts: 2, initialDelay: 100 })

    await vi.runAllTimersAsync()

    const result = await promise

    expect(result.ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('does not retry on 4xx error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    })

    const promise = retryFetch('/api/test', {}, { maxAttempts: 3 })

    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow(NetworkError)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
