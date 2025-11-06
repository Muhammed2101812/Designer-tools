# OAuth Setup Guide

## Google OAuth Configuration

To enable Google OAuth authentication in Design Kit, you need to configure it in your Supabase project.

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type
6. Add authorized redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - For local development: `http://localhost:54321/auth/v1/callback`
7. Save and copy your **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to expand
5. Enable the Google provider
6. Paste your **Client ID** and **Client Secret**
7. Click **Save**

### Step 3: Test OAuth Flow

1. Start your development server: `npm run dev`
2. Navigate to `/signup` or `/login`
3. Click "Continue with Google"
4. You should be redirected to Google's consent screen
5. After authorization, you'll be redirected back to your app

### Troubleshooting

**Error: "redirect_uri_mismatch"**
- Make sure the redirect URI in Google Console matches exactly with your Supabase callback URL
- Check for trailing slashes and protocol (http vs https)

**Error: "OAuth provider not configured"**
- Verify that Google OAuth is enabled in Supabase Dashboard
- Check that Client ID and Client Secret are correctly entered

**Profile not created after OAuth login**
- The callback handler automatically creates profiles for OAuth users
- Check the `app/auth/callback/route.ts` file for profile creation logic
- Verify that the profiles table exists in your database

### Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for sensitive data
- Regularly rotate your OAuth secrets
- Monitor OAuth usage in Google Cloud Console

### Additional Providers

To add more OAuth providers (GitHub, Facebook, etc.):

1. Follow similar steps in the respective provider's developer console
2. Configure the provider in Supabase Dashboard
3. Add the provider button to signup/login pages
4. Update the OAuth handler to support the new provider

Example for GitHub:

```typescript
const handleGitHubLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) {
    toast({
      title: 'OAuth error',
      description: error.message,
      variant: 'destructive',
    })
  }
}
```
