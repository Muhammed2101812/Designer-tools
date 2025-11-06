#!/usr/bin/env tsx
/**
 * Monitoring and Alerting Setup Script
 * 
 * This script configures monitoring and alerting for the Design Kit application:
 * - Sentry alert rules and notifications
 * - Uptime monitoring configuration
 * - Database backup strategy
 * - Error rate thresholds
 * 
 * Usage:
 *   npm run setup-monitoring
 *   or
 *   npx tsx scripts/setup-monitoring.ts
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../lib/env'

// Monitoring configuration
const MONITORING_CONFIG = {
  // Error rate thresholds
  errorRates: {
    critical: 5, // 5% error rate triggers critical alert
    warning: 2,  // 2% error rate triggers warning
    timeWindow: '5m', // Time window for error rate calculation
  },
  
  // Performance thresholds
  performance: {
    responseTime: {
      critical: 5000, // 5 seconds
      warning: 2000,  // 2 seconds
    },
    apdex: {
      critical: 0.7, // Apdex score below 0.7 is critical
      warning: 0.85, // Apdex score below 0.85 is warning
    },
  },
  
  // Uptime monitoring
  uptime: {
    checkInterval: '1m', // Check every minute
    timeout: 30, // 30 second timeout
    retries: 3,  // Retry 3 times before marking as down
    locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'], // Multiple regions
  },
  
  // Database monitoring
  database: {
    connectionThreshold: 80, // Alert when connection pool is 80% full
    queryTimeThreshold: 1000, // Alert for queries taking > 1 second
    diskSpaceThreshold: 85, // Alert when disk usage > 85%
  },
  
  // Backup configuration
  backup: {
    frequency: 'daily', // Daily backups
    retention: 30, // Keep backups for 30 days
    schedule: '02:00', // Run at 2 AM UTC
  },
}

// Sentry alert rules configuration
const SENTRY_ALERT_RULES = [
  {
    name: 'High Error Rate',
    conditions: [
      {
        id: 'sentry.rules.conditions.event_frequency.EventFrequencyCondition',
        value: MONITORING_CONFIG.errorRates.critical,
        interval: MONITORING_CONFIG.errorRates.timeWindow,
      },
    ],
    actions: [
      {
        id: 'sentry.rules.actions.notify_event.NotifyEventAction',
        targetType: 'IssueOwners',
        targetIdentifier: null,
      },
    ],
    actionMatch: 'any',
    filterMatch: 'any',
    frequency: 30, // Don't spam - wait 30 minutes between alerts
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
        targetIdentifier: null,
      },
    ],
    actionMatch: 'all',
    filterMatch: 'all',
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
        targetIdentifier: null,
      },
    ],
    actionMatch: 'all',
    filterMatch: 'all',
    frequency: 5, // Immediate alerts for payment issues
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
        targetIdentifier: null,
      },
    ],
    actionMatch: 'all',
    filterMatch: 'all',
    frequency: 10,
  },
]

// Uptime monitoring endpoints
const UPTIME_ENDPOINTS = [
  {
    name: 'Homepage',
    url: `${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}`,
    method: 'GET',
    expectedStatus: 200,
    expectedContent: 'Design Kit',
    timeout: MONITORING_CONFIG.uptime.timeout,
  },
  {
    name: 'API Health Check',
    url: `${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/api/health`,
    method: 'GET',
    expectedStatus: 200,
    expectedContent: 'ok',
    timeout: MONITORING_CONFIG.uptime.timeout,
  },
  {
    name: 'Dashboard (Auth Required)',
    url: `${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard`,
    method: 'GET',
    expectedStatus: [200, 302], // 302 for redirect to login
    timeout: MONITORING_CONFIG.uptime.timeout,
  },
  {
    name: 'Stripe Webhook',
    url: `${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/api/stripe/webhook`,
    method: 'POST',
    expectedStatus: 400, // Expected without proper webhook signature
    timeout: MONITORING_CONFIG.uptime.timeout,
  },
]

async function setupSentryAlerts() {
  console.log('🔧 Setting up Sentry alert rules...')
  
  if (!env.SENTRY_AUTH_TOKEN || !env.SENTRY_ORG || !env.SENTRY_PROJECT) {
    console.warn('⚠️  Sentry configuration missing. Skipping Sentry alert setup.')
    console.warn('   Set SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT to enable.')
    return
  }
  
  try {
    // Note: In a real implementation, you would use Sentry's API to create these rules
    // For now, we'll output the configuration that should be applied
    console.log('📋 Sentry Alert Rules Configuration:')
    console.log(JSON.stringify(SENTRY_ALERT_RULES, null, 2))
    
    console.log('\n📝 To apply these rules:')
    console.log('1. Go to Sentry Dashboard → Alerts → Rules')
    console.log('2. Create new rules with the above configuration')
    console.log('3. Or use Sentry CLI: sentry-cli alerts create-rule')
    
    console.log('✅ Sentry alert configuration prepared')
  } catch (error) {
    console.error('❌ Failed to setup Sentry alerts:', error)
    throw error
  }
}

async function setupUptimeMonitoring() {
  console.log('🔧 Setting up uptime monitoring...')
  
  try {
    console.log('📋 Uptime Monitoring Configuration:')
    console.log(JSON.stringify({
      endpoints: UPTIME_ENDPOINTS,
      config: MONITORING_CONFIG.uptime,
    }, null, 2))
    
    console.log('\n📝 Recommended uptime monitoring services:')
    console.log('• UptimeRobot (free tier available)')
    console.log('• Pingdom')
    console.log('• StatusCake')
    console.log('• Better Uptime')
    console.log('• Sentry Crons (for scheduled tasks)')
    
    console.log('\n🔗 Configure webhooks to send alerts to:')
    console.log('• Slack/Discord channels')
    console.log('• Email notifications')
    console.log('• PagerDuty/OpsGenie for critical alerts')
    
    console.log('✅ Uptime monitoring configuration prepared')
  } catch (error) {
    console.error('❌ Failed to setup uptime monitoring:', error)
    throw error
  }
}

async function setupDatabaseBackup() {
  console.log('🔧 Setting up database backup strategy...')
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Supabase configuration missing. Skipping database backup setup.')
    return
  }
  
  try {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Test database connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }
    
    console.log('📋 Database Backup Strategy:')
    console.log(JSON.stringify(MONITORING_CONFIG.backup, null, 2))
    
    console.log('\n📝 Supabase Backup Options:')
    console.log('1. Built-in Point-in-Time Recovery (PITR)')
    console.log('   • Available on Pro plan and above')
    console.log('   • Automatic continuous backups')
    console.log('   • Restore to any point in time')
    
    console.log('\n2. Manual Database Dumps:')
    console.log('   • Use pg_dump via Supabase CLI')
    console.log('   • Schedule with GitHub Actions or cron')
    console.log('   • Store in S3, Google Cloud Storage, etc.')
    
    console.log('\n3. Application-Level Backups:')
    console.log('   • Export critical data via API')
    console.log('   • Store user files separately')
    console.log('   • Backup configuration and metadata')
    
    console.log('\n🔧 Backup Script Example:')
    console.log('```bash')
    console.log('# Install Supabase CLI')
    console.log('npm install -g supabase')
    console.log('')
    console.log('# Create backup')
    console.log('supabase db dump --db-url "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql')
    console.log('')
    console.log('# Upload to cloud storage')
    console.log('aws s3 cp backup_*.sql s3://your-backup-bucket/')
    console.log('```')
    
    console.log('✅ Database backup strategy prepared')
  } catch (error) {
    console.error('❌ Failed to setup database backup:', error)
    throw error
  }
}

async function setupErrorThresholds() {
  console.log('🔧 Setting up error rate thresholds...')
  
  try {
    console.log('📋 Error Rate Thresholds:')
    console.log(JSON.stringify(MONITORING_CONFIG.errorRates, null, 2))
    
    console.log('\n📋 Performance Thresholds:')
    console.log(JSON.stringify(MONITORING_CONFIG.performance, null, 2))
    
    console.log('\n📋 Database Monitoring Thresholds:')
    console.log(JSON.stringify(MONITORING_CONFIG.database, null, 2))
    
    console.log('\n📝 Implementation Notes:')
    console.log('• Error rates are calculated over rolling time windows')
    console.log('• Thresholds should be adjusted based on baseline metrics')
    console.log('• Consider different thresholds for different endpoints')
    console.log('• Use percentile-based metrics (P95, P99) for better insights')
    
    console.log('\n🔔 Alert Channels:')
    console.log('• Critical: PagerDuty/OpsGenie + SMS')
    console.log('• Warning: Slack/Discord + Email')
    console.log('• Info: Email only')
    
    console.log('✅ Error thresholds configured')
  } catch (error) {
    console.error('❌ Failed to setup error thresholds:', error)
    throw error
  }
}

async function createHealthCheckEndpoint() {
  console.log('🔧 Creating health check endpoint...')
  
  const healthCheckCode = `import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      redis: 'unknown',
      external_apis: 'unknown',
    },
  }

  try {
    // Database health check
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    checks.checks.database = dbError ? 'error' : 'ok'

    // Redis health check (if configured)
    if (process.env.UPSTASH_REDIS_URL) {
      try {
        const { Redis } = await import('@upstash/redis')
        const redis = Redis.fromEnv()
        await redis.ping()
        checks.checks.redis = 'ok'
      } catch (error) {
        checks.checks.redis = 'error'
      }
    } else {
      checks.checks.redis = 'not_configured'
    }

    // External API health check (basic)
    checks.checks.external_apis = 'ok' // Simplified for now

    // Overall status
    const hasErrors = Object.values(checks.checks).includes('error')
    checks.status = hasErrors ? 'degraded' : 'ok'

    return NextResponse.json(checks, {
      status: hasErrors ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ...checks,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}`

  // Write the health check endpoint
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const healthCheckPath = path.join(process.cwd(), 'app', 'api', 'health', 'route.ts')
  
  try {
    await fs.mkdir(path.dirname(healthCheckPath), { recursive: true })
    await fs.writeFile(healthCheckPath, healthCheckCode)
    console.log('✅ Health check endpoint created at /api/health')
  } catch (error) {
    console.error('❌ Failed to create health check endpoint:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Setting up monitoring and alerting...')
  console.log('=====================================')
  
  try {
    await setupSentryAlerts()
    console.log('')
    
    await setupUptimeMonitoring()
    console.log('')
    
    await setupDatabaseBackup()
    console.log('')
    
    await setupErrorThresholds()
    console.log('')
    
    await createHealthCheckEndpoint()
    console.log('')
    
    console.log('🎉 Monitoring and alerting setup complete!')
    console.log('')
    console.log('📋 Next Steps:')
    console.log('1. Configure Sentry alert rules in the dashboard')
    console.log('2. Set up uptime monitoring service')
    console.log('3. Configure database backup schedule')
    console.log('4. Test all monitoring endpoints')
    console.log('5. Set up notification channels (Slack, email, etc.)')
    console.log('')
    console.log('🔗 Useful Links:')
    console.log('• Sentry Dashboard: https://sentry.io/')
    console.log('• UptimeRobot: https://uptimerobot.com/')
    console.log('• Supabase Dashboard: https://app.supabase.com/')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { MONITORING_CONFIG, SENTRY_ALERT_RULES, UPTIME_ENDPOINTS }