import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend
const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: mockSend },
  })),
}))

// Mock environment
vi.mock('@/lib/env', () => ({
  env: {
    RESEND_API_KEY: 'test-api-key',
    EMAIL_FROM: 'test@designkit.com',
    NEXT_PUBLIC_APP_URL: 'https://designkit.com',
  },
}))

describe('Email System Integration', () => {
  let emailClient: any

  beforeEach(async () => {
    vi.clearAllMocks()
    emailClient = await import('../client')
  })

  describe('Email Template System', () => {
    it('should send welcome email with proper template structure', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      const result = await emailClient.sendWelcomeEmail('user@example.com', 'John Doe')

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@designkit.com',
          to: 'user@example.com',
          subject: 'Welcome to Design Kit! 🎨',
          html: expect.stringContaining('Welcome, John Doe!'),
          text: expect.stringContaining('Welcome to Design Kit, John Doe!'),
        })
      )

      const call = mockSend.mock.calls[0][0]
      expect(call.html).toContain('<!DOCTYPE html>')
      expect(call.html).toContain('10 daily API operations')
      expect(call.html).toContain('Privacy-First')
    })

    it('should send subscription confirmation with plan-specific features', async () => {
      mockSend.mockResolvedValue({ id: 'email-124' })

      const result = await emailClient.sendSubscriptionConfirmation(
        'user@example.com',
        'John Doe',
        'premium',
        900
      )

      expect(result.success).toBe(true)
      const call = mockSend.mock.calls[0][0]
      expect(call.html).toContain('500 daily API operations')
      expect(call.html).toContain('50MB file size limit')
      expect(call.html).toContain('9.00/month')
    })

    it('should send quota warning with usage-specific styling', async () => {
      mockSend.mockResolvedValue({ id: 'email-125' })

      const result = await emailClient.sendQuotaWarning(
        'user@example.com',
        'John Doe',
        45,
        50,
        'free'
      )

      expect(result.success).toBe(true)
      const call = mockSend.mock.calls[0][0]
      expect(call.html).toContain('90% Used')
      expect(call.html).toContain('5') // remaining operations
      expect(call.subject).toBe('⚠️ Quota Alert: 90% Used')
    })

    it('should send subscription cancellation with proper date formatting', async () => {
      mockSend.mockResolvedValue({ id: 'email-126' })

      const endDate = '2024-12-31T23:59:59Z'
      const result = await emailClient.sendSubscriptionCancellation(
        'user@example.com',
        'John Doe',
        'premium',
        endDate
      )

      expect(result.success).toBe(true)
      const call = mockSend.mock.calls[0][0]
      expect(call.html).toContain('premium subscription has been cancelled')
      expect(call.html).toContain('Wednesday, January 1, 2025')
    })

    it('should send custom email with provided content', async () => {
      mockSend.mockResolvedValue({ id: 'email-127' })

      const result = await emailClient.sendCustomEmail(
        'user@example.com',
        'Custom Subject',
        '<h1>Custom Content</h1>',
        'Custom text'
      )

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@designkit.com',
        to: 'user@example.com',
        replyTo: 'test@designkit.com',
        subject: 'Custom Subject',
        html: '<h1>Custom Content</h1>',
        text: 'Custom text',
      })
    })
  })

  describe('Email Configuration', () => {
    it('should validate email configuration correctly', () => {
      const result = emailClient.validateEmailConfig()

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(typeof result.valid).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle email service errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Service unavailable'))

      const result = await emailClient.sendWelcomeEmail('user@example.com', 'John Doe')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Service unavailable')
    })

    it('should handle network timeouts gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Network timeout'))

      const result = await emailClient.sendQuotaWarning(
        'user@example.com',
        'John Doe',
        45,
        50,
        'free'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network timeout')
    })
  })

  describe('Template Content Validation', () => {
    it('should include proper HTML structure in all templates', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendWelcomeEmail('user@example.com', 'John Doe')
      const call = mockSend.mock.calls[0][0]

      expect(call.html).toContain('<!DOCTYPE html>')
      expect(call.html).toContain('<html lang="en">')
      expect(call.html).toContain('<meta charset="UTF-8">')
      expect(call.html).toContain('<style>')
      expect(call.html).toContain('</html>')
    })

    it('should include proper links in templates', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendWelcomeEmail('user@example.com', 'John Doe')
      const call = mockSend.mock.calls[0][0]

      expect(call.html).toContain('href="https://designkit.com/dashboard"')
      expect(call.html).toContain('href="https://designkit.com/pricing"')
      expect(call.html).toContain('href="https://designkit.com/faq"')
    })

    it('should include proper CSS styling', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendWelcomeEmail('user@example.com', 'John Doe')
      const call = mockSend.mock.calls[0][0]

      expect(call.html).toContain('font-family:')
      expect(call.html).toContain('max-width: 600px')
      expect(call.html).toContain('margin: 0 auto')
      expect(call.html).toContain('background-color:')
    })
  })

  describe('Email Content Personalization', () => {
    it('should handle missing names gracefully', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendWelcomeEmail('test@example.com')
      const call = mockSend.mock.calls[0][0]

      // Should use email prefix as fallback name
      expect(call.html).toContain('Welcome, test!')
      expect(call.text).toContain('Welcome to Design Kit, test!')
    })

    it('should format plan names correctly', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendSubscriptionConfirmation('user@example.com', 'John', 'pro', 2900)
      const call = mockSend.mock.calls[0][0]

      expect(call.subject).toBe('Welcome to pro Plan! 🎉')
      expect(call.html).toContain('Welcome to pro Plan, John!')
    })

    it('should calculate usage percentages correctly', async () => {
      mockSend.mockResolvedValue({ id: 'email-123' })

      await emailClient.sendQuotaWarning('user@example.com', 'John', 8, 10, 'free')
      const call = mockSend.mock.calls[0][0]

      expect(call.subject).toBe('⚠️ Quota Alert: 80% Used')
      expect(call.html).toContain('80% Used')
      expect(call.html).toContain('2') // remaining operations
    })
  })
})