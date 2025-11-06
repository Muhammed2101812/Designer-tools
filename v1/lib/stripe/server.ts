import Stripe from 'stripe'

/**
 * Stripe server-side client instance
 * 
 * This should only be used in server-side code (API routes, server components, etc.)
 * Never expose this client or the secret key to the client-side.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
  appInfo: {
    name: 'Design Kit',
    version: '1.0.0',
  },
})

/**
 * Stripe subscription plan configurations
 * 
 * These map to the products and prices created in the Stripe Dashboard.
 * Make sure to create these products in Stripe and update the price IDs
 * in your environment variables.
 */
export const STRIPE_PLANS = {
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    amount: 900, // $9.00 in cents
    name: 'Premium',
    interval: 'month' as const,
    features: [
      '500 daily API operations',
      'All tools',
      '50MB max file size',
      'Batch processing (10 files)',
      'Priority support',
    ],
    dailyQuota: 500,
    maxFileSize: 50 * 1024 * 1024, // 50MB in bytes
    batchLimit: 10,
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 2900, // $29.00 in cents
    name: 'Pro',
    interval: 'month' as const,
    features: [
      '2000 daily API operations',
      'All tools',
      '100MB max file size',
      'Batch processing (50 files)',
      'REST API access',
      'Dedicated support',
    ],
    dailyQuota: 2000,
    maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
    batchLimit: 50,
  },
} as const

/**
 * Type for plan names
 */
export type PlanName = keyof typeof STRIPE_PLANS

/**
 * Get plan configuration by name
 * 
 * @param planName - The name of the plan ('premium' or 'pro')
 * @returns Plan configuration object
 * 
 * @example
 * ```typescript
 * const premiumPlan = getPlanConfig('premium')
 * console.log(premiumPlan.dailyQuota) // 500
 * ```
 */
export function getPlanConfig(planName: PlanName) {
  return STRIPE_PLANS[planName]
}

/**
 * Validate that all required Stripe environment variables are set
 * 
 * @throws Error if any required environment variable is missing
 */
export function validateStripeConfig() {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PREMIUM_PRICE_ID',
    'STRIPE_PRO_PRICE_ID',
    'STRIPE_WEBHOOK_SECRET',
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all Stripe variables are set.'
    )
  }
}

/**
 * Format amount from cents to dollars
 * 
 * @param cents - Amount in cents
 * @returns Formatted dollar amount (e.g., "$9.00")
 * 
 * @example
 * ```typescript
 * formatAmount(900) // "$9.00"
 * formatAmount(2900) // "$29.00"
 * ```
 */
export function formatAmount(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}
