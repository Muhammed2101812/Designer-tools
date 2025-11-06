import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Resend
const mockSend = vi.fn()
const mockResend = {
  emails: {
    send: mockSend,
  },
}

vi.mock('resend', () => ({
  Resend: vi.fn(() => mockResend),
}))

// Mock environment
vi.mock('@/lib/env', () => ({
  env: {
    RESEND_API_KEY: 'test-api-key',
    EMAIL_FROM: 'test@designkit.com',
    NEXT_PUBLIC_APP_URL: 'https://designkit.com',
  },
}))

describe('Email Functions', () => {
  let emailClient: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Import after mocking to ensure mocked env is used
    emailClient = await import('../client')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const result = await emailClient.sendWelcomeEmail('test@example.com', 'John Doe')

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Welcome to Design Kit! 🎨',
        html: expect.stringContaining('Welcome, John Doe!'),
        text: expect.stringContaining('Welcome to Design Kit, John Doe!'),
      })
    })

    it('should handle welcome email without name', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const result = await emailClient.sendWelcomeEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Welcome to Design Kit! 🎨',
        html: expect.stringContaining('Welcome, test!'), // Uses email prefix as name
        text: expect.stringContaining('Welcome to Design Kit, test!'),
      })
    })

    it('should include correct content in welcome email', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendWelcomeEmail('test@example.com', 'John Doe')

      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html
      const textContent = call.text

      // Check HTML content
      expect(htmlContent).toContain('🎨 Design Kit')
      expect(htmlContent).toContain('Welcome, John Doe!')
      expect(htmlContent).toContain('10 daily API operations')
      expect(htmlContent).toContain('Privacy-First')
      expect(htmlContent).toContain('https://designkit.com/dashboard')

      // Check text content
      expect(textContent).toContain('Welcome to Design Kit, John Doe!')
      expect(textContent).toContain('10 daily API operations')
      expect(textContent).toContain('Privacy-First')
      expect(textContent).toContain('https://designkit.com/dashboard')
    })

    it('should handle email sending errors', async () => {
      mockSend.mockRejectedValue(new Error('Email service error'))

      const result = await emailClient.sendWelcomeEmail('test@example.com', 'John Doe')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service error')
    })
  })

  describe('sendSubscriptionConfirmation', () => {
    it('should send subscription confirmation successfully', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const result = await emailClient.sendSubscriptionConfirmation(
        'test@example.com',
        'John Doe',
        'premium',
        900
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Welcome to premium Plan! 🎉',
        html: expect.stringContaining('Welcome to premium Plan, John Doe!'),
        text: expect.stringContaining('Welcome to premium Plan, John Doe!'),
      })
    })

    it('should include correct plan features', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendSubscriptionConfirmation('test@example.com', 'John Doe', 'premium', 900)

      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('500 daily API operations')
      expect(htmlContent).toContain('50MB file size limit')
      expect(htmlContent).toContain('Batch processing (10 files)')
      expect(htmlContent).toContain('Priority support')
      expect(htmlContent).toContain('9.00/month')
    })

    it('should handle pro plan features', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendSubscriptionConfirmation('test@example.com', 'John Doe', 'pro', 2900)

      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('2000 daily API operations')
      expect(htmlContent).toContain('100MB file size limit')
      expect(htmlContent).toContain('Batch processing (50 files)')
      expect(htmlContent).toContain('REST API access')
      expect(htmlContent).toContain('Premium support')
      expect(htmlContent).toContain('29.00/month')
    })
  })

  describe('sendQuotaWarning', () => {
    it('should send quota warning successfully', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const result = await emailClient.sendQuotaWarning(
        'test@example.com',
        'John Doe',
        45,
        50,
        'free'
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: '⚠️ Quota Alert: 90% Used',
        html: expect.stringContaining('Quota Alert, John Doe!'),
        text: expect.stringContaining('Quota Alert, John Doe!'),
      })
    })

    it('should show correct usage information', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendQuotaWarning('test@example.com', 'John Doe', 45, 50, 'free')

      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('90% Used')
      expect(htmlContent).toContain('5') // remaining operations
      expect(htmlContent).toContain('operations remaining out of 50')
      expect(htmlContent).toContain('free plan')
      expect(htmlContent).toContain('Resets at midnight UTC')
    })

    it('should show upgrade options for free plan', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendQuotaWarning('test@example.com', 'John Doe', 9, 10, 'free')

      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('Need more operations?')
      expect(htmlContent).toContain('Upgrade to Premium')
      expect(htmlContent).toContain('https://designkit.com/pricing')
    })

    it('should show different message for premium users', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendQuotaWarning('test@example.com', 'John Doe', 450, 500, 'premium')

      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('consider upgrading to our Pro plan')
      expect(htmlContent).toContain('https://designkit.com/dashboard')
    })
  })

  describe('sendSubscriptionCancellation', () => {
    it('should send cancellation email successfully', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const endDate = '2024-12-31T23:59:59Z'
      const result = await emailClient.sendSubscriptionCancellation(
        'test@example.com',
        'John Doe',
        'premium',
        endDate
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Subscription Cancelled - We\'ll Miss You! 💙',
        html: expect.stringContaining('We\'ll Miss You, John Doe!'),
        text: expect.stringContaining('We\'ll Miss You, John Doe!'),
      })
    })

    it('should include correct cancellation information', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const endDate = '2024-12-31T23:59:59Z'
      await emailClient.sendSubscriptionCancellation('test@example.com', 'John Doe', 'premium', endDate)

      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('premium subscription has been cancelled')
      expect(htmlContent).toContain('Wednesday, January 1, 2025') // Actual formatted date
      expect(htmlContent).toContain('After this date, you\'ll be moved to our Free plan')
      expect(htmlContent).toContain('https://designkit.com/pricing')
    })
  })

  describe('sendCustomEmail', () => {
    it('should send custom email successfully', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const result = await emailClient.sendCustomEmail(
        'test@example.com',
        'Custom Subject',
        '<h1>Custom HTML Content</h1>',
        'Custom text content'
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Custom Subject',
        html: '<h1>Custom HTML Content</h1>',
        text: 'Custom text content',
      })
    })

    it('should generate text from HTML if not provided', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const result = await emailClient.sendCustomEmail(
        'test@example.com',
        'Custom Subject',
        '<h1>Custom HTML</h1><p>Some content</p>'
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Custom Subject',
        html: '<h1>Custom HTML</h1><p>Some content</p>',
        text: 'Custom HTMLSome content', // HTML tags stripped
      })
    })
  })

  describe('validateEmailConfig', () => {
    it('should validate email configuration', () => {
      const result = emailClient.validateEmailConfig()

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(typeof result.valid).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('Email Template Structure', () => {
    it('should include proper HTML structure', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendWelcomeEmail('test@example.com', 'John Doe')
      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('<html lang="en">')
      expect(htmlContent).toContain('<meta charset="UTF-8">')
      expect(htmlContent).toContain('<meta name="viewport"')
      expect(htmlContent).toContain('</html>')
    })

    it('should include proper CSS styling', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendWelcomeEmail('test@example.com', 'John Doe')
      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('<style>')
      expect(htmlContent).toContain('font-family:')
      expect(htmlContent).toContain('max-width: 600px')
      expect(htmlContent).toContain('margin: 0 auto')
      expect(htmlContent).toContain('</style>')
    })

    it('should include proper links', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendWelcomeEmail('test@example.com', 'John Doe')
      const call = mockSend.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('href="https://designkit.com/dashboard"')
      expect(htmlContent).toContain('href="https://designkit.com/pricing"')
      expect(htmlContent).toContain('href="https://designkit.com/faq"')
    })
  })

  describe('Error Handling', () => {
    it('should handle Resend API errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('API rate limit exceeded'))

      const result = await emailClient.sendWelcomeEmail('test@example.com', 'John Doe')

      expect(result.success).toBe(false)
      expect(result.error).toBe('API rate limit exceeded')
    })

    it('should handle network errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Network timeout'))

      const result = await emailClient.sendSubscriptionConfirmation(
        'test@example.com',
        'John Doe',
        'premium',
        900
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network timeout')
    })

    it('should handle invalid email addresses gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Invalid recipient email'))

      const result = await emailClient.sendQuotaWarning(
        'invalid-email',
        'John Doe',
        45,
        50,
        'free'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid recipient email')
    })
  })
})