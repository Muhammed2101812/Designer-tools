import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { QuotaCard } from '../QuotaCard'
import { PlanCard } from '../PlanCard'
import { UsageChart } from '../UsageChart'
import { RecentActivity } from '../RecentActivity'

// Mock Next.js Link component
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    )
  }
})

describe('Dashboard Components', () => {
  describe('QuotaCard', () => {
    it('renders quota information correctly', () => {
      render(
        <QuotaCard
          currentUsage={5}
          dailyLimit={10}
          plan="free"
        />
      )
      
      expect(screen.getByText('Günlük API Kotası')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('/ 10 kalan')).toBeInTheDocument()
      expect(screen.getByText('5 kullanıldı')).toBeInTheDocument()
    })

    it('shows upgrade button for free plan', () => {
      render(
        <QuotaCard
          currentUsage={5}
          dailyLimit={10}
          plan="free"
        />
      )
      
      expect(screen.getByText('Planı Yükselt')).toBeInTheDocument()
    })

    it('does not show upgrade button for premium plan', () => {
      render(
        <QuotaCard
          currentUsage={100}
          dailyLimit={500}
          plan="premium"
        />
      )
      
      expect(screen.queryByText('Planı Yükselt')).not.toBeInTheDocument()
    })

    it('shows warning when usage exceeds 80%', () => {
      render(
        <QuotaCard
          currentUsage={9}
          dailyLimit={10}
          plan="free"
        />
      )
      
      expect(screen.getByText('Kota Uyarısı')).toBeInTheDocument()
      expect(screen.getByText(/Günlük kotanızın %90'ini kullandınız/)).toBeInTheDocument()
    })

    it('does not show warning when usage is below 80%', () => {
      render(
        <QuotaCard
          currentUsage={7}
          dailyLimit={10}
          plan="free"
        />
      )
      
      expect(screen.queryByText('Kota Uyarısı')).not.toBeInTheDocument()
    })

    it('calculates remaining quota correctly', () => {
      render(
        <QuotaCard
          currentUsage={3}
          dailyLimit={10}
          plan="premium"
        />
      )
      
      expect(screen.getByText('7')).toBeInTheDocument() // remaining = 10 - 3
      expect(screen.getByText('3 kullanıldı')).toBeInTheDocument()
    })
  })

  describe('PlanCard', () => {
    it('renders free plan correctly', () => {
      render(<PlanCard plan="free" />)
      
      expect(screen.getByText('Mevcut Plan')).toBeInTheDocument()
      expect(screen.getByText('Free')).toBeInTheDocument()
      expect(screen.getByText('10 günlük API işlemi')).toBeInTheDocument()
      expect(screen.getByText('Planı Yükselt')).toBeInTheDocument()
    })

    it('renders premium plan correctly', () => {
      render(<PlanCard plan="premium" subscriptionStatus="active" />)
      
      expect(screen.getByText('Premium')).toBeInTheDocument()
      expect(screen.getByText('500 günlük API işlemi')).toBeInTheDocument()
      expect(screen.getByText('Aboneliği Yönet')).toBeInTheDocument()
      expect(screen.getByText('Aktif')).toBeInTheDocument()
    })

    it('renders pro plan correctly', () => {
      render(<PlanCard plan="pro" subscriptionStatus="active" />)
      
      expect(screen.getByText('Pro')).toBeInTheDocument()
      expect(screen.getByText('2000 günlük API işlemi')).toBeInTheDocument()
      expect(screen.getByText('REST API erişimi')).toBeInTheDocument()
      expect(screen.getByText('Aktif')).toBeInTheDocument()
    })

    it('shows canceled subscription status', () => {
      render(<PlanCard plan="premium" subscriptionStatus="canceled" />)
      
      expect(screen.getByText('İptal Edildi')).toBeInTheDocument()
      expect(screen.getByText(/Aboneliğiniz iptal edildi/)).toBeInTheDocument()
    })

    it('shows past due subscription status', () => {
      render(<PlanCard plan="premium" subscriptionStatus="past_due" />)
      
      expect(screen.getByText('Ödeme Gecikti')).toBeInTheDocument()
      expect(screen.getByText(/Ödemeniz gecikti/)).toBeInTheDocument()
    })

    it('shows upgrade button for free plan users', () => {
      render(<PlanCard plan="free" />)
      
      expect(screen.getByText('Planı Yükselt')).toBeInTheDocument()
    })

    it('shows Pro upgrade option for premium users', () => {
      render(<PlanCard plan="premium" subscriptionStatus="active" />)
      
      expect(screen.getByText('Pro\'ya Geç')).toBeInTheDocument()
    })

    it('does not show upgrade button for pro users', () => {
      render(<PlanCard plan="pro" subscriptionStatus="active" />)
      
      expect(screen.queryByText('Planı Yükselt')).not.toBeInTheDocument()
      expect(screen.queryByText('Pro\'ya Geç')).not.toBeInTheDocument()
    })
  })

  describe('UsageChart', () => {
    it('renders chart title correctly', () => {
      const mockData = [
        { date: '2024-01-01', api_tools_count: 5 },
        { date: '2024-01-02', api_tools_count: 8 },
      ]
      
      render(<UsageChart data={mockData} />)
      
      expect(screen.getByText('Son 7 Günün Kullanımı')).toBeInTheDocument()
      // Check for ResponsiveContainer class
      expect(document.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('shows empty state when no data', () => {
      render(<UsageChart data={[]} />)
      
      expect(screen.getByText('Son 7 Günün Kullanımı')).toBeInTheDocument()
      expect(screen.getByText('Henüz kullanım verisi bulunmuyor')).toBeInTheDocument()
    })
  })

  describe('RecentActivity', () => {
    it('renders activities correctly', () => {
      const mockActivities = [
        {
          tool_name: 'color-picker',
          created_at: '2024-01-01T10:00:00Z',
          success: true,
        },
        {
          tool_name: 'background-remover',
          created_at: '2024-01-01T09:00:00Z',
          success: false,
        },
      ]
      
      render(<RecentActivity activities={mockActivities} />)
      
      expect(screen.getByText('Son Aktiviteler')).toBeInTheDocument()
      expect(screen.getByText('Renk Seçici')).toBeInTheDocument()
      expect(screen.getByText('Arka Plan Silme')).toBeInTheDocument()
      expect(screen.getByText('Başarılı')).toBeInTheDocument()
      expect(screen.getByText('Hata')).toBeInTheDocument()
    })

    it('shows empty state when no activities', () => {
      render(<RecentActivity activities={[]} />)
      
      expect(screen.getByText('Henüz aktivite bulunmuyor')).toBeInTheDocument()
    })
  })
})