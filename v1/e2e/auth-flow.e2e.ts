import { test, expect } from '@playwright/test'

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    })
    
    // Navigate to login page
    await page.goto('/login')
  })

  test('User Registration Flow', async ({ page }) => {
    // Navigate to signup page
    await page.getByRole('link', { name: 'Sign Up' }).click()
    await page.waitForURL(/\/signup/)
    
    // Fill registration form
    await page.getByLabel('Full Name').fill('E2E Test User')
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('Password123!')
    await page.getByLabel('Confirm Password').fill('Password123!')
    
    // Accept terms and conditions
    await page.getByRole('checkbox', { name: 'I agree to the Terms and Conditions' }).check()
    
    // Submit registration
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should redirect to email verification page
    await page.waitForURL(/\/verify-email/)
    await expect(page.getByText('Please verify your email')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for verification email
    // 2. Extract verification link
    // 3. Navigate to verification link
    // 4. Confirm email verification
    
    // For this test, we'll simulate email verification
    await page.goto('/login')
    
    // Sign in with newly created account
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Check that user profile was created
    await page.goto('/profile')
    await expect(page.getByText('E2E Test User')).toBeVisible()
    await expect(page.getByText('e2e-auth-test@example.com')).toBeVisible()
    await expect(page.getByText('Free Plan')).toBeVisible()
  })

  test('User Login Flow', async ({ page }) => {
    // Fill login form
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password').fill('Password123!')
    
    // Submit login
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Check that user is properly authenticated
    const response = await page.request.get('/api/user/profile')
    expect(response.status()).toBe(200)
    
    const userData = await response.json()
    expect(userData.email).toBe('e2e-auth-test@example.com')
    expect(userData.full_name).toBe('E2E Test User')
  })

  test('User Logout Flow', async ({ page }) => {
    // Login first
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Click user menu
    await page.getByRole('button', { name: 'User menu' }).click()
    
    // Click logout
    await page.getByRole('menuitem', { name: 'Sign Out' }).click()
    
    // Should redirect to login page
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Check that session is cleared
    const cookies = await page.context().cookies()
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('supabase')
    )
    
    // Should have no session cookies
    expect(sessionCookies.length).toBe(0)
    
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to login
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('Password Reset Flow', async ({ page }) => {
    // Click forgot password link
    await page.getByRole('link', { name: 'Forgot Password' }).click()
    
    // Should navigate to reset password page
    await page.waitForURL(/\/reset-password/)
    await expect(page.getByText('Reset Password')).toBeVisible()
    
    // Fill email
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    
    // Submit reset request
    await page.getByRole('button', { name: 'Send Reset Link' }).click()
    
    // Should show success message
    await expect(page.getByText('Password reset link sent')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for reset link
    // 2. Extract reset link
    // 3. Navigate to reset link
    // 4. Set new password
    // 5. Verify login with new password
    
    // For this test, we'll simulate the reset process
    await page.goto('/update-password')
    
    // Fill new password
    await page.getByLabel('New Password').fill('NewPassword123!')
    await page.getByLabel('Confirm New Password').fill('NewPassword123!')
    
    // Submit new password
    await page.getByRole('button', { name: 'Update Password' }).click()
    
    // Should redirect to login with success message
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Password updated successfully')).toBeVisible()
    
    // Login with new password
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password').fill('NewPassword123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('OAuth Login Flow - Google', async ({ page }) => {
    // Click Google login button
    await page.getByRole('button', { name: 'Continue with Google' }).click()
    
    // Should redirect to Google OAuth
    await page.waitForURL(/accounts\.google\.com/)
    await expect(page.getByText('Google')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Fill Google credentials
    // 2. Grant permissions
    // 3. Redirect back to app
    // 4. Verify successful login
    
    // For this test, we'll simulate successful OAuth flow
    await page.goto('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Check that OAuth user profile was created
    const response = await page.request.get('/api/user/profile')
    expect(response.status()).toBe(200)
    
    const userData = await response.json()
    expect(userData.email).toContain('@gmail.com') // OAuth email would be from Google
    expect(userData.oauth_provider).toBe('google')
  })

  test('OAuth Login Flow - GitHub', async ({ page }) => {
    // Click GitHub login button
    await page.getByRole('button', { name: 'Continue with GitHub' }).click()
    
    // Should redirect to GitHub OAuth
    await page.waitForURL(/github\.com/)
    await expect(page.getByText('GitHub')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Fill GitHub credentials
    // 2. Grant permissions
    // 3. Redirect back to app
    // 4. Verify successful login
    
    // For this test, we'll simulate successful OAuth flow
    await page.goto('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Check that OAuth user profile was created
    const response = await page.request.get('/api/user/profile')
    expect(response.status()).toBe(200)
    
    const userData = await response.json()
    expect(userData.oauth_provider).toBe('github')
  })

  test('Authentication Error Handling', async ({ page }) => {
    // Test invalid login credentials
    await page.getByLabel('Email').fill('invalid@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show error message
    await expect(page.getByText(/Invalid login credentials|Incorrect email or password/i)).toBeVisible()
    
    // Test registration with existing email
    await page.getByRole('link', { name: 'Sign Up' }).click()
    await page.waitForURL(/\/signup/)
    
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill('e2e-auth-test@example.com') // Existing email
    await page.getByLabel('Password', { exact: true }).fill('Password123!')
    await page.getByLabel('Confirm Password').fill('Password123!')
    await page.getByRole('checkbox', { name: 'I agree to the Terms and Conditions' }).check()
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should show email already exists error
    await expect(page.getByText(/email already exists|already registered/i)).toBeVisible()
    
    // Test weak password registration
    await page.getByLabel('Email').fill('weak-password-test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('123') // Weak password
    await page.getByLabel('Confirm Password').fill('123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should show password strength error
    await expect(page.getByText(/password.*strong|at least/i)).toBeVisible()
    
    // Test password mismatch
    await page.getByLabel('Password', { exact: true }).fill('StrongPassword123!')
    await page.getByLabel('Confirm Password').fill('DifferentPassword123!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should show password mismatch error
    await expect(page.getByText(/passwords.*match|confirm password/i)).toBeVisible()
    
    // Test missing terms acceptance
    await page.getByLabel('Password', { exact: true }).fill('StrongPassword123!')
    await page.getByLabel('Confirm Password').fill('StrongPassword123!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should show terms acceptance error
    await expect(page.getByText(/agree.*terms|accept.*terms/i)).toBeVisible()
  })

  test('Session Management', async ({ page }) => {
    // Login
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Check session cookies
    const cookies = await page.context().cookies()
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.includes('sb-') || 
      cookie.name.includes('session') ||
      cookie.name.includes('supabase')
    )
    
    // Should have session cookies
    expect(sessionCookies.length).toBeGreaterThan(0)
    
    // Check that session cookies have proper security attributes
    for (const cookie of sessionCookies) {
      expect(cookie.httpOnly).toBe(true)
      expect(cookie.secure).toBe(true)
      expect(['Lax', 'Strict', 'None']).toContain(cookie.sameSite)
    }
    
    // Simulate session expiration
    await page.evaluate(() => {
      // Clear session storage to simulate expiration
      sessionStorage.clear()
      localStorage.removeItem('sb-access-token')
      localStorage.removeItem('sb-refresh-token')
    })
    
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to login due to expired session
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Show session expired message
    await expect(page.getByText(/session.*expired|please.*sign.*again/i)).toBeVisible()
  })

  test('Multi-Device Session Handling', async ({ page }) => {
    // Login on first device (current page)
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Create second browser context (simulating second device)
    const context2 = await page.context().browser().newContext()
    const page2 = await context2.newPage()
    
    // Navigate to app on second device
    await page2.goto('/login')
    
    // Login with same credentials on second device
    await page2.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page2.getByLabel('Password').fill('Password123!')
    await page2.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard on second device
    await page2.waitForURL(/\/dashboard/)
    await expect(page2.getByText('Dashboard')).toBeVisible()
    
    // Both sessions should be active
    const response1 = await page.request.get('/api/user/profile')
    const response2 = await page2.request.get('/api/user/profile')
    
    expect(response1.status()).toBe(200)
    expect(response2.status()).toBe(200)
    
    // Logout from first device
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByRole('menuitem', { name: 'Sign Out' }).click()
    
    // Should redirect to login on first device
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Second device should still be logged in
    await page2.goto('/dashboard')
    await expect(page2.getByText('Dashboard')).toBeVisible()
    
    // Cleanup
    await context2.close()
  })

  test('Authentication Security', async ({ page }) => {
    // Test that sensitive data is not logged
    const logs: string[] = []
    page.on('console', msg => logs.push(msg.text()))
    
    // Login
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Check that no sensitive data was logged
    const sensitivePatterns = [
      /password.*123/i,
      /pass.*word/i,
      /secret/i,
      /token/i,
      /key/i,
    ]
    
    for (const log of logs) {
      for (const pattern of sensitivePatterns) {
        expect(log).not.toMatch(pattern)
      }
    }
    
    // Test that authentication tokens are properly secured
    const cookies = await page.context().cookies()
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('sb-') || 
      cookie.name.includes('access') ||
      cookie.name.includes('refresh')
    )
    
    // All auth cookies should be secure
    for (const cookie of authCookies) {
      expect(cookie.httpOnly).toBe(true)
      expect(cookie.secure).toBe(true)
      expect(cookie.path).toBe('/')
      expect(['Lax', 'Strict', 'None']).toContain(cookie.sameSite)
    }
    
    // Test that localStorage doesn't contain sensitive data in plain text
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          data[key] = localStorage.getItem(key) || ''
        }
      }
      return data
    })
    
    // Check that no plain text passwords or tokens are stored
    for (const [key, value] of Object.entries(localStorageData)) {
      expect(value).not.toContain('Password123!')
      expect(value).not.toMatch(/ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/) // JWT pattern
    }
  })

  test('Authentication Performance', async ({ page }) => {
    // Measure login performance
    const startTime = Date.now()
    
    // Login
    await page.getByLabel('Email').fill('e2e-auth-test@example.com')
    await page.getByLabel('Password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    const loginTime = Date.now() - startTime
    
    // Should login within reasonable time (3 seconds for E2E test)
    expect(loginTime).toBeLessThan(3000)
    
    // Log performance metrics
    console.log(`Login time: ${loginTime}ms`)
    
    // Measure session validation time
    const sessionStartTime = Date.now()
    const response = await page.request.get('/api/user/profile')
    const sessionTime = Date.now() - sessionStartTime
    
    expect(response.status()).toBe(200)
    expect(sessionTime).toBeLessThan(1000) // Should validate session quickly
    
    console.log(`Session validation time: ${sessionTime}ms`)
    
    // Measure logout performance
    const logoutStartTime = Date.now()
    
    // Logout
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByRole('menuitem', { name: 'Sign Out' }).click()
    
    // Wait for redirect
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
    
    const logoutTime = Date.now() - logoutStartTime
    
    // Should logout quickly
    expect(logoutTime).toBeLessThan(1000)
    
    console.log(`Logout time: ${logoutTime}ms`)
  })
})