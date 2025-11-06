import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth callback handler for Supabase Auth
 * Handles the callback from OAuth providers (Google, GitHub)
 * and exchanges the authorization code for a session
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const returnTo = searchParams.get('return_to') || '/dashboard'

  // Handle OAuth errors
  if (error) {
    const errorMessages: Record<string, string> = {
      access_denied: 'oauth_failed',
      invalid_request: 'invalid_request',
      server_error: 'server_error',
    }
    
    const errorType = errorMessages[error] || 'unexpected_error'
    const message = errorDescription || 'An error occurred during authentication'
    
    return NextResponse.redirect(
      `${origin}/login?error=${errorType}&message=${encodeURIComponent(message)}`
    )
  }

  // Handle missing authorization code
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=invalid_request&message=${encodeURIComponent('Missing authorization code')}`
    )
  }

  try {
    const supabase = createClient()
    
    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Auth callback error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=session_failed&message=${encodeURIComponent('Failed to create session')}`
      )
    }

    if (!data.user) {
      return NextResponse.redirect(
        `${origin}/login?error=user_fetch_failed&message=${encodeURIComponent('Failed to retrieve user information')}`
      )
    }

    // Try to check/create user profile, but don't fail auth if it doesn't work
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      }
    } catch (profileError) {
      console.error('Profile operation error:', profileError)
      // Continue with auth flow even if profile operations fail
    }

    // Validate return_to parameter to prevent open redirects
    let redirectUrl = '/dashboard'
    if (returnTo) {
      try {
        const returnUrl = new URL(returnTo, origin)
        // Only allow same-origin redirects
        if (returnUrl.origin === origin) {
          redirectUrl = returnTo
        }
      } catch {
        // Invalid URL, use default
        redirectUrl = '/dashboard'
      }
    }

    return NextResponse.redirect(`${origin}${redirectUrl}`)
  } catch (error) {
    console.error('Unexpected auth callback error:', error)
    
    // More specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    
    return NextResponse.redirect(
      `${origin}/login?error=unexpected_error&message=${encodeURIComponent(errorMessage)}`
    )
  }
}