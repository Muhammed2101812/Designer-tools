# Authentication System Documentation

## Overview

Design Kit uses Supabase Auth for authentication, providing email/password authentication, OAuth (Google), email verification, and password reset functionality.

## Features Implemented

### 1. Email/Password Authentication

**Signup Flow:**
- Email and password validation (minimum 8 characters)
- Email verification required before login
- Automatic profile creation in database
- Welcome screen for new users
- Error handling for duplicate emails and weak passwords

**Login Flow:**
- Email and password authentication
- Session creation with 7-day expiration
- "Remember me" functionality
- Account lockout after 5 failed attempts (15 minutes)
- User-friendly error messages

### 2. OAuth Authentication

**Supported Providers:**
- Google OAuth (configured in Supabase)

**Features:**
- One-click signup/login
- Automatic profile creation for OAuth users
- Seamless callback handling
- Error handling for OAuth failures

**Setup Required:**
See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for configuration instructions.

### 3. Password Reset

**Flow:**
1. User requests password reset with email
2. Supabase sends reset link (expires in 1 hour)
3. User clicks link and is redirected to update password page
4. User enters new password (validated for strength)
5. Password is updated and user is redirected to login

**Features:**
- Email validation
- Token expiration handling
- Password strength validation
- Success/error notifications

### 4. Email Verification

**Flow:**
1. User signs up with email/password
2. Verification email sent automatically
3. User clicks verification link
4. User is redirected to welcome screen
5. Profile is created in database

## Routes

### Public Routes (No Authentication Required)

- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/reset-password` - Password reset request
- `/auth/update-password` - Password reset confirmation
- `/verify-email` - Email verification instructions
- `/auth/callback` - OAuth callback handler
- `/auth/auth-error` - Authentication error page
- `/pricing` - Pricing page

### Protected Routes (Authentication Required)

- `/dashboard` - User dashboard
- `/settings` - User settings
- `/profile` - User profile

Protected routes automatically redirect to `/login` if user is not authenticated.

### Auth Routes (Redirect to Dashboard if Authenticated)

- `/login` - Redirects to `/dashboard` if already logged in
- `/signup` - Redirects to `/dashboard` if already logged in

## Components

### Auth Pages

**Location:** `app/(auth)/`

All auth pages use a shared layout that centers content on the page with a muted background.

**Pages:**
- `login/page.tsx` - Login form with email/password and OAuth
- `signup/page.tsx` - Signup form with email/password and OAuth
- `reset-password/page.tsx` - Password reset request form
- `update-password/page.tsx` - Password reset confirmation form
- `verify-email/page.tsx` - Email verification instructions
- `welcome/page.tsx` - Welcome screen for new users
- `auth-error/page.tsx` - Authentication error page

### Auth Store

**Location:** `store/authStore.ts`

Zustand store for managing authentication state:

```typescript
interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}
```

**Usage:**

```typescript
import { useAuthStore } from '@/store/authStore'

function MyComponent() {
  const { user, profile, logout } = useAuthStore()
  
  // Access user data
  console.log(user?.email)
  console.log(profile?.plan)
  
  // Logout
  const handleLogout = () => {
    logout()
    router.push('/login')
  }
}
```

## Middleware

**Location:** `middleware.ts` and `lib/supabase/middleware.ts`

The middleware runs on every request to:
1. Refresh Supabase session if expired
2. Protect routes that require authentication
3. Redirect authenticated users away from auth pages

**Protected Routes:**
- `/dashboard`
- `/settings`
- `/profile`

**Auth Routes (redirect if authenticated):**
- `/login`
- `/signup`

## Security Features

### 1. Account Lockout

After 5 failed login attempts, the account is locked for 15 minutes. This is implemented client-side and stored in component state.

**Note:** For production, consider implementing server-side rate limiting using Upstash Redis or similar.

### 2. Password Strength

Passwords must be at least 8 characters long. This is validated both client-side (Zod) and server-side (Supabase).

### 3. Email Verification

Email verification is required before users can access protected routes. Unverified users cannot log in.

### 4. Session Management

- Sessions expire after 7 days by default
- Sessions are automatically refreshed by middleware
- Sessions are stored in HTTP-only cookies (handled by Supabase)

### 5. Row Level Security (RLS)

All database tables use RLS policies to ensure users can only access their own data.

## Error Handling

### Common Errors

**Signup Errors:**
- Email already exists
- Weak password
- Invalid email format
- Network errors

**Login Errors:**
- Invalid credentials
- Account locked (5 failed attempts)
- Email not verified
- Network errors

**Password Reset Errors:**
- Invalid email
- Expired token
- Network errors

**OAuth Errors:**
- Provider not configured
- User cancelled authorization
- Network errors

### Error Display

All errors are displayed using toast notifications from `@/hooks/use-toast`:

```typescript
toast({
  title: 'Error title',
  description: 'Error message',
  variant: 'destructive',
})
```

## Testing Authentication

### Manual Testing Checklist

**Signup Flow:**
- [ ] Valid email and password creates account
- [ ] Weak password shows error
- [ ] Duplicate email shows error
- [ ] Verification email is sent
- [ ] Verification link redirects to welcome page

**Login Flow:**
- [ ] Valid credentials log in successfully
- [ ] Invalid credentials show error
- [ ] 5 failed attempts lock account for 15 minutes
- [ ] Remember me checkbox works
- [ ] Redirects to dashboard after login

**OAuth Flow:**
- [ ] Google OAuth button initiates flow
- [ ] User is redirected to Google consent screen
- [ ] After authorization, user is redirected back
- [ ] Profile is created automatically
- [ ] User is logged in and redirected to dashboard

**Password Reset Flow:**
- [ ] Valid email sends reset link
- [ ] Reset link redirects to update password page
- [ ] New password is validated for strength
- [ ] Password is updated successfully
- [ ] Expired link shows error

**Protected Routes:**
- [ ] Unauthenticated users are redirected to login
- [ ] Authenticated users can access protected routes
- [ ] Logout clears session and redirects to login

## Database Schema

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS Policies

```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Environment Variables

Required environment variables for authentication:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Future Enhancements

### Recommended Improvements

1. **Server-Side Rate Limiting**
   - Implement rate limiting using Upstash Redis
   - Track failed login attempts per IP address
   - Prevent brute force attacks

2. **Two-Factor Authentication (2FA)**
   - Add TOTP-based 2FA
   - SMS-based 2FA
   - Backup codes

3. **Social Login Providers**
   - GitHub OAuth
   - Facebook OAuth
   - Twitter OAuth

4. **Account Management**
   - Email change with verification
   - Phone number verification
   - Account deletion

5. **Session Management**
   - View active sessions
   - Revoke sessions
   - Session activity log

6. **Security Enhancements**
   - CAPTCHA on signup/login
   - Device fingerprinting
   - Suspicious activity detection

## Troubleshooting

### Common Issues

**Issue: "Invalid login credentials"**
- Check that email is verified
- Verify password is correct
- Check Supabase dashboard for user status

**Issue: "OAuth provider not configured"**
- Follow [OAUTH_SETUP.md](./OAUTH_SETUP.md) to configure provider
- Verify credentials in Supabase dashboard

**Issue: "Session not persisting"**
- Check that cookies are enabled
- Verify middleware is running
- Check browser console for errors

**Issue: "Redirect loop"**
- Check middleware configuration
- Verify protected routes list
- Check for conflicting redirects

### Debug Mode

To enable debug logging for Supabase Auth:

```typescript
// In lib/supabase/client.ts
export const supabase = createClient({
  auth: {
    debug: true, // Enable debug logging
  },
})
```

## Support

For issues or questions:
1. Check this documentation
2. Review Supabase Auth documentation
3. Check browser console for errors
4. Review server logs
5. Contact support

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
