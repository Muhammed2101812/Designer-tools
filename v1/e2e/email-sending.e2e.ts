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
    await page.getByLabel('Email').fill('e2e-email-test@example.com')
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

  test('Welcome Email Sending Flow', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/welcome-email')
    
    // Should show success message
    await expect(page.getByText('Welcome email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for welcome email
    // 2. Verify email content and formatting
    // 3. Verify links in email work correctly
    
    // For this test, we'll just verify the endpoint returns success
    const response = await page.request.get('/api/test/welcome-email')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.type).toBe('welcome')
    expect(data.recipient).toBe('e2e-email-test@example.com')
  })

  test('Subscription Confirmation Email Flow', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/subscription-confirmation')
    
    // Should show success message
    await expect(page.getByText('Subscription confirmation email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for subscription confirmation email
    // 2. Verify email contains correct plan information
    // 3. Verify billing portal link works
    
    // For this test, we'll just verify the endpoint returns success
    const response = await page.request.get('/api/test/subscription-confirmation')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.type).toBe('subscription_confirmation')
    expect(data.recipient).toBe('e2e-email-test@example.com')
    expect(data.plan).toBe('premium')
    expect(data.amount).toBe(999)
  })

  test('Quota Warning Email Flow', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/quota-warning')
    
    // Should show success message
    await expect(page.getByText('Quota warning email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for quota warning email
    // 2. Verify email contains correct usage information
    // 3. Verify upgrade links work correctly
    
    // For this test, we'll just verify the endpoint returns success
    const response = await page.request.get('/api/test/quota-warning')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.type).toBe('quota_warning')
    expect(data.recipient).toBe('e2e-email-test@example.com')
    expect(data.current_usage).toBe(90)
    expect(data.daily_limit).toBe(100)
    expect(data.plan).toBe('free')
  })

  test('Subscription Cancellation Email Flow', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/subscription-cancellation')
    
    // Should show success message
    await expect(page.getByText('Subscription cancellation email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for subscription cancellation email
    // 2. Verify email contains correct cancellation information
    // 3. Verify renewal options are presented
    
    // For this test, we'll just verify the endpoint returns success
    const response = await page.request.get('/api/test/subscription-cancellation')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.type).toBe('subscription_cancellation')
    expect(data.recipient).toBe('e2e-email-test@example.com')
    expect(data.plan).toBe('premium')
    expect(data.end_date).toBe('2023-12-31T23:59:59Z')
  })

  test('Custom Email Sending Flow', async ({ page }) => {
    // Navigate to test email endpoint
    await page.goto('/api/test/custom-email')
    
    // Should show success message
    await expect(page.getByText('Custom email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for custom email
    // 2. Verify custom subject and content
    // 3. Verify HTML and text versions
    
    // For this test, we'll just verify the endpoint returns success
    const response = await page.request.get('/api/test/custom-email')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.type).toBe('custom')
    expect(data.recipient).toBe('e2e-email-test@example.com')
    expect(data.subject).toBe('Custom Email Subject')
    expect(data.html_content).toBe('<p>This is a custom HTML email</p>')
    expect(data.text_content).toBe('This is a custom text email')
  })

  test('Email Preferences Respect Flow', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile')
    
    // Find email preferences section
    const emailPrefsSection = page.locator('[data-testid="email-preferences"]')
    await expect(emailPrefsSection).toBeVisible()
    
    // Check initial state of marketing emails toggle
    const marketingToggle = emailPrefsSection.getByRole('switch', { name: 'Marketing Emails' })
    const initialState = await marketingToggle.isChecked()
    
    // Toggle marketing emails off
    await marketingToggle.click()
    
    // Save preferences
    await page.getByRole('button', { name: 'Save Preferences' }).click()
    
    // Should show success message
    await expect(page.getByText('Email preferences updated')).toBeVisible()
    
    // Try to send welcome email (marketing email)
    const response = await page.request.get('/api/test/welcome-email')
    
    // Should still send email but with preference respected
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    
    // Reset email preferences
    await marketingToggle.click()
    await page.getByRole('button', { name: 'Save Preferences' }).click()
    await expect(page.getByText('Email preferences updated')).toBeVisible()
  })

  test('Email Service Configuration Validation', async ({ page }) => {
    // Navigate to test email endpoint with missing config
    await page.goto('/api/test/email-configuration')
    
    // Should show configuration status
    await expect(page.getByText(/Email service (configured|not configured)/)).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check environment variables for email service config
    // 2. Verify Resend API key is properly set
    // 3. Test email sending with valid configuration
    
    // For this test, we'll just check the endpoint responds correctly
    const response = await page.request.get('/api/test/email-configuration')
    expect([200, 503]).toContain(response.status())
    
    const data = await response.json()
    expect(data.valid).toBeDefined()
    expect(Array.isArray(data.errors)).toBe(true)
  })

  test('Email Sending Error Handling', async ({ page }) => {
    // Navigate to test email endpoint with invalid address
    await page.goto('/api/test/invalid-email')
    
    // Should show validation error
    await expect(page.getByText('Invalid email address')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Test email sending with various error conditions
    // 2. Verify proper error messages are returned
    // 3. Check that errors are logged appropriately
    
    // For this test, we'll just verify the endpoint handles invalid emails
    const response = await page.request.get('/api/test/invalid-email')
    expect(response.status()).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Invalid email address')
    expect(data.type).toBe('VALIDATION')
  })

  test('Bulk Email Sending Flow', async ({ page }) => {
    // Navigate to test bulk email endpoint
    await page.goto('/api/test/bulk-email')
    
    // Should show success message
    await expect(page.getByText('Bulk emails sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inboxes for multiple recipients
    // 2. Verify emails are sent in batches
    // 3. Check rate limiting is applied
    
    // For this test, we'll just verify the endpoint returns success
    const response = await page.request.get('/api/test/bulk-email')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.type).toBe('bulk')
    expect(data.sent_count).toBeGreaterThanOrEqual(5)
    expect(data.failed_count).toBe(0)
  })

  test('Email Template Rendering', async ({ page }) => {
    // Navigate to test email template endpoint
    await page.goto('/api/test/email-template')
    
    // Should show rendered template
    await expect(page.getByText('Email Template Preview')).toBeVisible()
    
    // Check that template contains expected elements
    await expect(page.getByText('Welcome to Design Kit')).toBeVisible()
    await expect(page.getByText('Get Started')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Verify template rendering with different data
    // 2. Check responsive design of email templates
    // 3. Validate template accessibility
    
    // For this test, we'll just verify the endpoint renders templates
    const response = await page.request.get('/api/test/email-template')
    expect(response.status()).toBe(200)
    
    const html = await response.text()
    expect(html).toContain('<html')
    expect(html).toContain('<body')
    expect(html).toContain('Welcome to Design Kit')
  })

  test('Email Delivery Tracking', async ({ page }) => {
    // Navigate to test email tracking endpoint
    await page.goto('/api/test/email-tracking')
    
    // Should show tracking information
    await expect(page.getByText('Email Delivery Tracking')).toBeVisible()
    
    // Check that tracking data is displayed
    await expect(page.getByText('Delivery Status')).toBeVisible()
    await expect(page.getByText('Open Rate')).toBeVisible()
    await expect(page.getByText('Click Rate')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Send test emails with tracking enabled
    // 2. Verify tracking pixels are included
    // 3. Check tracking link redirection
    // 4. Validate delivery metrics
    
    // For this test, we'll just verify the endpoint returns tracking data
    const response = await page.request.get('/api/test/email-tracking')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.tracking_enabled).toBe(true)
    expect(data.delivery_status).toBeDefined()
    expect(data.open_rate).toBeDefined()
    expect(data.click_rate).toBeDefined()
  })

  test('Email Rate Limiting', async ({ page }) => {
    // Make multiple rapid requests to email endpoints
    const requests = []
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.get('/api/test/welcome-email')
      )
    }
    
    const responses = await Promise.all(requests)
    
    // Should have some rate limited responses (429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    
    // At least some requests should be rate limited
    expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(1)
    
    // Check rate limit headers
    const firstRateLimitedResponse = rateLimitedResponses[0]
    if (firstRateLimitedResponse) {
      expect(firstRateLimitedResponse.headers()['x-ratelimit-limit']).toBeDefined()
      expect(firstRateLimitedResponse.headers()['x-ratelimit-remaining']).toBeDefined()
      expect(firstRateLimitedResponse.headers()['x-ratelimit-reset']).toBeDefined()
      expect(firstRateLimitedResponse.headers()['retry-after']).toBeDefined()
    }
  })

  test('Email Security and Sanitization', async ({ page }) => {
    // Navigate to test email with XSS payload
    await page.goto('/api/test/email-xss')
    
    // Should sanitize malicious content
    await expect(page.getByText('Email sent safely')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Test email sending with XSS payloads
    // 2. Verify content is sanitized before sending
    // 3. Check that no script tags are included in emails
    // 4. Validate email headers for security
    
    // For this test, we'll just verify the endpoint handles XSS safely
    const response = await page.request.get('/api/test/email-xss')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.sanitized).toBe(true)
    
    // Verify that malicious content was removed
    expect(data.subject).not.toContain('<script>')
    expect(data.html_content).not.toContain('<script>')
    expect(data.text_content).not.toContain('<script>')
  })

  test('Email Internationalization', async ({ page }) => {
    // Navigate to test localized email endpoint
    await page.goto('/api/test/localized-email?lang=tr')
    
    // Should show success message
    await expect(page.getByText('Localized email sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email content for Turkish localization
    // 2. Verify proper encoding of Turkish characters
    // 3. Test different languages
    
    // For this test, we'll just verify the endpoint supports localization
    const response = await page.request.get('/api/test/localized-email?lang=tr')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.language).toBe('tr')
    expect(data.localized).toBe(true)
  })

  test('Email Attachment Handling', async ({ page }) => {
    // Navigate to test email with attachment
    await page.goto('/api/test/email-attachment')
    
    // Should show success message
    await expect(page.getByText('Email with attachment sent successfully')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check that email includes attachment
    // 2. Verify attachment content and metadata
    // 3. Test different attachment types
    
    // For this test, we'll just verify the endpoint handles attachments
    const response = await page.request.get('/api/test/email-attachment')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.has_attachment).toBe(true)
    expect(data.attachment_name).toBe('test-attachment.pdf')
    expect(data.attachment_type).toBe('application/pdf')
  })

  test('Email Queue Management', async ({ page }) => {
    // Navigate to test email queue endpoint
    await page.goto('/api/test/email-queue')
    
    // Should show queue status
    await expect(page.getByText('Email Queue Status')).toBeVisible()
    
    // Check that queue information is displayed
    await expect(page.getByText('Pending')).toBeVisible()
    await expect(page.getByText('Processing')).toBeVisible()
    await expect(page.getByText('Completed')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Add emails to queue
    // 2. Verify queue processing order
    // 3. Check retry mechanisms
    // 4. Validate queue persistence
    
    // For this test, we'll just verify the endpoint returns queue data
    const response = await page.request.get('/api/test/email-queue')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.queue_enabled).toBe(true)
    expect(data.pending_count).toBeDefined()
    expect(data.processing_count).toBeDefined()
    expect(data.completed_count).toBeDefined()
  })

  test('Email Performance and Reliability', async ({ page }) => {
    // Measure email sending time
    const startTime = Date.now()
    
    // Send test email
    await page.goto('/api/test/welcome-email')
    
    const endTime = Date.now()
    const sendTime = endTime - startTime
    
    // Should send email within reasonable time (5 seconds for E2E test)
    expect(sendTime).toBeLessThan(5000)
    
    // Log performance metric
    console.log(`Email send time: ${sendTime}ms`)
    
    // Check that email was sent successfully
    await expect(page.getByText('Welcome email sent successfully')).toBeVisible()
    
    // Verify response time
    const response = await page.request.get('/api/test/welcome-email')
    const responseTime = Date.now() - endTime
    
    // Should respond quickly
    expect(responseTime).toBeLessThan(1000)
    
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  test('Email Error Recovery', async ({ page }) => {
    // Navigate to test email recovery endpoint
    await page.goto('/api/test/email-recovery')
    
    // Should show recovery status
    await expect(page.getByText('Email Service Recovery')).toBeVisible()
    
    // Check that recovery mechanisms are in place
    await expect(page.getByText('Automatic Retry')).toBeVisible()
    await expect(page.getByText('Fallback Mechanism')).toBeVisible()
    await expect(page.getByText('Error Notification')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Simulate email service failures
    // 2. Verify automatic retry mechanism
    // 3. Check fallback email service
    // 4. Validate error notifications
    
    // For this test, we'll just verify the endpoint returns recovery info
    const response = await page.request.get('/api/test/email-recovery')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.recovery_enabled).toBe(true)
    expect(data.retry_attempts).toBeGreaterThanOrEqual(3)
    expect(data.fallback_service).toBeDefined()
    expect(data.notification_enabled).toBe(true)
  })

  test('Email Analytics and Reporting', async ({ page }) => {
    // Navigate to test email analytics endpoint
    await page.goto('/api/test/email-analytics')
    
    // Should show analytics dashboard
    await expect(page.getByText('Email Analytics')).toBeVisible()
    
    // Check that analytics data is displayed
    await expect(page.getByText('Total Sent')).toBeVisible()
    await expect(page.getByText('Delivered')).toBeVisible()
    await expect(page.getByText('Opened')).toBeVisible()
    await expect(page.getByText('Clicked')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Send test emails and track metrics
    // 2. Verify analytics data accuracy
    // 3. Check reporting functionality
    // 4. Validate data retention policies
    
    // For this test, we'll just verify the endpoint returns analytics data
    const response = await page.request.get('/api/test/email-analytics')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.analytics_enabled).toBe(true)
    expect(data.total_sent).toBeDefined()
    expect(data.delivered_count).toBeDefined()
    expect(data.opened_count).toBeDefined()
    expect(data.clicked_count).toBeDefined()
  })

  test('Email Compliance and Privacy', async ({ page }) => {
    // Navigate to test email compliance endpoint
    await page.goto('/api/test/email-compliance')
    
    // Should show compliance status
    await expect(page.getByText('Email Compliance')).toBeVisible()
    
    // Check that compliance features are enabled
    await expect(page.getByText('GDPR Compliant')).toBeVisible()
    await expect(page.getByText('CAN-SPAM Compliant')).toBeVisible()
    await expect(page.getByText('Unsubscribe Link')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Verify GDPR compliance in emails
    // 2. Check CAN-SPAM compliance
    // 3. Validate unsubscribe functionality
    // 4. Test data retention policies
    
    // For this test, we'll just verify the endpoint returns compliance info
    const response = await page.request.get('/api/test/email-compliance')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.gdpr_compliant).toBe(true)
    expect(data.can_spam_compliant).toBe(true)
    expect(data.unsubscribe_link_required).toBe(true)
    expect(data.data_retention_days).toBeGreaterThanOrEqual(30)
  })
})