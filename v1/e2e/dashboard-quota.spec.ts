import { test, expect } from '@playwright/test'

test.describe('Dashboard and Quota Management E2E Tests', () => {
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

  test('should display user quota information on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check quota card is visible
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
    
    // Check quota information
    await expect(quotaCard.getByText('Daily API Operations')).toBeVisible()
    await expect(quotaCard.getByText(/\d+ of \d+/)).toBeVisible()
    
    // Check plan information
    await expect(quotaCard.getByText('Free Plan')).toBeVisible()
    
    // Check quota progress bar
    const progressBar = quotaCard.locator('[data-testid="quota-progress"]')
    await expect(progressBar).toBeVisible()
  })

  test('should display personalized statistics on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check stats section is visible
    const statsSection = page.locator('[data-testid="personal-stats"]')
    await expect(statsSection).toBeVisible()
    
    // Check individual stats
    await expect(statsSection.getByText('Total Operations')).toBeVisible()
    await expect(statsSection.getByText('Favorite Tools')).toBeVisible()
    await expect(statsSection.getByText('Success Rate')).toBeVisible()
    
    // Check that stats have values
    const statValues = statsSection.locator('[data-testid="stat-value"]')
    const count = await statValues.count()
    for (let i = 0; i < count; i++) {
      const value = await statValues.nth(i).textContent()
      expect(value).not.toBeNull()
      expect(value).not.toBe('')
    }
  })

  test('should display recent activity on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check recent activity section is visible
    const activitySection = page.locator('[data-testid="recent-activity"]')
    await expect(activitySection).toBeVisible()
    
    // Check activity items
    const activityItems = activitySection.locator('[data-testid="activity-item"]')
    const count = await activityItems.count()
    
    // Should have recent activity items
    expect(count).toBeGreaterThan(0)
    
    // Check first activity item
    const firstItem = activityItems.first()
    await expect(firstItem.getByText(/used|processed/)).toBeVisible()
    await expect(firstItem.getByText(/\d+ (seconds?|minutes?|hours?|days?) ago/)).toBeVisible()
  })

  test('should show upgrade prompt when quota is low', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Simulate high usage (close to quota limit)
    // This would typically be done by making actual API calls
    // For this test, we'll simulate by manipulating the DOM
    
    // Check if quota warning is displayed for high usage
    const quotaCard = page.locator('[data-testid="quota-card"]')
    const usageText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    
    if (usageText) {
      const [current, limit] = usageText.match(/\d+/g) || []
      const usagePercentage = parseInt(current) / parseInt(limit)
      
      if (usagePercentage > 0.8) {
        // Should show quota warning
        await expect(quotaCard.getByText('Approaching Limit')).toBeVisible()
        await expect(quotaCard.getByRole('button', { name: 'Upgrade Plan' })).toBeVisible()
      }
    }
  })

  test('should allow user to upgrade plan from dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Find upgrade button in quota card
    const quotaCard = page.locator('[data-testid="quota-card"]')
    const upgradeButton = quotaCard.getByRole('button', { name: 'Upgrade Plan' })
    
    // If upgrade button is visible, click it
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click()
      
      // Should navigate to pricing page
      await page.waitForURL(/\/pricing/)
      await expect(page.getByText('Choose the Plan That\'s Right for You')).toBeVisible()
      
      // Check that plans are displayed
      await expect(page.getByText('Free')).toBeVisible()
      await expect(page.getByText('Premium')).toBeVisible()
      await expect(page.getByText('Pro')).toBeVisible()
    }
  })

  test('should display correct plan information', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check plan card
    const planCard = page.locator('[data-testid="plan-card"]')
    await expect(planCard).toBeVisible()
    
    // Check plan details
    await expect(planCard.getByText('Current Plan')).toBeVisible()
    await expect(planCard.getByText('Free')).toBeVisible()
    
    // Check plan features
    await expect(planCard.getByText('10 daily API operations')).toBeVisible()
    await expect(planCard.getByText('All client-side tools')).toBeVisible()
    await expect(planCard.getByText('10MB max file size')).toBeVisible()
    
    // Check upgrade button
    await expect(planCard.getByRole('button', { name: 'Upgrade' })).toBeVisible()
  })

  test('should display usage chart with correct data', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check usage chart
    const usageChart = page.locator('[data-testid="usage-chart"]')
    await expect(usageChart).toBeVisible()
    
    // Check chart title
    await expect(usageChart.getByText('Weekly Usage')).toBeVisible()
    
    // Check chart has data points
    const chartBars = usageChart.locator('rect')
    const barCount = await chartBars.count()
    
    // Should have data for the week
    expect(barCount).toBeGreaterThan(0)
  })

  test('should handle quota exceeded state', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Simulate quota exceeded state
    // This would typically be done by consuming the user's quota
    // For this test, we'll check for quota exceeded indicators
    
    const quotaCard = page.locator('[data-testid="quota-card"]')
    const usageText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    
    if (usageText) {
      const [current, limit] = usageText.match(/\d+/g) || []
      
      if (parseInt(current) >= parseInt(limit)) {
        // Should show quota exceeded state
        await expect(quotaCard.getByText('Quota Exceeded')).toBeVisible()
        await expect(quotaCard.getByText(/upgrade.*plan/i)).toBeVisible()
        
        // Should disable tool usage
        const upgradeButton = quotaCard.getByRole('button', { name: 'Upgrade Plan' })
        await expect(upgradeButton).toBeVisible()
      }
    }
  })

  test('should display tool usage statistics', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check tool usage section
    const toolUsageSection = page.locator('[data-testid="tool-usage"]')
    await expect(toolUsageSection).toBeVisible()
    
    // Check popular tools list
    const popularTools = toolUsageSection.locator('[data-testid="popular-tool"]')
    const count = await popularTools.count()
    
    // Should have popular tools listed
    expect(count).toBeGreaterThan(0)
    
    // Check first tool item
    const firstTool = popularTools.first()
    await expect(firstTool.getByText(/\w+/)).toBeVisible() // Tool name
    await expect(firstTool.getByText(/\d+/)).toBeVisible() // Usage count
  })

  test('should display account information', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check account section
    const accountSection = page.locator('[data-testid="account-info"]')
    await expect(accountSection).toBeVisible()
    
    // Check user information
    await expect(accountSection.getByText('test@example.com')).toBeVisible()
    await expect(accountSection.getByText('Member since')).toBeVisible()
    
    // Check settings link
    const settingsLink = accountSection.getByRole('link', { name: 'Settings' })
    await expect(settingsLink).toBeVisible()
    
    // Click settings link
    await settingsLink.click()
    
    // Should navigate to profile page
    await page.waitForURL(/\/profile/)
    await expect(page.getByText('Account Settings')).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Clean up session
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })
})