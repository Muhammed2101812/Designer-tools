/**
 * Environment validation script
 * Run this to check if all required environment variables are set
 * 
 * Usage: npx tsx scripts/check-env.ts
 */

import { z } from 'zod'

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
}

const optionalEnvVars = {
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (for admin operations)',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key',
  STRIPE_SECRET_KEY: 'Stripe secret key',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
  REMOVE_BG_API_KEY: 'Remove.bg API key (for background remover)',
  REPLICATE_API_KEY: 'Replicate API key (for image upscaler)',
}

function checkEnvironment() {
  console.log('🔍 Checking environment variables...\n')
  
  let hasErrors = false
  let hasWarnings = false
  
  // Check required variables
  console.log('📋 Required Variables:')
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key]
    if (!value) {
      console.log(`  ❌ ${key} - MISSING`)
      console.log(`     ${description}`)
      hasErrors = true
    } else {
      // Validate URL format for Supabase URL
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
        try {
          new URL(value)
          console.log(`  ✅ ${key} - OK`)
        } catch {
          console.log(`  ❌ ${key} - INVALID (not a valid URL)`)
          hasErrors = true
        }
      } else {
        console.log(`  ✅ ${key} - OK`)
      }
    }
  }
  
  // Check optional variables
  console.log('\n📋 Optional Variables:')
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    const value = process.env[key]
    if (!value) {
      console.log(`  ⚠️  ${key} - NOT SET`)
      console.log(`     ${description}`)
      hasWarnings = true
    } else {
      console.log(`  ✅ ${key} - OK`)
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  if (hasErrors) {
    console.log('❌ Environment check FAILED')
    console.log('\nPlease set the missing required variables:')
    console.log('1. Copy .env.example to .env.local')
    console.log('2. Fill in your Supabase credentials')
    console.log('3. Run this script again to verify')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('⚠️  Environment check PASSED with warnings')
    console.log('\nOptional variables are not set. Some features may not work:')
    console.log('- Stripe: Payment processing')
    console.log('- Remove.bg: Background remover tool')
    console.log('- Replicate: Image upscaler tool')
    console.log('\nYou can add these later when needed.')
  } else {
    console.log('✅ Environment check PASSED')
    console.log('\nAll variables are set correctly!')
  }
  console.log('='.repeat(60))
}

// Run the check
checkEnvironment()
