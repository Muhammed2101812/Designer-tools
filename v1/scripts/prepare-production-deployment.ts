#!/usr/bin/env tsx

/**
 * Production Deployment Preparation Script
 * 
 * This script helps prepare the Design Kit project for production deployment
 * by validating environment variables, checking service configurations,
 * and providing deployment guidance.
 */

import { z } from 'zod'
import chalk from 'chalk'

// Production environment schema - stricter validation
const productionEnvSchema = z.object({
  // App Configuration (REQUIRED)
  NEXT_PUBLIC_APP_URL: z.string().url().refine(
    (url) => !url.includes('localhost') && !url.includes('127.0.0.1'),
    'Production URL cannot be localhost'
  ),
  NODE_ENV: z.literal('production'),

  // Supabase (REQUIRED)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().refine(
    (url) => url.includes('.supabase.co'),
    'Must be a valid Supabase URL'
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100),

  // Stripe (REQUIRED for payments)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_live_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_live_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PREMIUM_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_PRO_PRICE_ID: z.string().startsWith('price_'),

  // Upstash Redis (RECOMMENDED for rate limiting)
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().min(1).optional(),

  // Sentry (RECOMMENDED for error tracking)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),

  // Resend (RECOMMENDED for emails)
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  EMAIL_FROM: z.string().email().optional(),

  // External APIs (OPTIONAL)
  REMOVE_BG_API_KEY: z.string().min(1).optional(),
  REPLICATE_API_KEY: z.string().min(1).optional(),
})

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  required: boolean
}

class ProductionDeploymentChecker {
  private results: CheckResult[] = []

  private addResult(name: string, status: 'pass' | 'fail' | 'warn', message: string, required = false) {
    this.results.push({ name, status, message, required })
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

  async checkEnvironmentVariables() {
    this.log('\n🔍 Checking Environment Variables...', 'info')

    try {
      const env = productionEnvSchema.parse(process.env)
      this.addResult('Environment Variables', 'pass', 'All required variables are valid', true)
      
      // Additional checks
      if (env.UPSTASH_REDIS_URL && env.UPSTASH_REDIS_TOKEN) {
        this.addResult('Rate Limiting', 'pass', 'Redis configuration found')
      } else {
        this.addResult('Rate Limiting', 'warn', 'Redis not configured - rate limiting disabled')
      }

      if (env.NEXT_PUBLIC_SENTRY_DSN) {
        this.addResult('Error Tracking', 'pass', 'Sentry configuration found')
      } else {
        this.addResult('Error Tracking', 'warn', 'Sentry not configured - error tracking disabled')
      }

      if (env.RESEND_API_KEY) {
        this.addResult('Email Service', 'pass', 'Resend configuration found')
      } else {
        this.addResult('Email Service', 'warn', 'Resend not configured - email notifications disabled')
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.errors.map(e => e.path.join('.')).join(', ')
        this.addResult('Environment Variables', 'fail', `Missing/invalid: ${missingVars}`, true)
      } else {
        this.addResult('Environment Variables', 'fail', 'Validation failed', true)
      }
    }
  }

  async checkStripeConfiguration() {
    this.log('\n💳 Checking Stripe Configuration...', 'info')

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!publishableKey || !secretKey) {
      this.addResult('Stripe Keys', 'fail', 'Stripe keys not configured', true)
      return
    }

    if (!publishableKey.startsWith('pk_live_')) {
      this.addResult('Stripe Mode', 'fail', 'Using test publishable key in production', true)
    } else {
      this.addResult('Stripe Mode', 'pass', 'Using live publishable key')
    }

    if (!secretKey.startsWith('sk_live_')) {
      this.addResult('Stripe Mode', 'fail', 'Using test secret key in production', true)
    } else {
      this.addResult('Stripe Mode', 'pass', 'Using live secret key')
    }

    // Check webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret || !webhookSecret.startsWith('whsec_')) {
      this.addResult('Stripe Webhook', 'fail', 'Invalid webhook secret', true)
    } else {
      this.addResult('Stripe Webhook', 'pass', 'Webhook secret configured')
    }

    // Check price IDs
    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID

    if (!premiumPriceId || !premiumPriceId.startsWith('price_')) {
      this.addResult('Stripe Prices', 'fail', 'Invalid Premium price ID', true)
    } else if (!proPriceId || !proPriceId.startsWith('price_')) {
      this.addResult('Stripe Prices', 'fail', 'Invalid Pro price ID', true)
    } else {
      this.addResult('Stripe Prices', 'pass', 'Price IDs configured')
    }
  }

  async checkSupabaseConfiguration() {
    this.log('\n🗄️ Checking Supabase Configuration...', 'info')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseUrl.includes('.supabase.co')) {
      this.addResult('Supabase URL', 'fail', 'Invalid Supabase URL', true)
    } else {
      this.addResult('Supabase URL', 'pass', 'Valid Supabase URL')
    }

    if (!anonKey || anonKey.length < 100) {
      this.addResult('Supabase Keys', 'fail', 'Invalid anonymous key', true)
    } else if (!serviceKey || serviceKey.length < 100) {
      this.addResult('Supabase Keys', 'fail', 'Invalid service role key', true)
    } else {
      this.addResult('Supabase Keys', 'pass', 'Keys configured')
    }

    // Check if using localhost (development) URL
    if (supabaseUrl && supabaseUrl.includes('localhost')) {
      this.addResult('Supabase Environment', 'fail', 'Using localhost URL in production', true)
    } else {
      this.addResult('Supabase Environment', 'pass', 'Using production URL')
    }
  }

  async checkSecurityConfiguration() {
    this.log('\n🔒 Checking Security Configuration...', 'info')

    // Check if using HTTPS
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl || !appUrl.startsWith('https://')) {
      this.addResult('HTTPS', 'fail', 'App URL must use HTTPS in production', true)
    } else {
      this.addResult('HTTPS', 'pass', 'Using HTTPS')
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
      this.addResult('Node Environment', 'fail', 'NODE_ENV must be "production"', true)
    } else {
      this.addResult('Node Environment', 'pass', 'NODE_ENV is production')
    }
  }

  async checkOptionalServices() {
    this.log('\n🔧 Checking Optional Services...', 'info')

    // Check Redis
    const redisUrl = process.env.UPSTASH_REDIS_URL
    const redisToken = process.env.UPSTASH_REDIS_TOKEN
    
    if (redisUrl && redisToken) {
      this.addResult('Redis Rate Limiting', 'pass', 'Redis configured for rate limiting')
    } else {
      this.addResult('Redis Rate Limiting', 'warn', 'Redis not configured - consider adding for rate limiting')
    }

    // Check Sentry
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (sentryDsn) {
      this.addResult('Error Monitoring', 'pass', 'Sentry configured for error tracking')
    } else {
      this.addResult('Error Monitoring', 'warn', 'Sentry not configured - consider adding for error tracking')
    }

    // Check Resend
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      this.addResult('Email Service', 'pass', 'Resend configured for email notifications')
    } else {
      this.addResult('Email Service', 'warn', 'Resend not configured - email notifications disabled')
    }

    // Check external APIs
    const removeBgKey = process.env.REMOVE_BG_API_KEY
    const replicateKey = process.env.REPLICATE_API_KEY

    if (removeBgKey) {
      this.addResult('Background Remover API', 'pass', 'Remove.bg API configured')
    } else {
      this.addResult('Background Remover API', 'warn', 'Remove.bg API not configured - tool disabled')
    }

    if (replicateKey) {
      this.addResult('Image Upscaler API', 'pass', 'Replicate API configured')
    } else {
      this.addResult('Image Upscaler API', 'warn', 'Replicate API not configured - tool disabled')
    }
  }

  printResults() {
    this.log('\n📊 Production Deployment Check Results', 'info')
    this.log('=' .repeat(50), 'info')

    let hasErrors = false
    let hasWarnings = false

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'
      const color = result.status === 'pass' ? 'success' : result.status === 'warn' ? 'warn' : 'error'
      
      this.log(`${icon} ${result.name}: ${result.message}`, color)
      
      if (result.status === 'fail') hasErrors = true
      if (result.status === 'warn') hasWarnings = true
    })

    this.log('\n' + '=' .repeat(50), 'info')

    if (hasErrors) {
      this.log('❌ DEPLOYMENT BLOCKED: Fix the errors above before deploying to production', 'error')
      return false
    } else if (hasWarnings) {
      this.log('⚠️  DEPLOYMENT READY WITH WARNINGS: Some optional features may be disabled', 'warn')
      return true
    } else {
      this.log('✅ DEPLOYMENT READY: All checks passed!', 'success')
      return true
    }
  }

  printDeploymentInstructions() {
    this.log('\n🚀 Production Deployment Instructions', 'info')
    this.log('=' .repeat(50), 'info')

    const instructions = [
      '1. Update Stripe webhook endpoint to production URL',
      '2. Update Supabase Auth redirect URLs to production domain',
      '3. Run database migrations in production Supabase project',
      '4. Test Stripe webhooks with production endpoint',
      '5. Verify email sending with Resend in production',
      '6. Set up monitoring alerts in Sentry',
      '7. Configure DNS and SSL certificate',
      '8. Deploy to your hosting platform',
      '9. Run post-deployment verification tests',
      '10. Monitor error rates and performance metrics'
    ]

    instructions.forEach(instruction => {
      this.log(`   ${instruction}`, 'info')
    })

    this.log('\n📚 Additional Resources:', 'info')
    this.log('   • docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md', 'info')
    this.log('   • docs/ENVIRONMENT_SETUP.md', 'info')
    this.log('   • scripts/verify-production.ts', 'info')
  }

  async run() {
    this.log('🔍 Design Kit Production Deployment Checker', 'info')
    this.log('=' .repeat(50), 'info')

    await this.checkEnvironmentVariables()
    await this.checkStripeConfiguration()
    await this.checkSupabaseConfiguration()
    await this.checkSecurityConfiguration()
    await this.checkOptionalServices()

    const isReady = this.printResults()
    
    if (isReady) {
      this.printDeploymentInstructions()
    }

    process.exit(isReady ? 0 : 1)
  }
}

// Run the checker
if (require.main === module) {
  const checker = new ProductionDeploymentChecker()
  checker.run().catch(console.error)
}

export { ProductionDeploymentChecker }