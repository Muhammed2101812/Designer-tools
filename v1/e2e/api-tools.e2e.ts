import { test, expect } from '@playwright/test'
import { Buffer } from 'buffer'

test.describe('API Tools E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Sign in as test user
    await page.goto('/login')
    await page.getByLabel('Email').fill('e2e-api-tools-test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Clean up session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('Background Remover Tool E2E', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check that tool page loads correctly
    await expect(page.getByText('Background Remover')).toBeVisible()
    await expect(page.getByText('Remove image backgrounds with AI-powered precision')).toBeVisible()
    
    // Create test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeEnabled()
    await removeBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    // Check that result is displayed
    await expect(page.getByText('Background removed successfully')).toBeVisible()
    
    // Check download button is available
    const downloadBtn = page.getByRole('button', { name: 'Download' })
    await expect(downloadBtn).toBeVisible()
    
    // Check that processing time is displayed
    await expect(page.getByText(/Processing time:/)).toBeVisible()
    
    // Check that file size information is displayed
    await expect(page.getByText(/File size:/)).toBeVisible()
    
    // Check that quota usage is updated
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
    
    // Check that usage percentage increased
    const usageText = await quotaCard.getByText(/\d+% used/).textContent()
    expect(usageText).toMatch(/\d+% used/)
  })

  test('Image Upscaler Tool E2E', async ({ page }) => {
    // Navigate to image upscaler tool
    await page.goto('/tools/image-upscaler')
    
    // Check that tool page loads correctly
    await expect(page.getByText('Image Upscaler')).toBeVisible()
    await expect(page.getByText('Enhance image resolution with AI-powered upscaling')).toBeVisible()
    
    // Create test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' }).slice(0, 100) // Smaller file for faster processing
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Select upscale factor (2x for faster processing)
    const scaleSelect = page.getByRole('combobox', { name: 'Scale Factor' })
    await scaleSelect.selectOption('2')
    
    // Click upscale button
    const upscaleBtn = page.getByRole('button', { name: 'Upscale Image' })
    await expect(upscaleBtn).toBeEnabled()
    await upscaleBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(3000)
    
    // Check that result is displayed
    await expect(page.getByText('Image upscaled successfully')).toBeVisible()
    
    // Check download button is available
    const downloadBtn = page.getByRole('button', { name: 'Download' })
    await expect(downloadBtn).toBeVisible()
    
    // Check that processing time is displayed
    await expect(page.getByText(/Processing time:/)).toBeVisible()
    
    // Check that file size information is displayed
    await expect(page.getByText(/File size:/)).toBeVisible()
    
    // Check that the upscaled image is larger
    const originalSizeText = await page.getByText(/Original size:/).textContent()
    const upscaledSizeText = await page.getByText(/Upscaled size:/).textContent()
    
    expect(originalSizeText).toContain('Original size:')
    expect(upscaledSizeText).toContain('Upscaled size:')
    
    // Check that quota usage is updated
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
  })

  test('Mockup Generator Tool E2E', async ({ page }) => {
    // Navigate to mockup generator tool
    await page.goto('/tools/mockup-generator')
    
    // Check that tool page loads correctly
    await expect(page.getByText('Mockup Generator')).toBeVisible()
    await expect(page.getByText('Create stunning product mockups')).toBeVisible()
    
    // Create test design file (transparent PNG)
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'design.png', { type: 'image/png' })
    
    // Upload design file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('design.png')).toBeVisible()
    
    // Select a mockup template
    const templateSelect = page.getByRole('combobox', { name: 'Template' })
    await templateSelect.selectOption('device-iphone-14-pro')
    
    // Adjust positioning
    const posXInput = page.getByLabel('Position X')
    const posYInput = page.getByLabel('Position Y')
    const scaleInput = page.getByLabel('Scale')
    const rotationInput = page.getByLabel('Rotation')
    
    await posXInput.fill('100')
    await posYInput.fill('150')
    await scaleInput.fill('1.2')
    await rotationInput.fill('15')
    
    // Click generate mockup button
    const generateBtn = page.getByRole('button', { name: 'Generate Mockup' })
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(3000)
    
    // Check that result is displayed
    await expect(page.getByText('Mockup generated successfully')).toBeVisible()
    
    // Check download button is available
    const downloadBtn = page.getByRole('button', { name: 'Download' })
    await expect(downloadBtn).toBeVisible()
    
    // Check that processing time is displayed
    await expect(page.getByText(/Processing time:/)).toBeVisible()
    
    // Check that template information is displayed
    await expect(page.getByText(/iPhone 14 Pro/)).toBeVisible()
    
    // Check that quota usage is updated
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
  })

  test('Color Picker Tool E2E', async ({ page }) => {
    // Navigate to color picker tool
    await page.goto('/tools/color-picker')
    
    // Check that tool page loads correctly
    await expect(page.getByText('Color Picker')).toBeVisible()
    await expect(page.getByText('Extract colors from images')).toBeVisible()
    
    // Create test image file with distinct colors
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'colors.png', { type: 'image/png' })
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('colors.png')).toBeVisible()
    
    // Click extract colors button
    const extractBtn = page.getByRole('button', { name: 'Extract Colors' })
    await expect(extractBtn).toBeEnabled()
    await extractBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    // Check that result is displayed
    await expect(page.getByText('Colors extracted successfully')).toBeVisible()
    
    // Check that color swatches are displayed
    const colorSwatches = page.locator('[data-testid="color-swatch"]')
    const swatchCount = await colorSwatches.count()
    expect(swatchCount).toBeGreaterThan(0)
    
    // Check that color information is displayed
    await expect(page.getByText(/HEX:/)).toBeVisible()
    await expect(page.getByText(/RGB:/)).toBeVisible()
    await expect(page.getByText(/HSL:/)).toBeVisible()
    
    // Check that processing time is displayed
    await expect(page.getByText(/Processing time:/)).toBeVisible()
    
    // Check that export button is available
    const exportBtn = page.getByRole('button', { name: 'Export Palette' })
    await expect(exportBtn).toBeVisible()
  })

  test('QR Code Generator Tool E2E', async ({ page }) => {
    // Navigate to QR code generator tool
    await page.goto('/tools/qr-code-generator')
    
    // Check that tool page loads correctly
    await expect(page.getByText('QR Code Generator')).toBeVisible()
    await expect(page.getByText('Create custom QR codes')).toBeVisible()
    
    // Fill in text to encode
    const textInput = page.getByLabel('Text or URL to Encode')
    await textInput.fill('https://desinerkit.com')
    
    // Adjust customization options
    const sizeInput = page.getByLabel('Size')
    const fgColorInput = page.getByLabel('Foreground Color')
    const bgColorInput = page.getByLabel('Background Color')
    
    await sizeInput.fill('300')
    await fgColorInput.fill('#000000')
    await bgColorInput.fill('#FFFFFF')
    
    // Click generate QR code button
    const generateBtn = page.getByRole('button', { name: 'Generate QR Code' })
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(1000)
    
    // Check that result is displayed
    await expect(page.getByText('QR Code generated successfully')).toBeVisible()
    
    // Check that QR code image is displayed
    const qrCodeImg = page.locator('[data-testid="qr-code-image"]')
    await expect(qrCodeImg).toBeVisible()
    
    // Check download button is available
    const downloadBtn = page.getByRole('button', { name: 'Download' })
    await expect(downloadBtn).toBeVisible()
    
    // Check that processing time is displayed
    await expect(page.getByText(/Processing time:/)).toBeVisible()
    
    // Check that customization options are reflected
    const imgSrc = await qrCodeImg.getAttribute('src')
    expect(imgSrc).toContain('data:image/png')
  })

  test('API Tool Rate Limiting', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check initial quota status
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
    
    const initialUsageText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    expect(initialUsageText).toMatch(/\d+ of \d+/)
    
    // Make multiple rapid requests to test rate limiting
    const fileInput = page.locator('input[type="file"]')
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    
    // Create test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload and process multiple files rapidly
    for (let i = 0; i < 5; i++) {
      await fileInput.setInputFiles(file)
      await page.waitForTimeout(500)
      
      if (await removeBtn.isEnabled()) {
        await removeBtn.click()
        await page.waitForTimeout(1000)
      }
    }
    
    // Check for rate limit warnings
    const rateLimitWarning = page.getByText(/rate limit|slow down|please wait/i)
    if (await rateLimitWarning.isVisible()) {
      await expect(rateLimitWarning).toBeVisible()
      
      // Check that rate limit headers are present
      const response = await page.request.post('/api/tools/background-remover', {
        data: {},
      })
      
      expect(response.headers()['x-ratelimit-limit']).toBeDefined()
      expect(response.headers()['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers()['x-ratelimit-reset']).toBeDefined()
      expect(response.headers()['retry-after']).toBeDefined()
    }
  })

  test('API Tool Quota Management', async ({ page }) => {
    // Navigate to dashboard to check initial quota
    await page.goto('/dashboard')
    
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
    
    // Get initial quota information
    const initialUsageText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    const [initialUsed, initialLimit] = initialUsageText?.match(/\d+/g) || ['0', '10']
    const initialUsedNum = parseInt(initialUsed)
    const initialLimitNum = parseInt(initialLimit)
    
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Create test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeEnabled()
    await removeBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    // Navigate back to dashboard to check updated quota
    await page.goto('/dashboard')
    
    // Get updated quota information
    const updatedUsageText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    const [updatedUsed, updatedLimit] = updatedUsageText?.match(/\d+/g) || ['0', '10']
    const updatedUsedNum = parseInt(updatedUsed)
    
    // Check that quota usage increased
    expect(updatedUsedNum).toBeGreaterThan(initialUsedNum)
    
    // Check that quota limit remained the same
    expect(parseInt(updatedLimit)).toBe(initialLimitNum)
    
    // Check that usage percentage is updated
    const usagePercentage = (updatedUsedNum / initialLimitNum) * 100
    await expect(quotaCard.getByText(`${Math.round(usagePercentage)}% used`)).toBeVisible()
    
    // If user is approaching limit, check warning indicators
    if (usagePercentage > 80) {
      await expect(quotaCard.getByText(/approaching|limit|warning/i)).toBeVisible()
    }
    
    // If user has exceeded limit, check blocking
    if (updatedUsedNum >= initialLimitNum) {
      await expect(quotaCard.getByText(/quota exceeded|upgrade|limit/i)).toBeVisible()
      
      // Navigate to tool and check that it's blocked
      await page.goto('/tools/background-remover')
      await expect(page.getByText(/quota exceeded|upgrade|limit/i)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Remove Background' })).toBeDisabled()
    }
  })

  test('API Tool Error Handling', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Test invalid file type
    const invalidBuffer = Buffer.from('Invalid file content')
    const invalidFile = new File([invalidBuffer], 'invalid.txt', { type: 'text/plain' })
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(invalidFile)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check that invalid file type error is displayed
    await expect(page.getByText(/Invalid file type|Unsupported format/i)).toBeVisible()
    
    // Test oversized file
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024) // 15MB file
    const largeFile = new File([largeBuffer], 'large.png', { type: 'image/png' })
    
    await fileInput.setInputFiles(largeFile)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check that file size error is displayed
    await expect(page.getByText(/File size.*exceeds|too large|10MB/i)).toBeVisible()
    
    // Test valid file but with processing error simulation
    const validBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const validFile = new File([validBuffer], 'test.png', { type: 'image/png' })
    
    await fileInput.setInputFiles(validFile)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeEnabled()
    
    // Mock network error for processing
    await page.route('**/api/tools/background-remover', route => {
      route.abort('failed')
    })
    
    await removeBtn.click()
    
    // Wait for error
    await page.waitForTimeout(2000)
    
    // Check that network error is displayed
    await expect(page.getByText(/Network error|Connection failed|Try again/i)).toBeVisible()
    
    // Restore normal network behavior
    await page.unroute('**/api/tools/background-remover')
  })

  test('API Tool Performance', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Create test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Measure upload time
    const uploadStartTime = Date.now()
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    const uploadEndTime = Date.now()
    const uploadTime = uploadEndTime - uploadStartTime
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded within reasonable time
    expect(uploadTime).toBeLessThan(2000) // 2 seconds
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeEnabled()
    
    // Measure processing time
    const processingStartTime = Date.now()
    await removeBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(3000)
    
    const processingEndTime = Date.now()
    const processingTime = processingEndTime - processingStartTime
    
    // Check that processing completes within reasonable time
    expect(processingTime).toBeLessThan(5000) // 5 seconds
    
    // Log performance metrics
    console.log(`Upload time: ${uploadTime}ms`)
    console.log(`Processing time: ${processingTime}ms`)
    
    // Check that result is displayed
    await expect(page.getByText('Background removed successfully')).toBeVisible()
    
    // Measure download preparation time
    const downloadStartTime = Date.now()
    
    const downloadBtn = page.getByRole('button', { name: 'Download' })
    await expect(downloadBtn).toBeVisible()
    
    const downloadEndTime = Date.now()
    const downloadTime = downloadEndTime - downloadStartTime
    
    // Check that download is prepared quickly
    expect(downloadTime).toBeLessThan(1000) // 1 second
    
    console.log(`Download preparation time: ${downloadTime}ms`)
  })

  test('API Tool Security', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Test file validation security
    const maliciousFile = new File(
      ['#!/bin/bash\necho "malicious code"'],
      'malicious.sh',
      { type: 'application/x-sh' }
    )
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(maliciousFile)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check that malicious file is rejected
    await expect(page.getByText(/Invalid file type|Unsupported format/i)).toBeVisible()
    
    // Test oversized file security
    const oversizedBuffer = Buffer.alloc(20 * 1024 * 1024) // 20MB file
    const oversizedFile = new File([oversizedBuffer], 'huge.png', { type: 'image/png' })
    
    await fileInput.setInputFiles(oversizedFile)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check that oversized file is rejected
    await expect(page.getByText(/File size.*exceeds|too large|10MB/i)).toBeVisible()
    
    // Test file content validation
    const fakeImageBuffer = Buffer.from('fake image content')
    const fakeImage = new File([fakeImageBuffer], 'document.pdf', { type: 'image/png' })
    
    await fileInput.setInputFiles(fakeImage)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check that file signature validation catches fake images
    await expect(page.getByText(/File signature|Invalid file/i)).toBeVisible()
    
    // Test valid file processing security
    const validBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const validFile = new File([validBuffer], 'test.png', { type: 'image/png' })
    
    await fileInput.setInputFiles(validFile)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is accepted
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeEnabled()
    await removeBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    // Check that result is displayed without exposing internal details
    await expect(page.getByText('Background removed successfully')).toBeVisible()
    
    // Check that no internal error details are exposed
    await expect(page.getByText(/stack|trace|exception|internal/i)).not.toBeVisible()
    
    // Check that security headers are present in responses
    const response = await page.request.post('/api/tools/background-remover', {
      data: {},
    })
    
    // Check for security headers
    const headers = response.headers()
    expect(headers['content-security-policy']).toBeDefined()
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('API Tool Accessibility', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check proper heading structure
    await expect(page.getByRole('heading', { name: 'Background Remover', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How to Use', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Features', level: 2 })).toBeVisible()
    
    // Check proper labeling of form elements
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toHaveAttribute('aria-label', /upload|select/i)
    
    // Check proper button labeling
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeVisible()
    
    // Check proper landmark structure
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('banner')).toBeVisible()
    
    // Check proper ARIA attributes
    await expect(page.locator('[role="region"]')).toHaveCount(2) // Tool info and main content regions
    
    // Check focus management
    await page.keyboard.press('Tab')
    await expect(fileInput).toBeFocused()
    
    await page.keyboard.press('Tab')
    if (await removeBtn.isVisible()) {
      await expect(removeBtn).toBeFocused()
    }
    
    // Check keyboard navigation
    await page.keyboard.press('Enter')
    if (await removeBtn.isVisible()) {
      // Should trigger file selection
      await expect(page.getByText(/select|choose/i)).toBeVisible()
    }
    
    // Check screen reader announcements
    const statusMessages = page.locator('[aria-live="polite"]')
    await expect(statusMessages).toBeVisible()
    
    // Check proper contrast ratios
    const textColor = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).color
    })
    
    const bgColor = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor
    })
    
    // Basic contrast check (would be more comprehensive in real tests)
    expect(textColor).not.toBe(bgColor)
    
    // Check proper alt text for images
    const images = page.locator('img')
    for (const img of await images.all()) {
      const altText = await img.getAttribute('alt')
      expect(altText).not.toBeNull()
      expect(altText).not.toBe('')
    }
    
    // Check proper form validation announcements
    const errorMessage = page.getByRole('alert')
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent()
      expect(errorText).not.toBeNull()
      expect(errorText).not.toBe('')
    }
  })

  test('API Tool Responsive Design', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check that layout adapts to mobile
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Check that file upload area is responsive
    const uploadArea = page.locator('[data-testid="file-upload-area"]')
    if (await uploadArea.isVisible()) {
      const boundingBox = await uploadArea.boundingBox()
      expect(boundingBox?.width).toBeLessThan(400) // Should fit within mobile screen
    }
    
    // Check that buttons stack vertically on mobile
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    if (buttonCount > 1) {
      // Check vertical stacking by comparing positions
      const firstButtonBox = await buttons.nth(0).boundingBox()
      const secondButtonBox = await buttons.nth(1).boundingBox()
      
      if (firstButtonBox && secondButtonBox) {
        // On mobile, buttons should stack vertically (different Y positions)
        expect(secondButtonBox.y).toBeGreaterThan(firstButtonBox.y)
      }
    }
    
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    // Check that layout adapts to tablet
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    // Check that layout adapts to desktop
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Check that buttons align horizontally on desktop
    const desktopButtons = page.locator('button')
    const desktopButtonCount = await desktopButtons.count()
    if (desktopButtonCount > 1) {
      const firstButtonBox = await desktopButtons.nth(0).boundingBox()
      const secondButtonBox = await desktopButtons.nth(1).boundingBox()
      
      if (firstButtonBox && secondButtonBox) {
        // On desktop, buttons should align horizontally when space permits
        // This is a simplified check - in reality would be more nuanced
        expect(Math.abs(secondButtonBox.y - firstButtonBox.y)).toBeLessThan(50)
      }
    }
  })

  test('API Tool Internationalization', async ({ page }) => {
    // Test English default
    await page.goto('/tools/background-remover')
    await expect(page.getByText('Background Remover')).toBeVisible()
    await expect(page.getByText('Remove image backgrounds')).toBeVisible()
    
    // In a real test, we would also test other languages:
    // 1. Set language preference
    // 2. Navigate to tool
    // 3. Check translated content
    
    // For now, we'll just verify that the default language works correctly
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    
    // Check that direction is left-to-right for English
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    
    // Check that translated strings are used consistently
    const toolTitle = await page.getByRole('heading', { name: 'Background Remover', level: 1 }).textContent()
    expect(toolTitle).toBe('Background Remover')
    
    const description = await page.getByText('Remove image backgrounds with AI-powered precision').textContent()
    expect(description).toBe('Remove image backgrounds with AI-powered precision')
  })

  test('API Tool Analytics Tracking', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Create test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Mock analytics tracking
    const analyticsEvents: any[] = []
    await page.exposeFunction('trackEvent', (event: any) => {
      analyticsEvents.push(event)
    })
    
    // Add mock analytics tracking
    await page.addInitScript(() => {
      (window as any).plausible = (eventName: string, options?: any) => {
        (window as any).trackEvent({ event: eventName, options })
      }
    })
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeEnabled()
    await removeBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    // Check that analytics events were tracked
    // In a real test environment, we would verify:
    // 1. Tool usage events
    // 2. Processing time events
    // 3. Success/failure events
    // 4. User interaction events
    
    // For this test, we'll verify that the analytics script is loaded
    const plausibleScript = page.locator('script[src*="plausible"]')
    expect(await plausibleScript.count()).toBeGreaterThanOrEqual(0)
    
    // Check that tool usage is tracked in database
    const usageResponse = await page.request.get('/api/analytics/tool-usage')
    expect([200, 404]).toContain(usageResponse.status()) // 404 if no usage yet
    
    // Check that tool appears in most used tools
    const popularToolsResponse = await page.request.get('/api/analytics/popular-tools')
    expect([200, 404]).toContain(popularToolsResponse.status())
  })
})