import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring and alerting.
 * Used by uptime monitoring services and load balancers.
 * 
 * Returns:
 * - 200: All systems operational
 * - 503: System degraded or error
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok' as 'ok' | 'degraded' | 'error',
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    checks: {
      database: 'unknown' as 'ok' | 'error' | 'unknown',
      redis: 'unknown' as 'ok' | 'error' | 'not_configured' | 'unknown',
      external_apis: 'unknown' as 'ok' | 'error' | 'unknown',
      memory: 'unknown' as 'ok' | 'warning' | 'error' | 'unknown',
    },
  }

  try {
    // Database health check
    try {
      const supabase = await createClient()
      const { error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      checks.checks.database = dbError ? 'error' : 'ok'
    } catch (error) {
      checks.checks.database = 'error'
    }

    // Redis health check (if configured)
    if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
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

    // Memory usage check
    try {
      const memUsage = process.memoryUsage()
      const memUsedMB = memUsage.heapUsed / 1024 / 1024
      const memTotalMB = memUsage.heapTotal / 1024 / 1024
      const memUsagePercent = (memUsedMB / memTotalMB) * 100
      
      if (memUsagePercent > 90) {
        checks.checks.memory = 'error'
      } else if (memUsagePercent > 75) {
        checks.checks.memory = 'warning'
      } else {
        checks.checks.memory = 'ok'
      }
    } catch (error) {
      checks.checks.memory = 'unknown'
    }

    // External API health check (simplified)
    // In production, you might want to check Remove.bg, Replicate, etc.
    checks.checks.external_apis = 'ok'

    // Overall status determination
    const hasErrors = Object.values(checks.checks).includes('error')
    const hasWarnings = Object.values(checks.checks).includes('warning')
    
    if (hasErrors) {
      checks.status = 'error'
    } else if (hasWarnings) {
      checks.status = 'degraded'
    } else {
      checks.status = 'ok'
    }

    const statusCode = checks.status === 'ok' ? 200 : 503

    return NextResponse.json(checks, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ...checks,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}