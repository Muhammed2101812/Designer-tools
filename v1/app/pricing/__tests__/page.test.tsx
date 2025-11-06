import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PricingPage from '../page'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pricing page for non-authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const PricingPageComponent = await PricingPage()
    render(PricingPageComponent)

    // Check main heading
    expect(screen.getByText('Choose the Plan That\'s Right for You')).toBeInTheDocument()
    
    // Check all three plans are displayed
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    
    // Check pricing
    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.getByText('$9')).toBeInTheDocument()
    expect(screen.getByText('$29')).toBeInTheDocument()
    
    // Check FAQ section
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    
    // Check comparison table
    expect(screen.getByText('Compare Plans')).toBeInTheDocument()
    expect(screen.getByText('Daily API Operations')).toBeInTheDocument()
  })

  it('renders pricing page for authenticated user with free plan', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { plan: 'free' },
    })

    const PricingPageComponent = await PricingPage()
    render(PricingPageComponent)

    // Should show upgrade options for premium and pro
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
  })

  it('renders pricing page for authenticated user with premium plan', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { plan: 'premium' },
    })

    const PricingPageComponent = await PricingPage()
    render(PricingPageComponent)

    // Should show current plan badge for premium
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('displays feature comparison table correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const PricingPageComponent = await PricingPage()
    render(PricingPageComponent)

    // Check comparison table features
    expect(screen.getByText('10')).toBeInTheDocument() // Free plan quota
    expect(screen.getByText('500')).toBeInTheDocument() // Premium plan quota
    expect(screen.getByText('2,000')).toBeInTheDocument() // Pro plan quota
    
    expect(screen.getByText('10MB')).toBeInTheDocument() // Free file size
    expect(screen.getByText('50MB')).toBeInTheDocument() // Premium file size
    expect(screen.getByText('100MB')).toBeInTheDocument() // Pro file size
  })

  it('displays FAQ section with expandable items', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const PricingPageComponent = await PricingPage()
    render(PricingPageComponent)

    // Check FAQ questions are present
    expect(screen.getByText('Can I cancel my plan anytime?')).toBeInTheDocument()
    expect(screen.getByText('How does the daily quota reset work?')).toBeInTheDocument()
    expect(screen.getByText('What happens when I change plans?')).toBeInTheDocument()
  })
})