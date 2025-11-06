import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { RateLimitDialog } from '../RateLimitDialog'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
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
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { expect } from '@playwright/test'
import { it } from 'date-fns/locale'
import { expect } from '@playwright/test'
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
import { expect } from '@playwright/test'
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
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock timers for testing countdown
vi.useFakeTimers()

describe('RateLimitDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    limit: 10,
    remaining: 0,
    reset: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
  }

  beforeEach(() => {
    vi.clearAllTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.useFakeTimers()
  })

  it('renders when open is true', () => {
    render(<RateLimitDialog {...defaultProps} />)
    
    expect(screen.getByText('İstek Limiti Aşıldı')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('İstek/Dakika')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<RateLimitDialog {...defaultProps} open={false} />)
    
    expect(screen.queryByText('İstek Limiti Aşıldı')).not.toBeInTheDocument()
  })

  it('displays custom error message when provided', () => {
    const customMessage = 'Custom rate limit message'
    render(<RateLimitDialog {...defaultProps} message={customMessage} />)
    
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('shows rate limit information in grid format', () => {
    render(<RateLimitDialog {...defaultProps} />)
    
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('İstek/Dakika')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Kalan İstek')).toBeInTheDocument()
  })

  it('shows countdown timer when reset time is in the future', () => {
    render(<RateLimitDialog {...defaultProps} />)
    
    expect(screen.getByText(/Yeniden deneyebilirsiniz:/)).toBeInTheDocument()
    expect(screen.getByText(/1 dakika/)).toBeInTheDocument()
  })

  it('updates countdown timer every second', async () => {
    render(<RateLimitDialog {...defaultProps} />)
    
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
      <RateLimitDialog
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
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows upgrade section when showUpgrade is true', () => {
    render(
      <RateLimitDialog
        {...defaultProps}
        showUpgrade={true}
      />
    )
    
    expect(screen.getByText('Daha Yüksek Limitler İstiyorsanız')).toBeInTheDocument()
    expect(screen.getByText(/Premium plan ile dakikada 120 istek/)).toBeInTheDocument()
    expect(screen.getByText('Planı Yükselt')).toBeInTheDocument()
  })

  it('calls onUpgrade and closes dialog when upgrade button is clicked', () => {
    const onUpgrade = vi.fn()
    
    render(
      <RateLimitDialog
        {...defaultProps}
        showUpgrade={true}
        onUpgrade={onUpgrade}
      />
    )
    
    fireEvent.click(screen.getByText('Planı Yükselt'))
    expect(onUpgrade).toHaveBeenCalled()
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes dialog when close button is clicked', () => {
    render(<RateLimitDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Kapat'))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes dialog when X button is clicked', () => {
    render(<RateLimitDialog {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('displays default message for regular users', () => {
    render(<RateLimitDialog {...defaultProps} />)
    
    expect(screen.getByText(/Çok fazla istek gönderdiniz/)).toBeInTheDocument()
  })

  it('displays upgrade message when showUpgrade is true', () => {
    render(<RateLimitDialog {...defaultProps} showUpgrade={true} />)
    
    expect(screen.getByText(/İstek limitinizi aştınız.*planınızı yükseltin/)).toBeInTheDocument()
  })

  it('does not update timer when dialog is closed', () => {
    const { rerender } = render(<RateLimitDialog {...defaultProps} />)
    
    // Close dialog
    rerender(<RateLimitDialog {...defaultProps} open={false} />)
    
    // Advance time
    vi.advanceTimersByTime(30000)
    
    // Reopen dialog
    rerender(<RateLimitDialog {...defaultProps} open={true} />)
    
    // Should still show original time
    expect(screen.getByText(/1 dakika/)).toBeInTheDocument()
  })

  it('handles edge case when reset time is exactly now', async () => {
    const nowReset = Math.floor(Date.now() / 1000)
    const onRetry = vi.fn()
    
    render(
      <RateLimitDialog
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
    
    render(<RateLimitDialog {...defaultProps} reset={pastReset} />)
    
    await waitFor(() => {
      expect(screen.queryByText('Tekrar Dene')).not.toBeInTheDocument()
    })
  })

  it('does not show upgrade button when showUpgrade is false', () => {
    render(
      <RateLimitDialog
        {...defaultProps}
        showUpgrade={false}
        onUpgrade={vi.fn()}
      />
    )
    
    expect(screen.queryByText('Planı Yükselt')).not.toBeInTheDocument()
  })
})