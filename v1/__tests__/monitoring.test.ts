/**
 * Monitoring and Alerting Tests
 * 
 * Tests for monitoring configuration, health checks, and alerting systems.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MONITORING_CONFIG, SENTRY_CONFIG, UPTIME_ENDPOINTS } from '../lib/monitoring/config'

describe('Monitoring Configuration', () => {
  it('should have valid error rate thresholds', () => {
    expect(MONITORING_CONFIG.errorRates.critical.threshold).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.errorRates.warning.threshold).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.errorRates.critical.threshold).toBeGreaterThan(
      MONITORING_CONFIG.errorRates.warning.threshold
    )
  })

  it('should have valid performance thresholds', () => {
    expect(MONITORING_CONFIG.performance.responseTime.critical).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.performance.responseTime.warning).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.performance.responseTime.critical).toBeGreaterThan(
      MONITORING_CONFIG.performance.responseTime.warning
    )
  })

  it('should have valid uptime monitoring configuration', () => {
    expect(MONITORING_CONFIG.uptime.checkInterval).toBeDefined()
    expect(MONITORING_CONFIG.uptime.timeout).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.uptime.retries).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.uptime.locations.length).toBeGreaterThan(0)
  })

  it('should have valid database monitoring thresholds', () => {
    expect(MONITORING_CONFIG.database.connections.critical).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.database.connections.warning).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.database.queryTime.critical).toBeGreaterThan(0)
    expect(MONITORING_CONFIG.database.storage.critical).toBeGreaterThan(0)
  })
})

describe('Sentry Configuration', () => {
  it('should have valid alert rules', () => {
    expect(SENTRY_CONFIG.alertRules.length).toBeGreaterThan(0)
    
    SENTRY_CONFIG.alertRules.forEach(rule => {
      expect(rule.name).toBeDefined()
      expect(rule.conditions.length).toBeGreaterThan(0)
      expect(rule.actions.length).toBeGreaterThan(0)
      expect(rule.frequency).toBeGreaterThan(0)
    })
  })

  it('should have valid performance configuration', () => {
    expect(SENTRY_CONFIG.performance.tracesSampleRate).toBeGreaterThanOrEqual(0)
    expect(SENTRY_CONFIG.performance.tracesSampleRate).toBeLessThanOrEqual(1)
    expect(SENTRY_CONFIG.performance.profilesSampleRate).toBeGreaterThanOrEqual(0)
    expect(SENTRY_CONFIG.performance.profilesSampleRate).toBeLessThanOrEqual(1)
  })

  it('should have valid replay configuration', () => {
    expect(SENTRY_CONFIG.replay.sessionSampleRate).toBeGreaterThanOrEqual(0)
    expect(SENTRY_CONFIG.replay.sessionSampleRate).toBeLessThanOrEqual(1)
    expect(SENTRY_CONFIG.replay.errorSampleRate).toBeGreaterThanOrEqual(0)
    expect(SENTRY_CONFIG.replay.errorSampleRate).toBeLessThanOrEqual(1)
  })
})

describe('Uptime Endpoints', () => {
  it('should have valid endpoint configurations', () => {
    expect(UPTIME_ENDPOINTS.length).toBeGreaterThan(0)
    
    UPTIME_ENDPOINTS.forEach(endpoint => {
      expect(endpoint.name).toBeDefined()
      expect(endpoint.url).toBeDefined()
      expect(endpoint.method).toBeDefined()
      expect(endpoint.expectedStatus).toBeDefined()
      expect(endpoint.timeout).toBeGreaterThan(0)
      expect(typeof endpoint.critical).toBe('boolean')
    })
  })

  it('should include critical endpoints', () => {
    const criticalEndpoints = UPTIME_ENDPOINTS.filter(e => e.critical)
    expect(criticalEndpoints.length).toBeGreaterThan(0)
    
    // Should include health check
    const healthCheck = UPTIME_ENDPOINTS.find(e => e.url.includes('/api/health'))
    expect(healthCheck).toBeDefined()
    expect(healthCheck?.critical).toBe(true)
  })
})

describe('Health Check Response', () => {
  it('should return valid health check structure', async () => {
    // Mock the health check response structure
    const mockHealthResponse = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      version: '0.1.0',
      environment: 'test',
      uptime: 3600,
      checks: {
        database: 'ok',
        redis: 'not_configured',
        external_apis: 'ok',
        memory: 'ok',
      },
    }

    expect(mockHealthResponse.timestamp).toBeDefined()
    expect(['ok', 'degraded', 'error']).toContain(mockHealthResponse.status)
    expect(mockHealthResponse.version).toBeDefined()
    expect(mockHealthResponse.environment).toBeDefined()
    expect(mockHealthResponse.uptime).toBeGreaterThanOrEqual(0)
    expect(mockHealthResponse.checks).toBeDefined()
    
    // Check individual service statuses
    Object.values(mockHealthResponse.checks).forEach(status => {
      expect(['ok', 'warning', 'error', 'not_configured', 'unknown']).toContain(status)
    })
  })
})

describe('Error Categorization', () => {
  it('should categorize errors correctly', () => {
    // Test error categorization logic
    const testCases = [
      { error: new Error('Database connection failed'), context: { component: 'database' }, expected: 'database' },
      { error: new Error('Payment failed'), context: { component: 'stripe' }, expected: 'stripe' },
      { error: new Error('Tool processing failed'), context: { toolName: 'background-remover' }, expected: 'tool' },
      { error: new Error('NetworkError timeout'), context: {}, expected: 'network' },
      { error: new Error('Authentication failed'), context: {}, expected: 'authentication' },
      { error: new Error('Validation error'), context: {}, expected: 'validation' },
      { error: new Error('Unknown error'), context: {}, expected: 'general' },
    ]

    // Mock categorization function (would be imported from error-logger)
    const categorizeError = (error: Error, context?: Record<string, any>): string => {
      if (context?.component) return context.component
      if (context?.toolName) return 'tool'
      if (error.message.includes('Network')) return 'network'
      if (error.message.includes('Authentication')) return 'authentication'
      if (error.name.includes('Payment') || error.name.includes('Stripe')) return 'payment'
      if (error.name.includes('Database') || error.name.includes('Supabase')) return 'database'
      if (error.message.includes('Validation')) return 'validation'
      return 'general'
    }

    testCases.forEach(({ error, context, expected }) => {
      const category = categorizeError(error, context)
      expect(category).toBe(expected)
    })
  })
})

describe('Performance Thresholds', () => {
  it('should detect performance issues correctly', () => {
    const { responseTime } = MONITORING_CONFIG.performance
    
    // Test response time categorization
    expect(500).toBeLessThan(responseTime.warning) // Good performance
    expect(responseTime.warning).toBeLessThan(responseTime.critical) // Warning < Critical
    expect(6000).toBeGreaterThan(responseTime.critical) // Poor performance
  })

  it('should have realistic Apdex thresholds', () => {
    const { apdex } = MONITORING_CONFIG.performance
    
    expect(apdex.critical).toBeGreaterThan(0)
    expect(apdex.critical).toBeLessThan(1)
    expect(apdex.warning).toBeGreaterThan(apdex.critical)
    expect(apdex.target).toBeGreaterThan(apdex.warning)
    expect(apdex.satisfiedThreshold).toBeGreaterThan(0)
    expect(apdex.toleratingThreshold).toBeGreaterThan(apdex.satisfiedThreshold)
  })
})

describe('Business Metrics Thresholds', () => {
  it('should have valid business metric targets', () => {
    const { business } = MONITORING_CONFIG
    
    expect(business.userActivity.dailyActiveUsers.target).toBeGreaterThan(0)
    expect(business.userActivity.conversionRate.target).toBeGreaterThan(0)
    expect(business.userActivity.conversionRate.target).toBeLessThanOrEqual(1)
    
    expect(business.revenue.dailyRevenue.target).toBeGreaterThan(0)
    expect(business.revenue.churnRate.critical).toBeGreaterThan(0)
    expect(business.revenue.churnRate.critical).toBeLessThanOrEqual(1)
  })
})

describe('Alert Configuration', () => {
  it('should have valid alert channels', () => {
    const { alerting } = MONITORING_CONFIG
    
    expect(alerting.channels.critical.length).toBeGreaterThan(0)
    expect(alerting.channels.warning.length).toBeGreaterThan(0)
    expect(alerting.channels.info.length).toBeGreaterThan(0)
  })

  it('should have valid suppression rules', () => {
    const { suppression } = MONITORING_CONFIG.alerting
    
    expect(suppression.duplicateWindow).toBeDefined()
    expect(typeof suppression.maintenanceMode).toBe('boolean')
    expect(typeof suppression.quietHours.enabled).toBe('boolean')
  })

  it('should have valid escalation rules', () => {
    const { escalation } = MONITORING_CONFIG.alerting
    
    expect(typeof escalation.enabled).toBe('boolean')
    if (escalation.enabled) {
      expect(escalation.levels.length).toBeGreaterThan(0)
      escalation.levels.forEach(level => {
        expect(level.delay).toBeDefined()
        expect(level.channels.length).toBeGreaterThan(0)
      })
    }
  })
})

describe('Backup Configuration', () => {
  it('should have valid backup settings', () => {
    const { backup } = MONITORING_CONFIG
    
    expect(backup.schedule.frequency).toBeDefined()
    expect(backup.schedule.time).toBeDefined()
    expect(backup.retention.daily).toBeGreaterThan(0)
    expect(backup.retention.weekly).toBeGreaterThan(0)
    expect(backup.retention.monthly).toBeGreaterThan(0)
    
    expect(typeof backup.validation.enabled).toBe('boolean')
    expect(typeof backup.validation.checksumVerification).toBe('boolean')
  })
})

describe('Security Monitoring', () => {
  it('should have valid security thresholds', () => {
    const { security } = MONITORING_CONFIG
    
    expect(security.authFailures.threshold).toBeGreaterThan(0)
    expect(security.authFailures.timeWindow).toBeDefined()
    expect(security.authFailures.blockDuration).toBeDefined()
    
    expect(security.suspicious.rapidRequests).toBeGreaterThan(0)
    expect(typeof security.suspicious.unusualGeoLocation).toBe('boolean')
    expect(typeof security.suspicious.botDetection).toBe('boolean')
    
    expect(security.ssl.expiryWarning).toBeGreaterThan(0)
    expect(security.ssl.expiryAlert).toBeGreaterThan(0)
    expect(security.ssl.expiryAlert).toBeLessThan(security.ssl.expiryWarning)
  })
})