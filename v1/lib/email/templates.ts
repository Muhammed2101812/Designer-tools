/**
 * Email Templates for Supabase Email Notifications
 *
 * These templates are used for:
 * - Quota warnings
 * - Subscription updates
 * - Marketing emails (future)
 */

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface QuotaWarningData {
  userName: string
  currentUsage: number
  maxQuota: number
  percentage: number
  planName: string
  upgradeUrl: string
}

interface SubscriptionUpdateData {
  userName: string
  updateType: 'created' | 'updated' | 'canceled' | 'renewed'
  planName: string
  amount?: string
  nextBillingDate?: string
  cancellationDate?: string
  dashboardUrl: string
}

interface WelcomeEmailData {
  userName: string
  dashboardUrl: string
  toolsUrl: string
}

/**
 * Quota Warning Email Template
 * Sent when user reaches 80% or 100% of their quota
 */
export function getQuotaWarningTemplate(data: QuotaWarningData): EmailTemplate {
  const { userName, currentUsage, maxQuota, percentage, planName, upgradeUrl } = data

  const isAtLimit = percentage >= 100
  const subject = isAtLimit
    ? '⚠️ You\'ve reached your quota limit'
    : '⚠️ You\'re running low on quota'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 40px 30px; }
    .warning-box { background-color: ${isAtLimit ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${isAtLimit ? '#ef4444' : '#f59e0b'}; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .quota-bar { background-color: #e5e7eb; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
    .quota-fill { background: linear-gradient(90deg, #10b981 0%, ${percentage > 80 ? '#f59e0b' : '#10b981'} 50%, ${isAtLimit ? '#ef4444' : '#f59e0b'} 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .btn:hover { opacity: 0.9; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Design Kit - Quota Alert</h1>
    </div>

    <div class="content">
      <p>Hi ${userName},</p>

      <div class="warning-box">
        <strong>${isAtLimit ? '⚠️ Quota Limit Reached' : '⚠️ Quota Warning'}</strong>
        <p style="margin: 10px 0 0 0;">
          ${isAtLimit
            ? 'You\'ve used all of your quota for today. Upgrade to continue using API-powered tools.'
            : `You've used ${percentage}% of your ${planName} plan quota. Consider upgrading to avoid interruptions.`
          }
        </p>
      </div>

      <div class="quota-bar">
        <div class="quota-fill" style="width: ${Math.min(percentage, 100)}%;">
          ${currentUsage} / ${maxQuota} (${percentage}%)
        </div>
      </div>

      <p><strong>Current Plan:</strong> ${planName}</p>
      <p><strong>Usage Today:</strong> ${currentUsage} out of ${maxQuota} API operations</p>

      ${isAtLimit
        ? '<p>🚀 Upgrade now to unlock higher limits and continue using Background Remover and Image Upscaler tools.</p>'
        : '<p>💡 Upgrade to a higher plan to get more daily operations and never worry about limits again.</p>'
      }

      <div style="text-align: center;">
        <a href="${upgradeUrl}" class="btn">
          ${isAtLimit ? 'Upgrade Now' : 'View Plans'}
        </a>
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        <strong>Note:</strong> Your quota resets daily at midnight UTC. Client-side tools (Color Picker, Image Cropper, etc.) are always unlimited and don't count towards your quota.
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Design Kit. All rights reserved.</p>
      <p>
        <a href="${upgradeUrl.replace('/pricing', '/dashboard/profile')}">Manage Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Hi ${userName},

${isAtLimit ? 'QUOTA LIMIT REACHED' : 'QUOTA WARNING'}

You've used ${currentUsage} out of ${maxQuota} API operations today (${percentage}%).

Current Plan: ${planName}

${isAtLimit
  ? 'You\'ve reached your daily limit. Upgrade to continue using API-powered tools.'
  : `You're running low on quota. Consider upgrading to avoid interruptions.`
}

Upgrade here: ${upgradeUrl}

Note: Your quota resets daily at midnight UTC. Client-side tools are always unlimited.

---
© ${new Date().getFullYear()} Design Kit
Manage preferences: ${upgradeUrl.replace('/pricing', '/dashboard/profile')}
  `

  return { subject, html, text }
}

/**
 * Subscription Update Email Template
 * Sent when subscription is created, updated, canceled, or renewed
 */
export function getSubscriptionUpdateTemplate(data: SubscriptionUpdateData): EmailTemplate {
  const { userName, updateType, planName, amount, nextBillingDate, cancellationDate, dashboardUrl } = data

  const subjects = {
    created: '🎉 Welcome to Design Kit Premium!',
    updated: '✅ Your subscription has been updated',
    canceled: '😢 Your subscription has been canceled',
    renewed: '✅ Your subscription has been renewed'
  }

  const subject = subjects[updateType]

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 40px 30px; }
    .info-box { background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .btn:hover { opacity: 0.9; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    .footer a { color: #667eea; text-decoration: none; }
    .details { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .details-row:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${updateType === 'created' ? '🎉' : updateType === 'canceled' ? '😢' : '✅'} Subscription ${updateType === 'created' ? 'Confirmation' : 'Update'}</h1>
    </div>

    <div class="content">
      <p>Hi ${userName},</p>

      ${updateType === 'created' ? `
        <p>Welcome to Design Kit ${planName} plan! 🎉</p>
        <p>Your subscription has been successfully activated. You now have access to all premium features including:</p>
        <ul>
          <li>✅ Higher API usage limits</li>
          <li>✅ Background Remover tool</li>
          <li>✅ Image Upscaler tool</li>
          <li>✅ Priority support</li>
        </ul>
      ` : updateType === 'canceled' ? `
        <p>We're sorry to see you go. Your ${planName} subscription has been canceled.</p>
        <p>Your premium features will remain active until ${cancellationDate ? new Date(cancellationDate).toLocaleDateString() : 'the end of your billing period'}.</p>
        <p>We'd love to hear your feedback on how we can improve. Feel free to reach out!</p>
      ` : updateType === 'renewed' ? `
        <p>Great news! Your ${planName} subscription has been successfully renewed.</p>
        <p>Thank you for continuing to use Design Kit. Your premium features remain active.</p>
      ` : `
        <p>Your subscription has been updated to the ${planName} plan.</p>
        <p>Your new plan features are now active!</p>
      `}

      <div class="details">
        <div class="details-row">
          <span><strong>Plan:</strong></span>
          <span>${planName}</span>
        </div>
        ${amount ? `
        <div class="details-row">
          <span><strong>Amount:</strong></span>
          <span>${amount}</span>
        </div>
        ` : ''}
        ${nextBillingDate && updateType !== 'canceled' ? `
        <div class="details-row">
          <span><strong>Next Billing Date:</strong></span>
          <span>${new Date(nextBillingDate).toLocaleDateString()}</span>
        </div>
        ` : ''}
        ${cancellationDate && updateType === 'canceled' ? `
        <div class="details-row">
          <span><strong>Active Until:</strong></span>
          <span>${new Date(cancellationDate).toLocaleDateString()}</span>
        </div>
        ` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="btn">
          ${updateType === 'canceled' ? 'Reactivate Subscription' : 'Go to Dashboard'}
        </a>
      </div>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Design Kit. All rights reserved.</p>
      <p>
        <a href="${dashboardUrl}/profile">Manage Subscription</a> |
        <a href="${dashboardUrl}/profile">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Hi ${userName},

${subjects[updateType]}

${updateType === 'created' ? `
Welcome to Design Kit ${planName} plan!

Your subscription is now active. You have access to:
- Higher API usage limits
- Background Remover tool
- Image Upscaler tool
- Priority support
` : updateType === 'canceled' ? `
Your ${planName} subscription has been canceled.

Premium features remain active until: ${cancellationDate ? new Date(cancellationDate).toLocaleDateString() : 'end of billing period'}

We'd love your feedback on how we can improve!
` : updateType === 'renewed' ? `
Your ${planName} subscription has been renewed.

Thank you for continuing with Design Kit!
` : `
Your subscription has been updated to ${planName}.

Your new plan features are now active.
`}

Plan: ${planName}
${amount ? `Amount: ${amount}` : ''}
${nextBillingDate && updateType !== 'canceled' ? `Next Billing: ${new Date(nextBillingDate).toLocaleDateString()}` : ''}
${cancellationDate && updateType === 'canceled' ? `Active Until: ${new Date(cancellationDate).toLocaleDateString()}` : ''}

Manage subscription: ${dashboardUrl}/profile

---
© ${new Date().getFullYear()} Design Kit
  `

  return { subject, html, text }
}

/**
 * Welcome Email Template
 * Sent when a new user signs up
 */
export function getWelcomeEmailTemplate(data: WelcomeEmailData): EmailTemplate {
  const { userName, dashboardUrl, toolsUrl } = data

  const subject = '🎉 Welcome to Design Kit!'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; }
    .content { padding: 40px 30px; }
    .tools-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
    .tool-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
    .tool-card h3 { margin: 10px 0 5px 0; font-size: 16px; }
    .tool-card p { color: #6b7280; font-size: 13px; margin: 0; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .btn:hover { opacity: 0.9; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Design Kit!</h1>
      <p>Your privacy-first design toolkit</p>
    </div>

    <div class="content">
      <p>Hi ${userName},</p>

      <p>Welcome aboard! We're excited to have you as part of the Design Kit community.</p>

      <p>Design Kit is your all-in-one design toolkit with 10 powerful tools, all processing files directly in your browser for maximum privacy and speed.</p>

      <h2 style="margin-top: 40px; margin-bottom: 20px;">🚀 Get Started</h2>

      <div class="tools-grid">
        <div class="tool-card">
          <div style="font-size: 32px;">🎨</div>
          <h3>Color Picker</h3>
          <p>Extract colors from images</p>
        </div>
        <div class="tool-card">
          <div style="font-size: 32px;">✂️</div>
          <h3>Image Cropper</h3>
          <p>Crop with precision</p>
        </div>
        <div class="tool-card">
          <div style="font-size: 32px;">📐</div>
          <h3>Image Resizer</h3>
          <p>Resize any image</p>
        </div>
        <div class="tool-card">
          <div style="font-size: 32px;">🔄</div>
          <h3>Format Converter</h3>
          <p>Convert image formats</p>
        </div>
      </div>

      <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 20px 0;">
        ...and 6 more powerful tools!
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${toolsUrl}" class="btn">Explore All Tools</a>
      </div>

      <h3 style="margin-top: 40px;">✨ What's included in your Free plan:</h3>
      <ul style="color: #374151; line-height: 1.8;">
        <li>✅ Unlimited use of 8 client-side tools</li>
        <li>✅ 10 AI-powered operations per day</li>
        <li>✅ All files processed locally (100% private)</li>
        <li>✅ No watermarks, ever</li>
      </ul>

      <p>Need more? <a href="${dashboardUrl.replace('/dashboard', '/pricing')}" style="color: #667eea; text-decoration: none;">Check out our Premium plans →</a></p>
    </div>

    <div class="footer">
      <p><strong>Need help?</strong></p>
      <p>
        <a href="${toolsUrl}">Browse Tools</a> |
        <a href="${dashboardUrl}">Dashboard</a> |
        <a href="${dashboardUrl}/profile">Settings</a>
      </p>
      <p style="margin-top: 20px;">© ${new Date().getFullYear()} Design Kit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Hi ${userName},

Welcome to Design Kit! 🎉

We're excited to have you as part of our community.

Design Kit is your privacy-first design toolkit with 10 powerful tools:

🎨 Color Picker - Extract colors from images
✂️ Image Cropper - Crop with precision
📐 Image Resizer - Resize any image
🔄 Format Converter - Convert image formats
...and 6 more!

What's included in your Free plan:
✅ Unlimited use of 8 client-side tools
✅ 10 AI-powered operations per day
✅ All files processed locally (100% private)
✅ No watermarks, ever

Explore tools: ${toolsUrl}
Dashboard: ${dashboardUrl}

Need more? Check our Premium plans: ${dashboardUrl.replace('/dashboard', '/pricing')}

---
© ${new Date().getFullYear()} Design Kit
  `

  return { subject, html, text }
}
