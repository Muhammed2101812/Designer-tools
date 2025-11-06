import { render, screen, fireEvent } from '@testing-library/react'
import { UsageIndicator } from '../UsageIndicator'
import { vi } from 'vitest'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
        })),
      })),
    })),
  })),
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('UsageIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with provided props', () => {
    render(
      <UsageIndicator
        currentUsage={5}
        dailyLimit={10}
        planName="free"
      />
    )

    expect(screen.getByText('5 remaining')).toBeInTheDocument()
    expect(screen.getByText('5 / 10 used')).toBeInTheDocument()
    expect(screen.getByText('free Plan')).toBeInTheDocument()
  })

  it('shows green color when usage is low (>50% remaining)', () => {
    render(
      <UsageIndicator
        currentUsage={2}
        dailyLimit={10}
        planName="free"
      />
    )

    const remainingText = screen.getByText('8 remaining')
    expect(remainingText).toHaveClass('text-green-600')
  })

  it('shows yellow color when usage is medium (20-50% remaining)', () => {
    render(
      <UsageIndicator
        currentUsage={6}
        dailyLimit={10}
        planName="free"
      />
    )

    const remainingText = screen.getByText('4 remaining')
    expect(remainingText).toHaveClass('text-yellow-600')
  })

  it('shows red color when usage is high (<20% remaining)', () => {
    render(
      <UsageIndicator
        currentUsage={9}
        dailyLimit={10}
        planName="free"
      />
    )

    const remainingText = screen.getByText('1 remaining')
    expect(remainingText).toHaveClass('text-red-600')
  })

  it('shows upgrade button when quota is low and not pro plan', () => {
    render(
      <UsageIndicator
        currentUsage={9}
        dailyLimit={10}
        planName="free"
      />
    )

    expect(screen.getByRole('button', { name: /upgrade your plan for more api quota/i })).toBeInTheDocument()
  })

  it('shows out of quota message when quota is exhausted', () => {
    render(
      <UsageIndicator
        currentUsage={10}
        dailyLimit={10}
        planName="free"
      />
    )

    expect(screen.getByText(/reached your daily quota limit/i)).toBeInTheDocument()
  })

  it('navigates to pricing page when upgrade button is clicked', () => {
    render(
      <UsageIndicator
        currentUsage={9}
        dailyLimit={10}
        planName="free"
      />
    )

    const upgradeButton = screen.getByRole('button', { name: /upgrade your plan for more api quota/i })
    fireEvent.click(upgradeButton)

    expect(mockPush).toHaveBeenCalledWith('/pricing')
  })

  it('renders compact version correctly', () => {
    render(
      <UsageIndicator
        currentUsage={5}
        dailyLimit={10}
        planName="free"
        compact
      />
    )

    expect(screen.getByText('5/10')).toBeInTheDocument()
    expect(screen.queryByText('API Quota')).not.toBeInTheDocument()
  })

  it('calls onUpgradeClick when provided', () => {
    const onUpgradeClick = vi.fn()
    render(
      <UsageIndicator
        currentUsage={9}
        dailyLimit={10}
        planName="free"
        onUpgradeClick={onUpgradeClick}
      />
    )

    const upgradeButton = screen.getByRole('button', { name: /upgrade your plan for more api quota/i })
    fireEvent.click(upgradeButton)

    expect(onUpgradeClick).toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not show upgrade button for pro plan', () => {
    render(
      <UsageIndicator
        currentUsage={1900}
        dailyLimit={2000}
        planName="pro"
      />
    )

    expect(screen.queryByRole('button', { name: /upgrade your plan for more api quota/i })).not.toBeInTheDocument()
  })
})