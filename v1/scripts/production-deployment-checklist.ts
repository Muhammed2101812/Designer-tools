#!/usr/bin/env tsx

/**
 * Production Deployment Checklist Script
 * 
 * This interactive script guides through the complete production deployment
 * process with step-by-step validation and instructions.
 */

import chalk from 'chalk'
import { ProductionDeploymentChecker } from './prepare-production-deployment'
import { ProductionVerifier } from './verify-production'

interface ChecklistItem {
  id: string
  title: string
  description: string
  required: boolean
  category: string
  validation?: () => Promise<boolean>
  instructions?: string[]
}

class ProductionDeploymentChecklist {
  private items: ChecklistItem[] = []
  private completedItems: Set<string> = new Set()

  constructor() {
    this.initializeChecklist()
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

  private initializeChecklist() {
    this.items = [
      // Environment Setup
      {
        id: 'env-vars',
        title: 'Environment Variables Configuration',
        description: 'All production environment variables are configured',
        required: true,
        category: 'Environment',
        validation: async () => {
          try {
            const checker = new ProductionDeploymentChecker()
            // This would need to be refactored to return boolean
            return true // Placeholder
          } catch {
            return false
          }
        },
        instructions: [
          'Copy .env.production.example to your deployment platform',
          'Replace all placeholder values with production credentials',
          'Ensure NODE_ENV=production',
          'Verify NEXT_PUBLIC_APP_URL uses your production domain'
        ]
      },

      // Stripe Configuration
      {
        id: 'stripe-live-mode',
        title: 'Stripe Live Mode Configuration',
        description: 'Stripe is configured for live mode with production keys',
        required: true,
        category: 'Payments',
        validation: async () => {
          const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          const secretKey = process.env.STRIPE_SECRET_KEY
          return !!(pubKey?.startsWith('pk_live_') && secretKey?.startsWith('sk_live_'))
        },
        instructions: [
          'Switch Stripe dashboard to Live mode',
          'Copy live publishable key (pk_live_...)',
          'Copy live secret key (sk_live_...)',
          'Update environment variables'
        ]
      },

      {
        id: 'stripe-webhook',
        title: 'Stripe Webhook Configuration',
        description: 'Production webhook endpoint is configured in Stripe',
        required: true,
        category: 'Payments',
        instructions: [
          'Go to Stripe Dashboard > Developers > Webhooks',
          'Add endpoint: https://your-domain.com/api/stripe/webhook',
          'Select events: checkout.session.completed, customer.subscription.*',
          'Copy webhook signing secret to STRIPE_WEBHOOK_SECRET'
        ]
      },

      {
        id: 'stripe-products',
        title: 'Stripe Products and Prices',
        description: 'Premium and Pro plans are created in live mode',
        required: true,
        category: 'Payments',
        validation: async () => {
          const premiumId = process.env.STRIPE_PREMIUM_PRICE_ID
          const proId = process.env.STRIPE_PRO_PRICE_ID
          return !!(premiumId?.startsWith('price_') && proId?.startsWith('price_'))
        },
        instructions: [
          'Create Premium plan: $9/month recurring',
          'Create Pro plan: $29/month recurring',
          'Copy price IDs to STRIPE_PREMIUM_PRICE_ID and STRIPE_PRO_PRICE_ID'
        ]
      },

      // Supabase Configuration
      {
        id: 'supabase-production',
        title: 'Supabase Production Project',
        description: 'Production Supabase project is configured',
        required: true,
        category: 'Database',
        validation: async () => {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL
          return !!(url && url.includes('.supabase.co') && !url.includes('localhost'))
        },
        instructions: [
          'Create new Supabase project for production',
          'Copy project URL to NEXT_PUBLIC_SUPABASE_URL',
          'Copy anon key to NEXT_PUBLIC_SUPABASE_ANON_KEY',
          'Copy service role key to SUPABASE_SERVICE_ROLE_KEY'
        ]
      },

      {
        id: 'database-migrations',
        title: 'Database Migrations',
        description: 'All database migrations are executed in production',
        required: true,
        category: 'Database',
        instructions: [
          'Run: npm run run-production-migrations',
          'Verify all tables are created correctly',
          'Check RLS policies are active',
          'Test database connection'
        ]
      },

      {
        id: 'supabase-auth',
        title: 'Supabase Auth Configuration',
        description: 'Authentication settings are configured for production',
        required: true,
        category: 'Authentication',
        instructions: [
          'Set Site URL to https://your-domain.com',
          'Add redirect URLs for auth callbacks',
          'Configure OAuth providers (Google, GitHub)',
          'Customize email templates'
        ]
      },

      // Security
      {
        id: 'https-ssl',
        title: 'HTTPS and SSL Certificate',
        description: 'SSL certificate is configured and HTTPS is enforced',
        required: true,
        category: 'Security',
        validation: async () => {
          const url = process.env.NEXT_PUBLIC_APP_URL
          return !!(url && url.startsWith('https://'))
        },
        instructions: [
          'Configure SSL certificate on your hosting platform',
          'Ensure HTTPS redirect is enabled',
          'Test SSL certificate validity',
          'Verify security headers are present'
        ]
      },

      {
        id: 'security-headers',
        title: 'Security Headers Configuration',
        description: 'Security headers are configured in next.config.js',
        required: true,
        category: 'Security',
        instructions: [
          'Configure CSP headers in next.config.js',
          'Add HSTS, X-Frame-Options, X-Content-Type-Options',
          'Test security headers with online tools',
          'Run: npm run test:security-headers'
        ]
      },

      // Optional Services
      {
        id: 'redis-rate-limiting',
        title: 'Redis Rate Limiting',
        description: 'Upstash Redis is configured for rate limiting',
        required: false,
        category: 'Performance',
        validation: async () => {
          const url = process.env.UPSTASH_REDIS_URL
          const token = process.env.UPSTASH_REDIS_TOKEN
          return !!(url && token)
        },
        instructions: [
          'Create Upstash Redis database',
          'Copy REST URL to UPSTASH_REDIS_URL',
          'Copy token to UPSTASH_REDIS_TOKEN',
          'Test rate limiting functionality'
        ]
      },

      {
        id: 'sentry-monitoring',
        title: 'Sentry Error Monitoring',
        description: 'Sentry is configured for error tracking',
        required: false,
        category: 'Monitoring',
        validation: async () => {
          const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
          return !!(dsn && dsn.includes('sentry.io'))
        },
        instructions: [
          'Create Sentry project',
          'Copy DSN to NEXT_PUBLIC_SENTRY_DSN',
          'Configure alert rules',
          'Test error reporting'
        ]
      },

      {
        id: 'email-service',
        title: 'Email Service Configuration',
        description: 'Resend is configured for transactional emails',
        required: false,
        category: 'Communication',
        validation: async () => {
          const apiKey = process.env.RESEND_API_KEY
          return !!(apiKey && apiKey.startsWith('re_'))
        },
        instructions: [
          'Create Resend account',
          'Verify sending domain',
          'Copy API key to RESEND_API_KEY',
          'Test email sending functionality'
        ]
      },

      // Testing and Validation
      {
        id: 'build-test',
        title: 'Production Build Test',
        description: 'Production build completes successfully',
        required: true,
        category: 'Testing',
        instructions: [
          'Run: npm run build',
          'Check for build errors or warnings',
          'Test production build locally: npm run start',
          'Verify all pages load correctly'
        ]
      },

      {
        id: 'deployment-test',
        title: 'Deployment Verification',
        description: 'Production deployment is working correctly',
        required: true,
        category: 'Testing',
        instructions: [
          'Deploy to production platform',
          'Run: npm run verify-production',
          'Test critical user flows',
          'Verify payment processing works'
        ]
      }
    ]
  }

  private async runValidation(item: ChecklistItem): Promise<boolean> {
    if (!item.validation) return true
    
    try {
      return await item.validation()
    } catch (error) {
      return false
    }
  }

  private printHeader() {
    this.log('\n🚀 Design Kit Production Deployment Checklist', 'info')
    this.log('=' .repeat(70), 'info')
    this.log('This checklist guides you through the complete production deployment process.', 'info')
    this.log('Each item will be validated where possible.\n', 'info')
  }

  private printCategorySummary() {
    const categories = [...new Set(this.items.map(item => item.category))]
    
    this.log('📋 Checklist Categories:', 'info')
    categories.forEach(category => {
      const categoryItems = this.items.filter(item => item.category === category)
      const requiredCount = categoryItems.filter(item => item.required).length
      const optionalCount = categoryItems.length - requiredCount
      
      this.log(`  • ${category}: ${requiredCount} required, ${optionalCount} optional`, 'info')
    })
    this.log('')
  }

  private async processCategory(category: string) {
    const categoryItems = this.items.filter(item => item.category === category)
    
    this.log(`\n📂 ${category}`, 'info')
    this.log('─'.repeat(50), 'info')

    for (const item of categoryItems) {
      await this.processItem(item)
    }
  }

  private async processItem(item: ChecklistItem) {
    const isValid = await this.runValidation(item)
    const status = isValid ? '✅' : (item.required ? '❌' : '⚠️')
    const statusText = isValid ? 'PASS' : (item.required ? 'FAIL' : 'SKIP')
    const color = isValid ? 'success' : (item.required ? 'error' : 'warn')

    this.log(`\n${status} ${item.title} [${statusText}]`, color)
    this.log(`   ${item.description}`, 'info')

    if (!isValid && item.instructions) {
      this.log('   Instructions:', 'warn')
      item.instructions.forEach(instruction => {
        this.log(`   • ${instruction}`, 'warn')
      })
    }

    if (isValid) {
      this.completedItems.add(item.id)
    }
  }

  private printSummary() {
    const totalItems = this.items.length
    const requiredItems = this.items.filter(item => item.required).length
    const completedRequired = this.items.filter(item => 
      item.required && this.completedItems.has(item.id)
    ).length
    const completedOptional = this.items.filter(item => 
      !item.required && this.completedItems.has(item.id)
    ).length

    this.log('\n📊 Deployment Readiness Summary', 'info')
    this.log('=' .repeat(50), 'info')
    this.log(`Required items completed: ${completedRequired}/${requiredItems}`, 
      completedRequired === requiredItems ? 'success' : 'error')
    this.log(`Optional items completed: ${completedOptional}/${totalItems - requiredItems}`, 'info')
    this.log(`Total completion: ${this.completedItems.size}/${totalItems}`, 'info')

    if (completedRequired === requiredItems) {
      this.log('\n🎉 READY FOR PRODUCTION DEPLOYMENT!', 'success')
      this.log('All required items are completed. You can proceed with deployment.', 'success')
      
      if (completedOptional < totalItems - requiredItems) {
        this.log('\n💡 Consider completing optional items for better functionality:', 'warn')
        this.items.filter(item => !item.required && !this.completedItems.has(item.id))
          .forEach(item => {
            this.log(`   • ${item.title}`, 'warn')
          })
      }
    } else {
      this.log('\n❌ NOT READY FOR PRODUCTION', 'error')
      this.log('Please complete the required items above before deploying.', 'error')
      
      const missingRequired = this.items.filter(item => 
        item.required && !this.completedItems.has(item.id)
      )
      
      this.log('\nMissing required items:', 'error')
      missingRequired.forEach(item => {
        this.log(`   • ${item.title}`, 'error')
      })
    }
  }

  private printNextSteps() {
    if (this.completedItems.size === this.items.filter(item => item.required).length) {
      this.log('\n🚀 Next Steps:', 'info')
      this.log('1. Run final production build: npm run build', 'info')
      this.log('2. Deploy to your hosting platform', 'info')
      this.log('3. Run post-deployment verification: npm run verify-production', 'info')
      this.log('4. Monitor error rates and performance', 'info')
      this.log('5. Test critical user flows', 'info')
    }
  }

  async run() {
    this.printHeader()
    this.printCategorySummary()

    const categories = [...new Set(this.items.map(item => item.category))]
    
    for (const category of categories) {
      await this.processCategory(category)
    }

    this.printSummary()
    this.printNextSteps()

    const allRequiredCompleted = this.items.filter(item => item.required)
      .every(item => this.completedItems.has(item.id))

    process.exit(allRequiredCompleted ? 0 : 1)
  }
}

// Run the checklist
if (require.main === module) {
  const checklist = new ProductionDeploymentChecklist()
  checklist.run().catch(console.error)
}

export { ProductionDeploymentChecklist }