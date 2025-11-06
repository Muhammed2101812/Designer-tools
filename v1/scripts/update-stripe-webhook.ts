#!/usr/bin/env tsx

/**
 * Stripe Webhook Update Script
 * 
 * This script helps update Stripe webhook endpoints when moving from
 * development to production or when changing domains.
 */

import chalk from 'chalk'

interface WebhookConfig {
  url: string
  events: string[]
  description: string
}

class StripeWebhookUpdater {
  private log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
    }
    console.log(colors[type](message))
  }

  private getWebhookConfig(): WebhookConfig {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    return {
      url: `${baseUrl}/api/stripe/webhook`,
      events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.subscription.created',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
      ],
      description: 'Design Kit - Subscription and Payment Events'
    }
  }

  private printInstructions() {
    const config = this.getWebhookConfig()
    const isProduction = process.env.NODE_ENV === 'production'
    const stripeMode = isProduction ? 'Live' : 'Test'

    this.log('\n🔧 Stripe Webhook Configuration Instructions', 'info')
    this.log('=' .repeat(60), 'info')

    this.log(`\n📍 Environment: ${stripeMode} Mode`, isProduction ? 'success' : 'warn')
    this.log(`🌐 Webhook URL: ${config.url}`, 'info')

    this.log('\n📋 Step-by-Step Instructions:', 'info')
    this.log('1. Go to Stripe Dashboard: https://dashboard.stripe.com', 'info')
    
    if (isProduction) {
      this.log('2. Make sure you are in LIVE mode (toggle in top-left)', 'warn')
    } else {
      this.log('2. Make sure you are in TEST mode (toggle in top-left)', 'info')
    }

    this.log('3. Navigate to: Developers > Webhooks', 'info')
    this.log('4. Click "Add endpoint" or edit existing endpoint', 'info')
    this.log(`5. Set Endpoint URL to: ${config.url}`, 'success')
    this.log('6. Select the following events:', 'info')

    config.events.forEach(event => {
      this.log(`   ✓ ${event}`, 'success')
    })

    this.log('7. Click "Add endpoint" to save', 'info')
    this.log('8. Copy the webhook signing secret', 'info')
    this.log('9. Update your environment variables:', 'info')
    this.log('   STRIPE_WEBHOOK_SECRET=whsec_...', 'warn')

    this.log('\n🧪 Testing Your Webhook:', 'info')
    this.log('After setting up the webhook, test it with:', 'info')
    this.log(`curl -X POST ${config.url} \\`, 'info')
    this.log('  -H "Content-Type: application/json" \\', 'info')
    this.log('  -d \'{"test": true}\'', 'info')
    this.log('Expected response: 400 (signature validation failure)', 'info')

    if (!isProduction) {
      this.log('\n🔧 For Local Development:', 'info')
      this.log('Use Stripe CLI to forward webhooks to localhost:', 'info')
      this.log('stripe listen --forward-to localhost:3000/api/stripe/webhook', 'warn')
    }

    this.log('\n⚠️  Important Notes:', 'warn')
    this.log('• Make sure your webhook endpoint is publicly accessible', 'warn')
    this.log('• Use HTTPS in production (required by Stripe)', 'warn')
    this.log('• Keep your webhook signing secret secure', 'warn')
    this.log('• Test webhook functionality after deployment', 'warn')
  }

  private printCurrentConfig() {
    this.log('\n📊 Current Configuration:', 'info')
    this.log('=' .repeat(40), 'info')

    const vars = [
      'NEXT_PUBLIC_APP_URL',
      'NODE_ENV',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ]

    vars.forEach(varName => {
      const value = process.env[varName]
      if (value) {
        // Mask sensitive values
        const maskedValue = varName.includes('SECRET') || varName.includes('STRIPE_SECRET') 
          ? value.substring(0, 8) + '...' 
          : value
        this.log(`${varName}: ${maskedValue}`, 'success')
      } else {
        this.log(`${varName}: Not set`, 'error')
      }
    })
  }

  private validateConfiguration() {
    this.log('\n✅ Configuration Validation:', 'info')
    this.log('=' .repeat(40), 'info')

    const issues: string[] = []

    // Check required environment variables
    const requiredVars = [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
    ]

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        issues.push(`Missing ${varName}`)
      }
    })

    // Check Stripe key consistency
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (publishableKey && secretKey) {
      const pubKeyMode = publishableKey.startsWith('pk_live_') ? 'live' : 'test'
      const secretKeyMode = secretKey.startsWith('sk_live_') ? 'live' : 'test'

      if (pubKeyMode !== secretKeyMode) {
        issues.push('Stripe key mode mismatch (one is live, one is test)')
      }

      const isProduction = process.env.NODE_ENV === 'production'
      if (isProduction && pubKeyMode === 'test') {
        issues.push('Using test keys in production environment')
      }
    }

    // Check webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
      issues.push('Invalid webhook secret format')
    }

    // Check URL format
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      if (process.env.NODE_ENV === 'production' && !appUrl.startsWith('https://')) {
        issues.push('Production URL must use HTTPS')
      }
      if (appUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
        issues.push('Cannot use localhost URL in production')
      }
    }

    if (issues.length === 0) {
      this.log('✅ Configuration looks good!', 'success')
    } else {
      this.log('❌ Configuration Issues Found:', 'error')
      issues.forEach(issue => {
        this.log(`   • ${issue}`, 'error')
      })
    }

    return issues.length === 0
  }

  run() {
    this.log('🔧 Stripe Webhook Configuration Helper', 'info')
    this.log('This tool helps you configure Stripe webhooks for production deployment.', 'info')

    this.printCurrentConfig()
    const isValid = this.validateConfiguration()
    
    if (isValid) {
      this.printInstructions()
    } else {
      this.log('\n❌ Please fix the configuration issues above before proceeding.', 'error')
      process.exit(1)
    }
  }
}

// Run the updater
if (require.main === module) {
  const updater = new StripeWebhookUpdater()
  updater.run()
}

export { StripeWebhookUpdater }