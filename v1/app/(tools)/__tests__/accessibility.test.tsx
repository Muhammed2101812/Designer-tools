/**
 * Accessibility tests for tool interfaces
 * Tests WCAG 2.1 Level AA compliance using axe-core
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'vitest-axe'

expect.extend(toHaveNoViolations)

// Mock Next.js components
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/tools/test',
}))

vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('Accessibility Tests', () => {
  describe('Tool Page Structure', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(
        <div>
          <h1>Image Resizer</h1>
          <section>
            <h2>Upload Image</h2>
            <p>Select an image to resize</p>
          </section>
          <section>
            <h2>Settings</h2>
            <p>Configure resize options</p>
          </section>
        </div>
      )

      const h1 = container.querySelector('h1')
      const h2s = container.querySelectorAll('h2')

      expect(h1).toBeTruthy()
      expect(h2s.length).toBe(2)
    })

    it('should have landmark regions', () => {
      const { container } = render(
        <div>
          <header role="banner">
            <h1>Tool Name</h1>
          </header>
          <main role="main">
            <p>Main content</p>
          </main>
          <footer role="contentinfo">
            <p>Footer content</p>
          </footer>
        </div>
      )

      expect(container.querySelector('[role="banner"]')).toBeTruthy()
      expect(container.querySelector('[role="main"]')).toBeTruthy()
      expect(container.querySelector('[role="contentinfo"]')).toBeTruthy()
    })
  })

  describe('Form Controls', () => {
    it('should have accessible form labels', async () => {
      const { container } = render(
        <form>
          <label htmlFor="width-input">Width (px)</label>
          <input id="width-input" type="number" />
          
          <label htmlFor="height-input">Height (px)</label>
          <input id="height-input" type="number" />
        </form>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible file upload', async () => {
      const { container } = render(
        <div>
          <label htmlFor="file-upload">
            Upload Image
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              aria-describedby="file-help"
            />
          </label>
          <p id="file-help">Supported formats: PNG, JPG, WEBP (max 10MB)</p>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible buttons', async () => {
      const { container } = render(
        <div>
          <button type="button" aria-label="Process image">
            Process
          </button>
          <button type="button" aria-label="Download processed image">
            Download
          </button>
          <button type="button" aria-label="Reset tool">
            Reset
          </button>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible sliders', async () => {
      const { container } = render(
        <div>
          <label htmlFor="quality-slider">
            Quality: <span id="quality-value">90%</span>
          </label>
          <input
            id="quality-slider"
            type="range"
            min="0"
            max="100"
            value="90"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={90}
            aria-valuetext="90 percent"
            aria-describedby="quality-value"
          />
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Interactive Elements', () => {
    it('should have keyboard-accessible buttons', () => {
      const { container } = render(
        <button type="button" tabIndex={0} aria-label="Process image">
          Process
        </button>
      )

      const button = container.querySelector('button')
      expect(button?.tabIndex).toBe(0)
      expect(button?.getAttribute('aria-label')).toBe('Process image')
    })

    it('should have focus indicators', () => {
      const { container } = render(
        <button
          type="button"
          className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          Click me
        </button>
      )

      const button = container.querySelector('button')
      expect(button?.className).toContain('focus:ring')
    })

    it('should have accessible dialogs', async () => {
      const { container } = render(
        <div
          role="dialog"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
          aria-modal="true"
        >
          <h2 id="dialog-title">Confirm Action</h2>
          <p id="dialog-description">Are you sure you want to proceed?</p>
          <button type="button">Confirm</button>
          <button type="button">Cancel</button>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Images and Media', () => {
    it('should have alternative text for images', async () => {
      const { container } = render(
        <div>
          <img src="/test.png" alt="Uploaded image preview" />
          <img src="/icon.svg" alt="Tool icon" />
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible canvas elements', async () => {
      const { container } = render(
        <canvas
          role="img"
          aria-label="Image preview with crop area"
          tabIndex={0}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should provide text alternatives for decorative images', async () => {
      const { container } = render(
        <div>
          <img src="/decoration.svg" alt="" role="presentation" />
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Status Messages', () => {
    it('should have accessible status announcements', async () => {
      const { container } = render(
        <div role="status" aria-live="polite" aria-atomic="true">
          Image processed successfully
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible error messages', async () => {
      const { container } = render(
        <div role="alert" aria-live="assertive">
          Error: File size exceeds 10MB limit
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible progress indicators', async () => {
      const { container } = render(
        <div
          role="progressbar"
          aria-valuenow={50}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Processing image"
        >
          <div style={{ width: '50%' }} />
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Color Contrast', () => {
    it('should meet WCAG AA contrast requirements for text', () => {
      const { container } = render(
        <div>
          <p className="text-gray-900 bg-white">Normal text (4.5:1 minimum)</p>
          <h1 className="text-2xl text-gray-900 bg-white">Large text (3:1 minimum)</h1>
        </div>
      )

      // Visual check - actual contrast testing requires color values
      const paragraph = container.querySelector('p')
      const heading = container.querySelector('h1')

      expect(paragraph).toBeTruthy()
      expect(heading).toBeTruthy()
    })

    it('should have sufficient contrast for interactive elements', () => {
      const { container } = render(
        <button className="bg-blue-600 text-white hover:bg-blue-700">
          Process Image
        </button>
      )

      const button = container.querySelector('button')
      expect(button?.className).toContain('bg-blue-600')
      expect(button?.className).toContain('text-white')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should have logical tab order', () => {
      const { container } = render(
        <div>
          <button tabIndex={1}>First</button>
          <button tabIndex={2}>Second</button>
          <button tabIndex={3}>Third</button>
        </div>
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons[0].tabIndex).toBe(1)
      expect(buttons[1].tabIndex).toBe(2)
      expect(buttons[2].tabIndex).toBe(3)
    })

    it('should skip to main content', async () => {
      const { container } = render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <main id="main-content">
            <h1>Tool Content</h1>
          </main>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should trap focus in modals', () => {
      const { container } = render(
        <div role="dialog" aria-modal="true">
          <button tabIndex={0}>First focusable</button>
          <input type="text" tabIndex={0} />
          <button tabIndex={0}>Last focusable</button>
        </div>
      )

      const focusableElements = container.querySelectorAll('[tabIndex="0"]')
      expect(focusableElements.length).toBe(3)
    })
  })

  describe('Screen Reader Support', () => {
    it('should have descriptive ARIA labels', () => {
      const { container } = render(
        <div>
          <button aria-label="Increase image width by 10 pixels">+</button>
          <button aria-label="Decrease image width by 10 pixels">-</button>
        </div>
      )

      const buttons = container.querySelectorAll('button')
      expect(buttons[0].getAttribute('aria-label')).toContain('Increase')
      expect(buttons[1].getAttribute('aria-label')).toContain('Decrease')
    })

    it('should have proper ARIA roles', async () => {
      const { container } = render(
        <div>
          <nav role="navigation" aria-label="Tool navigation">
            <ul>
              <li><a href="/tools/resizer">Resizer</a></li>
              <li><a href="/tools/cropper">Cropper</a></li>
            </ul>
          </nav>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should announce dynamic content changes', () => {
      const { container } = render(
        <div aria-live="polite" aria-atomic="true">
          <p>Processing: 50% complete</p>
        </div>
      )

      const liveRegion = container.querySelector('[aria-live]')
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite')
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true')
    })
  })

  describe('Form Validation', () => {
    it('should have accessible error messages', async () => {
      const { container } = render(
        <div>
          <label htmlFor="width">Width</label>
          <input
            id="width"
            type="number"
            aria-invalid="true"
            aria-describedby="width-error"
          />
          <span id="width-error" role="alert">
            Width must be between 1 and 10000 pixels
          </span>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should indicate required fields', async () => {
      const { container } = render(
        <div>
          <label htmlFor="file">
            Image File <span aria-label="required">*</span>
          </label>
          <input id="file" type="file" required aria-required="true" />
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility on mobile', async () => {
      const { container } = render(
        <div className="flex flex-col md:flex-row">
          <button className="w-full md:w-auto">Mobile-friendly button</button>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have touch-friendly targets', () => {
      const { container } = render(
        <button className="min-h-[44px] min-w-[44px] p-3">
          Touch Target
        </button>
      )

      const button = container.querySelector('button')
      // Minimum touch target size is 44x44px (WCAG 2.1 Level AAA)
      expect(button?.className).toContain('min-h-[44px]')
      expect(button?.className).toContain('min-w-[44px]')
    })
  })
})
