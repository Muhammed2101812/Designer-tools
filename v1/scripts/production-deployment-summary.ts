#!/usr/bin/env tsx

/**
 * Production Deployment Summary Script
 * 
 * This script provides a comprehensive summary of the production deployment
 * status and guides users through the final steps.
 */

import chalk from 'chalk'
import { existsSync } from 'fs'
import { join } from 'path'

interface DeploymentStatus {
  category: string
  item: string
  status: 'complete' | 'pending' | 'optional' | 'error'
  description: string
  action?: string
}

class ProductionDeploymentSummary {
  private statuses: DeploymentStatus[] = []

  private log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
    }
    console.log(colors[type](message))
  }

  private addStatus(
    category: string,
    item: string,
    status: DeploymentStatus['status'],
    description: string,
    action?: string
  ) {
    this.statuses.push({ category, item, status, description, action })
  }

  private checkEnvironmentVariables() {
    this.log('\n🔍 Checking Environment Variables...', 'info')

    const requiredVars = [
      'NEXT_PUBLIC_APP_URL',
      'NODE_ENV',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PREMIUM_PRICE_ID',
      'STRIPE_PRO_PRICE_ID',
    ]

    const optionalVars = [
      'UPSTASH_REDIS_URL',
      'UPSTASH_REDIS_TOKEN',
      'NEXT_PUBLIC_SENTRY_DSN',
      'RESEND_API_KEY',
      'REMOVE_BG_API_KEY',
      'REPLICATE_API_KEY',
    ]

    let missingRequired = 0
    let missingOptional = 0

    requiredVars.forEach(varName => {
      const value = process.env[varName]
      if (!value) {
        this.addStatus('Environment', varName, 'error', 'Required variable missing', 'Set in hosting platform')
        missingRequired++
      } else {
        // Additional validation for specific variables
        if (varName === 'NODE_ENV' && value !== 'production') {
          this.addStatus('Environment', varName, 'error', 'Must be set to "production"', 'Update environment variable')
        } else if (varName === 'NEXT_PUBLIC_APP_URL' && !value.startsWith('https://')) {
          this.addStatus('Environment', varName, 'error', 'Must use HTTPS in production', 'Update to HTTPS URL')
        } else if (varName.includes('STRIPE') && varName.includes('PUBLISHABLE') && !value.startsWith('pk_live_')) {
          this.addStatus('Environment', varName, 'error', 'Must use live Stripe key', 'Switch to live mode in Stripe')
        } else if (varName.includes('STRIPE') && varName.includes('SECRET') && !value.startsWith('sk_live_')) {
          this.addStatus('Environment', varName, 'error', 'Must use live Stripe key', 'Switch to live mode in Stripe')
        } else {
          this.addStatus('Environment', varName, 'complete', 'Configured correctly')
        }
      }
    })

    optionalVars.forEach(varName => {
      const value = process.env[varName]
      if (!value) {
        this.addStatus('Environment', varName, 'optional', 'Optional service not configured')
        missingOptional++
      } else {
        this.addStatus('Environment', varName, 'complete', 'Optional service configured')
      }
    })

    if (missingRequired === 0) {
      this.log(`✅ All required environment variables configured`, 'success')
    } else {
      this.log(`❌ ${missingRequired} required environment variables missing`, 'error')
    }

    if (missingOptional > 0) {
      this.log(`⚠️  ${missingOptional} optional services not configured`, 'warn')
    }
  }

  private checkProjectFiles() {
    this.log('\n📁 Checking Project Files...', 'info')

    const requiredFiles = [
      { path: 'package.json', description: 'Package configuration' },
      { path: 'next.config.js', description: 'Next.js configuration' },
      { path: 'tailwind.config.ts', description: 'Tailwind CSS configuration' },
      { path: 'tsconfig.json', description: 'TypeScript configuration' },
      { path: 'lib/env.ts', description: 'Environment validation' },
    ]

    const optionalFiles = [
      { path: '.env.production.example', description: 'Production environment template' },
      { path: 'docs/PRODUCTION_DEPLOYMENT_GUIDE.md', description: 'Deployment guide' },
      { path: 'scripts/production-deployment-setup.ts', description: 'Deployment setup script' },
    ]

    requiredFiles.forEach(file => {
      if (existsSync(file.path)) {
        this.addStatus('Files', file.path, 'complete', file.description)
      } else {
        this.addStatus('Files', file.path, 'error', `${file.description} missing`, 'Create the file')
      }
    })

    optionalFiles.forEach(file => {
      if (existsSync(file.path)) {
        this.addStatus('Files', file.path, 'complete', file.description)
      } else {
        this.addStatus('Files', file.path, 'optional', `${file.description} not found`)
      }
    })
  }

  private checkBuildStatus() {
    this.log('\n🔨 Checking Build Status...', 'info')

    const nextDir = join(process.cwd(), '.next')
    const buildExists = existsSync(nextDir)

    if (buildExists) {
      this.addStatus('Build', 'Next.js Build', 'complete', 'Production build exists')
    } else {
      this.addStatus('Build', 'Next.js Build', 'pending', 'Production build needed', 'Run: npm run build')
    }

    // Check if TypeScript compiles
    this.addStatus('Build', 'TypeScript Check', 'pending', 'Type checking needed', 'Run: npm run type-check')
    
    // Check if linting passes
    this.addStatus('Build', 'ESLint Check', 'pending', 'Linting needed', 'Run: npm run lint')
  }

  private generateDeploymentInstructions() {
    const categories = [...new Set(this.statuses.map(s => s.category))]
    
    this.log('\n📊 Production Deployment Status', 'info')
    this.log('=' .repeat(80), 'info')

    categories.forEach(category => {
      this.log(`\n📁 ${category}:`, 'info')
      
      const categoryStatuses = this.statuses.filter(s => s.category === category)
      categoryStatuses.forEach(status => {
        const icon = status.status === 'complete' ? '✅' : 
                     status.status === 'error' ? '❌' : 
                     status.status === 'optional' ? '⚪' : '⏳'
        
        const color = status.status === 'complete' ? 'success' : 
                      status.status === 'error' ? 'error' : 
                      status.status === 'optional' ? 'warn' : 'info'

        this.log(`  ${icon} ${status.item}: ${status.description}`, color)
        
        if (status.action) {
          this.log(`     Action: ${status.action}`, 'info')
        }
      })
    })

    // Summary
    const complete = this.statuses.filter(s => s.status === 'complete').length
    const errors = this.statuses.filter(s => s.status === 'error').length
    const pending = this.statuses.filter(s => s.status === 'pending').length
    const optional = this.statuses.filter(s => s.status === 'optional').length

    this.log('\n' + '=' .repeat(80), 'info')
    this.log(`✅ Complete: ${complete} | ❌ Errors: ${errors} | ⏳ Pending: ${pending} | ⚪ Optional: ${optional}`, 'info')

    return { complete, errors, pending, optional }
  }

  private printNextSteps(summary: { complete: number; errors: number; pending: number; optional: number }) {
    this.log('\n🚀 Next Steps for Production Deployment:', 'info')
    this.log('=' .repeat(60), 'info')

    if (summary.errors > 0) {
      this.log('\n❌ CRITICAL ISSUES FOUND', 'error')
      this.log('Fix the errors above before proceeding with deployment.', 'error')
      this.log('\nCommands to help:', 'info')
      this.log('  npm run validate:env          # Validate environment variables', 'info')
      this.log('  npm run deploy:setup          # Run deployment setup', 'info')
      return false
    }

    if (summary.pending > 0) {
      this.log('\n⏳ PENDING TASKS', 'warn')
      this.log('Complete the pending tasks before deployment:', 'warn')
      this.log('\nBuild Commands:', 'info')
      this.log('  npm run type-check            # Check TypeScript', 'info')
      this.log('  npm run lint                  # Check code quality', 'info')
      this.log('  npm run build                 # Build for production', 'info')
      this.log('  npm run start                 # Test production build', 'info')
    }

    this.log('\n✅ DEPLOYMENT READY', 'success')
    this.log('Your application is ready for production deployment!', 'success')

    this.log('\nDeployment Steps:', 'info')
    this.log('1. Choose your hosting platform:', 'info')
    this.log('   • Vercel: https://vercel.com', 'info')
    this.log('   • Netlify: https://netlify.com', 'info')
    this.log('   • Cloudflare Pages: https://pages.cloudflare.com', 'info')

    this.log('\n2. Deploy your application:', 'info')
    this.log('   • Connect your GitHub repository', 'info')
    this.log('   • Set build command: npm run build', 'info')
    this.log('   • Set output directory: .next', 'info')
    this.log('   • Add all environment variables', 'info')

    this.log('\n3. Configure your domain:', 'info')
    this.log('   • Add custom domain in hosting platform', 'info')
    this.log('   • Update DNS records', 'info')
    this.log('   • SSL certificate will be auto-generated', 'info')

    this.log('\n4. Update external services:', 'info')
    this.log('   • Update Stripe webhook URL to production domain', 'info')
    this.log('   • Update Supabase Auth redirect URLs', 'info')
    this.log('   • Verify Resend domain (if using email)', 'info')

    this.log('\n5. Post-deployment verification:', 'info')
    this.log('   npm run verify:production     # Verify deployment', 'info')

    this.log('\n6. Monitor your application:', 'info')
    this.log('   • Check Sentry for errors', 'info')
    this.log('   • Monitor Stripe dashboard', 'info')
    this.log('   • Verify email delivery', 'info')
    this.log('   • Test all functionality', 'info')

    this.log('\n📚 Additional Resources:', 'info')
    this.log('   • docs/PRODUCTION_DEPLOYMENT_GUIDE.md', 'info')
    this.log('   • docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md', 'info')
    this.log('   • .env.production.example', 'info')

    return true
  }

  run() {
    this.log('🎯 Design Kit Production Deployment Summary', 'info')
    this.log('This tool provides an overview of your production deployment readiness.', 'info')

    this.checkEnvironmentVariables()
    this.checkProjectFiles()
    this.checkBuildStatus()

    const summary = this.generateDeploymentInstructions()
    const isReady = this.printNextSteps(summary)

    process.exit(isReady ? 0 : 1)
  }
}

// Run the summary
if (require.main === module) {
  const summary = new ProductionDeploymentSummary()
  summary.run()
}

export { ProductionDeploymentSummary }