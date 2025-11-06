import { render, screen } from '@testing-library/react'
import { PersonalStats } from '../PersonalStats'

describe('PersonalStats', () => {
  const mockWeeklyActivity = [
    { date: '2024-01-01', count: 5 },
    { date: '2024-01-02', count: 3 },
    { date: '2024-01-03', count: 8 },
    { date: '2024-01-04', count: 2 },
    { date: '2024-01-05', count: 6 },
    { date: '2024-01-06', count: 4 },
    { date: '2024-01-07', count: 7 },
  ]

  it('renders total usage correctly', () => {
    render(
      <PersonalStats
        totalUsage={42}
        mostUsedTool={null}
        weeklyActivity={mockWeeklyActivity}
      />
    )

    expect(screen.getByText('Toplam Kullanım')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Tüm zamanlarda kullanılan araç sayısı')).toBeInTheDocument()
  })

  it('renders most used tool when available', () => {
    const mostUsedTool = {
      name: 'background-remover',
      displayName: 'Arka Plan Silme',
      count: 15
    }

    render(
      <PersonalStats
        totalUsage={42}
        mostUsedTool={mostUsedTool}
        weeklyActivity={mockWeeklyActivity}
      />
    )

    expect(screen.getByText('En Çok Kullanılan')).toBeInTheDocument()
    expect(screen.getByText('Arka Plan Silme')).toBeInTheDocument()
    expect(screen.getByText('15 kez kullanıldı')).toBeInTheDocument()
  })

  it('renders empty state when no most used tool', () => {
    render(
      <PersonalStats
        totalUsage={0}
        mostUsedTool={null}
        weeklyActivity={[]}
      />
    )

    expect(screen.getByText('En Çok Kullanılan')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText('Henüz araç kullanımı yok')).toBeInTheDocument()
  })

  it('calculates weekly total correctly', () => {
    render(
      <PersonalStats
        totalUsage={42}
        mostUsedTool={null}
        weeklyActivity={mockWeeklyActivity}
      />
    )

    const weeklyTotal = mockWeeklyActivity.reduce((sum, day) => sum + day.count, 0)
    expect(screen.getByText('Bu Hafta')).toBeInTheDocument()
    expect(screen.getByText(weeklyTotal.toString())).toBeInTheDocument()
    expect(screen.getByText('Son 7 günde toplam kullanım')).toBeInTheDocument()
  })

  it('renders weekly activity bars', () => {
    render(
      <PersonalStats
        totalUsage={42}
        mostUsedTool={null}
        weeklyActivity={mockWeeklyActivity}
      />
    )

    // Should render 7 activity bars (one for each day)
    const activityBars = screen.getAllByRole('generic').filter(el => 
      el.className.includes('bg-primary/20')
    )
    expect(activityBars).toHaveLength(7)
  })

  it('handles empty weekly activity', () => {
    render(
      <PersonalStats
        totalUsage={0}
        mostUsedTool={null}
        weeklyActivity={[]}
      />
    )

    expect(screen.getByText('Bu Hafta')).toBeInTheDocument()
    expect(screen.getByText('Son 7 günde toplam kullanım')).toBeInTheDocument()
    
    // Check that there are multiple "0" values (total usage and weekly total)
    const zeroElements = screen.getAllByText('0')
    expect(zeroElements).toHaveLength(2)
  })
})