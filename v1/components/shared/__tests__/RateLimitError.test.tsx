import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { RateLimitError } from '../RateLimitError'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock timers for testing countdown
vi.useFakeTimers()

describe('RateLimitError', () => {
  const defaultProps = {
    limit: 10,
    remaining: 0,
    reset: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
  }

  beforeEach(() => {
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.useFakeTimers()
  })

  it('renders rate limit information correctly', () => {
    render(<RateLimitError {...defaultProps} />)
    
    expect(screen.getByText('İstek Limiti Aşıldı')).toBeInTheDocument()
    expect(screen.getByText('10 istek/dakika')).toBeInTheDocument()
    expect(screen.getByText('0 istek')).toBeInTheDocument()
  })

  it('displays custom error message when provided', () => {
    const customMessage = 'Custom rate limit message'
    render(<RateLimitError {...defaultProps} message={customMessage} />)
    
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('shows countdown timer when reset time is in the future', () => {
    render(<RateLimitError {...defaultProps} />)
    
    expect(screen.getByText(/Yeniden deneyebilirsiniz:/)).toBeInTheDocument()
    expect(screen.getByText(/1 dakika/)).toBeInTheDocument()
  })

  it('updates countdown timer every second', async () => {
    render(<RateLimitError {...defaultProps} />)
    
    // Initial state
    expect(screen.getByText(/1 dakika/)).toBeInTheDocument()
    
    // Advance time by 30 seconds
    vi.advanceTimersByTime(30000)
    
    await waitFor(() => {
      expect(screen.getByText(/30 saniye/)).toBeInTheDocument()
    })
  })

  it('shows retry button when reset time has passed', async () => {
    const onRetry = vi.fn()
    const pastReset = Math.floor(Date.now() / 1000) - 10 // 10 seconds ago
    
    render(
      <RateLimitError
        {...defaultProps}
        reset={pastReset}
        onRetry={onRetry}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Tekrar Dene'))
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows upgrade button when showUpgrade is true', () => {
    const onUpgrade = vi.fn()
    
    render(
      <RateLimitError
        {...defaultProps}
        showUpgrade={true}
        onUpgrade={onUpgrade}
      />
    )
    
    expect(screen.getByText('Planı Yükselt')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Planı Yükselt'))
    expect(onUpgrade).toHaveBeenCalled()
  })

  it('displays upgrade message when showUpgrade is true', () => {
    render(<RateLimitError {...defaultProps} showUpgrade={true} />)
    
    expect(screen.getByText(/Daha yüksek limitler için planınızı yükseltin/)).toBeInTheDocument()
  })

  it('formats time remaining correctly for different durations', () => {
    // Test seconds
    const secondsReset = Math.floor(Date.now() / 1000) + 30
    const { rerender } = render(<RateLimitError {...defaultProps} reset={secondsReset} />)
    expect(screen.getByText(/30 saniye/)).toBeInTheDocument()
    
    // Test minutes
    const minutesReset = Math.floor(Date.now() / 1000) + 150 // 2.5 minutes
    rerender(<RateLimitError {...defaultProps} reset={minutesReset} />)
    expect(screen.getByText(/2 dakika 30 saniye/)).toBeInTheDocument()
    
    // Test hours
    const hoursReset = Math.floor(Date.now() / 1000) + 3900 // 1 hour 5 minutes
    rerender(<RateLimitError {...defaultProps} reset={hoursReset} />)
    expect(screen.getByText(/1 saat 5 dakika/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <RateLimitError {...defaultProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles edge case when reset time is exactly now', async () => {
    const nowReset = Math.floor(Date.now() / 1000)
    const onRetry = vi.fn()
    
    render(
      <RateLimitError
        {...defaultProps}
        reset={nowReset}
        onRetry={onRetry}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument()
    })
  })

  it('does not show retry button when onRetry is not provided', async () => {
    const pastReset = Math.floor(Date.now() / 1000) - 10
    
    render(<RateLimitError {...defaultProps} reset={pastReset} />)
    
    await waitFor(() => {
      expect(screen.queryByText('Tekrar Dene')).not.toBeInTheDocument()
    })
  })

  it('does not show upgrade button when showUpgrade is false', () => {
    render(
      <RateLimitError
        {...defaultProps}
        showUpgrade={false}
        onUpgrade={vi.fn()}
      />
    )
    
    expect(screen.queryByText('Planı Yükselt')).not.toBeInTheDocument()
  })
})