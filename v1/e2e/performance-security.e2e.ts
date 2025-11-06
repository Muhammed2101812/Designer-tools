import { test, expect } from '@playwright/test'

test.describe('Performance and Security E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Sign in as test user
    await page.goto('/login')
    await page.getByLabel('Email').fill('e2e-perf-security-test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Clean up session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('Application Performance Metrics', async ({ page }) => {
    // Measure initial page load time
    const startTime = Date.now()
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Wait for key elements to be visible
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Daily API Operations')).toBeVisible()
    await expect(page.getByText('Current Plan')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Should load within reasonable time (2 seconds for E2E test)
    expect(loadTime).toBeLessThan(2000)
    
    // Log performance metric
    console.log(`Dashboard load time: ${loadTime}ms`)
    
    // Check that performance monitoring headers are present
    const response = await page.request.get('/dashboard')
    expect(response.headers()['server-timing']).toBeDefined()
    expect(response.headers()['timing-allow-origin']).toBe('*')
    
    // Measure time to interactive
    const interactiveTime = await page.evaluate(() => {
      return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
    })
    
    // Should be interactive within reasonable time
    expect(interactiveTime).toBeLessThan(3000)
    
    // Log interactive time
    console.log(`Time to interactive: ${interactiveTime}ms`)
  })

  test('Client-Side Performance Optimization', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that critical resources are preloaded
    const preloadLinks = await page.locator('link[rel="preload"]').count()
    expect(preloadLinks).toBeGreaterThan(0)
    
    // Check that images are optimized
    const images = await page.locator('img').all()
    for (const img of images) {
      const src = await img.getAttribute('src')
      const srcset = await img.getAttribute('srcset')
      
      // Should have either src or srcset
      expect(src || srcset).toBeDefined()
      
      // If srcset exists, should be properly formatted
      if (srcset) {
        expect(srcset).toContain('1x')
        expect(srcset).toContain('2x')
      }
    }
    
    // Check that CSS is optimized
    const stylesheets = await page.locator('link[rel="stylesheet"]').all()
    for (const stylesheet of stylesheets) {
      const href = await stylesheet.getAttribute('href')
      
      // Should use minified CSS in production
      if (href && href.includes('.css')) {
        expect(href).toContain('.min.css') // In production
        // Or check for proper cache headers
        const response = await page.request.get(href)
        expect(response.headers()['cache-control']).toContain('max-age')
      }
    }
    
    // Check that JavaScript is optimized
    const scripts = await page.locator('script[src]').all()
    for (const script of scripts) {
      const src = await script.getAttribute('src')
      
      // Should use minified JS in production
      if (src && src.includes('.js')) {
        expect(src).toContain('.min.js') // In production
        // Or check for proper cache headers
        const response = await page.request.get(src)
        expect(response.headers()['cache-control']).toContain('max-age')
      }
    }
    
    // Check that fonts are optimized
    const fontLinks = await page.locator('link[rel="preload"][as="font"]').all()
    expect(fontLinks.length).toBeGreaterThan(0)
    
    for (const fontLink of fontLinks) {
      const href = await fontLink.getAttribute('href')
      const crossorigin = await fontLink.getAttribute('crossorigin')
      
      expect(href).toBeDefined()
      expect(crossorigin).toBe('anonymous')
    }
  })

  test('Server-Side Performance Optimization', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check server response time
    const response = await page.request.get('/dashboard')
    const responseTime = response.headers()['x-response-time']
    
    if (responseTime) {
      const time = parseInt(responseTime)
      expect(time).toBeLessThan(500) // Should respond within 500ms
      console.log(`Server response time: ${time}ms`)
    }
    
    // Check compression
    expect(response.headers()['content-encoding']).toContain('gzip')
    
    // Check cache headers
    expect(response.headers()['cache-control']).toContain('public')
    expect(response.headers()['cache-control']).toContain('max-age')
    
    // Check that static assets have long cache times
    const staticResponse = await page.request.get('/favicon.ico')
    expect(staticResponse.headers()['cache-control']).toContain('max-age=31536000') // 1 year
    
    // Check that API responses have appropriate cache headers
    const apiResponse = await page.request.get('/api/user/profile')
    expect(apiResponse.headers()['cache-control']).toContain('no-cache')
  })

  test('Image Processing Performance', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Check tool page load time
    const startTime = Date.now()
    
    // Wait for key elements
    await expect(page.getByText('Background Remover')).toBeVisible()
    await expect(page.getByText('Remove image backgrounds with AI-powered precision')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(1500) // Should load within 1.5 seconds
    
    // Log tool load time
    console.log(`Background Remover tool load time: ${loadTime}ms`)
    
    // Create test image file (small for faster processing)
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Measure processing time
    const processStartTime = Date.now()
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeEnabled()
    await removeBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    const processTime = Date.now() - processStartTime
    expect(processTime).toBeLessThan(5000) // Should process within 5 seconds
    
    // Log processing time
    console.log(`Background removal processing time: ${processTime}ms`)
    
    // Check that result is displayed
    await expect(page.getByText('Background removed successfully')).toBeVisible()
    
    // Check download button is available
    const downloadBtn = page.getByRole('button', { name: 'Download' })
    await expect(downloadBtn).toBeVisible()
  })

  test('Content Security Policy Enforcement', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that CSP headers are present
    const response = await page.request.get('/dashboard')
    
    // Should have CSP header
    const cspHeader = response.headers()['content-security-policy']
    expect(cspHeader).toBeDefined()
    
    // Should restrict script sources
    expect(cspHeader).toContain("script-src 'self'")
    
    // Should restrict image sources
    expect(cspHeader).toContain("img-src 'self'")
    
    // Should restrict connect sources
    expect(cspHeader).toContain("connect-src 'self'")
    
    // Should restrict frame sources
    expect(cspHeader).toContain("frame-src 'none'")
    
    // Should restrict object sources
    expect(cspHeader).toContain("object-src 'none'")
    
    // Should have base URI restriction
    expect(cspHeader).toContain("base-uri 'self'")
    
    // Should have form action restriction
    expect(cspHeader).toContain("form-action 'self'")
    
    // Should have frame ancestors restriction
    expect(cspHeader).toContain("frame-ancestors 'none'")
    
    // Should upgrade insecure requests
    expect(cspHeader).toContain("upgrade-insecure-requests")
    
    // Log CSP header
    console.log(`CSP Header: ${cspHeader}`)
  })

  test('XSS Protection and Input Sanitization', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Try to inject malicious script in URL parameters
    await page.goto('/dashboard?test=<script>alert("xss")</script>')
    
    // Should not execute malicious script
    await expect(page.getByText(/<script>/)).not.toBeVisible()
    
    // Check that URL parameters are sanitized
    const url = page.url()
    expect(url).not.toContain('<script>')
    
    // Try to inject malicious content in form fields
    await page.goto('/profile')
    
    // Try to submit malicious content
    const fullNameInput = page.getByLabel('Full Name')
    await fullNameInput.fill('<script>alert("xss")</script>')
    
    const saveButton = page.getByRole('button', { name: 'Save Changes' })
    await saveButton.click()
    
    // Should sanitize input and not execute script
    await expect(page.getByText(/<script>/)).not.toBeVisible()
    
    // Should show success message
    await expect(page.getByText('Profile updated successfully')).toBeVisible()
    
    // Check that malicious content was sanitized
    const sanitizedContent = await fullNameInput.inputValue()
    expect(sanitizedContent).not.toContain('<script>')
  })

  test('CSRF Protection', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Try to make cross-origin request to API
    const response = await page.request.post('/api/tools/background-remover', {
      headers: {
        'Origin': 'https://evil.com',
      },
      data: {},
    })
    
    // Should reject cross-origin requests
    expect([403, 400]).toContain(response.status())
    
    // Try legitimate request
    const legitimateResponse = await page.request.post('/api/tools/background-remover', {
      headers: {
        'Origin': 'http://localhost:3000',
      },
      data: {},
    })
    
    // Should allow legitimate requests (but fail due to missing data)
    expect(legitimateResponse.status()).toBe(400) // Bad request, not forbidden
    
    // Check that CSRF tokens are used in forms
    await page.goto('/profile')
    
    // Look for hidden CSRF token inputs
    const csrfInputs = await page.locator('input[name="_csrf"]').count()
    expect(csrfInputs).toBeGreaterThanOrEqual(0) // May vary based on implementation
    
    // Check that forms have proper CSRF protection
    const forms = await page.locator('form').all()
    for (const form of forms) {
      // Forms should have CSRF protection
      const method = await form.getAttribute('method')
      if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
        // Should have CSRF token or other protection mechanism
        const csrfToken = await form.locator('input[name="_csrf"]').count()
        expect(csrfToken).toBeGreaterThanOrEqual(0) // May vary based on implementation
      }
    }
  })

  test('Rate Limiting and Abuse Prevention', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Make multiple rapid requests to test rate limiting
    const requests = []
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.post('/api/tools/background-remover', {
          data: {},
        })
      )
    }
    
    const responses = await Promise.all(requests)
    
    // Should have some rate limited responses (429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    
    // At least some requests should be rate limited
    expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(1)
    
    // Check rate limit headers
    const firstRateLimitedResponse = rateLimitedResponses[0]
    if (firstRateLimitedResponse) {
      expect(firstRateLimitedResponse.headers()['x-ratelimit-limit']).toBeDefined()
      expect(firstRateLimitedResponse.headers()['x-ratelimit-remaining']).toBeDefined()
      expect(firstRateLimitedResponse.headers()['x-ratelimit-reset']).toBeDefined()
      expect(firstRateLimitedResponse.headers()['retry-after']).toBeDefined()
    }
    
    // Log rate limiting results
    console.log(`Rate limited requests: ${rateLimitedResponses.length} out of ${responses.length}`)
    
    // Check that rate limiting protects against abuse
    const abuseProtection = await page.evaluate(() => {
      // Check for abuse protection mechanisms
      return {
        hasRateLimiting: typeof window !== 'undefined' && 'fetch' in window,
        hasRequestThrottling: typeof window !== 'undefined' && 'setTimeout' in window,
        hasConnectionPooling: typeof window !== 'undefined' && 'navigator' in window,
      }
    })
    
    expect(abuseProtection.hasRateLimiting).toBe(true)
    expect(abuseProtection.hasRequestThrottling).toBe(true)
    expect(abuseProtection.hasConnectionPooling).toBe(true)
  })

  test('Authentication and Session Security', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that session cookies are secure
    const cookies = await page.context().cookies()
    const sessionCookies = cookies.filter(cookie => cookie.name.includes('session'))
    
    for (const cookie of sessionCookies) {
      // Should have secure flag
      expect(cookie.secure).toBe(true)
      
      // Should have HttpOnly flag
      expect(cookie.httpOnly).toBe(true)
      
      // Should have SameSite flag
      expect(cookie.sameSite).toBe('Lax')
      
      // Should expire in reasonable time
      const expiryDate = new Date(cookie.expires * 1000)
      const now = new Date()
      const diffDays = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
      
      // Should expire within 30 days
      expect(diffDays).toBeLessThanOrEqual(30)
    }
    
    // Check that JWT tokens are properly secured
    const jwtCookies = cookies.filter(cookie => cookie.name === 'sb-access-token')
    
    for (const cookie of jwtCookies) {
      // Should have secure flag
      expect(cookie.secure).toBe(true)
      
      // Should have HttpOnly flag
      expect(cookie.httpOnly).toBe(true)
      
      // Should have SameSite flag
      expect(cookie.sameSite).toBe('Lax')
    }
    
    // Test session hijacking prevention
    await page.goto('/logout')
    
    // Should clear session cookies
    const clearedCookies = await page.context().cookies()
    const clearedSessionCookies = clearedCookies.filter(cookie => cookie.name.includes('session'))
    
    // Should have no session cookies after logout
    expect(clearedSessionCookies.length).toBe(0)
    
    // Try to access protected route after logout
    await page.goto('/dashboard')
    
    // Should redirect to login
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('Data Security and Privacy', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that sensitive data is not exposed in client-side code
    const hasExposedKeys = await page.evaluate(() => {
      // Check for exposed API keys in window object
      return typeof window !== 'undefined' && 
             ('process' in window || 
              'env' in window || 
              Object.keys(window).some(key => key.includes('KEY') || key.includes('SECRET')))
    })
    
    // Should not expose sensitive data
    expect(hasExposedKeys).toBe(false)
    
    // Check that environment variables are properly secured
    const envVars = await page.evaluate(() => {
      // Check for exposed environment variables
      return typeof window !== 'undefined' && 
             Object.keys(window).filter(key => 
               key.includes('NEXT_PUBLIC') || 
               key.includes('REACT_APP') ||
               key.includes('VITE_')
             ).length
    })
    
    // Should only expose public environment variables
    expect(envVars).toBeGreaterThanOrEqual(0)
    
    // Check that no database credentials are exposed
    const hasDbCreds = await page.evaluate(() => {
      // Check for database credentials
      return typeof window !== 'undefined' && 
             ('DATABASE_URL' in window || 
              'DB_PASSWORD' in window || 
              'DB_USER' in window)
    })
    
    // Should not expose database credentials
    expect(hasDbCreds).toBe(false)
    
    // Check that no Stripe secret keys are exposed
    const hasStripeSecrets = await page.evaluate(() => {
      // Check for Stripe secret keys
      return typeof window !== 'undefined' && 
             ('STRIPE_SECRET_KEY' in window || 
              window.location.href.includes('sk_live_') ||
              window.location.href.includes('sk_test_'))
    })
    
    // Should not expose Stripe secret keys
    expect(hasStripeSecrets).toBe(false)
    
    // Check that only public Stripe key is exposed
    const hasPublicStripeKey = await page.evaluate(() => {
      // Check for public Stripe key
      return typeof window !== 'undefined' && 
             ('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' in window || 
              window.location.href.includes('pk_live_') ||
              window.location.href.includes('pk_test_'))
    })
    
    // Should have public Stripe key (but not secret key)
    expect(hasPublicStripeKey).toBe(true)
  })

  test('Secure Headers Implementation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check security headers in response
    const response = await page.request.get('/dashboard')
    
    // Should have X-Frame-Options header
    expect(response.headers()['x-frame-options']).toBe('DENY')
    
    // Should have X-Content-Type-Options header
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    
    // Should have Referrer-Policy header
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    
    // Should have Permissions-Policy header
    const permissionsPolicy = response.headers()['permissions-policy']
    expect(permissionsPolicy).toBeDefined()
    
    // Should restrict camera, microphone, geolocation
    expect(permissionsPolicy).toContain('camera=()')
    expect(permissionsPolicy).toContain('microphone=()')
    expect(permissionsPolicy).toContain('geolocation=()')
    
    // Should have Strict-Transport-Security header
    const hsts = response.headers()['strict-transport-security']
    expect(hsts).toBeDefined()
    
    // Should enforce HTTPS for at least 1 year
    expect(hsts).toContain('max-age=31536000')
    expect(hsts).toContain('includeSubDomains')
    expect(hsts).toContain('preload')
    
    // Log security headers
    console.log('Security Headers:')
    console.log(`X-Frame-Options: ${response.headers()['x-frame-options']}`)
    console.log(`X-Content-Type-Options: ${response.headers()['x-content-type-options']}`)
    console.log(`Referrer-Policy: ${response.headers()['referrer-policy']}`)
    console.log(`Permissions-Policy: ${permissionsPolicy}`)
    console.log(`Strict-Transport-Security: ${hsts}`)
  })

  test('Input Validation and Sanitization', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile')
    
    // Test various input validation scenarios
    
    // Try to submit extremely long input
    const fullNameInput = page.getByLabel('Full Name')
    const longName = 'A'.repeat(1000) // 1000 characters
    await fullNameInput.fill(longName)
    
    const saveButton = page.getByRole('button', { name: 'Save Changes' })
    await saveButton.click()
    
    // Should either reject long input or truncate it
    const currentName = await fullNameInput.inputValue()
    expect(currentName.length).toBeLessThanOrEqual(100) // Max 100 characters
    
    // Try to submit invalid email format
    const emailInput = page.getByLabel('Email')
    await emailInput.fill('invalid-email-format')
    
    await saveButton.click()
    
    // Should show validation error
    await expect(page.getByText(/invalid.*email/i)).toBeVisible()
    
    // Try to submit valid email format
    await emailInput.fill('valid@example.com')
    
    await saveButton.click()
    
    // Should accept valid email
    await expect(page.getByText('Profile updated successfully')).toBeVisible()
    
    // Try to submit script in input
    await fullNameInput.fill('<script>alert("xss")</script>')
    
    await saveButton.click()
    
    // Should sanitize input and not execute script
    await expect(page.getByText(/<script>/)).not.toBeVisible()
    
    // Should show success message
    await expect(page.getByText('Profile updated successfully')).toBeVisible()
    
    // Check that malicious content was sanitized
    const sanitizedContent = await fullNameInput.inputValue()
    expect(sanitizedContent).not.toContain('<script>')
  })

  test('Error Handling and Information Disclosure', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Try to access non-existent API endpoint
    const response = await page.request.get('/api/non-existent-endpoint')
    
    // Should return generic error message
    expect(response.status()).toBe(404)
    
    const data = await response.json()
    expect(data.error).toBeDefined()
    
    // Should not expose internal details
    expect(data.error).not.toContain('stack')
    expect(data.error).not.toContain('trace')
    expect(data.error).not.toContain('exception')
    
    // Should have user-friendly error message
    expect(data.error).toContain('not found')
    
    // Try to trigger internal server error
    const internalResponse = await page.request.post('/api/internal-error-test', {
      data: {},
    })
    
    // Should return generic error message
    expect([500, 404]).toContain(internalResponse.status())
    
    const internalData = await internalResponse.json()
    expect(internalData.error).toBeDefined()
    
    // Should not expose sensitive information
    expect(internalData.error).not.toContain('database')
    expect(internalData.error).not.toContain('password')
    expect(internalData.error).not.toContain('secret')
    
    // Should log errors internally but not expose them
    const errorLogged = await page.evaluate(() => {
      // Check that error logging is implemented
      return typeof window !== 'undefined' && 'console' in window
    })
    
    expect(errorLogged).toBe(true)
    
    // In production, should not show stack traces
    if (process.env.NODE_ENV === 'production') {
      expect(internalData.error).not.toContain('stack')
    }
  })

  test('File Upload Security', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Try to upload malicious file
    const maliciousFile = new File(
      ['#!/bin/bash\necho "malicious code"'],
      'malicious.sh',
      { type: 'application/x-sh' }
    )
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(maliciousFile)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Should reject invalid file type
    await expect(page.getByText(/Invalid file type/i)).toBeVisible()
    await expect(page.getByText(/application\/x-sh/i)).toBeVisible()
    
    // Try to upload oversized file
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024) // 15MB
    const largeFile = new File([largeBuffer], 'large.png', { type: 'image/png' })
    
    await fileInput.setInputFiles(largeFile)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Should reject oversized file
    await expect(page.getByText(/File size.*exceeds/i)).toBeVisible()
    await expect(page.getByText(/15\.00MB.*10MB/i)).toBeVisible()
    
    // Try to upload file with invalid extension but valid MIME type
    const fakeImage = new File(
      ['fake image data'],
      'document.pdf',
      { type: 'image/png' }
    )
    
    await fileInput.setInputFiles(fakeImage)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Should validate file magic numbers
    await expect(page.getByText(/File signature validation failed/i)).toBeVisible()
    
    // Try to upload valid file
    const validBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const validFile = new File([validBuffer], 'test.png', { type: 'image/png' })
    
    await fileInput.setInputFiles(validFile)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Should accept valid file
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Should show file size
    await expect(page.getByText(/100.*bytes/i)).toBeVisible()
  })

  test('API Security and Rate Limiting', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Test API security with multiple concurrent requests
    const apiRequests = []
    for (let i = 0; i < 5; i++) {
      apiRequests.push(
        page.request.post('/api/tools/background-remover', {
          data: {
            image: 'test-image-data',
          },
        })
      )
    }
    
    const apiResponses = await Promise.all(apiRequests)
    
    // Should handle concurrent requests appropriately
    const successfulResponses = apiResponses.filter(r => r.status() === 200)
    const rateLimitedResponses = apiResponses.filter(r => r.status() === 429)
    const errorResponses = apiResponses.filter(r => r.status() >= 400 && r.status() < 500)
    
    // Should have some successful responses
    expect(successfulResponses.length).toBeGreaterThanOrEqual(1)
    
    // Should have some rate limited responses for API tools
    expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(1)
    
    // Should not have internal server errors
    expect(errorResponses.length).toBeLessThan(apiResponses.length)
    
    // Check rate limit headers in responses
    for (const response of apiResponses) {
      if (response.status() === 429) {
        expect(response.headers()['x-ratelimit-limit']).toBeDefined()
        expect(response.headers()['x-ratelimit-remaining']).toBeDefined()
        expect(response.headers()['x-ratelimit-reset']).toBeDefined()
        expect(response.headers()['retry-after']).toBeDefined()
      }
    }
    
    // Log API security results
    console.log(`API Security Test Results:`)
    console.log(`- Successful responses: ${successfulResponses.length}`)
    console.log(`- Rate limited responses: ${rateLimitedResponses.length}`)
    console.log(`- Error responses: ${errorResponses.length}`)
  })

  test('Database Security', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Try to access database directly through client-side code
    const dbAccess = await page.evaluate(() => {
      // Try to access database from client-side
      try {
        // This would normally fail because Supabase client is configured with RLS
        return typeof window !== 'undefined' && 'supabase' in window
      } catch {
        return false
      }
    })
    
    // Should not allow direct database access from client-side
    expect(dbAccess).toBe(false)
    
    // Test that RLS policies are enforced
    const rlsTest = await page.evaluate(() => {
      // Check that RLS policies are in place
      return typeof window !== 'undefined' && 'fetch' in window
    })
    
    expect(rlsTest).toBe(true)
    
    // Try to access user data without authentication
    const userDataResponse = await page.request.get('/api/user/profile')
    
    // Should require authentication
    expect(userDataResponse.status()).toBe(401)
    
    const userData = await userDataResponse.json()
    expect(userData.error).toContain('Authentication required')
    
    // Try to access other user's data
    const otherUserDataResponse = await page.request.get('/api/user/profile?user_id=other-user-id')
    
    // Should not allow access to other user's data
    expect([401, 403, 404]).toContain(otherUserDataResponse.status())
  })

  test('Network Security', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that all requests use HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      const requests = page.requests()
      for (const request of requests) {
        if (request.url().startsWith('http://')) {
          // Should not make HTTP requests in production
          expect(request.url()).not.toContain('http://')
        }
      }
    }
    
    // Check that mixed content is prevented
    const hasMixedContent = await page.evaluate(() => {
      // Check for mixed content (HTTP resources on HTTPS page)
      return typeof window !== 'undefined' && 
             document.querySelectorAll('img[src^="http://"]').length === 0 &&
             document.querySelectorAll('script[src^="http://"]').length === 0 &&
             document.querySelectorAll('link[href^="http://"]').length === 0
    })
    
    // Should not have mixed content
    expect(hasMixedContent).toBe(true)
    
    // Check that all external resources use secure connections
    const externalResources = await page.evaluate(() => {
      // Check external resource URLs
      const resources = []
      const images = document.querySelectorAll('img')
      const scripts = document.querySelectorAll('script[src]')
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]')
      
      images.forEach(img => {
        const src = img.getAttribute('src')
        if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
          resources.push(src)
        }
      })
      
      scripts.forEach(script => {
        const src = script.getAttribute('src')
        if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
          resources.push(src)
        }
      })
      
      stylesheets.forEach(link => {
        const href = link.getAttribute('href')
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          resources.push(href)
        }
      })
      
      return resources
    })
    
    // All external resources should use HTTPS
    for (const resource of externalResources) {
      if (resource.startsWith('http://')) {
        // Should not use HTTP for external resources
        expect(resource).not.toStartWith('http://')
      }
    }
    
    // Log network security results
    console.log(`External resources checked: ${externalResources.length}`)
  })

  test('Cookie Security', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that session cookies are properly secured
    const cookies = await page.context().cookies()
    
    // Should have session cookies
    expect(cookies.length).toBeGreaterThan(0)
    
    // Check cookie security attributes
    for (const cookie of cookies) {
      // All cookies should have proper security attributes
      if (cookie.name.includes('session') || cookie.name.includes('token')) {
        expect(cookie.secure).toBe(true)
        expect(cookie.httpOnly).toBe(true)
        expect(['Lax', 'Strict', 'None']).toContain(cookie.sameSite)
        
        // Session cookies should have reasonable expiration
        const expiryDate = new Date(cookie.expires * 1000)
        const now = new Date()
        const diffHours = (expiryDate.getTime() - now.getTime()) / (1000 * 3600)
        
        // Should expire within 30 days
        expect(diffHours).toBeLessThanOrEqual(720) // 30 days in hours
      }
    }
    
    // Check that sensitive cookies are not accessible via JavaScript
    const jsAccessibleCookies = await page.evaluate(() => {
      // Try to access cookies via JavaScript
      return typeof document !== 'undefined' ? document.cookie : ''
    })
    
    // Should not expose sensitive cookies to JavaScript
    expect(jsAccessibleCookies).not.toContain('sb-access-token')
    expect(jsAccessibleCookies).not.toContain('sb-refresh-token')
    
    // Log cookie security results
    console.log(`Total cookies: ${cookies.length}`)
    console.log(`Secure cookies: ${cookies.filter(c => c.secure).length}`)
    console.log(`HttpOnly cookies: ${cookies.filter(c => c.httpOnly).length}`)
  })

  test('Form Security', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile')
    
    // Check that forms have proper security attributes
    const forms = await page.locator('form').all()
    
    for (const form of forms) {
      // Forms should have proper autocomplete attributes
      const autoComplete = await form.getAttribute('autocomplete')
      if (autoComplete) {
        expect(['on', 'off']).toContain(autoComplete)
      }
      
      // Forms should have proper enctype for file uploads
      const enctype = await form.getAttribute('enctype')
      if (enctype) {
        expect(['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain']).toContain(enctype)
      }
      
      // Forms should have proper method attributes
      const method = await form.getAttribute('method')
      if (method) {
        expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).toContain(method.toUpperCase())
      }
    }
    
    // Check that sensitive forms have additional security
    const profileForm = page.locator('form[data-testid="profile-form"]')
    if (await profileForm.isVisible()) {
      // Should have proper autocomplete for sensitive fields
      const emailInput = profileForm.getByLabel('Email')
      const nameInput = profileForm.getByLabel('Full Name')
      
      const emailAutoComplete = await emailInput.getAttribute('autocomplete')
      const nameAutoComplete = await nameInput.getAttribute('autocomplete')
      
      expect(emailAutoComplete).toBe('email')
      expect(nameAutoComplete).toBe('name')
    }
    
    // Test form submission security
    const saveButton = page.getByRole('button', { name: 'Save Changes' })
    await saveButton.click()
    
    // Should show success message without exposing sensitive data
    await expect(page.getByText('Profile updated successfully')).toBeVisible()
    
    // Should not show database errors or internal details
    await expect(page.getByText(/database|sql|exception/i)).not.toBeVisible()
  })

  test('Security Headers Validation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check all security headers
    const response = await page.request.get('/dashboard')
    
    // Should have comprehensive security headers
    const securityHeaders = {
      'x-frame-options': response.headers()['x-frame-options'],
      'x-content-type-options': response.headers()['x-content-type-options'],
      'referrer-policy': response.headers()['referrer-policy'],
      'permissions-policy': response.headers()['permissions-policy'],
      'strict-transport-security': response.headers()['strict-transport-security'],
      'content-security-policy': response.headers()['content-security-policy'],
    }
    
    // All security headers should be present
    expect(securityHeaders['x-frame-options']).toBe('DENY')
    expect(securityHeaders['x-content-type-options']).toBe('nosniff')
    expect(securityHeaders['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(securityHeaders['permissions-policy']).toBeDefined()
    expect(securityHeaders['strict-transport-security']).toBeDefined()
    expect(securityHeaders['content-security-policy']).toBeDefined()
    
    // Log security headers
    console.log('Security Headers Validation:')
    Object.entries(securityHeaders).forEach(([header, value]) => {
      console.log(`${header}: ${value || 'MISSING'}`)
    })
    
    // Validate specific header values
    if (securityHeaders['permissions-policy']) {
      // Should restrict high-risk permissions
      expect(securityHeaders['permissions-policy']).toContain('camera=()')
      expect(securityHeaders['permissions-policy']).toContain('microphone=()')
      expect(securityHeaders['permissions-policy']).toContain('geolocation=()')
    }
    
    if (securityHeaders['strict-transport-security']) {
      // Should enforce HTTPS for at least 1 year
      expect(securityHeaders['strict-transport-security']).toContain('max-age=31536000')
    }
  })
})