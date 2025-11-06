/**
 * Tests for ColorHistory component
 * Requirements: 7.4, 7.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorHistory } from '../ColorHistory'
import type { Color } from '@/types'

describe('ColorHistory', () => {
  const mockColors: Color[] = [
    {
      hex: '#3B82F6',
      rgb: { r: 59, g: 130, b: 246 },
      hsl: { h: 217, s: 91, l: 60 },
      timestamp: Date.now(),
    },
    {
      hex: '#EF4444',
      rgb: { r: 239, g: 68, b: 68 },
      hsl: { h: 0, s: 84, l: 60 },
      timestamp: Date.now() + 1000,
    },
    {
      hex: '#10B981',
      rgb: { r: 16, g: 185, b: 129 },
      hsl: { h: 160, s: 84, l: 39 },
      timestamp: Date.now() + 2000,
    },
  ]

  const mockCallbacks = {
    onColorSelect: vi.fn(),
    onExport: vi.fn(),
    onClear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render empty state when no colors', () => {
      render(<ColorHistory colors={[]} {...mockCallbacks} />)
      
      expect(screen.getByText('Color History')).toBeInTheDocument()
      expect(screen.getByText('Pick colors to build your palette')).toBeInTheDocument()
      expect(screen.getByLabelText('0 of 10 colors saved')).toBeInTheDocument()
    })

    it('should render color count', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      expect(screen.getByLabelText('3 of 10 colors saved')).toBeInTheDocument()
    })

    it('should render color swatches in grid', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const swatches = screen.getAllByRole('listitem')
      expect(swatches).toHaveLength(3)
    })

    it('should render color swatches with correct background colors', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const swatches = screen.getAllByRole('listitem')
      expect(swatches[0]).toHaveStyle({ backgroundColor: '#3B82F6' })
      expect(swatches[1]).toHaveStyle({ backgroundColor: '#EF4444' })
      expect(swatches[2]).toHaveStyle({ backgroundColor: '#10B981' })
    })

    it('should render Export Palette button', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      expect(screen.getByLabelText(/Export palette/i)).toBeInTheDocument()
    })

    it('should render Clear History button', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      expect(screen.getByLabelText(/Clear all/i)).toBeInTheDocument()
    })

    it('should not render action buttons when no colors', () => {
      render(<ColorHistory colors={[]} {...mockCallbacks} />)
      
      // Buttons are not rendered in empty state
      expect(screen.queryByLabelText(/Export palette/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Clear all/i)).not.toBeInTheDocument()
    })
  })

  describe('Color Selection', () => {
    it('should call onColorSelect when color swatch is clicked', async () => {
      const user = userEvent.setup()
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const firstSwatch = screen.getAllByRole('listitem')[0]
      await user.click(firstSwatch)
      
      expect(mockCallbacks.onColorSelect).toHaveBeenCalledWith(mockColors[0])
    })

    it('should call onColorSelect with correct color for each swatch', async () => {
      const user = userEvent.setup()
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const swatches = screen.getAllByRole('listitem')
      
      await user.click(swatches[1])
      expect(mockCallbacks.onColorSelect).toHaveBeenCalledWith(mockColors[1])
      
      await user.click(swatches[2])
      expect(mockCallbacks.onColorSelect).toHaveBeenCalledWith(mockColors[2])
    })
  })

  describe('Export Functionality', () => {
    it('should call onExport when Export Palette button is clicked', async () => {
      const user = userEvent.setup()
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const exportButton = screen.getByLabelText(/Export palette/i)
      await user.click(exportButton)
      
      expect(mockCallbacks.onExport).toHaveBeenCalled()
    })

    it('should not render export button in empty state', () => {
      render(<ColorHistory colors={[]} {...mockCallbacks} />)
      
      // Button is not rendered in empty state
      expect(screen.queryByLabelText(/Export palette/i)).not.toBeInTheDocument()
    })
  })

  describe('Clear Functionality', () => {
    it('should show confirmation dialog when Clear History is clicked', async () => {
      const user = userEvent.setup()
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const clearButton = screen.getByLabelText(/Clear all/i)
      await user.click(clearButton)
      
      await waitFor(() => {
        expect(screen.getByText('Clear Color History?')).toBeInTheDocument()
      })
    })

    it('should show correct count in confirmation dialog', async () => {
      const user = userEvent.setup()
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const clearButton = screen.getByLabelText(/Clear all/i)
      await user.click(clearButton)
      
      await waitFor(() => {
        expect(screen.getByText(/remove all 3 colors/i)).toBeInTheDocument()
      })
    })

    it('should call onClear when confirmation is accepted', async () => {
      const user = userEvent.setup()
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const clearButton = screen.getByLabelText(/Clear all/i)
      await user.click(clearButton)
      
      await waitFor(() => {
        expect(screen.getByText('Clear Color History?')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByRole('button', { name: /Clear History/i })
      await user.click(confirmButton)
      
      expect(mockCallbacks.onClear).toHaveBeenCalled()
    })

    it('should not call onClear when confirmation is cancelled', async () => {
      const user = userEvent.setup()
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const clearButton = screen.getByLabelText(/Clear all/i)
      await user.click(clearButton)
      
      await waitFor(() => {
        expect(screen.getByText('Clear Color History?')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await user.click(cancelButton)
      
      expect(mockCallbacks.onClear).not.toHaveBeenCalled()
    })

    it('should close dialog after confirmation', async () => {
      const user = userEvent.setup()
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const clearButton = screen.getByLabelText(/Clear all/i)
      await user.click(clearButton)
      
      await waitFor(() => {
        expect(screen.getByText('Clear Color History?')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByRole('button', { name: /Clear History/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Clear Color History?')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for color swatches', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      expect(screen.getByLabelText(/Select color #3B82F6/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Select color #EF4444/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Select color #10B981/i)).toBeInTheDocument()
    })

    it('should have proper ARIA label for color grid', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      expect(screen.getByLabelText(/Color palette with 3 saved colors/i)).toBeInTheDocument()
    })

    it('should have proper ARIA labels for action buttons', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      expect(screen.getByLabelText(/Export palette with 3 colors/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Clear all 3 colors/i)).toBeInTheDocument()
    })

    it('should have keyboard accessible color swatches', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const swatches = screen.getAllByRole('listitem')
      // Buttons are keyboard accessible by default
      swatches.forEach(swatch => {
        expect(swatch.tagName).toBe('BUTTON')
      })
    })

    it('should meet minimum touch target size (44px)', () => {
      render(<ColorHistory colors={mockColors} {...mockCallbacks} />)
      
      const swatches = screen.getAllByRole('listitem')
      swatches.forEach(swatch => {
        expect(swatch).toHaveClass('min-h-[44px]')
        expect(swatch).toHaveClass('min-w-[44px]')
      })
    })
  })

  describe('Maximum Colors Limit', () => {
    it('should handle maximum of 10 colors', () => {
      const tenColors: Color[] = Array.from({ length: 10 }, (_, i) => ({
        hex: `#${i.toString(16).padStart(6, '0')}`,
        rgb: { r: i, g: i, b: i },
        hsl: { h: i, s: i, l: i },
        timestamp: Date.now() + i,
      }))
      
      render(<ColorHistory colors={tenColors} {...mockCallbacks} />)
      
      expect(screen.getByLabelText('10 of 10 colors saved')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(10)
    })
  })
})
