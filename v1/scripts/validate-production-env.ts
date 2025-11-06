#!/usr/bin/env tsx

/**
 * Production Environment Validation Script
 * 
 * This script validates that all production environment variables
 * are properly configured before deployment.
 */

import { z } from 'zod'
import chalk from 'chalk'

// Production environment schema with detailed validation
const productionEnvSchema = z.object({
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().refine(
    (url) => {
      if (!url.startsWith('https://')) return false
      if (url.includes('localhost') || url.includes('127.0.0.1')) return false
      if (url.includes('ngrok') || url.includes('tunnel')) return false
      return true
    },
    'Production URL must use HTTPS and cannot be localhost, ngrok, or tunnel'
  ),
  NODE_ENV: z.literal('production'),

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().refine(
    (url) => url.includes('.supabase.co') && !url.includes('localhost'),
    'Must be a valid production Supabase URL'
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100).refine(
    (key) => key.startsWith('eyJ'),
    'Invalid Supabase anonymous key format'
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100).refine(
    (key) => key.startsWith('eyJ'),
    'Invalid Supabase service role key format'
  ),

  // Stripe Configuration (Live Mode Required)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_live_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_live_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PREMIUM_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_PRO_PRICE_ID: z.string().startsWith('price_'),

  // Optional but recommended services
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  EMAIL_FROM: z.string().email().optional(),

  // External API services (optional)
  REMOVE_BG_API_KEY: z.string().min(1).optional(),
  REPLICATE_API_KEY: z.string().min(1).optional(),
})

interface ValidationResult {
  category: string
  name: string
  status: 'pass' | 'fail' | 'warn' | 'missing'
  message: string
  value?: string
  required: boolean
}

class ProductionEnvValidator {
  private results: ValidationResult[] = []

  private log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
    }
    console.log(colors[type](message))
  }

  private addResult(
    category: string,
    name: string,
    status: ValidationResult['status'],
    message: string,
    value?: string,
    required = false
  ) {
    this.results.push({ category, name, status, message, value, required })
  }

  private maskSensitiveValue(key: string, value: string): string {
    const sensitiveKeys = [
      'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE'
    ]
    
    if (sensitiveKeys.some(sensitive => key.includes(sensitive))) {
      if (value.length <= 8) return '***'
      return value.substring(0, 8) + '...'
    }
    
    return value
  }

  private validateAppConfiguration() {
    this.log('\n🌐 Validating App Configuration...', 'info')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const nodeEnv = process.env.NODE_ENV

    // App URL validation
    if (!appUrl) {
      this.addResult('App', 'NEXT_PUBLIC_APP_URL', 'missing', 'App URL is required', undefined, true)
    } else {
      try {
        const url = new URL(appUrl)
        
        if (!url.protocol.startsWith('https')) {
          this.addResult('App', 'NEXT_PUBLIC_APP_URL', 'fail', 'Must use HTTPS in production', appUrl, true)
        } else if (url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1')) {
          this.addResult('App', 'NEXT_PUBLIC_APP_URL', 'fail', 'Cannot use localhost in production', appUrl, true)
        } else if (url.hostname.includes('ngrok') || url.hostname.includes('tunnel')) {
          this.addResult('App', 'NEXT_PUBLIC_APP_URL', 'warn', 'Using tunnel service - not recommended for production', appUrl, true)
        } else {
          this.addResult('App', 'NEXT_PUBLIC_APP_URL', 'pass', 'Valid production URL', appUrl, true)
        }
      } catch {
        this.addResult('App', 'NEXT_PUBLIC_APP_URL', 'fail', 'Invalid URL format', appUrl, true)
      }
    }

    // Node environment validation
    if (nodeEnv !== 'production') {
      this.addResult('App', 'NODE_ENV', 'fail', 'Must be set to "production"', nodeEnv, true)
    } else {
      this.addResult('App', 'NODE_ENV', 'pass', 'Correctly set to production', nodeEnv, true)
    }
  }

  private validateSupabaseConfiguration() {
    this.log('\n🗄️ Validating Supabase Configuration...', 'info')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Supabase URL validation
    if (!supabaseUrl) {
      this.addResult('Supabase', 'NEXT_PUBLIC_SUPABASE_URL', 'missing', 'Supabase URL is required', undefined, true)
    } else if (!supabaseUrl.includes('.supabase.co')) {
      this.addResult('Supabase', 'NEXT_PUBLIC_SUPABASE_URL', 'fail', 'Invalid Supabase URL format', supabaseUrl, true)
    } else if (supabaseUrl.includes('localhost')) {
      this.addResult('Supabase', 'NEXT_PUBLIC_SUPABASE_URL', 'fail', 'Cannot use localhost Supabase in production', supabaseUrl, true)
    } else {
      this.addResult('Supabase', 'NEXT_PUBLIC_SUPABASE_URL', 'pass', 'Valid Supabase URL', supabaseUrl, true)
    }

    // Anonymous key validation
    if (!anonKey) {
      this.addResult('Supabase', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'missing', 'Anonymous key is required', undefined, true)
    } else if (!anonKey.startsWith('eyJ') || anonKey.length < 100) {
      this.addResult('Supabase', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'fail', 'Invalid anonymous key format', this.maskSensitiveValue('ANON_KEY', anonKey), true)
    } else {
      this.addResult('Supabase', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'pass', 'Valid anonymous key', this.maskSensitiveValue('ANON_KEY', anonKey), true)
    }

    // Service role key validation
    if (!serviceKey) {
      this.addResult('Supabase', 'SUPABASE_SERVICE_ROLE_KEY', 'missing', 'Service role key is required', undefined, true)
    } else if (!serviceKey.startsWith('eyJ') || serviceKey.length < 100) {
      this.addResult('Supabase', 'SUPABASE_SERVICE_ROLE_KEY', 'fail', 'Invalid service role key format', this.maskSensitiveValue('SERVICE_KEY', serviceKey), true)
    } else {
      this.addResult('Supabase', 'SUPABASE_SERVICE_ROLE_KEY', 'pass', 'Valid service role key', this.maskSensitiveValue('SERVICE_KEY', serviceKey), true)
    }
  }

  private validateStripeConfiguration() {
    this.log('\n💳 Validating Stripe Configuration...', 'info')

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const secretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID

    // Publishable key validation
    if (!publishableKey) {
      this.addResult('Stripe', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'missing', 'Publishable key is required', undefined, true)
    } else if (!publishableKey.startsWith('pk_live_')) {
      this.addResult('Stripe', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'fail', 'Must use live publishable key (pk_live_)', this.maskSensitiveValue('PK', publishableKey), true)
    } else {
      this.addResult('Stripe', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pass', 'Valid live publishable key', this.maskSensitiveValue('PK', publishableKey), true)
    }

    // Secret key validation
    if (!secretKey) {
      this.addResult('Stripe', 'STRIPE_SECRET_KEY', 'missing', 'Secret key is required', undefined, true)
    } else if (!secretKey.startsWith('sk_live_')) {
      this.addResult('Stripe', 'STRIPE_SECRET_KEY', 'fail', 'Must use live secret key (sk_live_)', this.maskSensitiveValue('SK', secretKey), true)
    } else {
      this.addResult('Stripe', 'STRIPE_SECRET_KEY', 'pass', 'Valid live secret key', this.maskSensitiveValue('SK', secretKey), true)
    }

    // Webhook secret validation
    if (!webhookSecret) {
      this.addResult('Stripe', 'STRIPE_WEBHOOK_SECRET', 'missing', 'Webhook secret is required', undefined, true)
    } else if (!webhookSecret.startsWith('whsec_')) {
      this.addResult('Stripe', 'STRIPE_WEBHOOK_SECRET', 'fail', 'Invalid webhook secret format', this.maskSensitiveValue('WHSEC', webhookSecret), true)
    } else {
      this.addResult('Stripe', 'STRIPE_WEBHOOK_SECRET', 'pass', 'Valid webhook secret', this.maskSensitiveValue('WHSEC', webhookSecret), true)
    }

    // Price IDs validation
    if (!premiumPriceId) {
      this.addResult('Stripe', 'STRIPE_PREMIUM_PRICE_ID', 'missing', 'Premium price ID is required', undefined, true)
    } else if (!premiumPriceId.startsWith('price_')) {
      this.addResult('Stripe', 'STRIPE_PREMIUM_PRICE_ID', 'fail', 'Invalid price ID format', premiumPriceId, true)
    } else {
      this.addResult('Stripe', 'STRIPE_PREMIUM_PRICE_ID', 'pass', 'Valid premium price ID', premiumPriceId, true)
    }

    if (!proPriceId) {
      this.addResult('Stripe', 'STRIPE_PRO_PRICE_ID', 'missing', 'Pro price ID is required', undefined, true)
    } else if (!proPriceId.startsWith('price_')) {
      this.addResult('Stripe', 'STRIPE_PRO_PRICE_ID', 'fail', 'Invalid price ID format', proPriceId, true)
    } else {
      this.addResult('Stripe', 'STRIPE_PRO_PRICE_ID', 'pass', 'Valid pro price ID', proPriceId, true)
    }
  }

  private validateOptionalServices() {
    this.log('\n🔧 Validating Optional Services...', 'info')

    // Redis validation
    const redisUrl = process.env.UPSTASH_REDIS_URL
    const redisToken = process.env.UPSTASH_REDIS_TOKEN

    if (!redisUrl || !redisToken) {
      this.addResult('Redis', 'Rate Limiting', 'warn', 'Redis not configured - rate limiting will be disabled')
    } else {
      try {
        new URL(redisUrl)
        this.addResult('Redis', 'UPSTASH_REDIS_URL', 'pass', 'Valid Redis URL', redisUrl)
        this.addResult('Redis', 'UPSTASH_REDIS_TOKEN', 'pass', 'Redis token configured', this.maskSensitiveValue('TOKEN', redisToken))
      } catch {
        this.addResult('Redis', 'UPSTASH_REDIS_URL', 'fail', 'Invalid Redis URL format', redisUrl)
      }
    }

    // Sentry validation
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN
    const sentryOrg = process.env.SENTRY_ORG
    const sentryProject = process.env.SENTRY_PROJECT

    if (!sentryDsn) {
      this.addResult('Sentry', 'Error Tracking', 'warn', 'Sentry not configured - error tracking will be disabled')
    } else {
      try {
        const url = new URL(sentryDsn)
        if (url.hostname.includes('sentry.io')) {
          this.addResult('Sentry', 'NEXT_PUBLIC_SENTRY_DSN', 'pass', 'Valid Sentry DSN', sentryDsn)
        } else {
          this.addResult('Sentry', 'NEXT_PUBLIC_SENTRY_DSN', 'fail', 'Invalid Sentry DSN format', sentryDsn)
        }
      } catch {
        this.addResult('Sentry', 'NEXT_PUBLIC_SENTRY_DSN', 'fail', 'Invalid Sentry DSN format', sentryDsn)
      }

      if (sentryAuthToken) {
        this.addResult('Sentry', 'SENTRY_AUTH_TOKEN', 'pass', 'Auth token configured', this.maskSensitiveValue('TOKEN', sentryAuthToken))
      }
      if (sentryOrg) {
        this.addResult('Sentry', 'SENTRY_ORG', 'pass', 'Organization configured', sentryOrg)
      }
      if (sentryProject) {
        this.addResult('Sentry', 'SENTRY_PROJECT', 'pass', 'Project configured', sentryProject)
      }
    }

    // Resend validation
    const resendApiKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM

    if (!resendApiKey) {
      this.addResult('Email', 'Email Service', 'warn', 'Resend not configured - email notifications will be disabled')
    } else if (!resendApiKey.startsWith('re_')) {
      this.addResult('Email', 'RESEND_API_KEY', 'fail', 'Invalid Resend API key format', this.maskSensitiveValue('RESEND', resendApiKey))
    } else {
      this.addResult('Email', 'RESEND_API_KEY', 'pass', 'Valid Resend API key', this.maskSensitiveValue('RESEND', resendApiKey))
      
      if (emailFrom) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(emailFrom)) {
          this.addResult('Email', 'EMAIL_FROM', 'pass', 'Valid from email address', emailFrom)
        } else {
          this.addResult('Email', 'EMAIL_FROM', 'fail', 'Invalid email format', emailFrom)
        }
      } else {
        this.addResult('Email', 'EMAIL_FROM', 'warn', 'From email not configured')
      }
    }

    // External APIs validation
    const removeBgKey = process.env.REMOVE_BG_API_KEY
    const replicateKey = process.env.REPLICATE_API_KEY

    if (removeBgKey) {
      this.addResult('APIs', 'REMOVE_BG_API_KEY', 'pass', 'Background remover API configured', this.maskSensitiveValue('REMOVEBG', removeBgKey))
    } else {
      this.addResult('APIs', 'Background Remover', 'warn', 'Remove.bg API not configured - background remover tool will be disabled')
    }

    if (replicateKey) {
      this.addResult('APIs', 'REPLICATE_API_KEY', 'pass', 'Image upscaler API configured', this.maskSensitiveValue('REPLICATE', replicateKey))
    } else {
      this.addResult('APIs', 'Image Upscaler', 'warn', 'Replicate API not configured - image upscaler tool will be disabled')
    }
  }

  private printResults() {
    this.log('\n📊 Production Environment Validation Results', 'info')
    this.log('=' .repeat(80), 'info')

    const categories = [...new Set(this.results.map(r => r.category))]
    let totalPass = 0
    let totalFail = 0
    let totalWarn = 0
    let totalMissing = 0

    categories.forEach(category => {
      this.log(`\n📁 ${category}:`, 'info')
      
      const categoryResults = this.results.filter(r => r.category === category)
      categoryResults.forEach(result => {
        const icon = result.status === 'pass' ? '✅' : 
                     result.status === 'fail' ? '❌' : 
                     result.status === 'warn' ? '⚠️' : '❓'
        
        const color = result.status === 'pass' ? 'success' : 
                      result.status === 'fail' ? 'error' : 
                      result.status === 'warn' ? 'warn' : 'error'

        const valueText = result.value ? ` (${result.value})` : ''
        this.log(`  ${icon} ${result.name}: ${result.message}${valueText}`, color)

        if (result.status === 'pass') totalPass++
        else if (result.status === 'fail') totalFail++
        else if (result.status === 'warn') totalWarn++
        else if (result.status === 'missing') totalMissing++
      })
    })

    this.log('\n' + '=' .repeat(80), 'info')
    this.log(`✅ Pass: ${totalPass} | ❌ Fail: ${totalFail} | ⚠️ Warn: ${totalWarn} | ❓ Missing: ${totalMissing}`, 'info')

    const criticalIssues = totalFail + totalMissing
    if (criticalIssues > 0) {
      this.log('\n❌ VALIDATION FAILED', 'error')
      this.log(`Found ${criticalIssues} critical issues that must be fixed before production deployment.`, 'error')
      return false
    } else if (totalWarn > 0) {
      this.log('\n⚠️ VALIDATION PASSED WITH WARNINGS', 'warn')
      this.log(`Found ${totalWarn} warnings. Some optional features may be disabled.`, 'warn')
      return true
    } else {
      this.log('\n✅ VALIDATION SUCCESSFUL', 'success')
      this.log('All environment variables are properly configured for production!', 'success')
      return true
    }
  }

  private printNextSteps() {
    this.log('\n🚀 Next Steps for Production Deployment:', 'info')
    this.log('1. Run production deployment setup: npm run deploy:setup', 'info')
    this.log('2. Update Stripe webhook endpoint to production URL', 'info')
    this.log('3. Run database migrations: npm run db:migrate', 'info')
    this.log('4. Deploy to your hosting platform', 'info')
    this.log('5. Run post-deployment verification: npm run verify:production', 'info')
  }

  run() {
    this.log('🔍 Design Kit Production Environment Validator', 'info')
    this.log('This tool validates your environment variables for production deployment.', 'info')

    this.validateAppConfiguration()
    this.validateSupabaseConfiguration()
    this.validateStripeConfiguration()
    this.validateOptionalServices()

    const success = this.printResults()
    
    if (success) {
      this.printNextSteps()
    }

    process.exit(success ? 0 : 1)
  }
}

// Run the validator
if (require.main === module) {
  const validator = new ProductionEnvValidator()
  validator.run()
}

export { ProductionEnvValidator }