/**
 * Tests for ToolWrapper component
 * Requirements: 14.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolWrapper } from '../ToolWrapper'
import { Palette } from 'lucide-react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('ToolWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render tool title', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.getByText('Color Picker')).toBeInTheDocument()
    })

    it('should render tool description', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.getByText('Extract colors from images')).toBeInTheDocument()
    })

    it('should render tool icon when provided', () => {
      render(
        <ToolWrapper
          title="Color Picker"
          description="Extract colors from images"
          icon={<Palette data-testid="palette-icon" />}
        >
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.getByTestId('palette-icon')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.getByText('Tool Content')).toBeInTheDocument()
    })

    it('should render back button by default', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.getByLabelText(/Navigate back to tools page/i)).toBeInTheDocument()
    })

    it('should not render back button when showBackButton is false', () => {
      render(
        <ToolWrapper
          title="Color Picker"
          description="Extract colors from images"
          showBackButton={false}
        >
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.queryByLabelText(/Navigate back to tools page/i)).not.toBeInTheDocument()
    })

    it('should render privacy notice for client-side tools', () => {
      render(
        <ToolWrapper
          title="Color Picker"
          description="Extract colors from images"
          isClientSide={true}
        >
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.getByText(/All processing happens in your browser/i)).toBeInTheDocument()
    })

    it('should not render privacy notice for API tools', () => {
      render(
        <ToolWrapper
          title="Background Remover"
          description="Remove backgrounds from images"
          isClientSide={false}
        >
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.queryByText(/All processing happens in your browser/i)).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate back to tools page when back button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const backButton = screen.getByLabelText(/Navigate back to tools page/i)
      await user.click(backButton)
      
      expect(mockPush).toHaveBeenCalledWith('/tools')
    })
  })

  describe('Info Modal', () => {
    it('should render info button when infoContent is provided', () => {
      render(
        <ToolWrapper
          title="Color Picker"
          description="Extract colors from images"
          infoContent={<div>Instructions here</div>}
        >
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.getByLabelText(/Open Color Picker instructions/i)).toBeInTheDocument()
    })

    it('should not render info button when infoContent is not provided', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.queryByLabelText(/Open.*instructions/i)).not.toBeInTheDocument()
    })

    it('should open info modal when info button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ToolWrapper
          title="Color Picker"
          description="Extract colors from images"
          infoContent={<div>Instructions here</div>}
        >
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const infoButton = screen.getByLabelText(/Open Color Picker instructions/i)
      await user.click(infoButton)
      
      expect(screen.getByText('Color Picker - Instructions')).toBeInTheDocument()
      expect(screen.getByText('Instructions here')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have proper semantic HTML structure', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument() // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
    })

    it('should have main content with proper id', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('id', 'main-content')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const heading = screen.getByRole('heading', { name: 'Color Picker' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H1')
    })

    it('should have accessible back button label', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const backButton = screen.getByLabelText('Navigate back to tools page')
      expect(backButton).toBeInTheDocument()
    })

    it('should have accessible info button label', () => {
      render(
        <ToolWrapper
          title="Color Picker"
          description="Extract colors from images"
          infoContent={<div>Instructions</div>}
        >
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const infoButton = screen.getByLabelText('Open Color Picker instructions and information')
      expect(infoButton).toBeInTheDocument()
    })

    it('should have accessible privacy notice', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const privacyNotice = screen.getByRole('status')
      expect(privacyNotice).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should hide "Back" text on small screens', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const backButton = screen.getByLabelText(/Navigate back to tools page/i)
      const backText = backButton.querySelector('span')
      
      expect(backText).toHaveClass('hidden')
      expect(backText).toHaveClass('sm:inline')
    })

    it('should apply responsive text sizes to title', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const heading = screen.getByRole('heading', { name: 'Color Picker' })
      expect(heading).toHaveClass('text-xl')
      expect(heading).toHaveClass('sm:text-2xl')
      expect(heading).toHaveClass('lg:text-3xl')
    })

    it('should apply responsive text sizes to description', () => {
      render(
        <ToolWrapper title="Color Picker" description="Extract colors from images">
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const description = screen.getByText('Extract colors from images')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('sm:text-base')
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className to wrapper', () => {
      const { container } = render(
        <ToolWrapper
          title="Color Picker"
          description="Extract colors from images"
          className="custom-class"
        >
          <div>Tool Content</div>
        </ToolWrapper>
      )
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-class')
    })
  })
})
