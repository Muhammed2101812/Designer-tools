import { test, expect } from '@playwright/test'

test.describe('Email Sending E2E Tests', () => {
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

  test('should send welcome email after signup', async ({ page }) => {
    // This test would be run as part of the signup flow
    // For now, we'll test the email sending endpoint directly
    
    // Navigate to test email endpoint
    await page.goto('/api/test/welcome-email')
    
    // Should show success message
    await expect(page.getByText('Welcome email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for welcome email
    // 2. Verify email content and formatting
    // 3. Verify links in email work correctly
  })

  test('should send subscription confirmation email after upgrade', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/subscription-confirmation')
    
    // Should show success message
    await expect(page.getByText('Subscription confirmation email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for subscription confirmation email
    // 2. Verify email contains correct plan information
    // 3. Verify billing portal link works
  })

  test('should send quota warning email when approaching limit', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/quota-warning')
    
    // Should show success message
    await expect(page.getByText('Quota warning email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for quota warning email
    // 2. Verify email contains correct usage information
    // 3. Verify upgrade links work correctly
  })

  test('should send subscription cancellation email after downgrade', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/subscription-cancellation')
    
    // Should show success message
    await expect(page.getByText('Subscription cancellation email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for subscription cancellation email
    // 2. Verify email contains correct cancellation information
    // 3. Verify renewal options are presented
  })

  test('should respect user email preferences', async ({ page }) => {
    // Navigate to profile settings
    await page.goto('/profile')
    
    // Find email preferences section
    const emailPrefsSection = page.locator('[data-testid="email-preferences"]')
    await expect(emailPrefsSection).toBeVisible()
    
    // Check marketing emails toggle
    const marketingToggle = emailPrefsSection.getByRole('switch', { name: 'Marketing Emails' })
    await expect(marketingToggle).toBeVisible()
    
    // Toggle marketing emails off
    const isChecked = await marketingToggle.isChecked()
    if (isChecked) {
      await marketingToggle.click()
    }
    
    // Save preferences
    const saveButton = emailPrefsSection.getByRole('button', { name: 'Save Preferences' })
    await saveButton.click()
    
    // Should show success message
    await expect(page.getByText('Email preferences updated')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Trigger marketing email sending
    // 2. Verify email is not sent when preference is disabled
    // 3. Re-enable preference and verify emails are sent
  })

  test('should handle email sending failures gracefully', async ({ page }) => {
    // Navigate to test email endpoint with forced failure
    await page.goto('/api/test/email-failure')
    
    // Should show error message
    await expect(page.getByText('Failed to send email')).toBeVisible()
    
    // Should include error details
    await expect(page.getByText(/Error:/)).toBeVisible()
  })

  test('should send custom emails with correct content', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/custom-email')
    
    // Should show success message
    await expect(page.getByText('Custom email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for custom email
    // 2. Verify custom subject and content
    // 3. Verify HTML and text versions
  })

  test('should handle invalid email addresses gracefully', async ({ page }) => {
    // Navigate to test email endpoint with invalid address
    await page.goto('/api/test/invalid-email')
    
    // Should show validation error
    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should send emails with attachments when appropriate', async ({ page }) => {
    // Navigate to test email endpoint with attachment
    await page.goto('/api/test/email-with-attachment')
    
    // Should show success message
    await expect(page.getByText('Email with attachment sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox
    // 2. Verify attachment is included
    // 3. Verify attachment can be downloaded
  })

  test('should handle email rate limiting', async ({ page }) => {
    // Send multiple emails quickly
    for (let i = 0; i < 5; i++) {
      await page.goto('/api/test/welcome-email')
      
      // Should succeed for first few requests
      if (i < 3) {
        await expect(page.getByText('Welcome email sent successfully')).toBeVisible()
      }
    }
    
    // Fifth request might be rate limited
    // Should show rate limit error
    await expect(page.getByText(/rate limit/i)).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Clean up session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })
})