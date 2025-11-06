import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendWelcomeEmail } from '../client'
import { sendWelcomeEmail } from '../client'
import { sendWelcomeEmail } from '../client'
import { sendSubscriptionConfirmation } from '../client'
import { sendWelcomeEmail } from '../client'
import { validateEmailConfig } from '../client'
import { validateEmailConfig } from '../client'
import { validateEmailConfig } from '../client'
import { validateEmailConfig } from '../client'
import { sendCustomEmail } from '../client'
import { sendCustomEmail } from '../client'
import { sendCustomEmail } from '../client'
import { sendSubscriptionCancellation } from '../client'
import { sendSubscriptionCancellation } from '../client'
import { sendSubscriptionCancellation } from '../client'
import { sendSubscriptionCancellation } from '../client'
import { sendQuotaWarning } from '../client'
import { sendQuotaWarning } from '../client'
import { sendQuotaWarning } from '../client'
import { sendQuotaWarning } from '../client'
import { sendQuotaWarning } from '../client'
import { sendQuotaWarning } from '../client'
import { sendSubscriptionConfirmation } from '../client'
import { sendSubscriptionConfirmation } from '../client'
import { sendSubscriptionConfirmation } from '../client'
import { sendSubscriptionConfirmation } from '../client'
import { sendWelcomeEmail } from '../client'
import { sendWelcomeEmail } from '../client'
import { sendWelcomeEmail } from '../client'

// Mock Resend
const mockResend = {
  emails: {
    send: vi.fn(),
  },
}

vi.mock('resend', () => ({
  Resend: vi.fn(() => mockResend),
}))

// Mock environment module
vi.mock('@/lib/env', () => ({
  env: {
    RESEND_API_KEY: 'test-api-key',
    EMAIL_FROM: 'test@designkit.com',
    NEXT_PUBLIC_APP_URL: 'https://designkit.com',
  },
}))

// Import after mocking
let emailFunctions: any

beforeEach(async () => {
  vi.clearAllMocks()
  
  // Re-import the module to get fresh instances with mocked env
  emailFunctions = await import('../client')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Email Templates', () => {
  describe('Welcome Email', () => {
    it('should send welcome email with correct parameters', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const result = await emailFunctions.sendWelcomeEmail('test@example.com', 'John Doe')

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Welcome to Design Kit! 🎨',
        html: expect.stringContaining('Welcome, John Doe!'),
        text: expect.stringContaining('Welcome to Design Kit, John Doe!'),
      })
    })

    it('should handle welcome email without name', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const result = await emailFunctions.sendWelcomeEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Welcome to Design Kit! 🎨',
        html: expect.stringContaining('Welcome!'),
        text: expect.stringContaining('Welcome to Design Kit!'),
      })
    })

    it('should include correct content in welcome email template', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendWelcomeEmail('test@example.com', 'John Doe')

      const call = mockResend.emails.send.mock.calls[0][0]
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

    it('should handle email sending errors gracefully', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Email service error'))

      const result = await sendWelcomeEmail('test@example.com', 'John Doe')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service error')
    })

    it('should skip sending when API key is not configured', async () => {
      process.env.RESEND_API_KEY = ''

      const result = await sendWelcomeEmail('test@example.com', 'John Doe')

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).not.toHaveBeenCalled()
    })
  })

  describe('Subscription Confirmation Email', () => {
    it('should send subscription confirmation with correct parameters', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const result = await sendSubscriptionConfirmation(
        'test@example.com',
        'John Doe',
        'premium',
        900
      )

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Welcome to premium Plan! 🎉',
        html: expect.stringContaining('Welcome to premium Plan, John Doe!'),
        text: expect.stringContaining('Welcome to premium Plan, John Doe!'),
      })
    })

    it('should include correct plan features in template', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendSubscriptionConfirmation('test@example.com', 'John Doe', 'premium', 900)

      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html
      const textContent = call.text

      // Check premium plan features
      expect(htmlContent).toContain('500 daily API operations')
      expect(htmlContent).toContain('50MB file size limit')
      expect(htmlContent).toContain('Batch processing (10 files)')
      expect(htmlContent).toContain('Priority support')
      expect(htmlContent).toContain('9.00/month')

      // Check text content
      expect(textContent).toContain('premium Plan - 9.00/month')
    })

    it('should handle pro plan features correctly', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendSubscriptionConfirmation('test@example.com', 'John Doe', 'pro', 2900)

      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html

      // Check pro plan features
      expect(htmlContent).toContain('2000 daily API operations')
      expect(htmlContent).toContain('100MB file size limit')
      expect(htmlContent).toContain('Batch processing (50 files)')
      expect(htmlContent).toContain('REST API access')
      expect(htmlContent).toContain('Premium support')
      expect(htmlContent).toContain('29.00/month')
    })

    it('should handle subscription confirmation errors', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Service unavailable'))

      const result = await sendSubscriptionConfirmation(
        'test@example.com',
        'John Doe',
        'premium',
        900
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Service unavailable')
    })
  })

  describe('Quota Warning Email', () => {
    it('should send quota warning with correct parameters', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const result = await sendQuotaWarning(
        'test@example.com',
        'John Doe',
        45,
        50,
        'free'
      )

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: '⚠️ Quota Alert: 90% Used',
        html: expect.stringContaining('Quota Alert, John Doe!'),
        text: expect.stringContaining('Quota Alert, John Doe!'),
      })
    })

    it('should show correct usage information in template', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendQuotaWarning('test@example.com', 'John Doe', 45, 50, 'free')

      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html
      const textContent = call.text

      // Check usage information
      expect(htmlContent).toContain('90% Used')
      expect(htmlContent).toContain('5') // remaining operations
      expect(htmlContent).toContain('operations remaining out of 50')
      expect(htmlContent).toContain('free plan')
      expect(htmlContent).toContain('Resets at midnight UTC')

      // Check text content
      expect(textContent).toContain('90% Used')
      expect(textContent).toContain('5 operations remaining out of 50')
    })

    it('should show upgrade options for free plan users', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendQuotaWarning('test@example.com', 'John Doe', 9, 10, 'free')

      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('Need more operations?')
      expect(htmlContent).toContain('Upgrade to Premium')
      expect(htmlContent).toContain('https://designkit.com/pricing')
    })

    it('should show different message for premium users', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendQuotaWarning('test@example.com', 'John Doe', 450, 500, 'premium')

      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('consider upgrading to our Pro plan')
      expect(htmlContent).toContain('https://designkit.com/dashboard')
    })

    it('should use different colors for different usage levels', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      // Test high usage (>90%)
      await sendQuotaWarning('test@example.com', 'John Doe', 95, 100, 'free')
      let call = mockResend.emails.send.mock.calls[0][0]
      expect(call.html).toContain('#ef4444') // Red color

      vi.clearAllMocks()
      mockResend.emails.send.mockResolvedValue({ id: 'email-124' })

      // Test medium usage (80-90%)
      await sendQuotaWarning('test@example.com', 'John Doe', 85, 100, 'free')
      call = mockResend.emails.send.mock.calls[0][0]
      expect(call.html).toContain('#f59e0b') // Yellow color
    })
  })

  describe('Subscription Cancellation Email', () => {
    it('should send cancellation email with correct parameters', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const endDate = '2024-12-31T23:59:59Z'
      const result = await sendSubscriptionCancellation(
        'test@example.com',
        'John Doe',
        'premium',
        endDate
      )

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Subscription Cancelled - We\'ll Miss You! 💙',
        html: expect.stringContaining('We\'ll Miss You, John Doe!'),
        text: expect.stringContaining('We\'ll Miss You, John Doe!'),
      })
    })

    it('should include correct cancellation information', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const endDate = '2024-12-31T23:59:59Z'
      await sendSubscriptionCancellation('test@example.com', 'John Doe', 'premium', endDate)

      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html
      const textContent = call.text

      // Check cancellation information
      expect(htmlContent).toContain('premium subscription has been cancelled')
      expect(htmlContent).toContain('Monday, December 31, 2024') // Formatted date
      expect(htmlContent).toContain('After this date, you\'ll be moved to our Free plan')
      expect(htmlContent).toContain('https://designkit.com/pricing')

      // Check text content
      expect(textContent).toContain('premium subscription has been cancelled')
      expect(textContent).toContain('Monday, December 31, 2024')
    })

    it('should list benefits that continue until end date', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const endDate = '2024-12-31T23:59:59Z'
      await sendSubscriptionCancellation('test@example.com', 'John Doe', 'premium', endDate)

      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('Your current daily API quota')
      expect(htmlContent).toContain('Higher file size limits')
      expect(htmlContent).toContain('Batch processing capabilities')
      expect(htmlContent).toContain('Priority support')
    })

    it('should list free plan benefits after cancellation', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const endDate = '2024-12-31T23:59:59Z'
      await sendSubscriptionCancellation('test@example.com', 'John Doe', 'premium', endDate)

      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('All client-side tools (unlimited)')
      expect(htmlContent).toContain('10 daily API operations')
      expect(htmlContent).toContain('Community support')
    })
  })

  describe('Custom Email', () => {
    it('should send custom email with provided content', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const result = await sendCustomEmail(
        'test@example.com',
        'Custom Subject',
        '<h1>Custom HTML Content</h1>',
        'Custom text content'
      )

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Custom Subject',
        html: '<h1>Custom HTML Content</h1>',
        text: 'Custom text content',
      })
    })

    it('should generate text content from HTML if not provided', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      const result = await sendCustomEmail(
        'test@example.com',
        'Custom Subject',
        '<h1>Custom HTML</h1><p>Some content</p>'
      )

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'test@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Custom Subject',
        html: '<h1>Custom HTML</h1><p>Some content</p>',
        text: 'Custom HTMLSome content', // HTML tags stripped
      })
    })

    it('should handle custom email errors', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Invalid recipient'))

      const result = await sendCustomEmail(
        'invalid-email',
        'Subject',
        '<h1>Content</h1>'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid recipient')
    })
  })

  describe('Email Configuration Validation', () => {
    it('should validate complete email configuration', () => {
      const result = validateEmailConfig()

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should detect missing RESEND_API_KEY', () => {
      process.env.RESEND_API_KEY = ''

      const result = validateEmailConfig()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('RESEND_API_KEY is not configured')
    })

    it('should detect missing EMAIL_FROM', () => {
      process.env.EMAIL_FROM = ''

      const result = validateEmailConfig()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('EMAIL_FROM is not configured')
    })

    it('should detect multiple missing configurations', () => {
      process.env.RESEND_API_KEY = ''
      process.env.EMAIL_FROM = ''

      const result = validateEmailConfig()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('RESEND_API_KEY is not configured')
      expect(result.errors).toContain('EMAIL_FROM is not configured')
    })
  })

  describe('Email Template Content Validation', () => {
    it('should include proper email structure in all templates', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      // Test welcome email structure
      await sendWelcomeEmail('test@example.com', 'John Doe')
      let call = mockResend.emails.send.mock.calls[0][0]
      let htmlContent = call.html

      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('<html lang="en">')
      expect(htmlContent).toContain('<meta charset="UTF-8">')
      expect(htmlContent).toContain('<meta name="viewport"')
      expect(htmlContent).toContain('</html>')

      vi.clearAllMocks()
      mockResend.emails.send.mockResolvedValue({ id: 'email-124' })

      // Test subscription confirmation structure
      await sendSubscriptionConfirmation('test@example.com', 'John Doe', 'premium', 900)
      call = mockResend.emails.send.mock.calls[0][0]
      htmlContent = call.html

      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('<html lang="en">')
      expect(htmlContent).toContain('</html>')
    })

    it('should include proper CSS styling in templates', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendWelcomeEmail('test@example.com', 'John Doe')
      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html

      expect(htmlContent).toContain('<style>')
      expect(htmlContent).toContain('font-family:')
      expect(htmlContent).toContain('max-width: 600px')
      expect(htmlContent).toContain('margin: 0 auto')
      expect(htmlContent).toContain('</style>')
    })

    it('should include proper links in templates', async () => {
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendWelcomeEmail('test@example.com', 'John Doe')
      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html

      // Check for proper links
      expect(htmlContent).toContain('href="https://designkit.com/dashboard"')
      expect(htmlContent).toContain('href="https://designkit.com/pricing"')
      expect(htmlContent).toContain('href="https://designkit.com/faq"')
    })

    it('should handle missing environment variables gracefully in templates', async () => {
      process.env.NEXT_PUBLIC_APP_URL = ''
      mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

      await sendWelcomeEmail('test@example.com', 'John Doe')
      const call = mockResend.emails.send.mock.calls[0][0]
      const htmlContent = call.html

      // Should fallback to default URL
      expect(htmlContent).toContain('href="https://designkit.com/dashboard"')
    })
  })
})