/**
 * Stripe Integration Module
 * 
 * This module provides both client-side and server-side Stripe functionality.
 * 
 * Client-side exports (safe for browser):
 * - getStripe: Get Stripe.js instance for checkout flows
 * 
 * Server-side exports (API routes and server components only):
 * - stripe: Stripe API client instance
 * - STRIPE_PLANS: Plan configurations with pricing and features
 * - getPlanConfig: Helper to get plan configuration
 * - validateStripeConfig: Validate environment variables
 * - formatAmount: Format cents to dollar string
 * 
 * @example Client-side usage:
 * ```typescript
 * import { getStripe } from '@/lib/stripe'
 * 
 * const stripe = await getStripe()
 * // Use for redirectToCheckout, etc.
 * ```
 * 
 * @example Server-side usage:
 * ```typescript
 * import { stripe, STRIPE_PLANS } from '@/lib/stripe/server'
 * 
 * const session = await stripe.checkout.sessions.create({
 *   line_items: [{
 *     price: STRIPE_PLANS.premium.priceId,
 *     quantity: 1,
 *   }],
 *   // ...
 * })
 * ```
 */

// Client-side exports
export { getStripe } from './client'

// Server-side exports (use with caution - only in server contexts)
export {
  stripe,
  STRIPE_PLANS,
  getPlanConfig,
  validateStripeConfig,
  formatAmount,
  type PlanName,
} from './server'
