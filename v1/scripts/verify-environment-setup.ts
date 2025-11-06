#!/usr/bin/env tsx

/**
 * Environment Setup Verification Script
 * 
 * Bu script tüm servislerin doğru konfigüre edildiğini kontrol eder
 * Usage: npm run verify-env
 */

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { Redis } from '@upstash/redis'

// Environment schema
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PREMIUM_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_PRO_PRICE_ID: z.string().startsWith('price_'),
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  
  // Sentry
  SENTRY_DSN: z.string().url(),
  
  // Resend
  RESEND_API_KEY: z.string().startsWith('re_'),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

interface TestResult {
  service: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: string
}

class EnvironmentVerifier {
  private results: TestResult[] = []
  private env: z.infer<typeof envSchema>

  constructor() {
    try {
      this.env = envSchema.parse(process.env)
      this.addResult('Environment Variables', 'success', 'All required environment variables are present')
    } catch (error) {
      this.addResult('Environment Variables', 'error', 'Missing or invalid environment variables', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  }

  private addResult(service: string, status: TestResult['status'], message: string, details?: string) {
    this.results.push({ service, status, message, details })
  }

  async verifySupabase(): Promise<void> {
    try {
      console.log('🔍 Testing Supabase connection...')
      
      const supabase = createClient(
        this.env.NEXT_PUBLIC_SUPABASE_URL,
        this.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Test database connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        this.addResult('Supabase', 'error', 'Database connection failed', error.message)
        return
      }

      // Test auth
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        this.addResult('Supabase Auth', 'warning', 'Auth service test failed', authError.message)
      } else {
        this.addResult('Supabase Auth', 'success', 'Auth service is working')
      }

      this.addResult('Supabase', 'success', 'Database connection successful')
    } catch (error) {
      this.addResult('Supabase', 'error', 'Connection failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifyStripe(): Promise<void> {
    try {
      console.log('🔍 Testing Stripe connection...')
      
      const stripe = new Stripe(this.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
      })

      // Test API connection
      const account = await stripe.accounts.retrieve()
      this.addResult('Stripe', 'success', `Connected to Stripe account: ${account.display_name || account.id}`)

      // Test webhook endpoint
      try {
        const webhooks = await stripe.webhookEndpoints.list({ limit: 10 })
        const hasWebhook = webhooks.data.some(webhook => 
          webhook.url.includes('/api/stripe/webhook')
        )
        
        if (hasWebhook) {
          this.addResult('Stripe Webhooks', 'success', 'Webhook endpoint found')
        } else {
          this.addResult('Stripe Webhooks', 'warning', 'No webhook endpoint found for /api/stripe/webhook')
        }
      } catch (error) {
        this.addResult('Stripe Webhooks', 'warning', 'Could not verify webhook endpoints')
      }

      // Test price IDs
      try {
        await stripe.prices.retrieve(this.env.STRIPE_PREMIUM_PRICE_ID)
        this.addResult('Stripe Premium Price', 'success', 'Premium price ID is valid')
      } catch (error) {
        this.addResult('Stripe Premium Price', 'error', 'Premium price ID is invalid')
      }

      try {
        await stripe.prices.retrieve(this.env.STRIPE_PRO_PRICE_ID)
        this.addResult('Stripe Pro Price', 'success', 'Pro price ID is valid')
      } catch (error) {
        this.addResult('Stripe Pro Price', 'error', 'Pro price ID is invalid')
      }

    } catch (error) {
      this.addResult('Stripe', 'error', 'Connection failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifyRedis(): Promise<void> {
    try {
      console.log('🔍 Testing Redis connection...')
      
      const redis = new Redis({
        url: this.env.UPSTASH_REDIS_REST_URL,
        token: this.env.UPSTASH_REDIS_REST_TOKEN,
      })

      // Test connection with a simple ping
      const testKey = `test:${Date.now()}`
      await redis.set(testKey, 'test-value', { ex: 10 })
      const value = await redis.get(testKey)
      await redis.del(testKey)

      if (value === 'test-value') {
        this.addResult('Redis', 'success', 'Redis connection and operations working')
      } else {
        this.addResult('Redis', 'error', 'Redis operations failed')
      }
    } catch (error) {
      this.addResult('Redis', 'error', 'Connection failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifySentry(): Promise<void> {
    try {
      console.log('🔍 Testing Sentry configuration...')
      
      // Test DSN format
      const dsn = new URL(this.env.SENTRY_DSN)
      if (dsn.hostname.includes('sentry.io')) {
        this.addResult('Sentry', 'success', 'Sentry DSN format is valid')
      } else {
        this.addResult('Sentry', 'warning', 'Sentry DSN format may be invalid')
      }

      // Note: We can't easily test Sentry connection without sending an actual error
      this.addResult('Sentry Config', 'success', 'Sentry configuration appears valid')
    } catch (error) {
      this.addResult('Sentry', 'error', 'Invalid Sentry DSN', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifyResend(): Promise<void> {
    try {
      console.log('🔍 Testing Resend configuration...')
      
      // Test API key format
      if (this.env.RESEND_API_KEY.startsWith('re_')) {
        this.addResult('Resend', 'success', 'Resend API key format is valid')
      } else {
        this.addResult('Resend', 'error', 'Resend API key format is invalid')
      }

      // Note: We can't easily test Resend connection without sending an actual email
      this.addResult('Resend Config', 'success', 'Resend configuration appears valid')
    } catch (error) {
      this.addResult('Resend', 'error', 'Resend verification failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async verifyDatabaseSchema(): Promise<void> {
    try {
      console.log('🔍 Testing database schema...')
      
      const supabase = createClient(
        this.env.NEXT_PUBLIC_SUPABASE_URL,
        this.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Check required tables
      const requiredTables = ['profiles', 'subscriptions', 'tool_usage', 'daily_limits']
      
      for (const table of requiredTables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1)
          
          if (error) {
            this.addResult(`Table: ${table}`, 'error', `Table ${table} not found or not accessible`)
          } else {
            this.addResult(`Table: ${table}`, 'success', `Table ${table} exists and is accessible`)
          }
        } catch (error) {
          this.addResult(`Table: ${table}`, 'error', `Error checking table ${table}`)
        }
      }

      // Check RLS policies
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies')
        .select('*')

      if (!policiesError && policies && policies.length > 0) {
        this.addResult('RLS Policies', 'success', `Found ${policies.length} RLS policies`)
      } else {
        this.addResult('RLS Policies', 'warning', 'Could not verify RLS policies')
      }

    } catch (error) {
      this.addResult('Database Schema', 'error', 'Schema verification failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  printResults(): void {
    console.log('\n' + '='.repeat(60))
    console.log('🔍 ENVIRONMENT SETUP VERIFICATION RESULTS')
    console.log('='.repeat(60))

    const successCount = this.results.filter(r => r.status === 'success').length
    const warningCount = this.results.filter(r => r.status === 'warning').length
    const errorCount = this.results.filter(r => r.status === 'error').length

    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
      console.log(`${icon} ${result.service}: ${result.message}`)
      if (result.details) {
        console.log(`   Details: ${result.details}`)
      }
    })

    console.log('\n' + '-'.repeat(60))
    console.log(`📊 Summary: ${successCount} success, ${warningCount} warnings, ${errorCount} errors`)
    
    if (errorCount > 0) {
      console.log('\n❌ Some critical services are not properly configured.')
      console.log('Please check the errors above and refer to the Environment Setup Guide.')
      process.exit(1)
    } else if (warningCount > 0) {
      console.log('\n⚠️  Setup is mostly complete but some warnings need attention.')
      console.log('Your app should work but some features might not be fully functional.')
    } else {
      console.log('\n🎉 All services are properly configured!')
      console.log('Your environment is ready for development/production.')
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting environment verification...\n')

    await this.verifySupabase()
    await this.verifyStripe()
    await this.verifyRedis()
    await this.verifySentry()
    await this.verifyResend()
    await this.verifyDatabaseSchema()

    this.printResults()
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const verifier = new EnvironmentVerifier()
  verifier.runAllTests().catch(error => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
}

export { EnvironmentVerifier }