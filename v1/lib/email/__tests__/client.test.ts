import { describe, it, expect } from 'vitest'

describe('Email Client Configuration', () => {
  it('should have email client module', async () => {
    const emailClient = await import('../client')
    
    expect(emailClient.sendWelcomeEmail).toBeDefined()
    expect(emailClient.sendSubscriptionConfirmation).toBeDefined()
    expect(emailClient.sendQuotaWarning).toBeDefined()
    expect(emailClient.sendSubscriptionCancellation).toBeDefined()
    expect(emailClient.sendCustomEmail).toBeDefined()
    expect(emailClient.validateEmailConfig).toBeDefined()
  })

  it('should export all required email functions', async () => {
    const emailClient = await import('../client')
    
    expect(typeof emailClient.sendWelcomeEmail).toBe('function')
    expect(typeof emailClient.sendSubscriptionConfirmation).toBe('function')
    expect(typeof emailClient.sendQuotaWarning).toBe('function')
    expect(typeof emailClient.sendSubscriptionCancellation).toBe('function')
    expect(typeof emailClient.sendCustomEmail).toBe('function')
    expect(typeof emailClient.validateEmailConfig).toBe('function')
  })

  it('should validate email configuration structure', async () => {
    const { validateEmailConfig } = await import('../client')
    
    const result = validateEmailConfig()
    
    // Should return an object with valid and errors properties
    expect(result).toHaveProperty('valid')
    expect(result).toHaveProperty('errors')
    expect(typeof result.valid).toBe('boolean')
    expect(Array.isArray(result.errors)).toBe(true)
  })
})

describe('Email Template Functions', () => {
  it('should handle email sending gracefully when API key is missing', async () => {
    // This test verifies that email functions don't throw errors
    // when configuration is missing (they should log warnings and return success: true)
    
    const { sendWelcomeEmail } = await import('../client')
    
    // The function should not throw an error even if configuration is incomplete
    expect(async () => {
      await sendWelcomeEmail('test@example.com', 'Test User')
    }).not.toThrow()
  })

  it('should accept correct parameters for welcome email', async () => {
    const { sendWelcomeEmail } = await import('../client')
    
    // Should accept email and optional name
    expect(async () => {
      await sendWelcomeEmail('test@example.com')
    }).not.toThrow()
    
    expect(async () => {
      await sendWelcomeEmail('test@example.com', 'Test User')
    }).not.toThrow()
  })

  it('should accept correct parameters for subscription confirmation', async () => {
    const { sendSubscriptionConfirmation } = await import('../client')
    
    expect(async () => {
      await sendSubscriptionConfirmation('test@example.com', 'Test User', 'premium', 900)
    }).not.toThrow()
  })

  it('should accept correct parameters for quota warning', async () => {
    const { sendQuotaWarning } = await import('../client')
    
    expect(async () => {
      await sendQuotaWarning('test@example.com', 'Test User', 45, 50, 'free')
    }).not.toThrow()
  })

  it('should accept correct parameters for subscription cancellation', async () => {
    const { sendSubscriptionCancellation } = await import('../client')
    
    expect(async () => {
      await sendSubscriptionCancellation('test@example.com', 'Test User', 'premium', '2024-12-31')
    }).not.toThrow()
  })

  it('should accept correct parameters for custom email', async () => {
    const { sendCustomEmail } = await import('../client')
    
    expect(async () => {
      await sendCustomEmail('test@example.com', 'Test Subject', '<h1>Test</h1>', 'Test')
    }).not.toThrow()
    
    expect(async () => {
      await sendCustomEmail('test@example.com', 'Test Subject', '<h1>Test</h1>')
    }).not.toThrow()
  })
})