/**
 * Monitoring and Alerting Configuration
 * 
 * Centralized configuration for all monitoring, alerting, and observability settings.
 * Used by Sentry, uptime monitoring, and custom alerting systems.
 */

export const MONITORING_CONFIG = {
  // Application metadata
  app: {
    name: 'Design Kit',
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  },

  // Error rate thresholds
  errorRates: {
    // Critical: Immediate attention required
    critical: {
      threshold: 5, // 5% error rate
      timeWindow: '5m',
      alertChannels: ['pagerduty', 'sms', 'slack'],
      description: 'High error rate detected - immediate attention required',
    },
    
    // Warning: Should be investigated
    warning: {
      threshold: 2, // 2% error rate
      timeWindow: '5m',
      alertChannels: ['slack', 'email'],
      description: 'Elevated error rate detected',
    },
    
    // Info: For tracking trends
    info: {
      threshold: 1, // 1% error rate
      timeWindow: '15m',
      alertChannels: ['email'],
      description: 'Error rate above baseline',
    },
  },

  // Performance thresholds
  performance: {
    // Response time thresholds (in milliseconds)
    responseTime: {
      critical: 5000, // 5 seconds
      warning: 2000,  // 2 seconds
      target: 1000,   // 1 second target
    },
    
    // Apdex score thresholds (Application Performance Index)
    apdex: {
      critical: 0.7,  // Poor user experience
      warning: 0.85,  // Fair user experience
      target: 0.95,   // Excellent user experience
      satisfiedThreshold: 1000, // 1 second for satisfied users
      toleratingThreshold: 4000, // 4 seconds for tolerating users
    },
    
    // Throughput thresholds (requests per minute)
    throughput: {
      maxRpm: 1000,   // Maximum requests per minute
      warningRpm: 800, // Warning threshold
    },
  },

  // Uptime monitoring configuration
  uptime: {
    checkInterval: '1m',     // Check every minute
    timeout: 30,             // 30 second timeout
    retries: 3,              // Retry 3 times before marking as down
    gracePeriod: '2m',       // Grace period before alerting
    
    // Monitoring locations for global coverage
    locations: [
      'us-east-1',      // US East (Virginia)
      'us-west-2',      // US West (Oregon)
      'eu-west-1',      // Europe (Ireland)
      'ap-southeast-1', // Asia Pacific (Singapore)
    ],
    
    // Expected response criteria
    expectations: {
      statusCodes: [200, 201, 202, 204, 301, 302],
      maxResponseTime: 10000, // 10 seconds max
      sslCheck: true,
      followRedirects: true,
    },
  },

  // Database monitoring thresholds
  database: {
    // Connection pool monitoring
    connections: {
      critical: 90,  // 90% of max connections
      warning: 80,   // 80% of max connections
      maxConnections: 100, // Supabase default
    },
    
    // Query performance
    queryTime: {
      critical: 5000, // 5 seconds
      warning: 1000,  // 1 second
      slowQueryLog: true,
    },
    
    // Storage monitoring
    storage: {
      critical: 90,  // 90% disk usage
      warning: 85,   // 85% disk usage
      checkInterval: '5m',
    },
    
    // Replication lag (if applicable)
    replication: {
      critical: 60,  // 60 seconds lag
      warning: 30,   // 30 seconds lag
    },
  },

  // Rate limiting monitoring
  rateLimiting: {
    // Track rate limit violations
    violations: {
      threshold: 100,    // 100 violations per hour
      timeWindow: '1h',
      alertChannels: ['slack'],
    },
    
    // Monitor rate limit effectiveness
    effectiveness: {
      blockRate: 0.1,    // 10% of requests blocked is concerning
      falsePositiveRate: 0.05, // 5% false positives is too high
    },
  },

  // External service monitoring
  externalServices: {
    // Stripe API monitoring
    stripe: {
      timeout: 10000,        // 10 second timeout
      retries: 3,
      errorThreshold: 5,     // 5% error rate
      responseTimeThreshold: 3000, // 3 seconds
    },
    
    // Remove.bg API monitoring
    removeBg: {
      timeout: 30000,        // 30 second timeout (image processing)
      retries: 2,
      errorThreshold: 10,    // 10% error rate (external service)
      responseTimeThreshold: 15000, // 15 seconds
    },
    
    // Replicate API monitoring
    replicate: {
      timeout: 60000,        // 60 second timeout (AI processing)
      retries: 2,
      errorThreshold: 15,    // 15% error rate (AI service)
      responseTimeThreshold: 30000, // 30 seconds
    },
    
    // Supabase API monitoring
    supabase: {
      timeout: 5000,         // 5 second timeout
      retries: 3,
      errorThreshold: 2,     // 2% error rate
      responseTimeThreshold: 2000, // 2 seconds
    },
  },

  // Backup monitoring
  backup: {
    // Backup schedule and retention
    schedule: {
      frequency: 'daily',    // Daily backups
      time: '02:00',         // 2 AM UTC
      timezone: 'UTC',
    },
    
    // Retention policy
    retention: {
      daily: 7,              // Keep 7 daily backups
      weekly: 4,             // Keep 4 weekly backups
      monthly: 12,           // Keep 12 monthly backups
    },
    
    // Backup validation
    validation: {
      enabled: true,
      testRestore: 'weekly', // Test restore weekly
      checksumVerification: true,
    },
    
    // Alert if backup fails
    alerts: {
      failureThreshold: 1,   // Alert on first failure
      channels: ['email', 'slack'],
    },
  },

  // Security monitoring
  security: {
    // Failed authentication attempts
    authFailures: {
      threshold: 10,         // 10 failed attempts per IP per hour
      timeWindow: '1h',
      blockDuration: '24h',  // Block for 24 hours
      alertChannels: ['security-team'],
    },
    
    // Suspicious activity patterns
    suspicious: {
      rapidRequests: 100,    // 100 requests per minute from single IP
      unusualGeoLocation: true, // Alert on unusual geo patterns
      botDetection: true,    // Monitor for bot activity
    },
    
    // SSL certificate monitoring
    ssl: {
      expiryWarning: 30,     // Warn 30 days before expiry
      expiryAlert: 7,        // Alert 7 days before expiry
    },
  },

  // Business metrics monitoring
  business: {
    // User activity metrics
    userActivity: {
      dailyActiveUsers: {
        target: 100,
        warning: 50,         // Warn if DAU drops below 50
      },
      conversionRate: {
        target: 0.05,        // 5% conversion rate target
        warning: 0.02,       // Warn if below 2%
      },
    },
    
    // Revenue metrics
    revenue: {
      dailyRevenue: {
        target: 1000,        // $1000 daily revenue target
        warning: 500,        // Warn if below $500
      },
      churnRate: {
        critical: 0.1,       // 10% monthly churn is critical
        warning: 0.05,       // 5% monthly churn is concerning
      },
    },
    
    // Tool usage metrics
    toolUsage: {
      apiToolsUsage: {
        target: 1000,        // 1000 API calls per day target
        warning: 500,        // Warn if below 500
      },
      errorRate: {
        critical: 0.05,      // 5% tool error rate is critical
        warning: 0.02,       // 2% tool error rate is concerning
      },
    },
  },

  // Alert routing configuration
  alerting: {
    // Default notification channels
    channels: {
      critical: ['pagerduty', 'sms', 'slack-critical'],
      warning: ['slack-alerts', 'email'],
      info: ['email'],
    },
    
    // Alert suppression rules
    suppression: {
      duplicateWindow: '30m', // Suppress duplicate alerts for 30 minutes
      maintenanceMode: false, // Disable during maintenance
      quietHours: {
        enabled: false,       // No quiet hours for critical systems
        start: '22:00',
        end: '08:00',
        timezone: 'UTC',
      },
    },
    
    // Escalation rules
    escalation: {
      enabled: true,
      levels: [
        { delay: '5m', channels: ['slack-critical'] },
        { delay: '15m', channels: ['pagerduty'] },
        { delay: '30m', channels: ['sms', 'phone'] },
      ],
    },
  },
} as const

// Sentry-specific configuration
export const SENTRY_CONFIG = {
  // Alert rules for Sentry
  alertRules: [
    {
      name: 'High Error Rate - Critical',
      conditions: [
        {
          id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
          value: MONITORING_CONFIG.errorRates.critical.threshold,
          interval: MONITORING_CONFIG.errorRates.critical.timeWindow,
        },
      ],
      actions: [
        {
          id: 'sentry.rules.actions.notify_event.NotifyEventAction',
          targetType: 'IssueOwners',
        },
      ],
      frequency: 5, // Alert every 5 minutes if condition persists
    },
    
    {
      name: 'API Endpoint Errors',
      conditions: [
        {
          id: 'sentry.rules.conditions.tagged_event.TaggedEventCondition',
          key: 'transaction',
          match: 'co',
          value: '/api/',
        },
        {
          id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
          value: 10,
          interval: '5m',
        },
      ],
      actions: [
        {
          id: 'sentry.rules.actions.notify_event.NotifyEventAction',
          targetType: 'IssueOwners',
        },
      ],
      frequency: 30,
    },
    
    {
      name: 'Payment Processing Errors',
      conditions: [
        {
          id: 'sentry.rules.conditions.tagged_event.TaggedEventCondition',
          key: 'transaction',
          match: 'co',
          value: 'stripe',
        },
        {
          id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
          value: 1,
          interval: '1m',
        },
      ],
      actions: [
        {
          id: 'sentry.rules.actions.notify_event.NotifyEventAction',
          targetType: 'IssueOwners',
        },
      ],
      frequency: 1, // Immediate alerts for payment issues
    },
    
    {
      name: 'Database Connection Errors',
      conditions: [
        {
          id: 'sentry.rules.conditions.tagged_event.TaggedEventCondition',
          key: 'logger',
          match: 'eq',
          value: 'supabase',
        },
        {
          id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
          value: 5,
          interval: '1m',
        },
      ],
      actions: [
        {
          id: 'sentry.rules.actions.notify_event.NotifyEventAction',
          targetType: 'IssueOwners',
        },
      ],
      frequency: 10,
    },
    
    {
      name: 'Performance Degradation',
      conditions: [
        {
          id: 'sentry.rules.conditions.event_frequency.EventFrequencyPercentCondition',
          value: 20, // 20% of transactions
          interval: '5m',
        },
        {
          id: 'sentry.rules.conditions.tagged_event.TaggedEventCondition',
          key: 'transaction.duration',
          match: 'gt',
          value: MONITORING_CONFIG.performance.responseTime.warning.toString(),
        },
      ],
      actions: [
        {
          id: 'sentry.rules.actions.notify_event.NotifyEventAction',
          targetType: 'IssueOwners',
        },
      ],
      frequency: 15,
    },
  ],
  
  // Performance monitoring configuration
  performance: {
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  },
  
  // Session replay configuration
  replay: {
    sessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,
    errorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.0,
  },
} as const

// Uptime monitoring endpoints
export const UPTIME_ENDPOINTS = [
  {
    name: 'Homepage',
    url: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    expectedContent: 'ok',
    timeout: MONITORING_CONFIG.uptime.timeout,
    critical: true,
  },
  {
    name: 'API Health Check',
    url: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    expectedContent: 'ok',
    timeout: MONITORING_CONFIG.uptime.timeout,
    critical: true,
  },
  {
    name: 'Dashboard Authentication',
    url: '/dashboard',
    method: 'GET',
    expectedStatus: [200, 302], // 302 for redirect to login
    timeout: MONITORING_CONFIG.uptime.timeout,
    critical: false,
  },
  {
    name: 'Stripe Webhook Endpoint',
    url: '/api/stripe/webhook',
    method: 'POST',
    expectedStatus: 400, // Expected without proper webhook signature
    timeout: MONITORING_CONFIG.uptime.timeout,
    critical: true,
  },
  {
    name: 'Background Remover API',
    url: '/api/tools/background-remover',
    method: 'POST',
    expectedStatus: 401, // Expected without authentication
    timeout: MONITORING_CONFIG.uptime.timeout,
    critical: false,
  },
] as const

export type MonitoringConfig = typeof MONITORING_CONFIG
export type SentryConfig = typeof SENTRY_CONFIG
export type UptimeEndpoint = typeof UPTIME_ENDPOINTS[number]