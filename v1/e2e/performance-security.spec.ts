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
    await page.getByLabel('Email').fill('e2e-test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should load dashboard page within performance targets', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Wait for key elements to be visible
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Daily API Operations')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000)
    
    // Log performance metric
    console.log(`Dashboard load time: ${loadTime}ms`)
  })

  test('should maintain responsive UI during heavy operations', async ({ page }) => {
    // Navigate to a tool page
    await page.goto('/tools/background-remover')
    
    // Check that UI is responsive
    await expect(page.getByText('Background Remover')).toBeVisible()
    
    // Perform a simulated heavy operation
    const startTime = Date.now()
    
    // Upload a test file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], 'test.png', { type: 'image/png' })
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Check that file is uploaded
    await expect(page.getByText('test.png')).toBeVisible()
    
    // Click remove background button
    const removeBtn = page.getByRole('button', { name: 'Remove Background' })
    await expect(removeBtn).toBeEnabled()
    await removeBtn.click()
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    const processingTime = Date.now() - startTime
    
    // Should process within reasonable time
    expect(processingTime).toBeLessThan(5000)
    
    // UI should remain responsive during processing
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    
    // Log performance metric
    console.log(`Background removal processing time: ${processingTime}ms`)
  })

  test('should handle concurrent requests without performance degradation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Open multiple tabs
    const contexts = await page.context().browser()?.contexts() || []
    const context = contexts[0]
    
    // Create multiple pages
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
    ])
    
    // Load dashboard on all pages simultaneously
    const loadPromises = pages.map(async (p) => {
      await p.goto('/dashboard')
      await expect(p.getByText('Dashboard')).toBeVisible()
    })
    
    const startTime = Date.now()
    await Promise.all(loadPromises)
    const loadTime = Date.now() - startTime
    
    // Should handle concurrent requests efficiently
    expect(loadTime).toBeLessThan(3000) // Total time for 3 concurrent requests
    
    // Close extra pages
    for (const p of pages) {
      await p.close()
    }
    
    // Log performance metric
    console.log(`Concurrent dashboard loads time: ${loadTime}ms`)
  })

  test('should prevent brute force authentication attacks', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Attempt multiple failed logins
    for (let i = 0; i < 10; i++) {
      await page.getByLabel('Email').fill(`attacker${i}@example.com`)
      await page.getByLabel('Password').fill('wrongpassword')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Wait for response
      await page.waitForTimeout(500)
    }
    
    // Should show rate limit error after multiple attempts
    await expect(page.getByText(/rate limit/i)).toBeVisible()
    await expect(page.getByText(/try again/i)).toBeVisible()
  })

  test('should prevent unauthorized access to admin routes', async ({ page }) => {
    // Try to access admin analytics page as regular user
    const response = await page.goto('/admin/analytics')
    
    // Should redirect to login or show 403 error
    if (response) {
      expect([302, 403]).toContain(response.status())
    }
    
    // Should not show admin analytics content
    await expect(page.getByText('Admin Analytics')).not.toBeVisible()
  })

  test('should prevent XSS attacks through input validation', async ({ page }) => {
    // Navigate to a tool page that accepts user input
    await page.goto('/tools/background-remover')
    
    // Try to inject malicious script in file name
    const maliciousFileName = 'test<script>alert("xss")</script>.png'
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const file = new File([buffer], maliciousFileName, { type: 'image/png' })
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(file)
    
    // Wait for file to be processed
    await page.waitForTimeout(1000)
    
    // Should sanitize file name to prevent XSS
    await expect(page.getByText(/<script>/)).not.toBeVisible()
    await expect(page.getByText('test.png')).toBeVisible() // Sanitized name
  })

  test('should prevent SQL injection through API parameters', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Try to access user data with malicious parameter
    const maliciousUserId = "1'; DROP TABLE users; --"
    const response = await page.goto(`/api/users/${maliciousUserId}`)
    
    // Should return error or sanitize input
    if (response) {
      expect([400, 404, 500]).toContain(response.status())
    }
    
    // Should not execute malicious SQL
    // This would be verified by checking database state in a real test environment
  })

  test('should enforce proper CORS policies', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Try to make cross-origin request to API
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/tools/background-remover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
        return { status: res.status, ok: res.ok }
      } catch (error) {
        return { error: (error as Error).message }
      }
    })
    
    // Should enforce CORS and require proper authentication
    if ('status' in response) {
      expect([401, 403, 405]).toContain(response.status)
    }
  })

  test('should enforce Content Security Policy', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that CSP headers are present
    const response = await page.goto('/dashboard')
    
    if (response) {
      // Should have CSP headers
      const cspHeader = response.headers()['content-security-policy']
      expect(cspHeader).toBeDefined()
      
      // Should restrict inline scripts
      expect(cspHeader).toContain("script-src 'self'")
      
      // Should restrict external resources
      expect(cspHeader).toContain("connect-src 'self'")
    }
  })

  test('should prevent clickjacking attacks', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that X-Frame-Options header is present
    const response = await page.goto('/dashboard')
    
    if (response) {
      const frameOptions = response.headers()['x-frame-options']
      expect(frameOptions).toBe('DENY')
    }
  })

  test('should sanitize user-generated content', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Try to submit malicious content through API
    const maliciousContent = '<script>alert("xss")</script>'
    
    const response = await page.evaluate(async (content) => {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ full_name: content }),
        })
        return { status: res.status, ok: res.ok }
      } catch (error) {
        return { error: (error as Error).message }
      }
    }, maliciousContent)
    
    // Should sanitize or reject malicious content
    if ('status' in response) {
      expect([200, 400]).toContain(response.status) // Either accepted and sanitized or rejected
    }
    
    // Should not execute malicious scripts
    await expect(page.locator('script')).not.toHaveText(/alert\("xss"\)/)
  })

  test('should enforce rate limiting on API routes', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Make multiple rapid requests to API route
    const requests = []
    for (let i = 0; i < 20; i++) {
      requests.push(
        page.evaluate(async () => {
          try {
            const res = await fetch('/api/tools/background-remover', {
              method: 'POST',
              body: new FormData(),
            })
            return { status: res.status }
          } catch (error) {
            return { error: (error as Error).message }
          }
        })
      )
    }
    
    const responses = await Promise.all(requests)
    
    // Should enforce rate limiting
    const rateLimitResponses = responses.filter(r => 
      'status' in r && r.status === 429
    )
    
    // At least some requests should be rate limited
    expect(rateLimitResponses.length).toBeGreaterThan(0)
  })

  test('should prevent file upload attacks', async ({ page }) => {
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
  })

  test('should enforce file size limits', async ({ page }) => {
    // Navigate to background remover tool
    await page.goto('/tools/background-remover')
    
    // Create oversized file (15MB)
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024)
    const largeFile = new File([largeBuffer], 'large.png', { type: 'image/png' })
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(largeFile)
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Should reject oversized file
    await expect(page.getByText(/File size.*exceeds/i)).toBeVisible()
    await expect(page.getByText(/15\.00MB.*10MB/i)).toBeVisible()
  })

  test('should prevent directory traversal attacks', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Try to access sensitive files through malicious path
    const response = await page.goto('/api/../.env')
    
    // Should return 404 or 403
    if (response) {
      expect([403, 404]).toContain(response.status())
    }
  })

  test.afterEach(async ({ page }) => {
    // Clean up session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })
})