/**
 * Stripe Customer Portal Session Creation API Route
 * 
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Allows users to update payment methods, view invoices, and cancel subscriptions.
 * 
 * @route POST /api/stripe/create-portal
 * @requires Authentication
 * @requires Existing Stripe customer
 * @rateLimit User-based (30 requests/minute)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import {
  withApiSecurity,
  ApiError,
  ApiErrorType,
} from '@/lib/utils/apiSecurity'

/**
 * POST handler - Create Stripe Customer Portal session
 * 
 * Flow:
 * 1. Validate user authentication
 * 2. Get user's Stripe customer ID from profile
 * 3. Create billing portal session
 * 4. Return portal URL
 */
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (_request, user) => {
      if (!user) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION,
          'User not authenticated',
          401
        )
      }

      // Get Supabase client
      const supabase = await createClient()

      // Get user's profile to retrieve Stripe customer ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, plan')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        throw new ApiError(
          ApiErrorType.INTERNAL,
          'Failed to fetch user profile',
          500,
          { error: profileError.message }
        )
      }

      // Check if user has a Stripe customer ID
      if (!profile?.stripe_customer_id) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          'No Stripe customer found. Please subscribe to a plan first.',
          404,
          { 
            hint: 'User needs to create a subscription before accessing the portal',
            plan: profile?.plan || 'free'
          }
        )
      }

      // Check if user is on free plan (no active subscription)
      if (profile.plan === 'free') {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION,
          'Customer portal is only available for Premium and Pro subscribers',
          403,
          { 
            hint: 'Free plan users should upgrade first',
            plan: 'free'
          }
        )
      }

      // Create billing portal session
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: profile.stripe_customer_id,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        })

        return {
          success: true,
          url: session.url,
        }
      } catch (error) {
        // Handle specific Stripe errors
        const stripeError = error as any
        
        if (stripeError.type === 'StripeInvalidRequestError') {
          throw new ApiError(
            ApiErrorType.NOT_FOUND,
            'Invalid Stripe customer. Please contact support.',
            404,
            { 
              error: stripeError.message,
              customerId: profile.stripe_customer_id
            }
          )
        }

        throw new ApiError(
          ApiErrorType.INTERNAL,
          'Failed to create billing portal session',
          500,
          { error: error instanceof Error ? error.message : String(error) }
        )
      }
    },
    {
      requireAuth: true,
      allowedMethods: ['POST'],
      rateLimit: 'premium', // User-based rate limiting (30 requests/minute)
      errorContext: {
        endpoint: 'create-portal',
        service: 'stripe',
      },
    }
  )
}
