import { Resend } from 'resend'
import { env } from '@/lib/env'

// Initialize Resend client only if API key is available
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

// Email configuration
const EMAIL_CONFIG = {
  from: env.EMAIL_FROM || 'Design Kit <noreply@designkit.com>',
  replyTo: env.EMAIL_FROM || 'support@designkit.com',
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  name: string = ''
): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip sending if no API key is configured
    if (!env.RESEND_API_KEY || !resend) {
      console.warn('RESEND_API_KEY not configured, skipping welcome email')
      return { success: true }
    }

    const displayName = name || to.split('@')[0]

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Welcome to Design Kit! 🎨',
      html: getWelcomeEmailTemplate(displayName),
      text: getWelcomeEmailText(displayName),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * HTML template for welcome email
 */
function getWelcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Design Kit</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }
    .content {
      margin-bottom: 30px;
    }
    .feature-list {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .feature-list h3 {
      margin-top: 0;
      color: #475569;
      font-size: 16px;
    }
    .feature-list ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .feature-list li {
      margin: 8px 0;
      color: #64748b;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
    }
    .quota-info {
      background: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .quota-info h4 {
      margin: 0 0 8px 0;
      color: #065f46;
      font-size: 16px;
    }
    .quota-info p {
      margin: 0;
      color: #047857;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎨 Design Kit</div>
      <h1 class="title">Welcome${name ? `, ${name}` : ''}!</h1>
    </div>
    
    <div class="content">
      <p>Thank you for joining Design Kit! We're excited to help you create amazing designs with our powerful, privacy-first tools.</p>
      
      <div class="quota-info">
        <h4>🎉 Your Free Plan is Ready</h4>
        <p>You start with 10 daily API operations and unlimited access to all client-side tools. No credit card required!</p>
      </div>
      
      <div class="feature-list">
        <h3>🛠️ What you can do right now:</h3>
        <ul>
          <li><strong>Client-Side Tools (Unlimited):</strong> Color Picker, Image Cropper, Resizer, Format Converter, QR Generator, Gradient Generator</li>
          <li><strong>API-Powered Tools (10/day):</strong> Image Compressor, Background Remover, Image Upscaler, Mockup Generator</li>
          <li><strong>Privacy-First:</strong> Client-side tools process files entirely in your browser - we never see your files!</li>
        </ul>
      </div>
      
      <p>Ready to start creating? Click the button below to explore all our tools:</p>
      
      <div style="text-align: center;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard" class="cta-button">
          Start Creating →
        </a>
      </div>
      
      <p>Need more API operations? Check out our <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/pricing" style="color: #2563eb;">Premium and Pro plans</a> for higher limits and additional features.</p>
    </div>
    
    <div class="footer">
      <p>Questions? Reply to this email or visit our <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/faq" style="color: #64748b;">FAQ page</a>.</p>
      <p>Happy designing! 🚀<br>The Design Kit Team</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Plain text version of welcome email
 */
function getWelcomeEmailText(name: string): string {
  return `
Welcome to Design Kit${name ? `, ${name}` : ''}!

Thank you for joining Design Kit! We're excited to help you create amazing designs with our powerful, privacy-first tools.

🎉 Your Free Plan is Ready
You start with 10 daily API operations and unlimited access to all client-side tools. No credit card required!

🛠️ What you can do right now:

Client-Side Tools (Unlimited):
- Color Picker, Image Cropper, Resizer, Format Converter, QR Generator, Gradient Generator

API-Powered Tools (10/day):
- Image Compressor, Background Remover, Image Upscaler, Mockup Generator

Privacy-First:
Client-side tools process files entirely in your browser - we never see your files!

Ready to start creating? Visit your dashboard:
${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard

Need more API operations? Check out our Premium and Pro plans:
${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/pricing

Questions? Reply to this email or visit our FAQ page:
${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/faq

Happy designing! 🚀
The Design Kit Team
  `.trim()
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmation(
  to: string,
  name: string = '',
  plan: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.RESEND_API_KEY || !resend) {
      console.warn('RESEND_API_KEY not configured, skipping subscription confirmation email')
      return { success: true }
    }

    const displayName = name || to.split('@')[0]

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Welcome to ${plan} Plan! 🎉`,
      html: getSubscriptionConfirmationTemplate(displayName, plan, amount),
      text: getSubscriptionConfirmationText(displayName, plan, amount),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send subscription confirmation email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send quota warning email
 */
export async function sendQuotaWarning(
  to: string,
  name: string = '',
  currentUsage: number,
  dailyLimit: number,
  plan: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.RESEND_API_KEY || !resend) {
      console.warn('RESEND_API_KEY not configured, skipping quota warning email')
      return { success: true }
    }

    const displayName = name || to.split('@')[0]
    const percentage = Math.round((currentUsage / dailyLimit) * 100)

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `⚠️ Quota Alert: ${percentage}% Used`,
      html: getQuotaWarningTemplate(displayName, currentUsage, dailyLimit, plan, percentage),
      text: getQuotaWarningText(displayName, currentUsage, dailyLimit, plan, percentage),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send quota warning email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send subscription cancellation email
 */
export async function sendSubscriptionCancellation(
  to: string,
  name: string = '',
  plan: string,
  endDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.RESEND_API_KEY || !resend) {
      console.warn('RESEND_API_KEY not configured, skipping subscription cancellation email')
      return { success: true }
    }

    const displayName = name || to.split('@')[0]

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Subscription Cancelled - We\'ll Miss You! 💙',
      html: getSubscriptionCancellationTemplate(displayName, plan, endDate),
      text: getSubscriptionCancellationText(displayName, plan, endDate),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send subscription cancellation email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Generic email sender with custom template
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.RESEND_API_KEY || !resend) {
      console.warn('RESEND_API_KEY not configured, skipping custom email')
      return { success: true }
    }

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send custom email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * HTML template for subscription confirmation email
 */
function getSubscriptionConfirmationTemplate(name: string, plan: string, amount: number): string {
  const planFeatures = {
    premium: ['500 daily API operations', '50MB file size limit', 'Batch processing (10 files)', 'Priority support'],
    pro: ['2000 daily API operations', '100MB file size limit', 'Batch processing (50 files)', 'REST API access', 'Premium support']
  }

  const features = planFeatures[plan.toLowerCase() as keyof typeof planFeatures] || []

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }
    .success-badge {
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 20px;
    }
    .plan-info {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .plan-name {
      font-size: 20px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 8px;
    }
    .plan-price {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 16px;
    }
    .feature-list {
      text-align: left;
      margin: 20px 0;
    }
    .feature-list ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .feature-list li {
      margin: 8px 0;
      color: #475569;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎨 Design Kit</div>
      <div class="success-badge">✅ Subscription Active</div>
      <h1 class="title">Welcome to ${plan} Plan${name ? `, ${name}` : ''}!</h1>
    </div>
    
    <div class="content">
      <p>Thank you for upgrading to Design Kit ${plan}! Your subscription is now active and you have access to all premium features.</p>
      
      <div class="plan-info">
        <div class="plan-name">${plan} Plan</div>
        <div class="plan-price">$${(amount / 100).toFixed(2)}/month</div>
        
        <div class="feature-list">
          <ul>
            ${features.map(feature => `<li>✓ ${feature}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <p>Your new quota limits are now active and will reset daily at midnight UTC. You can monitor your usage and manage your subscription anytime from your dashboard.</p>
      
      <div style="text-align: center;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard" class="cta-button">
          Go to Dashboard →
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Need help? Reply to this email or visit our <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/faq" style="color: #64748b;">FAQ page</a>.</p>
      <p>Manage your subscription: <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard" style="color: #64748b;">Dashboard</a></p>
      <p>Thank you for choosing Design Kit! 🚀</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * HTML template for quota warning email
 */
function getQuotaWarningTemplate(name: string, currentUsage: number, dailyLimit: number, plan: string, percentage: number): string {
  const remaining = dailyLimit - currentUsage
  const isNearLimit = percentage >= 90

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quota Warning</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .warning-badge {
      background: ${isNearLimit ? '#ef4444' : '#f59e0b'};
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }
    .quota-info {
      background: ${isNearLimit ? '#fef2f2' : '#fffbeb'};
      border: 1px solid ${isNearLimit ? '#fecaca' : '#fed7aa'};
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .quota-usage {
      font-size: 32px;
      font-weight: bold;
      color: ${isNearLimit ? '#dc2626' : '#d97706'};
      margin-bottom: 8px;
    }
    .quota-details {
      color: #64748b;
      margin-bottom: 16px;
    }
    .progress-bar {
      background: #e2e8f0;
      border-radius: 10px;
      height: 8px;
      overflow: hidden;
      margin: 16px 0;
    }
    .progress-fill {
      background: ${isNearLimit ? '#ef4444' : '#f59e0b'};
      height: 100%;
      width: ${percentage}%;
      border-radius: 10px;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎨 Design Kit</div>
      <div class="warning-badge">⚠️ ${percentage}% Used</div>
      <h1 class="title">Quota Alert${name ? `, ${name}` : ''}!</h1>
    </div>
    
    <div class="content">
      <p>You've used ${percentage}% of your daily API quota. ${isNearLimit ? 'You\'re almost at your limit!' : 'Just a heads up to help you plan your usage.'}</p>
      
      <div class="quota-info">
        <div class="quota-usage">${remaining}</div>
        <div class="quota-details">operations remaining out of ${dailyLimit} (${plan} plan)</div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <p style="margin: 0; font-size: 14px; color: #64748b;">Resets at midnight UTC</p>
      </div>
      
      ${plan === 'free' ? `
      <p>Need more operations? Upgrade to Premium (500/day) or Pro (2000/day) for higher limits and additional features.</p>
      
      <div style="text-align: center;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/pricing" class="cta-button">
          Upgrade Plan →
        </a>
      </div>
      ` : `
      <p>If you frequently hit your quota, consider upgrading to our Pro plan for 2000 daily operations and additional features.</p>
      
      <div style="text-align: center;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard" class="cta-button">
          View Dashboard →
        </a>
      </div>
      `}
    </div>
    
    <div class="footer">
      <p>Monitor your usage: <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard" style="color: #64748b;">Dashboard</a></p>
      <p>Questions? Reply to this email or visit our <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/faq" style="color: #64748b;">FAQ</a>.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * HTML template for subscription cancellation email
 */
function getSubscriptionCancellationTemplate(name: string, plan: string, endDate: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancelled</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }
    .cancellation-info {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .end-date {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 8px;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎨 Design Kit</div>
      <h1 class="title">We'll Miss You${name ? `, ${name}` : ''}! 💙</h1>
    </div>
    
    <div class="content">
      <p>Your ${plan} subscription has been cancelled successfully. We're sorry to see you go!</p>
      
      <div class="cancellation-info">
        <p><strong>Your ${plan} benefits continue until:</strong></p>
        <div class="end-date">${new Date(endDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
        <p style="margin: 0; color: #64748b; font-size: 14px;">After this date, you'll be moved to our Free plan</p>
      </div>
      
      <p>Until then, you can continue using all ${plan} features including:</p>
      <ul>
        <li>Your current daily API quota</li>
        <li>Higher file size limits</li>
        <li>Batch processing capabilities</li>
        <li>Priority support</li>
      </ul>
      
      <p>After your subscription ends, you'll still have access to:</p>
      <ul>
        <li>All client-side tools (unlimited)</li>
        <li>10 daily API operations</li>
        <li>Community support</li>
      </ul>
      
      <p>Changed your mind? You can reactivate your subscription anytime before ${new Date(endDate).toLocaleDateString()}.</p>
      
      <div style="text-align: center;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/pricing" class="cta-button">
          Reactivate Subscription →
        </a>
      </div>
      
      <p>We'd love to hear your feedback about why you cancelled. Your input helps us improve Design Kit for everyone.</p>
    </div>
    
    <div class="footer">
      <p>Questions? Reply to this email or visit our <a href="${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/faq" style="color: #64748b;">FAQ page</a>.</p>
      <p>Thank you for being part of the Design Kit community! 🚀</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Plain text versions of email templates
 */
function getSubscriptionConfirmationText(name: string, plan: string, amount: number): string {
  return `
Welcome to ${plan} Plan${name ? `, ${name}` : ''}!

✅ Subscription Active

Thank you for upgrading to Design Kit ${plan}! Your subscription is now active and you have access to all premium features.

${plan} Plan - $${(amount / 100).toFixed(2)}/month

Your new quota limits are now active and will reset daily at midnight UTC. You can monitor your usage and manage your subscription anytime from your dashboard.

Go to Dashboard: ${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard

Need help? Reply to this email or visit our FAQ page:
${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/faq

Manage your subscription: ${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard

Thank you for choosing Design Kit! 🚀
  `.trim()
}

function getQuotaWarningText(name: string, currentUsage: number, dailyLimit: number, plan: string, percentage: number): string {
  const remaining = dailyLimit - currentUsage
  const isNearLimit = percentage >= 90

  return `
Quota Alert${name ? `, ${name}` : ''}!

⚠️ ${percentage}% Used

You've used ${percentage}% of your daily API quota. ${isNearLimit ? 'You\'re almost at your limit!' : 'Just a heads up to help you plan your usage.'}

${remaining} operations remaining out of ${dailyLimit} (${plan} plan)
Resets at midnight UTC

${plan === 'free' ? `
Need more operations? Upgrade to Premium (500/day) or Pro (2000/day) for higher limits and additional features.

Upgrade Plan: ${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/pricing
` : `
If you frequently hit your quota, consider upgrading to our Pro plan for 2000 daily operations and additional features.

View Dashboard: ${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard
`}

Monitor your usage: ${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/dashboard
Questions? Reply to this email or visit our FAQ: ${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/faq
  `.trim()
}

function getSubscriptionCancellationText(name: string, plan: string, endDate: string): string {
  return `
We'll Miss You${name ? `, ${name}` : ''}! 💙

Your ${plan} subscription has been cancelled successfully. We're sorry to see you go!

Your ${plan} benefits continue until: ${new Date(endDate).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

After this date, you'll be moved to our Free plan.

Until then, you can continue using all ${plan} features including:
- Your current daily API quota
- Higher file size limits  
- Batch processing capabilities
- Priority support

After your subscription ends, you'll still have access to:
- All client-side tools (unlimited)
- 10 daily API operations
- Community support

Changed your mind? You can reactivate your subscription anytime before ${new Date(endDate).toLocaleDateString()}.

Reactivate Subscription: ${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/pricing

We'd love to hear your feedback about why you cancelled. Your input helps us improve Design Kit for everyone.

Questions? Reply to this email or visit our FAQ page:
${env.NEXT_PUBLIC_APP_URL || 'https://designkit.com'}/faq

Thank you for being part of the Design Kit community! 🚀
  `.trim()
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is not configured')
  }

  if (!env.EMAIL_FROM) {
    errors.push('EMAIL_FROM is not configured')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}