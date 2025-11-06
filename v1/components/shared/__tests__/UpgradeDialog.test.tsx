import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UpgradeDialog } from '../UpgradeDialog'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { vi } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { it } from 'vitest'
import { beforeEach } from 'vitest'
import { describe } from 'vitest'
import { vi } from 'vitest'
import { vi } from 'vitest'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('UpgradeDialog', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders when open is true', () => {
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={() => {}}
        currentPlan="free"
        currentUsage={10}
        dailyLimit={10}
      />
    )

    expect(screen.getByText('Daily Quota Exceeded')).toBeInTheDocument()
    expect(screen.getByText(/You've used all 10 of your daily API operations/)).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(
      <UpgradeDialog
        open={false}
        onOpenChange={() => {}}
        currentPlan="free"
        currentUsage={8}
        dailyLimit={10}
      />
    )

    expect(screen.queryByText('Daily Quota Exceeded')).not.toBeInTheDocument()
  })

  it('shows plan options with correct features', () => {
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={() => {}}
        currentPlan="free"
        currentUsage={10}
        dailyLimit={10}
      />
    )

    // Check Premium plan
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('$9')).toBeInTheDocument()
    expect(screen.getByText('500 daily API operations')).toBeInTheDocument()
    expect(screen.getByText('Most Popular')).toBeInTheDocument()

    // Check Pro plan
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('$29')).toBeInTheDocument()
    expect(screen.getByText('2000 daily API operations')).toBeInTheDocument()
    expect(screen.getByText('REST API access')).toBeInTheDocument()
  })

  it('navigates to pricing page when upgrade button is clicked', async () => {
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={() => {}}
        currentPlan="free"
        currentUsage={10}
        dailyLimit={10}
      />
    )

    const upgradeButton = screen.getByText('Upgrade to Premium')
    fireEvent.click(upgradeButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pricing?plan=premium')
    })
  })

  it('navigates to pricing page when "View All Plans" is clicked', async () => {
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={() => {}}
        currentPlan="free"
        currentUsage={10}
        dailyLimit={10}
      />
    )

    const viewAllPlansButton = screen.getByText('View All Plans & Features')
    fireEvent.click(viewAllPlansButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pricing')
    })
  })

  it('calls onOpenChange when dialog is closed', () => {
    const mockOnOpenChange = vi.fn()
    
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentPlan="free"
        currentUsage={10}
        dailyLimit={10}
      />
    )

    const maybeLaterButton = screen.getByText('Maybe Later')
    fireEvent.click(maybeLaterButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows custom title and description when provided', () => {
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={() => {}}
        currentPlan="free"
        currentUsage={5}
        dailyLimit={10}
        title="Custom Title"
        description="Custom description text"
      />
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })

  it('disables upgrade buttons for current plan', () => {
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={() => {}}
        currentPlan="premium"
        currentUsage={400}
        dailyLimit={500}
      />
    )

    // Premium plan should show "Current Plan" and be disabled
    expect(screen.getAllByText('Current Plan')).toHaveLength(2) // Badge and button
    
    // Pro plan should still be upgradeable
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
  })

  it('shows quota reset information when quota is exceeded', () => {
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={() => {}}
        currentPlan="free"
        currentUsage={10}
        dailyLimit={10}
      />
    )

    expect(screen.getByText('💡 Good to know:')).toBeInTheDocument()
    expect(screen.getByText(/Your quota will reset at midnight UTC/)).toBeInTheDocument()
  })

  it('shows upgrade title when not out of quota', () => {
    render(
      <UpgradeDialog
        open={true}
        onOpenChange={() => {}}
        currentPlan="free"
        currentUsage={5}
        dailyLimit={10}
      />
    )

    expect(screen.getByText('Upgrade Your Plan')).toBeInTheDocument()
    expect(screen.getByText(/Get more API operations and unlock additional features/)).toBeInTheDocument()
  })
})