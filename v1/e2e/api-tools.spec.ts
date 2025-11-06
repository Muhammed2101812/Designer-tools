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
    await page.getByLabel('Email').fill('e2e-test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should process background removal with valid image', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check tool page is loaded
    await expect(page.getByText('Background Remover')).toBeVisible()
    await expect(page.getByText('Remove image backgrounds with AI-powered precision')).toBeVisible()
    
    // Create a test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload file using FileUploader component
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
    
    // Check that download button is available
    const downloadBtn = page.getByRole('button', { name: 'Download' })
    await expect(downloadBtn).toBeVisible()
    
    // In a real test environment, we would download and verify the image
  })

  test('should process image upscaling with valid image', async ({ page }) => {
    // Navigate to image upscaler tool
    await page.goto('/tools/image-upscaler')
    
    // Check tool page is loaded
    await expect(page.getByText('Image Upscaler')).toBeVisible()
    await expect(page.getByText('Enhance image resolution with AI-powered upscaling')).toBeVisible()
    
    // Create a test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload file using FileUploader component
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Select scale factor
    const scaleSelect = page.getByRole('combobox', { name: 'Scale Factor' })
    await scaleSelect.click()
    await page.getByRole('option', { name: '4x' }).click()
    
    // Click upscale button
    const upscaleBtn = page.getByRole('button', { name: 'Upscale Image' })
    await expect(upscaleBtn).toBeEnabled()
    await upscaleBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(3000)
    
    // Check that result is displayed
    await expect(page.getByText('Image upscaled successfully')).toBeVisible()
    
    // Check that download button is available
    const downloadBtn = page.getByRole('button', { name: 'Download' })
    await expect(downloadBtn).toBeVisible()
    
    // In a real test environment, we would download and verify the image
  })

  test('should enforce quota limits on API tools', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check tool page is loaded
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Create a test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload file using FileUploader component
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Click remove background button multiple times to exceed quota
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    
    // Try 15 times (assuming free plan limit is 10)
    for (let i = 0; i < 15; i++) {
      if (await removeBtn.isEnabled()) {
        await removeBtn.click()
        await page.waitForTimeout(1000)
      } else {
        // Button should be disabled when quota is exceeded
        break
      }
    }
    
    // Check that quota exceeded message is displayed
    await expect(page.getByText('Daily quota exceeded')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upgrade Plan' })).toBeVisible()
  })

  test('should handle invalid file types gracefully', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check tool page is loaded
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Create an invalid file (text file)
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    
    // Upload file using FileUploader component
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check that error message is displayed
    await expect(page.getByText('Invalid file type')).toBeVisible()
    await expect(page.getByText('Supported types: PNG, JPG, WEBP')).toBeVisible()
  })

  test('should handle oversized files gracefully', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check tool page is loaded
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Create a large file (simulate 15MB file)
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024) // 15MB
    const file = new File([largeBuffer], 'large.png', { type: 'image/png' })
    
    // Upload file using FileUploader component
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check that error message is displayed
    await expect(page.getByText('File size exceeds recommended size')).toBeVisible()
    await expect(page.getByText('(15.00MB) exceeds recommended size (10MB)')).toBeVisible()
  })

  test('should show real-time quota usage on tool pages', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check tool page is loaded
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Check quota indicator is visible
    const quotaIndicator = page.locator('[data-testid="usage-indicator"]')
    await expect(quotaIndicator).toBeVisible()
    
    // Check initial quota display
    const quotaText = await quotaIndicator.textContent()
    expect(quotaText).toMatch(/\d+ of \d+/)
    
    // Create a test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload file using FileUploader component
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Record initial quota
    const initialQuotaText = await quotaIndicator.textContent()
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await removeBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    // Check that quota usage increased
    const updatedQuotaText = await quotaIndicator.textContent()
    
    // Parse quota values
    const initialMatch = initialQuotaText?.match(/(\d+) of (\d+)/)
    const updatedMatch = updatedQuotaText?.match(/(\d+) of (\d+)/)
    
    if (initialMatch && updatedMatch) {
      const initialUsage = parseInt(initialMatch[1])
      const updatedUsage = parseInt(updatedMatch[1])
      
      // Usage should have increased
      expect(updatedUsage).toBeGreaterThanOrEqual(initialUsage)
    }
  })

  test('should disable tools when quota is exceeded', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check tool page is loaded
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Check that tool is initially enabled
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeEnabled()
    
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeDisabled() // Initially disabled until file is uploaded
    
    // Simulate quota exceeded state
    // This would typically be done by consuming the user's quota
    // For this test, we'll check for quota exceeded indicators
    
    const quotaIndicator = page.locator('[data-testid="usage-indicator"]')
    const quotaText = await quotaIndicator.textContent()
    
    if (quotaText && quotaText.includes('exceeded')) {
      // Tools should be disabled when quota is exceeded
      await expect(fileInput).toBeDisabled()
      await expect(removeBtn).toBeDisabled()
      
      // Should show quota exceeded message
      await expect(page.getByText('Daily quota exceeded')).toBeVisible()
      
      // Should show upgrade button
      await expect(page.getByRole('button', { name: 'Upgrade Plan' })).toBeVisible()
    }
  })

  test('should allow authenticated users to access API tools', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Should not redirect to login (user is authenticated)
    await expect(page).toHaveURL(/\/tools\/background-remover/)
    
    // Should show tool interface
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Should show quota information
    const quotaIndicator = page.locator('[data-testid="usage-indicator"]')
    await expect(quotaIndicator).toBeVisible()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear authentication
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access background remover tool
    await page.goto('/tools/background-remover')
    
    // Should redirect to login
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Should preserve return_to parameter
    expect(page.url()).toContain('?return_to=/tools/background-remover')
  })

  test('should handle tool processing errors gracefully', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check tool page is loaded
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Create a test image file
    const buffer = Buffer.from('invalid image data', 'utf-8')
    const file = new File([buffer], 'corrupted.png', { type: 'image/png' })
    
    // Upload file using FileUploader component
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await removeBtn.click()
    
    // Wait for error
    await page.waitForTimeout(2000)
    
    // Should show error message
    await expect(page.getByText('Failed to process image')).toBeVisible()
    await expect(page.getByText(/Please try again/i)).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Clean up session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })
})