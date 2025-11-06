/**
 * Tests for ColorDisplay component
 * Requirements: 7.1, 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorDisplay } from '../ColorDisplay'
import type { Color } from '@/types'
import { toast } from '@/lib/hooks/use-toast'

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
}

Object.assign(navigator, {
  clipboard: mockClipboard,
})

// Mock browser compatibility check
vi.mock('@/lib/utils/browserCompat', () => ({
  checkClipboardSupport: () => true,
}))

describe('ColorDisplay', () => {
  const mockColor: Color = {
    hex: '#3B82F6',
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    timestamp: Date.now(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render empty state when no color is provided', () => {
      render(<ColorDisplay color={null} />)
      
      expect(screen.getByText('Current Color')).toBeInTheDocument()
      expect(screen.getByText('Click on the image to pick a color')).toBeInTheDocument()
    })

    it('should render color swatch when color is provided', () => {
      render(<ColorDisplay color={mockColor} />)
      
      const swatch = screen.getByRole('img', { name: /color swatch/i })
      expect(swatch).toBeInTheDocument()
      expect(swatch).toHaveStyle({ backgroundColor: '#3B82F6' })
    })

    it('should display HEX value', () => {
      render(<ColorDisplay color={mockColor} />)
      
      expect(screen.getByText('#3B82F6')).toBeInTheDocument()
      expect(screen.getByLabelText(/HEX color value/i)).toBeInTheDocument()
    })

    it('should display RGB value in correct format', () => {
      render(<ColorDisplay color={mockColor} />)
      
      expect(screen.getByText('rgb(59, 130, 246)')).toBeInTheDocument()
      expect(screen.getByLabelText(/RGB color value/i)).toBeInTheDocument()
    })

    it('should display HSL value in correct format', () => {
      render(<ColorDisplay color={mockColor} />)
      
      expect(screen.getByText('hsl(217, 91%, 60%)')).toBeInTheDocument()
      expect(screen.getByLabelText(/HSL color value/i)).toBeInTheDocument()
    })

    it('should render copy buttons for all formats', () => {
      render(<ColorDisplay color={mockColor} />)
      
      expect(screen.getByLabelText(/Copy HEX value/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Copy RGB value/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Copy HSL value/i)).toBeInTheDocument()
    })
  })

  describe('Copy Functionality', () => {
    it('should have copy buttons for all color formats', () => {
      render(<ColorDisplay color={mockColor} />)
      
      expect(screen.getByLabelText(/Copy HEX value/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Copy RGB value/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Copy HSL value/i)).toBeInTheDocument()
    })

    it('should show visual feedback after clicking copy button', async () => {
      const user = userEvent.setup()
      render(<ColorDisplay color={mockColor} />)
      
      const copyButton = screen.getByLabelText(/Copy HEX value/i)
      await user.click(copyButton)
      
      // Visual feedback should appear (checkmark icon)
      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should call onCopy callback when provided', async () => {
      const user = userEvent.setup()
      const onCopy = vi.fn()
      render(<ColorDisplay color={mockColor} onCopy={onCopy} />)
      
      const copyButton = screen.getByLabelText(/Copy HEX value/i)
      await user.click(copyButton)
      
      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith('hex')
      }, { timeout: 1000 })
    })

    it('should have separate copy buttons for RGB and HSL', async () => {
      const user = userEvent.setup()
      const onCopy = vi.fn()
      render(<ColorDisplay color={mockColor} onCopy={onCopy} />)
      
      const rgbButton = screen.getByLabelText(/Copy RGB value/i)
      await user.click(rgbButton)
      
      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith('rgb')
      }, { timeout: 1000 })
      
      const hslButton = screen.getByLabelText(/Copy HSL value/i)
      await user.click(hslButton)
      
      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith('hsl')
      }, { timeout: 1000 })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for color values', () => {
      render(<ColorDisplay color={mockColor} />)
      
      expect(screen.getByLabelText(/HEX color value: #3B82F6/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/RGB color value/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/HSL color value/i)).toBeInTheDocument()
    })

    it('should announce color changes to screen readers', () => {
      const { rerender } = render(<ColorDisplay color={null} />)
      
      const newColor: Color = {
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
        hsl: { h: 0, s: 100, l: 50 },
        timestamp: Date.now(),
      }
      
      rerender(<ColorDisplay color={newColor} />)
      
      const announcement = screen.getByRole('status')
      expect(announcement).toBeInTheDocument()
    })

    it('should have accessible copy button labels', () => {
      render(<ColorDisplay color={mockColor} />)
      
      expect(screen.getByLabelText(/Copy HEX value #3B82F6 to clipboard/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Copy RGB value rgb\(59, 130, 246\) to clipboard/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Copy HSL value hsl\(217, 91%, 60%\) to clipboard/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should not crash when copy button is clicked', async () => {
      const user = userEvent.setup()
      render(<ColorDisplay color={mockColor} />)
      
      const copyButton = screen.getByLabelText(/Copy HEX value/i)
      
      // Should not throw error when clicked
      await expect(user.click(copyButton)).resolves.not.toThrow()
    })
  })
})
