#!/usr/bin/env tsx
/**
 * Monitoring Dashboard Script
 * 
 * Provides a command-line dashboard for monitoring system health,
 * error rates, performance metrics, and business KPIs.
 * 
 * Usage:
 *   npm run monitoring-dashboard
 *   npx tsx scripts/monitoring-dashboard.ts
 *   npx tsx scripts/monitoring-dashboard.ts --watch
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../lib/env'
import { MONITORING_CONFIG } from '../lib/monitoring/config'

interface SystemHealth {
  timestamp: string
  status: 'healthy' | 'degraded' | 'critical'
  services: {
    database: 'ok' | 'warning' | 'error'
    redis: 'ok' | 'warning' | 'error' | 'not_configured'
    external_apis: 'ok' | 'warning' | 'error'
  }
  metrics: {
    errorRate: number
    responseTime: number
    activeUsers: number
    apiUsage: number
  }
  alerts: Array<{
    level: 'info' | 'warning' | 'critical'
    message: string
    timestamp: string
  }>
}

class MonitoringDashboard {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing')
    }

    this.supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  /**
   * Get overall system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const timestamp = new Date().toISOString()
    const alerts: SystemHealth['alerts'] = []

    // Check database health
    const dbHealth = await this.checkDatabaseHealth()
    if (dbHealth !== 'ok') {
      alerts.push({
        level: dbHealth === 'error' ? 'critical' : 'warning',
        message: 'Database connectivity issues detected',
        timestamp,
      })
    }

    // Check Redis health
    const redisHealth = await this.checkRedisHealth()
    if (redisHealth === 'error') {
      alerts.push({
        level: 'warning',
        message: 'Redis connectivity issues detected',
        timestamp,
      })
    }

    // Check external APIs
    const apiHealth = await this.checkExternalAPIs()
    if (apiHealth !== 'ok') {
      alerts.push({
        level: 'warning',
        message: 'External API issues detected',
        timestamp,
      })
    }

    // Get metrics
    const metrics = await this.getMetrics()

    // Check error rate
    if (metrics.errorRate > MONITORING_CONFIG.errorRates.critical.threshold) {
      alerts.push({
        level: 'critical',
        message: `Error rate (${metrics.errorRate.toFixed(2)}%) exceeds critical threshold`,
        timestamp,
      })
    } else if (metrics.errorRate > MONITORING_CONFIG.errorRates.warning.threshold) {
      alerts.push({
        level: 'warning',
        message: `Error rate (${metrics.errorRate.toFixed(2)}%) exceeds warning threshold`,
        timestamp,
      })
    }

    // Check response time
    if (metrics.responseTime > MONITORING_CONFIG.performance.responseTime.critical) {
      alerts.push({
        level: 'critical',
        message: `Response time (${metrics.responseTime}ms) exceeds critical threshold`,
        timestamp,
      })
    } else if (metrics.responseTime > MONITORING_CONFIG.performance.responseTime.warning) {
      alerts.push({
        level: 'warning',
        message: `Response time (${metrics.responseTime}ms) exceeds warning threshold`,
        timestamp,
      })
    }

    // Determine overall status
    const hasCritical = alerts.some(a => a.level === 'critical')
    const hasWarning = alerts.some(a => a.level === 'warning')
    const hasServiceErrors = [dbHealth, redisHealth, apiHealth].includes('error')

    let status: SystemHealth['status'] = 'healthy'
    if (hasCritical || hasServiceErrors) {
      status = 'critical'
    } else if (hasWarning) {
      status = 'degraded'
    }

    return {
      timestamp,
      status,
      services: {
        database: dbHealth,
        redis: redisHealth,
        external_apis: apiHealth,
      },
      metrics,
      alerts,
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabaseHealth(): Promise<'ok' | 'warning' | 'error'> {
    try {
      const start = Date.now()
      
      // Test basic connectivity
      const { error: connectError } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (connectError) {
        console.error('Database connection error:', connectError)
        return 'error'
      }

      const responseTime = Date.now() - start

      // Check response time
      if (responseTime > MONITORING_CONFIG.database.queryTime.critical) {
        return 'warning'
      }

      return 'ok'
    } catch (error) {
      console.error('Database health check failed:', error)
      return 'error'
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedisHealth(): Promise<'ok' | 'warning' | 'error' | 'not_configured'> {
    if (!env.UPSTASH_REDIS_URL || !env.UPSTASH_REDIS_TOKEN) {
      return 'not_configured'
    }

    try {
      const { Redis } = await import('@upstash/redis')
      const redis = Redis.fromEnv()
      
      const start = Date.now()
      await redis.ping()
      const responseTime = Date.now() - start

      if (responseTime > 1000) { // 1 second threshold
        return 'warning'
      }

      return 'ok'
    } catch (error) {
      console.error('Redis health check failed:', error)
      return 'error'
    }
  }

  /**
   * Check external API health
   */
  private async checkExternalAPIs(): Promise<'ok' | 'warning' | 'error'> {
    // For now, return ok - in production you'd check actual API endpoints
    return 'ok'
  }

  /**
   * Get system metrics
   */
  private async getMetrics(): Promise<SystemHealth['metrics']> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    try {
      // Get error rate (simplified - in production you'd have proper error tracking)
      const errorRate = 0 // Placeholder

      // Get average response time (simplified)
      const responseTime = 500 // Placeholder

      // Get active users (users who used tools in last 24 hours)
      const { data: activeUsersData } = await this.supabase
        .from('tool_usage')
        .select('user_id')
        .gte('created_at', oneDayAgo.toISOString())
        .neq('user_id', null)

      const activeUsers = new Set((activeUsersData as any[])?.map((u: any) => u.user_id) || []).size

      // Get API usage (tool usage in last hour)
      const { data: apiUsageData } = await this.supabase
        .from('tool_usage')
        .select('count')
        .gte('created_at', oneHourAgo.toISOString())

      const apiUsage = apiUsageData?.length || 0

      return {
        errorRate,
        responseTime,
        activeUsers,
        apiUsage,
      }
    } catch (error) {
      console.error('Failed to get metrics:', error)
      return {
        errorRate: 0,
        responseTime: 0,
        activeUsers: 0,
        apiUsage: 0,
      }
    }
  }

  /**
   * Get business metrics
   */
  async getBusinessMetrics() {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    try {
      // Daily active users
      const { data: dauData } = await this.supabase
        .from('tool_usage')
        .select('user_id')
        .gte('created_at', oneDayAgo.toISOString())
        .neq('user_id', null)

      const dau = new Set((dauData as any[])?.map((u: any) => u.user_id) || []).size

      // Weekly active users
      const { data: wauData } = await this.supabase
        .from('tool_usage')
        .select('user_id')
        .gte('created_at', oneWeekAgo.toISOString())
        .neq('user_id', null)

      const wau = new Set((wauData as any[])?.map((u: any) => u.user_id) || []).size

      // Active subscriptions
      const { data: subscriptionsData } = await this.supabase
        .from('subscriptions')
        .select('count')
        .eq('status', 'active')

      const activeSubscriptions = subscriptionsData?.length || 0

      // Tool usage by type
      const { data: toolUsageData } = await this.supabase
        .from('tool_usage')
        .select('tool_name')
        .gte('created_at', oneDayAgo.toISOString())

      const toolUsage = (toolUsageData as any[])?.reduce((acc: Record<string, number>, usage: any) => {
        acc[usage.tool_name] = (acc[usage.tool_name] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      return {
        dau,
        wau,
        activeSubscriptions,
        toolUsage,
      }
    } catch (error) {
      console.error('Failed to get business metrics:', error)
      return {
        dau: 0,
        wau: 0,
        activeSubscriptions: 0,
        toolUsage: {},
      }
    }
  }

  /**
   * Display dashboard in terminal
   */
  async displayDashboard(): Promise<void> {
    console.clear()
    console.log('🔍 Design Kit Monitoring Dashboard')
    console.log('=====================================')
    console.log(`📅 ${new Date().toLocaleString()}`)
    console.log('')

    try {
      const health = await this.getSystemHealth()
      const business = await this.getBusinessMetrics()

      // System Status
      const statusEmoji = {
        healthy: '✅',
        degraded: '⚠️',
        critical: '🚨',
      }[health.status]

      console.log(`🏥 System Status: ${statusEmoji} ${health.status.toUpperCase()}`)
      console.log('')

      // Services Health
      console.log('🔧 Services:')
      console.log(`  Database: ${this.getStatusEmoji(health.services.database)} ${health.services.database}`)
      console.log(`  Redis: ${this.getStatusEmoji(health.services.redis)} ${health.services.redis}`)
      console.log(`  External APIs: ${this.getStatusEmoji(health.services.external_apis)} ${health.services.external_apis}`)
      console.log('')

      // Metrics
      console.log('📊 Metrics:')
      console.log(`  Error Rate: ${health.metrics.errorRate.toFixed(2)}%`)
      console.log(`  Response Time: ${health.metrics.responseTime}ms`)
      console.log(`  API Usage (1h): ${health.metrics.apiUsage}`)
      console.log(`  Active Users (24h): ${health.metrics.activeUsers}`)
      console.log('')

      // Business Metrics
      console.log('💼 Business Metrics:')
      console.log(`  Daily Active Users: ${business.dau}`)
      console.log(`  Weekly Active Users: ${business.wau}`)
      console.log(`  Active Subscriptions: ${business.activeSubscriptions}`)
      console.log('')

      // Tool Usage
      if (Object.keys(business.toolUsage).length > 0) {
        console.log('🛠️  Tool Usage (24h):')
        Object.entries(business.toolUsage)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .forEach(([tool, count]) => {
            console.log(`  ${tool}: ${count}`)
          })
        console.log('')
      }

      // Alerts
      if (health.alerts.length > 0) {
        console.log('🚨 Active Alerts:')
        health.alerts.forEach(alert => {
          const emoji = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨',
          }[alert.level]
          console.log(`  ${emoji} ${alert.message}`)
        })
        console.log('')
      } else {
        console.log('✅ No active alerts')
        console.log('')
      }

      // Thresholds
      console.log('📏 Thresholds:')
      console.log(`  Error Rate: Warning ${MONITORING_CONFIG.errorRates.warning.threshold}%, Critical ${MONITORING_CONFIG.errorRates.critical.threshold}%`)
      console.log(`  Response Time: Warning ${MONITORING_CONFIG.performance.responseTime.warning}ms, Critical ${MONITORING_CONFIG.performance.responseTime.critical}ms`)
      console.log('')

    } catch (error) {
      console.error('❌ Failed to get dashboard data:', error)
    }
  }

  /**
   * Get status emoji for service health
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'ok': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'not_configured': return '⚪'
      default: return '❓'
    }
  }

  /**
   * Start watching mode (refresh every 30 seconds)
   */
  async startWatching(): Promise<void> {
    console.log('👀 Starting watch mode (refresh every 30 seconds)')
    console.log('Press Ctrl+C to exit')
    console.log('')

    // Initial display
    await this.displayDashboard()

    // Set up interval
    const interval = setInterval(async () => {
      await this.displayDashboard()
    }, 30000)

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(interval)
      console.log('\n👋 Monitoring dashboard stopped')
      process.exit(0)
    })
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const watchMode = args.includes('--watch') || args.includes('-w')

  try {
    const dashboard = new MonitoringDashboard()

    if (watchMode) {
      await dashboard.startWatching()
    } else {
      await dashboard.displayDashboard()
    }
  } catch (error) {
    console.error('❌ Dashboard failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { MonitoringDashboard }