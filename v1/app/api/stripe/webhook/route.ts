/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription lifecycle management.
 * This endpoint receives events from Stripe when subscription-related actions occur.
 * 
 * Supported Events:
 * - checkout.session.completed: When a customer completes checkout
 * - customer.subscription.updated: When subscription details change
 * - customer.subscription.deleted: When a subscription is canceled
 * 
 * @route POST /api/stripe/webhook
 * @public No authentication required (verified via Stripe signature)
 * @rateLimit None (Stripe webhooks are trusted)
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { reportError } from '@/lib/utils/error-logger'

/**
 * POST handler - Process Stripe webhook events
 * 
 * Security:
 * - Verifies webhook signature using Stripe's webhook secret
 * - Only processes events from Stripe's servers
 * - Uses service role key for database operations
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const error = err as Error
    console.error('Webhook signature verification failed:', error.message)
    
    await reportError(error, {
      context: 'stripe-webhook-verification',
      signature: signature.substring(0, 20) + '...', // Log partial signature for debugging
    })
    
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log(`Received Stripe webhook: ${event.type}`)

  // Create Supabase client with service role for webhook operations
  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error)
    
    await reportError(
      error instanceof Error ? error : new Error('Unknown webhook error'),
      {
        eventType: event.type,
        eventId: event.id,
      }
    )

    // Return 500 so Stripe will retry the webhook
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed event
 * 
 * This event fires when a customer successfully completes the checkout process.
 * We create a subscription record and update the user's plan.
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const userId = session.metadata?.user_id
  const plan = session.metadata?.plan

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session:', {
      sessionId: session.id,
      hasUserId: !!userId,
      hasPlan: !!plan,
    })
    return
  }

  // Validate plan
  if (!['premium', 'pro'].includes(plan)) {
    console.error('Invalid plan in checkout session:', plan)
    return
  }

  // Get subscription details from Stripe
  const subscriptionId = session.subscription as string
  
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session:', session.id)
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Insert subscription record
  const { error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      status: subscription.status,
      plan: plan,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
    })

  if (insertError) {
    // Check if it's a duplicate key error (subscription already exists)
    if (insertError.code === '23505') {
      console.log('Subscription already exists, updating instead:', subscription.id)
      
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          stripe_price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          plan: plan,
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: (subscription as any).cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id)
      
      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`)
      }
    } else {
      throw new Error(`Failed to insert subscription: ${insertError.message}`)
    }
  }

  // Update user's plan in profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ plan: plan })
    .eq('id', userId)

  if (profileError) {
    throw new Error(`Failed to update user plan: ${profileError.message}`)
  }

  // Send subscription confirmation email
  await sendSubscriptionConfirmationEmail(userId, plan, subscription.items.data[0].price.unit_amount || 0, supabase)

  console.log(`Successfully processed checkout for user ${userId}, plan: ${plan}`)
}

/**
 * Handle customer.subscription.updated event
 * 
 * This event fires when subscription details change (e.g., renewal, plan change, status change).
 * We update the subscription record with the latest information.
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  // Get the plan from subscription metadata or price
  const plan = subscription.metadata?.plan || 
    (subscription.items.data[0].price.id === process.env.STRIPE_PREMIUM_PRICE_ID ? 'premium' : 'pro')

  // Update subscription record
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: subscription.items.data[0].price.id,
      status: subscription.status,
      plan: plan,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id)

  if (updateError) {
    throw new Error(`Failed to update subscription: ${updateError.message}`)
  }

  // Get user_id from subscription record
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (subError || !subData) {
    console.error('Could not find subscription record:', subscription.id)
    return
  }

  // Update user's plan if subscription is active
  if (subscription.status === 'active') {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ plan: plan })
      .eq('id', subData.user_id)

    if (profileError) {
      throw new Error(`Failed to update user plan: ${profileError.message}`)
    }
  }

  console.log(`Successfully updated subscription ${subscription.id}, status: ${subscription.status}`)
}

/**
 * Handle customer.subscription.deleted event
 * 
 * This event fires when a subscription is canceled or expires.
 * We update the subscription status and downgrade the user to the free plan.
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  // Get user_id and plan from subscription record before updating
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id, plan, current_period_end')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (subError || !subData) {
    console.error('Could not find subscription record:', subscription.id)
    return
  }

  // Update subscription status to canceled
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('stripe_subscription_id', subscription.id)

  if (updateError) {
    throw new Error(`Failed to update subscription status: ${updateError.message}`)
  }

  // Downgrade user to free plan
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', subData.user_id)

  if (profileError) {
    throw new Error(`Failed to downgrade user to free plan: ${profileError.message}`)
  }

  // Send subscription cancellation email
  await sendSubscriptionCancellationEmail(
    subData.user_id, 
    subData.plan, 
    subData.current_period_end, 
    supabase
  )

  console.log(`Successfully canceled subscription ${subscription.id}, user downgraded to free plan`)
}

/**
 * Send subscription confirmation email
 */
async function sendSubscriptionConfirmationEmail(
  userId: string,
  plan: string,
  amount: number,
  supabase: any
) {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      console.error('Profile not found for subscription confirmation email:', userId)
      return
    }

    // Send email via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'subscription_confirmation',
        user_id: userId,
        email: profile.email,
        full_name: profile.full_name || '',
        plan: plan,
        amount: amount,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send subscription confirmation email:', error)
    } else {
      console.log(`Subscription confirmation email sent to ${profile.email}`)
    }
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error)
    reportError(error as Error, {
      context: 'subscription_confirmation_email',
      user_id: userId,
      plan: plan,
    })
  }
}

/**
 * Send subscription cancellation email
 */
async function sendSubscriptionCancellationEmail(
  userId: string,
  plan: string,
  endDate: string,
  supabase: any
) {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      console.error('Profile not found for subscription cancellation email:', userId)
      return
    }

    // Send email via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'subscription_cancellation',
        user_id: userId,
        email: profile.email,
        full_name: profile.full_name || '',
        plan: plan,
        end_date: endDate,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send subscription cancellation email:', error)
    } else {
      console.log(`Subscription cancellation email sent to ${profile.email}`)
    }
  } catch (error) {
    console.error('Error sending subscription cancellation email:', error)
    reportError(error as Error, {
      context: 'subscription_cancellation_email',
      user_id: userId,
      plan: plan,
    })
  }
}
