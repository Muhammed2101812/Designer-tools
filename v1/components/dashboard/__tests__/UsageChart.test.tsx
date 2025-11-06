import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { UsageChart } from '../UsageChart'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('UsageChart', () => {
  const mockData = [
    { date: '2024-01-01', api_tools_count: 5 },
    { date: '2024-01-02', api_tools_count: 8 },
    { date: '2024-01-03', api_tools_count: 3 },
  ]

  it('renders chart with data', () => {
    render(<UsageChart data={mockData} />)
    
    expect(screen.getByText('Son 7 Günün Kullanımı')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<UsageChart data={[]} />)
    
    expect(screen.getByText('Son 7 Günün Kullanımı')).toBeInTheDocument()
    expect(screen.getByText('Henüz kullanım verisi bulunmuyor')).toBeInTheDocument()
  })

  it('renders chart components', () => {
    render(<UsageChart data={mockData} />)
    
    expect(screen.getByTestId('bar')).toBeInTheDocument()
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
  })
})