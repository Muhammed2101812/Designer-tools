import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

/**
 * Content Security Policy configuration
 * Restricts resource loading to prevent XSS and other attacks
 */
const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdn.jsdelivr.net https://plausible.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.remove.bg https://api.replicate.com https://upstash.io https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/background-remover',
  '/image-upscaler',
  '/mockup-generator',
  '/image-compressor',
]

// Auth routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = [
  '/login', 
  '/signup', 
  '/reset-password', 
  '/update-password', 
  '/verify-email',
  '/welcome'
]

/**
 * Next.js Middleware
 * Runs on every request to:
 * 1. Enforce HTTPS in production
 * 2. Handle authentication and route protection
 * 3. Refresh Supabase sessions
 * 4. Add security headers (CSP, CSRF protection)
 */
export async function middleware(request: NextRequest) {
  // Enforce HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https' &&
    !request.nextUrl.hostname.includes('localhost')
  ) {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }
  
  // Create Supabase client for session management
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate query parameters for XSS and injection attempts
  const url = new URL(request.url)
  for (const [key, value] of url.searchParams.entries()) {
    // Check for dangerous patterns in query parameters
    if (
      value.includes('<script') ||
      value.includes('javascript:') ||
      value.includes('onerror=') ||
      value.includes('onload=') ||
      value.includes('</script>') ||
      value.includes('vbscript:') ||
      value.includes('data:text/html') ||
      /on\w+\s*=/i.test(value)
    ) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
  }

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()
  
  const pathname = request.nextUrl.pathname
  
  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if current route is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  )
  
  // Requirement 2.1 & 2.2: Protect routes and redirect unauthorized users to login with return_to
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('return_to', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirect authenticated users away from auth routes to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Add Content Security Policy header
  response.headers.set('Content-Security-Policy', CSP_HEADER)
  
  // Add additional security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Add Strict-Transport-Security header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // CSRF protection for state-changing operations
  // Check for custom header on POST, PUT, DELETE, PATCH requests
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  
  if (isStateChanging && isApiRoute) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    // Verify origin matches host (same-origin policy)
    if (origin && host) {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403 }
        )
      }
    }
  }
  
  return response
}

/**
 * Middleware configuration
 * Matches all routes except static files and images
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
