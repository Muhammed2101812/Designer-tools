# Email Client Documentation

This module provides email functionality for Design Kit using Resend as the email service provider.

## Setup

1. Install the Resend package (already done):
   ```bash
   npm install resend
   ```

2. Configure environment variables in `.env.local`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=noreply@designkit.com
   ```

3. Verify your domain in Resend dashboard for production use.

## Available Functions

### `sendWelcomeEmail(to, name?)`
Sends a welcome email to new users with onboarding information.

```typescript
import { sendWelcomeEmail } from '@/lib/email/client'

const result = await sendWelcomeEmail('user@example.com', 'John Doe')
if (result.success) {
  console.log('Welcome email sent successfully')
} else {
  console.error('Failed to send welcome email:', result.error)
}
```

### `sendSubscriptionConfirmation(to, name?, plan, amount)`
Sends a confirmation email when a user subscribes to a paid plan.

```typescript
import { sendSubscriptionConfirmation } from '@/lib/email/client'

const result = await sendSubscriptionConfirmation(
  'user@example.com', 
  'John Doe', 
  'premium', 
  900 // $9.00 in cents
)
```

### `sendQuotaWarning(to, name?, currentUsage, dailyLimit, plan)`
Sends a warning email when user approaches their daily quota limit.

```typescript
import { sendQuotaWarning } from '@/lib/email/client'

const result = await sendQuotaWarning(
  'user@example.com',
  'John Doe',
  45, // current usage
  50, // daily limit
  'free' // plan type
)
```

### `sendSubscriptionCancellation(to, name?, plan, endDate)`
Sends a confirmation email when a user cancels their subscription.

```typescript
import { sendSubscriptionCancellation } from '@/lib/email/client'

const result = await sendSubscriptionCancellation(
  'user@example.com',
  'John Doe',
  'premium',
  '2024-12-31'
)
```

### `sendCustomEmail(to, subject, htmlContent, textContent?)`
Sends a custom email with provided content.

```typescript
import { sendCustomEmail } from '@/lib/email/client'

const result = await sendCustomEmail(
  'user@example.com',
  'Custom Subject',
  '<h1>Custom HTML Content</h1>',
  'Custom text content' // optional
)
```

### `validateEmailConfig()`
Validates that email configuration is properly set up.

```typescript
import { validateEmailConfig } from '@/lib/email/client'

const config = validateEmailConfig()
if (!config.valid) {
  console.error('Email configuration errors:', config.errors)
}
```

## Email Templates

All email templates are responsive and include:
- Professional Design Kit branding
- Mobile-friendly layouts
- Both HTML and plain text versions
- Consistent styling and colors
- Call-to-action buttons
- Footer with support links

### Template Features

- **Welcome Email**: Introduces new users to Design Kit features and quota information
- **Subscription Confirmation**: Shows plan details, features, and billing information
- **Quota Warning**: Displays usage percentage with visual progress bar and upgrade options
- **Cancellation Email**: Confirms cancellation with access end date and reactivation option

## Error Handling

All email functions return a consistent response format:

```typescript
{
  success: boolean
  error?: string
}
```

### Graceful Degradation

- If `RESEND_API_KEY` is not configured, functions will log a warning and return `{ success: true }`
- This prevents email functionality from breaking the application in development
- Production deployments should always have proper email configuration

## Configuration Validation

The module includes validation to ensure proper setup:

```typescript
const validation = validateEmailConfig()
// Returns: { valid: boolean, errors: string[] }
```

Common configuration issues:
- Missing `RESEND_API_KEY`
- Missing `EMAIL_FROM` address
- Invalid email format in `EMAIL_FROM`

## Integration Examples

### Stripe Webhook Integration
```typescript
// In Stripe webhook handler
import { sendSubscriptionConfirmation } from '@/lib/email/client'

case 'checkout.session.completed':
  await sendSubscriptionConfirmation(
    user.email,
    user.full_name,
    subscription.plan,
    subscription.amount
  )
  break
```

### Quota Monitoring
```typescript
// In API tool usage tracking
import { sendQuotaWarning } from '@/lib/email/client'

if (usagePercentage >= 90) {
  await sendQuotaWarning(
    user.email,
    user.full_name,
    currentUsage,
    dailyLimit,
    user.plan
  )
}
```

### User Registration
```typescript
// In auth callback or profile creation
import { sendWelcomeEmail } from '@/lib/email/client'

await sendWelcomeEmail(user.email, user.full_name)
```

## Testing

The email client includes comprehensive tests covering:
- Function exports and availability
- Parameter validation
- Error handling
- Configuration validation
- Graceful degradation when API key is missing

Run tests with:
```bash
npm test -- lib/email/__tests__/client.test.ts
```

## Production Considerations

1. **Domain Verification**: Verify your sending domain in Resend dashboard
2. **Rate Limits**: Resend free tier allows 100 emails/day, 3000 emails/month
3. **Monitoring**: Monitor email delivery rates and bounce rates
4. **Compliance**: Ensure compliance with email regulations (CAN-SPAM, GDPR)
5. **Unsubscribe**: Implement unsubscribe functionality for marketing emails

## Troubleshooting

### Common Issues

1. **"Missing API key" Error**
   - Ensure `RESEND_API_KEY` is set in environment variables
   - Check that the API key is valid and not expired

2. **Domain Not Verified**
   - Verify your sending domain in Resend dashboard
   - Use a verified domain in `EMAIL_FROM`

3. **Emails Not Delivered**
   - Check Resend dashboard for delivery status
   - Verify recipient email addresses
   - Check spam folders

4. **Rate Limit Exceeded**
   - Monitor your usage in Resend dashboard
   - Consider upgrading your Resend plan
   - Implement email queuing for high volume

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
```

This will provide additional console output for troubleshooting email issues.