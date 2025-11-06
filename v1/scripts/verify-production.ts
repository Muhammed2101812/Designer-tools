#!/usr/bin/env tsx

/**
 * Production Verification Script
 * 
 * This script verifies that the production deployment is working correctly
 * by testing critical functionality and endpoints.
 */

import { z } from 'zod'
import chalk from 'chalk'

interface VerificationResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  details?: string
}

class ProductionVerifier {
  private results: VerificationResult[] = []
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, details?: string) {
    this.results.push({ name, status, message, details })
  }

  private log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
    }
    console.log(colors[type](message))
  }

  async verifyHomepage() {
    this.log('\n🏠 Verifying Homepage...', 'info')

    try {
      const response = await fetch(this.baseUrl)
      
      if (response.ok) {
        const html = await response.text()
        
        if (html.includes('Design Kit') || html.includes('design-kit')) {
          this.addResult('Homepage', 'pass', 'Homepage loads successfully')
        } else {
          this.addResult('Homepage', 'fail', 'Homepage loads but content seems incorrect')
        }
      } else {
        this.addResult('Homepage', 'fail', `Homepage returned ${response.status}`)
      }
    } catch (error) {
      this.addResult('Homepage', 'fail', 'Failed to load homepage', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifyHealthEndpoint() {
    this.log('\n❤️ Verifying Health Endpoint...', 'info')

    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      
      if (response.ok) {
        const data = await response.json()
        this.addResult('Health Endpoint', 'pass', 'Health endpoint responds correctly')
      } else if (response.status === 404) {
        this.addResult('Health Endpoint', 'skip', 'Health endpoint not implemented')
      } else {
        this.addResult('Health Endpoint', 'fail', `Health endpoint returned ${response.status}`)
      }
    } catch (error) {
      this.addResult('Health Endpoint', 'skip', 'Health endpoint not accessible')
    }
  }

  async verifyStripeWebhook() {
    this.log('\n💳 Verifying Stripe Webhook...', 'info')

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      this.addResult('Stripe Webhook', 'skip', 'Webhook secret not configured')
      return
    }

    try {
      // Test webhook endpoint exists (without valid signature, should return 400)
      const response = await fetch(`${this.baseUrl}/api/stripe/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      })

      if (response.status === 400) {
        this.addResult('Stripe Webhook', 'pass', 'Webhook endpoint exists and validates signatures')
      } else {
        this.addResult('Stripe Webhook', 'fail', `Unexpected webhook response: ${response.status}`)
      }
    } catch (error) {
      this.addResult('Stripe Webhook', 'fail', 'Webhook endpoint not accessible', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifyDatabaseConnection() {
    this.log('\n🗄️ Verifying Database Connection...', 'info')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      this.addResult('Database Connection', 'fail', 'Supabase credentials not configured')
      return
    }

    try {
      // Test Supabase connection by checking the health endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      })

      if (response.ok) {
        this.addResult('Database Connection', 'pass', 'Database connection successful')
      } else {
        this.addResult('Database Connection', 'fail', `Database connection failed: ${response.status}`)
      }
    } catch (error) {
      this.addResult('Database Connection', 'fail', 'Database connection error', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifyRedisConnection() {
    this.log('\n🔴 Verifying Redis Connection...', 'info')

    const redisUrl = process.env.UPSTASH_REDIS_URL
    const redisToken = process.env.UPSTASH_REDIS_TOKEN

    if (!redisUrl || !redisToken) {
      this.addResult('Redis Connection', 'skip', 'Redis not configured')
      return
    }

    try {
      // Test Redis connection with a simple ping
      const response = await fetch(`${redisUrl}/ping`, {
        headers: {
          'Authorization': `Bearer ${redisToken}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.result === 'PONG') {
          this.addResult('Redis Connection', 'pass', 'Redis connection successful')
        } else {
          this.addResult('Redis Connection', 'fail', 'Redis ping failed')
        }
      } else {
        this.addResult('Redis Connection', 'fail', `Redis connection failed: ${response.status}`)
      }
    } catch (error) {
      this.addResult('Redis Connection', 'fail', 'Redis connection error', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifySentryConfiguration() {
    this.log('\n🐛 Verifying Sentry Configuration...', 'info')

    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

    if (!sentryDsn) {
      this.addResult('Sentry Configuration', 'skip', 'Sentry not configured')
      return
    }

    try {
      // Parse DSN to verify format
      const url = new URL(sentryDsn)
      if (url.hostname.includes('sentry.io')) {
        this.addResult('Sentry Configuration', 'pass', 'Sentry DSN is valid')
      } else {
        this.addResult('Sentry Configuration', 'fail', 'Invalid Sentry DSN format')
      }
    } catch (error) {
      this.addResult('Sentry Configuration', 'fail', 'Invalid Sentry DSN', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifySSLCertificate() {
    this.log('\n🔒 Verifying SSL Certificate...', 'info')

    if (!this.baseUrl.startsWith('https://')) {
      this.addResult('SSL Certificate', 'skip', 'Not using HTTPS')
      return
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
      })

      if (response.ok) {
        this.addResult('SSL Certificate', 'pass', 'SSL certificate is valid')
      } else {
        this.addResult('SSL Certificate', 'fail', 'SSL certificate validation failed')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('certificate')) {
        this.addResult('SSL Certificate', 'fail', 'SSL certificate error', error.message)
      } else {
        this.addResult('SSL Certificate', 'fail', 'SSL verification failed', error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  async verifySecurityHeaders() {
    this.log('\n🛡️ Verifying Security Headers...', 'info')

    try {
      const response = await fetch(this.baseUrl, { method: 'HEAD' })
      const headers = response.headers

      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security',
        'x-xss-protection',
      ]

      const missingHeaders = securityHeaders.filter(header => !headers.has(header))

      if (missingHeaders.length === 0) {
        this.addResult('Security Headers', 'pass', 'All security headers present')
      } else {
        this.addResult('Security Headers', 'fail', `Missing headers: ${missingHeaders.join(', ')}`)
      }
    } catch (error) {
      this.addResult('Security Headers', 'fail', 'Failed to check security headers', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  printResults() {
    this.log('\n📊 Production Verification Results', 'info')
    this.log('=' .repeat(60), 'info')

    let passCount = 0
    let failCount = 0
    let skipCount = 0

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'skip' ? '⏭️' : '❌'
      const color = result.status === 'pass' ? 'success' : result.status === 'skip' ? 'warn' : 'error'
      
      this.log(`${icon} ${result.name}: ${result.message}`, color)
      
      if (result.details) {
        this.log(`   Details: ${result.details}`, 'info')
      }

      if (result.status === 'pass') passCount++
      else if (result.status === 'fail') failCount++
      else skipCount++
    })

    this.log('\n' + '=' .repeat(60), 'info')
    this.log(`✅ Passed: ${passCount} | ❌ Failed: ${failCount} | ⏭️ Skipped: ${skipCount}`, 'info')

    if (failCount > 0) {
      this.log('\n❌ PRODUCTION VERIFICATION FAILED', 'error')
      this.log('Fix the issues above before considering the deployment successful.', 'error')
      return false
    } else {
      this.log('\n✅ PRODUCTION VERIFICATION SUCCESSFUL', 'success')
      this.log('Your production deployment appears to be working correctly!', 'success')
      return true
    }
  }

  async run() {
    this.log('🔍 Design Kit Production Verification', 'info')
    this.log(`🌐 Testing URL: ${this.baseUrl}`, 'info')
    this.log('=' .repeat(60), 'info')

    await this.verifyHomepage()
    await this.verifyHealthEndpoint()
    await this.verifyStripeWebhook()
    await this.verifyDatabaseConnection()
    await this.verifyRedisConnection()
    await this.verifySentryConfiguration()
    await this.verifySSLCertificate()
    await this.verifySecurityHeaders()

    const success = this.printResults()
    process.exit(success ? 0 : 1)
  }
}

// Run the verifier
if (require.main === module) {
  const verifier = new ProductionVerifier()
  verifier.run().catch(console.error)
}

export { ProductionVerifier }