import { test, expect } from '@playwright/test'

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should allow new user to sign up', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    
    // Fill in signup form
    await page.getByLabel('Email').fill('e2e-test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Full Name').fill('E2E Test User')
    
    // Submit form
    await page.getByRole('button', { name: 'Sign Up' }).click()
    
    // Should redirect to verification page
    await page.waitForURL(/\/verify/)
    await expect(page.getByText('Check your email')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check the email inbox for verification link
    // 2. Click the verification link
    // 3. Verify redirect to dashboard
    
    // For this test, we'll simulate email verification by navigating directly
    await page.goto('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should allow existing user to sign in', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in login form
    await page.getByLabel('Email').fill('e2e-test@example.com')
    await page.getByLabel('Password').fill('password123')
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should reject invalid login credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show error message
    await expect(page.getByText('Invalid login credentials')).toBeVisible()
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should allow user to reset password', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Click forgot password link
    await page.getByRole('link', { name: 'Forgot Password?' }).click()
    
    // Should navigate to reset password page
    await page.waitForURL(/\/reset-password/)
    await expect(page.getByText('Reset password')).toBeVisible()
    
    // Fill in email
    await page.getByLabel('Email').fill('e2e-test@example.com')
    
    // Submit form
    await page.getByRole('button', { name: 'Send reset link' }).click()
    
    // Should show success message
    await expect(page.getByText('Check your email for a password reset link')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Check email inbox for reset link
    // 2. Click reset link
    // 3. Enter new password
    // 4. Verify login with new password
  })

  test('should allow authenticated user to sign out', async ({ page }) => {
    // First sign in
    await page.goto('/login')
    await page.getByLabel('Email').fill('e2e-test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Click user menu
    await page.getByRole('button', { name: 'User menu' }).click()
    
    // Click sign out
    await page.getByRole('menuitem', { name: 'Sign Out' }).click()
    
    // Should redirect to login page
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('should protect authenticated routes from unauthenticated access', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login page
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Should show return_to parameter in URL
    expect(page.url()).toContain('?return_to=/dashboard')
  })

  test('should redirect authenticated users from auth pages', async ({ page }) => {
    // First sign in
    await page.goto('/login')
    await page.getByLabel('Email').fill('e2e-test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Try to access login page while authenticated
    await page.goto('/login')
    
    // Should redirect back to dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should handle OAuth login with Google', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Click Google OAuth button
    await page.getByRole('button', { name: 'Continue with Google' }).click()
    
    // Should redirect to Google OAuth
    await page.waitForURL(/accounts\.google\.com/)
    await expect(page.getByText('Sign in with Google')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Fill in Google credentials
    // 2. Grant permissions
    // 3. Verify redirect to app dashboard
    
    // For this test, we'll verify the OAuth flow was initiated
    expect(page.url()).toContain('accounts.google.com')
  })

  test('should handle OAuth login with GitHub', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Click GitHub OAuth button
    await page.getByRole('button', { name: 'Continue with GitHub' }).click()
    
    // Should redirect to GitHub OAuth
    await page.waitForURL(/github\.com/)
    await expect(page.getByText('Sign in to GitHub')).toBeVisible()
    
    // In a real test environment, we would:
    // 1. Fill in GitHub credentials
    // 2. Grant permissions
    // 3. Verify redirect to app dashboard
    
    // For this test, we'll verify the OAuth flow was initiated
    expect(page.url()).toContain('github.com')
  })

  test('should handle OAuth errors gracefully', async ({ page }) => {
    // Navigate to login page with error parameters
    await page.goto('/login?error=access_denied&error_description=User%20denied%20access')
    
    // Should show error message
    await expect(page.getByText('Access denied')).toBeVisible()
    await expect(page.getByText('You cancelled the authentication process')).toBeVisible()
  })

  test('should preserve return_to parameter through OAuth flow', async ({ page }) => {
    // Navigate to protected page to trigger auth redirect
    await page.goto('/dashboard?utm_source=test')
    
    // Should redirect to login with return_to parameter
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('?return_to=/dashboard%3Futm_source%3Dtest')
    
    // Click Google OAuth button
    await page.getByRole('button', { name: 'Continue with Google' }).click()
    
    // Should redirect to Google OAuth
    await page.waitForURL(/accounts\.google\.com/)
    
    // In a real test environment, after OAuth completion,
    // user would be redirected back to original URL
  })

  test.afterEach(async ({ page }) => {
    // Clean up session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })
})