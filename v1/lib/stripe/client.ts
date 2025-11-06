import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

/**
 * Get Stripe client instance for client-side operations
 * 
 * This function ensures we only create one Stripe instance
 * and reuse it across the application.
 * 
 * @returns Promise that resolves to Stripe instance or null
 * 
 * @example
 * ```typescript
 * const stripe = await getStripe()
 * if (stripe) {
 *   // Use stripe for checkout, etc.
 * }
 * ```
 */
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (!publishableKey) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable')
      return Promise.resolve(null)
    }
    
    stripePromise = loadStripe(publishableKey)
  }
  
  return stripePromise
}
