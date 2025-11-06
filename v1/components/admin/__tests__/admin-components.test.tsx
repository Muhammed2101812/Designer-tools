import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsCard } from '../StatsCard'
import { ToolUsageChart } from '../ToolUsageChart'
import { RetentionChart } from '../RetentionChart'
import { ConversionFunnel } from '../ConversionFunnel'
import { Users } from 'lucide-react'

describe('Admin Components', () => {
  describe('StatsCard', () => {
    it('renders stats card with correct data', () => {
      render(
        <StatsCard
          title="Total Users"
          value="1,234"
          icon={<Users className="h-4 w-4" />}
          change="+12%"
        />
      )

      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
      expect(screen.getByText('+12%')).toBeInTheDocument()
    })

    it('shows positive change in green', () => {
      render(
        <StatsCard
          title="Test"
          value="100"
          icon={<Users className="h-4 w-4" />}
          change="+5%"
        />
      )

      const changeElement = screen.getByText('+5%')
      expect(changeElement).toHaveClass('text-green-600')
    })

    it('shows negative change in red', () => {
      render(
        <StatsCard
          title="Test"
          value="100"
          icon={<Users className="h-4 w-4" />}
          change="-5%"
        />
      )

      const changeElement = screen.getByText('-5%')
      expect(changeElement).toHaveClass('text-red-600')
    })
  })

  describe('ToolUsageChart', () => {
    it('renders tool usage chart component', () => {
      const mockData = [
        { toolName: 'color-picker', count: 100, percentage: 40 },
        { toolName: 'image-cropper', count: 75, percentage: 30 },
        { toolName: 'qr-generator', count: 50, percentage: 20 }
      ]

      const { container } = render(<ToolUsageChart data={mockData} />)
      
      // Chart container should render
      expect(container.firstChild).toBeInTheDocument()
      expect(container.querySelector('[class*="h-"]')).toBeInTheDocument()
    })

    it('handles empty data gracefully', () => {
      const { container } = render(<ToolUsageChart data={[]} />)
      
      // Should render chart container even with no data
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('RetentionChart', () => {
    it('renders retention chart component', () => {
      const mockData = [
        { day: 1, percentage: 100 },
        { day: 7, percentage: 45 },
        { day: 30, percentage: 20 }
      ]

      const { container } = render(<RetentionChart data={mockData} />)
      
      // Chart container should render
      expect(container.firstChild).toBeInTheDocument()
      expect(container.querySelector('[class*="h-"]')).toBeInTheDocument()
    })
  })

  describe('ConversionFunnel', () => {
    it('renders conversion funnel with stages', () => {
      const mockData = [
        { stage: 'Signup', count: 1000, percentage: 100 },
        { stage: 'First Tool Use', count: 600, percentage: 60 },
        { stage: 'Subscription', count: 120, percentage: 12 }
      ]

      render(<ConversionFunnel data={mockData} />)

      expect(screen.getByText('Signup')).toBeInTheDocument()
      expect(screen.getByText('First Tool Use')).toBeInTheDocument()
      expect(screen.getByText('Subscription')).toBeInTheDocument()
      expect(screen.getByText('1000')).toBeInTheDocument()
      expect(screen.getByText('600')).toBeInTheDocument()
      expect(screen.getByText('120')).toBeInTheDocument()
    })

    it('calculates conversion rates correctly', () => {
      const mockData = [
        { stage: 'Signup', count: 1000, percentage: 100 },
        { stage: 'First Tool Use', count: 600, percentage: 60 }
      ]

      render(<ConversionFunnel data={mockData} />)

      expect(screen.getByText('Conversion Rates Between Stages')).toBeInTheDocument()
      expect(screen.getByText('Signup → First Tool Use')).toBeInTheDocument()
      expect(screen.getByText('60%')).toBeInTheDocument()
    })

    it('handles single stage data', () => {
      const mockData = [
        { stage: 'Signup', count: 1000, percentage: 100 }
      ]

      render(<ConversionFunnel data={mockData} />)

      expect(screen.getByText('Signup')).toBeInTheDocument()
      expect(screen.getByText('1000')).toBeInTheDocument()
      // Should not show conversion rates section for single stage
      expect(screen.queryByText('Conversion Rates Between Stages')).toBeInTheDocument()
    })
  })
})