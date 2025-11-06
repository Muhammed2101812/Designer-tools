#!/usr/bin/env tsx

/**
 * Deployment Verification Script
 * 
 * This script verifies that all required environment variables
 * are set correctly before deployment to production.
 * 
 * Usage:
 *   npx tsx scripts/verify-deployment.ts
 */

import { z } from 'zod'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60))
  log(title, 'bold')
  console.log('='.repeat(60))
}

function logCheck(name: string, status: 'pass' | 'fail' | 'warn', message?: string) {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠'
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow'
  log(`${icon} ${name}${message ? `: ${message}` : ''}`, color)
}

// Environment variable schemas
const requiredVars = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'Must be at least 20 characters'),
  NEXT_PUBLIC_APP_URL: z.string().url('Must be a valid URL'),
})

const productionVars = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'Must be at least 20 characters'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Must start with pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Must start with sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Must start with whsec_'),
})

const optionalVars = z.object({
  REMOVE_BG_API_KEY: z.string().optional(),
  REPLICATE_API_KEY: z.string().optional(),
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

interface CheckResult {
  passed: number
  failed: number
  warnings: number
  errors: string[]
}

function checkEnvironmentVariables(): CheckResult {
  logSection('🔍 Checking Environment Variables')

  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  }

  // Check required variables
  log('\nRequired Variables:', 'cyan')
  const requiredChecks = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { name: 'NEXT_PUBLIC_APP_URL', value: process.env.NEXT_PUBLIC_APP_URL },
  ]

  for (const check of requiredChecks) {
    if (!check.value) {
      logCheck(check.name, 'fail', 'Missing')
      result.failed++
      result.errors.push(`${check.name} is required but not set`)
    } else {
      logCheck(check.name, 'pass', 'Set')
      result.passed++
    }
  }

  // Check production variables
  log('\nProduction Variables (Stripe & Supabase):', 'cyan')
  const productionChecks = [
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY },
    { name: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY },
    { name: 'STRIPE_WEBHOOK_SECRET', value: process.env.STRIPE_WEBHOOK_SECRET },
  ]

  for (const check of productionChecks) {
    if (!check.value) {
      logCheck(check.name, 'warn', 'Not set (optional for MVP)')
      result.warnings++
    } else {
      logCheck(check.name, 'pass', 'Set')
      result.passed++
    }
  }

  // Check optional variables
  log('\nOptional Variables (API Tools & Analytics):', 'cyan')
  const optionalChecks = [
    { name: 'REMOVE_BG_API_KEY', value: process.env.REMOVE_BG_API_KEY },
    { name: 'REPLICATE_API_KEY', value: process.env.REPLICATE_API_KEY },
    { name: 'UPSTASH_REDIS_URL', value: process.env.UPSTASH_REDIS_URL },
    { name: 'UPSTASH_REDIS_TOKEN', value: process.env.UPSTASH_REDIS_TOKEN },
    { name: 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN', value: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN },
    { name: 'NEXT_PUBLIC_SENTRY_DSN', value: process.env.NEXT_PUBLIC_SENTRY_DSN },
  ]

  for (const check of optionalChecks) {
    if (!check.value) {
      logCheck(check.name, 'warn', 'Not set (optional)')
      result.warnings++
    } else {
      logCheck(check.name, 'pass', 'Set')
      result.passed++
    }
  }

  return result
}

function checkProductionReadiness(): CheckResult {
  logSection('🚀 Production Readiness Checks')

  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  }

  // Check NODE_ENV
  log('\nEnvironment Configuration:', 'cyan')
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') {
    logCheck('NODE_ENV', 'pass', 'production')
    result.passed++
  } else {
    logCheck('NODE_ENV', 'warn', `${nodeEnv || 'not set'} (should be "production" for deployment)`)
    result.warnings++
  }

  // Check Stripe keys are live (not test)
  log('\nStripe Configuration:', 'cyan')
  const stripePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const stripeSecret = process.env.STRIPE_SECRET_KEY

  if (stripePublishable) {
    if (stripePublishable.startsWith('pk_live_')) {
      logCheck('Stripe Publishable Key', 'pass', 'Using LIVE key')
      result.passed++
    } else if (stripePublishable.startsWith('pk_test_')) {
      logCheck('Stripe Publishable Key', 'fail', 'Using TEST key in production!')
      result.failed++
      result.errors.push('Stripe publishable key must be a LIVE key (pk_live_) for production')
    }
  }

  if (stripeSecret) {
    if (stripeSecret.startsWith('sk_live_')) {
      logCheck('Stripe Secret Key', 'pass', 'Using LIVE key')
      result.passed++
    } else if (stripeSecret.startsWith('sk_test_')) {
      logCheck('Stripe Secret Key', 'fail', 'Using TEST key in production!')
      result.failed++
      result.errors.push('Stripe secret key must be a LIVE key (sk_live_) for production')
    }
  }

  // Check Supabase URL is not localhost
  log('\nSupabase Configuration:', 'cyan')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
      logCheck('Supabase URL', 'fail', 'Using localhost!')
      result.failed++
      result.errors.push('Supabase URL must be a production URL, not localhost')
    } else if (supabaseUrl.includes('.supabase.co')) {
      logCheck('Supabase URL', 'pass', 'Using production Supabase')
      result.passed++
    } else {
      logCheck('Supabase URL', 'warn', 'Unusual Supabase URL format')
      result.warnings++
    }
  }

  // Check APP_URL is not localhost
  log('\nApplication URL:', 'cyan')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
      logCheck('App URL', 'fail', 'Using localhost!')
      result.failed++
      result.errors.push('App URL must be your production domain, not localhost')
    } else if (appUrl.startsWith('https://')) {
      logCheck('App URL', 'pass', 'Using HTTPS')
      result.passed++
    } else if (appUrl.startsWith('http://')) {
      logCheck('App URL', 'warn', 'Using HTTP (HTTPS recommended)')
      result.warnings++
    }
  }

  return result
}

function checkBuildConfiguration(): CheckResult {
  logSection('🔧 Build Configuration')

  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  }

  log('\nPackage Configuration:', 'cyan')

  // Check if package.json exists
  try {
    const fs = require('fs')
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))

    // Check build script
    if (packageJson.scripts?.build) {
      logCheck('Build script', 'pass', packageJson.scripts.build)
      result.passed++
    } else {
      logCheck('Build script', 'fail', 'Missing')
      result.failed++
      result.errors.push('package.json must have a "build" script')
    }

    // Check start script
    if (packageJson.scripts?.start) {
      logCheck('Start script', 'pass', packageJson.scripts.start)
      result.passed++
    } else {
      logCheck('Start script', 'fail', 'Missing')
      result.failed++
      result.errors.push('package.json must have a "start" script')
    }

    // Check Next.js version
    const nextVersion = packageJson.dependencies?.next
    if (nextVersion) {
      logCheck('Next.js version', 'pass', nextVersion)
      result.passed++
    } else {
      logCheck('Next.js version', 'fail', 'Not found')
      result.failed++
      result.errors.push('Next.js must be in dependencies')
    }
  } catch (error) {
    logCheck('package.json', 'fail', 'Cannot read file')
    result.failed++
    result.errors.push('Cannot read package.json')
  }

  return result
}

function printSummary(
  envResult: CheckResult,
  prodResult: CheckResult,
  buildResult: CheckResult
) {
  logSection('📊 Summary')

  const totalPassed = envResult.passed + prodResult.passed + buildResult.passed
  const totalFailed = envResult.failed + prodResult.failed + buildResult.failed
  const totalWarnings = envResult.warnings + prodResult.warnings + buildResult.warnings

  console.log('')
  log(`✓ Passed:   ${totalPassed}`, 'green')
  log(`✗ Failed:   ${totalFailed}`, 'red')
  log(`⚠ Warnings: ${totalWarnings}`, 'yellow')

  const allErrors = [
    ...envResult.errors,
    ...prodResult.errors,
    ...buildResult.errors,
  ]

  if (allErrors.length > 0) {
    logSection('❌ Errors Found')
    allErrors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'red')
    })
  }

  console.log('\n' + '='.repeat(60))

  if (totalFailed > 0) {
    log('\n❌ DEPLOYMENT NOT READY', 'red')
    log('Please fix the errors above before deploying to production.', 'red')
    process.exit(1)
  } else if (totalWarnings > 0) {
    log('\n⚠️  DEPLOYMENT READY WITH WARNINGS', 'yellow')
    log('Review the warnings above. You can proceed with deployment.', 'yellow')
    process.exit(0)
  } else {
    log('\n✅ DEPLOYMENT READY', 'green')
    log('All checks passed! You can proceed with deployment.', 'green')
    process.exit(0)
  }
}

// Main execution
function main() {
  log('\n🎨 Design Kit - Deployment Verification', 'bold')
  log('Checking if your application is ready for production deployment\n', 'cyan')

  const envResult = checkEnvironmentVariables()
  const prodResult = checkProductionReadiness()
  const buildResult = checkBuildConfiguration()

  printSummary(envResult, prodResult, buildResult)
}

main()
