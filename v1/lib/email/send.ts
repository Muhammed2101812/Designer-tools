/**
 * Email Sending Utilities using Supabase Auth
 *
 * This module provides functions to send emails through Supabase's built-in email service.
 * For transactional emails (quota warnings, subscription updates), we use a custom
 * email sending approach that integrates with Supabase.
 *
 * Note: Supabase Auth emails are primarily for authentication flows (verify email, reset password).
 * For custom transactional emails, consider integrating Resend or SendGrid in the future.
 */

import { createServerClient } from '@/lib/supabase/server'
import {
  getQuotaWarningTemplate,
  getSubscriptionUpdateTemplate,
  getWelcomeEmailTemplate,
} from './templates'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Send email using Supabase Admin API
 * Note: This is a placeholder for future implementation with a proper email service
 * For now, we'll use Supabase's built-in email for auth-related emails only
 */
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrate with Resend, SendGrid, or another email service
    // For now, we log the email (development mode)

    if (process.env.NODE_ENV === 'development') {
      console.log('📧 EMAIL SENT (DEV MODE):')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('---')
      console.log(options.text)
      console.log('---')
      return { success: true }
    }

    // In production, you would use an email service here
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'Design Kit <noreply@designkit.com>',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // })

    console.warn('Email sending not configured for production. Email not sent:', options.subject)
    return { success: false, error: 'Email service not configured' }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check if user has email preference enabled
 */
async function canSendEmail(
  userId: string,
  emailType: 'quota_warnings' | 'subscription_updates' | 'marketing_emails'
): Promise<boolean> {
  try {
    const supabase = createServerClient()

    // Get user's email preferences
    const { data, error } = await supabase
      .from('email_preferences')
      .select(emailType)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // If no preferences found, default to true (send email)
      return true
    }

    return data[emailType] === true
  } catch (error) {
    console.error('Error checking email preferences:', error)
    // Default to true on error
    return true
  }
}

/**
 * Send quota warning email
 */
export async function sendQuotaWarningEmail(
  userId: string,
  email: string,
  data: {
    userName: string
    currentUsage: number
    maxQuota: number
    percentage: number
    planName: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user wants quota warning emails
    const canSend = await canSendEmail(userId, 'quota_warnings')
    if (!canSend) {
      return { success: false, error: 'User has disabled quota warning emails' }
    }

    const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
    const template = getQuotaWarningTemplate({ ...data, upgradeUrl })

    return await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  } catch (error) {
    console.error('Error sending quota warning email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send subscription update email
 */
export async function sendSubscriptionUpdateEmail(
  userId: string,
  email: string,
  data: {
    userName: string
    updateType: 'created' | 'updated' | 'canceled' | 'renewed'
    planName: string
    amount?: string
    nextBillingDate?: string
    cancellationDate?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user wants subscription update emails
    const canSend = await canSendEmail(userId, 'subscription_updates')
    if (!canSend) {
      return { success: false, error: 'User has disabled subscription update emails' }
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    const template = getSubscriptionUpdateTemplate({ ...data, dashboardUrl })

    return await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  } catch (error) {
    console.error('Error sending subscription update email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  userId: string,
  email: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Welcome emails are always sent (not based on preferences)
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    const toolsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tools`

    const template = getWelcomeEmailTemplate({ userName, dashboardUrl, toolsUrl })

    return await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Trigger quota warning based on usage percentage
 * This should be called after incrementing quota
 */
export async function checkAndSendQuotaWarning(
  userId: string,
  currentUsage: number,
  maxQuota: number
): Promise<void> {
  try {
    const percentage = Math.round((currentUsage / maxQuota) * 100)

    // Send warning at 80% and 100%
    if (percentage !== 80 && percentage !== 100) {
      return
    }

    // Get user info
    const supabase = createServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, plan')
      .eq('id', userId)
      .single()

    if (!profile?.email) {
      console.error('No email found for user:', userId)
      return
    }

    await sendQuotaWarningEmail(userId, profile.email, {
      userName: profile.full_name || 'there',
      currentUsage,
      maxQuota,
      percentage,
      planName: profile.plan === 'free' ? 'Free' : profile.plan === 'premium' ? 'Premium' : 'Pro',
    })
  } catch (error) {
    console.error('Error in checkAndSendQuotaWarning:', error)
  }
}
