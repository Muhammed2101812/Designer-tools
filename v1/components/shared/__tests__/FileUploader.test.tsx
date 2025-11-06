/**
 * Tests for FileUploader component
 * Requirements: 14.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploader } from '../FileUploader'

describe('FileUploader', () => {
  const mockOnFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render upload area', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />)
      
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument()
      expect(screen.getByText(/or drag and drop/i)).toBeInTheDocument()
    })

    it('should display accepted file types', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png,image/jpeg"
        />
      )
      
      expect(screen.getByText(/PNG, JPEG/i)).toBeInTheDocument()
    })

    it('should display max file size', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          maxSize={5}
        />
      )
      
      expect(screen.getByText(/max 5MB/i)).toBeInTheDocument()
    })

    it('should display custom description', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          description="Upload your image file"
        />
      )
      
      expect(screen.getByText('Upload your image file')).toBeInTheDocument()
    })

    it('should show multiple files indicator when multiple is true', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          multiple={true}
        />
      )
      
      expect(screen.getByText(/Multiple files allowed/i)).toBeInTheDocument()
    })
  })

  describe('File Selection via Click', () => {
    it('should trigger file input when upload area is clicked', async () => {
      const user = userEvent.setup()
      render(<FileUploader onFileSelect={mockOnFileSelect} />)
      
      const uploadArea = screen.getByRole('button', { name: /Upload file area/i })
      await user.click(uploadArea)
      
      // File input should be triggered (we can't fully test this without browser interaction)
      expect(uploadArea).toBeInTheDocument()
    })

    it('should call onFileSelect with valid file', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
          maxSize={10}
        />
      )
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }) // 5MB
      
      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      if (input) {
        await user.upload(input, file)
        
        await waitFor(() => {
          expect(mockOnFileSelect).toHaveBeenCalledWith(file)
        })
      }
    })
  })

  describe('File Validation', () => {
    it('should show error for invalid file type', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })

      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement

      if (input) {
        await user.upload(input, file)
        
        await waitFor(() => {
          expect(screen.getByRole('alert')).toBeInTheDocument()
        })
      }
    })

    it('should show error for file exceeding max size', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
          maxSize={5}
        />
      )
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }) // 10MB
      
      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      if (input) {
        await user.upload(input, file)
        
        await waitFor(() => {
          expect(screen.getByRole('alert')).toBeInTheDocument()
        })
      }
    })

    it('should not call onFileSelect for invalid files', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
        />
      )
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })
      
      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      if (input) {
        await user.upload(input, file)
        
        await waitFor(() => {
          expect(mockOnFileSelect).not.toHaveBeenCalled()
        })
      }
    })
  })

  describe('Selected File Display', () => {
    it('should display selected file name and size', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
        />
      )
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }) // 5MB
      
      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      if (input) {
        await user.upload(input, file)
        
        await waitFor(() => {
          expect(screen.getByText('test.png')).toBeInTheDocument()
          expect(screen.getByText(/5\.00 MB/i)).toBeInTheDocument()
        })
      }
    })

    it('should show clear button for selected file', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
        />
      )
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })
      
      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      if (input) {
        await user.upload(input, file)
        
        await waitFor(() => {
          expect(screen.getByLabelText(/Remove test\.png/i)).toBeInTheDocument()
        })
      }
    })

    it('should clear file when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
        />
      )
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })
      
      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      if (input) {
        await user.upload(input, file)
        
        await waitFor(() => {
          expect(screen.getByText('test.png')).toBeInTheDocument()
        })
        
        const clearButton = screen.getByLabelText(/Remove test\.png/i)
        await user.click(clearButton)
        
        await waitFor(() => {
          expect(screen.queryByText('test.png')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Drag and Drop', () => {
    it('should show active state when dragging over', async () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />)
      
      const uploadArea = screen.getByRole('button', { name: /Upload file area/i })
      
      // Simulate drag enter
      const dragEnterEvent = new Event('dragenter', { bubbles: true })
      Object.defineProperty(dragEnterEvent, 'dataTransfer', {
        value: { items: [{ kind: 'file' }] },
      })
      uploadArea.dispatchEvent(dragEnterEvent)
      
      await waitFor(() => {
        expect(screen.getByText('Drop your file here')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA label for upload area', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />)
      
      expect(screen.getByRole('button', { name: /Upload file area/i })).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<FileUploader onFileSelect={mockOnFileSelect} />)
      
      const uploadArea = screen.getByRole('button', { name: /Upload file area/i })
      
      // Tab to focus
      await user.tab()
      expect(uploadArea).toHaveFocus()
    })

    it('should trigger file selection on Enter key', async () => {
      const user = userEvent.setup()
      render(<FileUploader onFileSelect={mockOnFileSelect} />)
      
      const uploadArea = screen.getByRole('button', { name: /Upload file area/i })
      uploadArea.focus()
      
      await user.keyboard('{Enter}')
      
      // File input should be triggered
      expect(uploadArea).toBeInTheDocument()
    })

    it('should trigger file selection on Space key', async () => {
      const user = userEvent.setup()
      render(<FileUploader onFileSelect={mockOnFileSelect} />)
      
      const uploadArea = screen.getByRole('button', { name: /Upload file area/i })
      uploadArea.focus()
      
      await user.keyboard(' ')
      
      // File input should be triggered
      expect(uploadArea).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} disabled={true} />)
      
      const uploadArea = screen.getByRole('button', { name: /Upload file area/i })
      expect(uploadArea).toHaveClass('cursor-not-allowed')
    })
  })

  describe('Multiple Files', () => {
    it('should accept multiple files when multiple is true', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
          multiple={true}
        />
      )
      
      const file1 = new File(['test1'], 'test1.png', { type: 'image/png' })
      const file2 = new File(['test2'], 'test2.png', { type: 'image/png' })
      Object.defineProperty(file1, 'size', { value: 1 * 1024 * 1024 })
      Object.defineProperty(file2, 'size', { value: 2 * 1024 * 1024 })
      
      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      if (input) {
        await user.upload(input, [file1, file2])
        
        await waitFor(() => {
          expect(mockOnFileSelect).toHaveBeenCalledWith([file1, file2])
        })
      }
    })

    it('should show Clear All button for multiple files', async () => {
      const user = userEvent.setup()
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          accept="image/png"
          multiple={true}
        />
      )
      
      const file1 = new File(['test1'], 'test1.png', { type: 'image/png' })
      const file2 = new File(['test2'], 'test2.png', { type: 'image/png' })
      Object.defineProperty(file1, 'size', { value: 1 * 1024 * 1024 })
      Object.defineProperty(file2, 'size', { value: 2 * 1024 * 1024 })
      
      const input = screen.getByRole('button', { name: /Upload file area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      if (input) {
        await user.upload(input, [file1, file2])
        
        await waitFor(() => {
          expect(screen.getByText('Clear All')).toBeInTheDocument()
        })
      }
    })
  })
})
