# Email Troubleshooting Guide

## Issue Summary

User reports that signup confirmation emails are not being delivered, but test emails (password reset) are working.

## Root Cause Analysis

1. **Missing verify-email page**: Users were redirected to a non-existent page after signup
2. **Test email confusion**: The test email endpoint was sending password reset emails instead of verification emails
3. **Email delivery timing**: Supabase emails can take a few minutes to arrive

## Solutions Implemented

### 1. Fixed Route Conflicts

- **Issue**: Duplicate verify-email and reset-password pages causing Next.js route conflicts
- **Solution**: Removed duplicate pages and used existing auth route group pages
- **Location**: `app/(auth)/verify-email/page.tsx` (existing, enhanced)

### 2. Enhanced Verify Email Page

- **Location**: `app/(auth)/verify-email/page.tsx`
- **Improvements**:
  - Updated test email functionality to send verification emails
  - Better user instructions and troubleshooting tips
  - Proper integration with existing auth flow

### 3. Updated Test Email Endpoint

- **Location**: `app/api/test-email/route.ts`
- **Changes**:
  - Added support for verification email testing
  - Accepts `type` parameter: `'verification'` or `'reset'`
  - Properly handles both email types

### 4. Verified Existing Auth Pages

- **Reset Password**: `app/(auth)/reset-password/page.tsx` (already exists)
- **Update Password**: `app/(auth)/update-password/page.tsx` (already exists)
- **All pages**: Properly integrated with Supabase auth flow

### 5. Added Email Debug Tool

- **Location**: `app/debug-email/page.tsx`
- **Features**:
  - Test all email types
  - Check Supabase configuration
  - View detailed results
  - Troubleshoot delivery issues

## Email Flow Explanation

### Signup Process
1. User fills signup form
2. `supabase.auth.signUp()` called with email redirect URL
3. User redirected to `/verify-email` page
4. Supabase sends confirmation email
5. User clicks link in email
6. Redirected to `/auth/callback` which processes verification
7. Finally redirected to dashboard

### Email Types
- **Signup Verification**: Sent automatically on signup
- **Resend Verification**: Manual resend via API
- **Password Reset**: Sent when user requests password reset
- **Test Email**: Debug tool for testing delivery

## Troubleshooting Steps

### For Users
1. **Check spam/junk folder** - Most common issue
2. **Wait 5-10 minutes** - Email delivery can be delayed
3. **Use resend button** - On verify-email page
4. **Try test email** - To verify delivery is working
5. **Check email address** - Ensure it's correct

### For Developers
1. **Visit `/debug-email`** - Test all email functions
2. **Check Supabase dashboard** - Verify email settings
3. **Check environment variables** - Ensure correct URLs
4. **Monitor browser console** - Look for errors
5. **Check Supabase logs** - In dashboard

## Supabase Email Configuration

### Required Settings
- **Email confirmation**: Enabled
- **Redirect URLs**: Properly configured
- **Email templates**: Default or custom
- **SMTP settings**: Default Supabase or custom

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Issues & Solutions

### Issue: "Email not received"
**Solutions**:
- Check spam folder
- Wait longer (up to 10 minutes)
- Use resend functionality
- Verify email address is correct

### Issue: "Invalid reset link"
**Solutions**:
- Links expire after 1 hour
- Request new reset email
- Ensure clicking correct link

### Issue: "Test email sends reset instead of verification"
**Solutions**:
- Use updated API with `type: 'verification'`
- Check API endpoint implementation
- Verify request payload

### Issue: "Emails work in development but not production"
**Solutions**:
- Check production environment variables
- Verify redirect URLs in Supabase
- Ensure domain is properly configured

## Testing Checklist

- [ ] Signup sends verification email
- [ ] Verification email arrives in inbox
- [ ] Clicking verification link works
- [ ] Resend verification works
- [ ] Password reset email works
- [ ] Test email functionality works
- [ ] All pages load correctly
- [ ] Error handling works properly

## Next Steps

1. **Monitor email delivery** - Check if issues persist
2. **User feedback** - Gather reports from users
3. **Supabase dashboard** - Monitor email metrics
4. **Consider custom SMTP** - If delivery issues continue

## Files Modified/Created

1. `app/(auth)/verify-email/page.tsx` - Enhanced existing verification page
2. `app/api/test-email/route.ts` - Updated test endpoint with verification support
3. `app/debug-email/page.tsx` - New debug tool
4. `EMAIL_TROUBLESHOOTING_GUIDE.md` - This guide
5. Removed duplicate pages that caused route conflicts

## Contact & Support

If email issues persist:
1. Check Supabase dashboard for email logs
2. Contact Supabase support if needed
3. Consider implementing custom SMTP provider
4. Monitor user feedback and reports