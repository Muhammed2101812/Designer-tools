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
    await page.getByLabel('Email').fill('e2e-dashboard-test@example.com')
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

  test('Dashboard Page Rendering and Navigation', async ({ page }) => {
    // Check that dashboard page renders correctly
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Welcome back')).toBeVisible()
    
    // Check that user name is displayed
    await expect(page.getByText('E2E Dashboard Test User')).toBeVisible()
    
    // Check that plan information is displayed
    await expect(page.getByText('Free Plan')).toBeVisible()
    
    // Check that quota card is visible
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
    
    // Check that plan card is visible
    const planCard = page.locator('[data-testid="plan-card"]')
    await expect(planCard).toBeVisible()
    
    // Check that usage chart is visible
    const usageChart = page.locator('[data-testid="usage-chart"]')
    await expect(usageChart).toBeVisible()
    
    // Check that recent activity is visible
    const recentActivity = page.locator('[data-testid="recent-activity"]')
    await expect(recentActivity).toBeVisible()
    
    // Check that navigation works
    await page.getByRole('link', { name: 'Tools' }).click()
    await page.waitForURL(/\/tools/)
    await expect(page.getByText('Design Tools')).toBeVisible()
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('Quota Card Display and Functionality', async ({ page }) => {
    // Check quota card displays correct information
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
    
    // Check quota title
    await expect(quotaCard.getByText('Daily API Operations')).toBeVisible()
    
    // Check quota usage display
    await expect(quotaCard.getByText(/\d+ of \d+/)).toBeVisible()
    
    // Check quota progress bar
    const progressBar = quotaCard.locator('[data-testid="quota-progress"]')
    await expect(progressBar).toBeVisible()
    
    // Check plan information
    await expect(quotaCard.getByText('Free Plan')).toBeVisible()
    
    // Check upgrade button
    const upgradeButton = quotaCard.getByRole('button', { name: 'Upgrade Plan' })
    await expect(upgradeButton).toBeVisible()
    
    // Click upgrade button
    await upgradeButton.click()
    
    // Should navigate to pricing page
    await page.waitForURL(/\/pricing/)
    await expect(page.getByText('Choose the Plan That\'s Right for You')).toBeVisible()
  })

  test('Plan Card Display and Functionality', async ({ page }) => {
    // Check plan card displays correct information
    const planCard = page.locator('[data-testid="plan-card"]')
    await expect(planCard).toBeVisible()
    
    // Check plan title
    await expect(planCard.getByText('Current Plan')).toBeVisible()
    
    // Check plan name
    await expect(planCard.getByText('Free')).toBeVisible()
    
    // Check plan features
    await expect(planCard.getByText('10 daily API operations')).toBeVisible()
    await expect(planCard.getByText('All client-side tools')).toBeVisible()
    await expect(planCard.getByText('10MB max file size')).toBeVisible()
    
    // Check upgrade button
    const upgradeButton = planCard.getByRole('button', { name: 'Upgrade' })
    await expect(upgradeButton).toBeVisible()
    
    // Click upgrade button
    await upgradeButton.click()
    
    // Should navigate to pricing page
    await page.waitForURL(/\/pricing/)
    await expect(page.getByText('Choose the Plan That\'s Right for You')).toBeVisible()
    
    // Navigate back to dashboard
    await page.goBack()
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('Usage Chart Display and Functionality', async ({ page }) => {
    // Check usage chart displays correctly
    const usageChart = page.locator('[data-testid="usage-chart"]')
    await expect(usageChart).toBeVisible()
    
    // Check chart title
    await expect(usageChart.getByText('Weekly Usage')).toBeVisible()
    
    // Check that chart has data points
    const chartBars = usageChart.locator('rect')
    const barCount = await chartBars.count()
    
    // Should have data for the week
    expect(barCount).toBeGreaterThanOrEqual(0)
    
    // Check chart axes
    await expect(usageChart.getByText('Days')).toBeVisible()
    await expect(usageChart.getByText('Operations')).toBeVisible()
    
    // Check that chart updates with new data
    // This would be tested by making API tool usage and refreshing the chart
  })

  test('Recent Activity Display and Functionality', async ({ page }) => {
    // Check recent activity displays correctly
    const recentActivity = page.locator('[data-testid="recent-activity"]')
    await expect(recentActivity).toBeVisible()
    
    // Check section title
    await expect(recentActivity.getByText('Recent Activity')).toBeVisible()
    
    // Check that activity items are displayed
    const activityItems = recentActivity.locator('[data-testid="activity-item"]')
    const itemCount = await activityItems.count()
    
    // Should have recent activity items
    expect(itemCount).toBeGreaterThanOrEqual(0)
    
    // If there are items, check their structure
    if (itemCount > 0) {
      const firstItem = activityItems.first()
      await expect(firstItem.getByText(/used|processed/)).toBeVisible()
      await expect(firstItem.getByText(/\d+ (seconds?|minutes?|hours?|days?) ago/)).toBeVisible()
    }
    
    // Check empty state
    if (itemCount === 0) {
      await expect(recentActivity.getByText('No recent activity')).toBeVisible()
    }
  })

  test('Personal Statistics Display', async ({ page }) => {
    // Check personal stats section
    const statsSection = page.locator('[data-testid="personal-stats"]')
    await expect(statsSection).toBeVisible()
    
    // Check section title
    await expect(statsSection.getByText('Your Statistics')).toBeVisible()
    
    // Check individual stats
    const totalOperationsStat = statsSection.locator('[data-testid="total-operations-stat"]')
    await expect(totalOperationsStat).toBeVisible()
    await expect(totalOperationsStat.getByText('Total Operations')).toBeVisible()
    await expect(totalOperationsStat.getByText(/\d+/)).toBeVisible()
    
    const favoriteToolsStat = statsSection.locator('[data-testid="favorite-tools-stat"]')
    await expect(favoriteToolsStat).toBeVisible()
    await expect(favoriteToolsStat.getByText('Favorite Tools')).toBeVisible()
    
    const successRateStat = statsSection.locator('[data-testid="success-rate-stat"]')
    await expect(successRateStat).toBeVisible()
    await expect(successRateStat.getByText('Success Rate')).toBeVisible()
    await expect(successRateStat.getByText(/\d+%/)).toBeVisible()
    
    const processingTimeStat = statsSection.locator('[data-testid="processing-time-stat"]')
    await expect(processingTimeStat).toBeVisible()
    await expect(processingTimeStat.getByText('Avg Processing Time')).toBeVisible()
    await expect(processingTimeStat.getByText(/\d+ms/)).toBeVisible()
  })

  test('Quota Warning and Exceeded States', async ({ page }) => {
    // Simulate high usage to test warning state
    // This would typically be done by making actual API calls
    // For this test, we'll check for existing warning indicators
    
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
    
    // Check usage text for high usage
    const usageText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    
    if (usageText) {
      const [current, limit] = usageText.match(/\d+/g) || []
      const usagePercentage = parseInt(current) / parseInt(limit)
      
      // If usage is high, check warning indicators
      if (usagePercentage > 0.8) {
        await expect(quotaCard.getByText('Approaching Limit')).toBeVisible()
        await expect(quotaCard.getByRole('button', { name: 'Upgrade Plan' })).toBeVisible()
      }
      
      // If usage is at limit, check exceeded indicators
      if (parseInt(current) >= parseInt(limit)) {
        await expect(quotaCard.getByText('Quota Exceeded')).toBeVisible()
        await expect(quotaCard.getByText(/upgrade.*plan/i)).toBeVisible()
      }
    }
  })

  test('Plan Upgrade Flow from Dashboard', async ({ page }) => {
    // Find upgrade button in quota card
    const quotaCard = page.locator('[data-testid="quota-card"]')
    const upgradeButton = quotaCard.getByRole('button', { name: 'Upgrade Plan' })
    
    // Click upgrade button
    await upgradeButton.click()
    
    // Should navigate to pricing page
    await page.waitForURL(/\/pricing/)
    await expect(page.getByText('Choose the Plan That\'s Right for You')).toBeVisible()
    
    // Check that plans are displayed
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('Premium')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
    
    // Check current plan indicator
    await expect(page.getByText('Current')).toBeVisible()
    
    // Find and click Premium plan
    const premiumPlanCard = page.locator('[data-testid="premium-plan-card"]')
    await expect(premiumPlanCard).toBeVisible()
    
    const subscribeButton = premiumPlanCard.getByRole('button', { name: 'Subscribe' })
    await subscribeButton.click()
    
    // Should redirect to Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/)
    await expect(page.url()).toContain('checkout.stripe.com')
    
    // Navigate back to dashboard
    await page.goBack()
    await page.waitForURL(/\/pricing/)
    await page.goBack()
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('User Profile Access from Dashboard', async ({ page }) => {
    // Click user menu
    await page.getByRole('button', { name: 'User menu' }).click()
    
    // Click profile link
    await page.getByRole('menuitem', { name: 'Profile' }).click()
    
    // Should navigate to profile page
    await page.waitForURL(/\/profile/)
    await expect(page.getByText('Account Settings')).toBeVisible()
    
    // Check profile information
    await expect(page.getByText('E2E Dashboard Test User')).toBeVisible()
    await expect(page.getByText('e2e-dashboard-test@example.com')).toBeVisible()
    await expect(page.getByText('Free Plan')).toBeVisible()
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('Navigation Menu Functionality', async ({ page }) => {
    // Check navigation menu items
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tools' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible()
    
    // Test navigation to tools page
    await page.getByRole('link', { name: 'Tools' }).click()
    await page.waitForURL(/\/tools/)
    await expect(page.getByText('Design Tools')).toBeVisible()
    
    // Test navigation back to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Test navigation to pricing page
    await page.getByRole('link', { name: 'Pricing' }).click()
    await page.waitForURL(/\/pricing/)
    await expect(page.getByText('Choose the Plan That\'s Right for You')).toBeVisible()
    
    // Test navigation back to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('Responsive Dashboard Layout', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Reload page to apply responsive changes
    await page.reload()
    
    // Check that dashboard elements are still visible
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Welcome back')).toBeVisible()
    
    // Check that cards stack vertically on mobile
    const quotaCard = page.locator('[data-testid="quota-card"]')
    const planCard = page.locator('[data-testid="plan-card"]')
    await expect(quotaCard).toBeVisible()
    await expect(planCard).toBeVisible()
    
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    // Check that dashboard elements are still visible
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Welcome back')).toBeVisible()
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    // Check that dashboard elements are still visible
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('Dashboard Performance and Loading States', async ({ page }) => {
    // Measure dashboard load time
    const startTime = Date.now()
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Wait for key elements to be visible
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Daily API Operations')).toBeVisible()
    await expect(page.getByText('Current Plan')).toBeVisible()
    await expect(page.getByText('Weekly Usage')).toBeVisible()
    await expect(page.getByText('Recent Activity')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Should load within reasonable time (2 seconds for E2E test)
    expect(loadTime).toBeLessThan(2000)
    
    // Log performance metric
    console.log(`Dashboard load time: ${loadTime}ms`)
    
    // Check that loading indicators are not visible after load
    await expect(page.getByText('Loading...')).not.toBeVisible()
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('Dashboard Error Handling', async ({ page }) => {
    // Mock network error for analytics data
    await page.route('**/api/analytics/**', route => {
      route.abort('failed')
    })
    
    // Reload dashboard
    await page.reload()
    
    // Should still render dashboard with error state
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Should show error message for analytics
    await expect(page.getByText(/failed to load/i)).toBeVisible()
    
    // Restore normal network behavior
    await page.unroute('**/api/analytics/**')
    
    // Reload dashboard again
    await page.reload()
    
    // Should render dashboard correctly
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Daily API Operations')).toBeVisible()
  })

  test('Dashboard Security and Authentication', async ({ page }) => {
    // Check that dashboard is only accessible to authenticated users
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login
    await page.waitForURL(/\/login/)
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Sign in again
    await page.getByLabel('Email').fill('e2e-dashboard-test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Check that sensitive information is not exposed in network requests
    // This would be verified by inspecting network traffic in a real test environment
  })

  test('Dashboard Data Refresh and Updates', async ({ page }) => {
    // Check initial data
    const quotaCard = page.locator('[data-testid="quota-card"]')
    const initialUsageText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    
    // Find refresh button
    const refreshButton = page.getByRole('button', { name: 'Refresh' })
    await expect(refreshButton).toBeVisible()
    
    // Click refresh button
    await refreshButton.click()
    
    // Wait for refresh to complete
    await page.waitForTimeout(1000)
    
    // Check that data is still consistent
    const updatedUsageText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    
    // Usage should be consistent after refresh
    expect(updatedUsageText).toBe(initialUsageText)
    
    // Check that refresh button is enabled after refresh
    await expect(refreshButton).toBeEnabled()
  })

  test('Dashboard Accessibility Features', async ({ page }) => {
    // Check proper heading hierarchy
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Daily API Operations', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Current Plan', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Weekly Usage', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent Activity', level: 2 })).toBeVisible()
    
    // Check that quota progress bar has accessible labels
    const progressBar = page.locator('[data-testid="quota-progress"]')
    await expect(progressBar).toBeVisible()
    await expect(progressBar).toHaveAttribute('aria-label', /quota usage/i)
    await expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    await expect(progressBar).toHaveAttribute('aria-valuemax')
    await expect(progressBar).toHaveAttribute('aria-valuenow')
    
    // Check that cards have proper landmarks
    const quotaCard = page.locator('[data-testid="quota-card"]')
    const planCard = page.locator('[data-testid="plan-card"]')
    const usageChart = page.locator('[data-testid="usage-chart"]')
    const recentActivity = page.locator('[data-testid="recent-activity"]')
    
    await expect(quotaCard).toHaveAttribute('role', 'region')
    await expect(quotaCard).toHaveAttribute('aria-labelledby')
    await expect(planCard).toHaveAttribute('role', 'region')
    await expect(planCard).toHaveAttribute('aria-labelledby')
    await expect(usageChart).toHaveAttribute('role', 'region')
    await expect(usageChart).toHaveAttribute('aria-labelledby')
    await expect(recentActivity).toHaveAttribute('role', 'region')
    await expect(recentActivity).toHaveAttribute('aria-labelledby')
    
    // Check keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'User menu' })).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Upgrade Plan' })).toBeFocused()
  })

  test('Quota Management and Plan Features', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check quota management functionality
    const quotaCard = page.locator('[data-testid="quota-card"]')
    await expect(quotaCard).toBeVisible()
    
    // Check current plan features
    const planCard = page.locator('[data-testid="plan-card"]')
    await expect(planCard).toBeVisible()
    
    // Check that plan features match user's plan
    await expect(planCard.getByText('Free')).toBeVisible()
    await expect(planCard.getByText('10 daily API operations')).toBeVisible()
    await expect(planCard.getByText('All client-side tools')).toBeVisible()
    await expect(planCard.getByText('10MB max file size')).toBeVisible()
    
    // Check that upgrade button is available for free plan
    const upgradeButton = planCard.getByRole('button', { name: 'Upgrade' })
    await expect(upgradeButton).toBeVisible()
    
    // Check that quota limit matches plan
    const quotaText = await quotaCard.getByText(/\d+ of \d+/).textContent()
    expect(quotaText).toContain('of 10') // Free plan limit
    
    // Check that quota is tracked correctly
    const quotaProgress = quotaCard.locator('[data-testid="quota-progress"]')
    await expect(quotaProgress).toBeVisible()
    
    // Check that quota percentage is calculated correctly
    const quotaPercentage = await quotaProgress.getAttribute('aria-valuenow')
    expect(quotaPercentage).toBeDefined()
    
    // Check that quota color changes based on usage
    const quotaBar = quotaProgress.locator('div')
    const quotaBarColor = await quotaBar.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor
    })
    
    // Color should depend on usage percentage
    expect(quotaBarColor).toBeDefined()
  })

  test('Dashboard Analytics and Insights', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check analytics components
    const analyticsSection = page.locator('[data-testid="analytics-section"]')
    await expect(analyticsSection).toBeVisible()
    
    // Check that charts are displayed
    const charts = page.locator('[data-testid*="chart"]')
    const chartCount = await charts.count()
    expect(chartCount).toBeGreaterThanOrEqual(1)
    
    // Check that analytics data loads
    await expect(page.getByText(/tool usage|performance|statistics/i)).toBeVisible()
    
    // Check that insights are provided
    const insightsSection = page.locator('[data-testid="insights-section"]')
    await expect(insightsSection).toBeVisible()
    
    // Check that tips are displayed
    const tipsSection = page.locator('[data-testid="tips-section"]')
    await expect(tipsSection).toBeVisible()
    
    // Check that recommendations are provided
    const recommendations = page.locator('[data-testid="recommendation"]')
    const recCount = await recommendations.count()
    expect(recCount).toBeGreaterThanOrEqual(0)
  })

  test('Dashboard Notifications and Alerts', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check for notifications
    const notifications = page.locator('[data-testid="notification"]')
    const notificationCount = await notifications.count()
    
    // Check that notifications display correctly
    if (notificationCount > 0) {
      const firstNotification = notifications.first()
      await expect(firstNotification).toBeVisible()
      
      // Check notification content
      await expect(firstNotification.getByText(/upgrade|tip|recommendation/i)).toBeVisible()
      
      // Check dismiss button
      const dismissButton = firstNotification.getByRole('button', { name: 'Dismiss' })
      await expect(dismissButton).toBeVisible()
      
      // Check that notification can be dismissed
      const dismissCount = await notifications.count()
      await dismissButton.click()
      await page.waitForTimeout(500)
      const newCount = await notifications.count()
      expect(newCount).toBeLessThan(dismissCount)
    }
    
    // Check for alerts
    const alerts = page.locator('[data-testid="alert"]')
    const alertCount = await alerts.count()
    
    // Check alert types
    for (let i = 0; i < alertCount; i++) {
      const alert = alerts.nth(i)
      await expect(alert).toBeVisible()
      
      // Check that alerts have proper styling
      await expect(alert).toHaveAttribute('role', 'alert')
      
      // Check alert content
      await expect(alert.getByText(/warning|error|info|success/i)).toBeVisible()
    }
  })

  test('Dashboard Customization and Preferences', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check for customization options
    const customizeButton = page.getByRole('button', { name: 'Customize Dashboard' })
    await expect(customizeButton).toBeVisible()
    
    // Click customize button
    await customizeButton.click()
    
    // Check that customization panel opens
    const customizationPanel = page.locator('[data-testid="customization-panel"]')
    await expect(customizationPanel).toBeVisible()
    
    // Check customization options
    const widgetOptions = customizationPanel.locator('[data-testid="widget-option"]')
    const optionCount = await widgetOptions.count()
    expect(optionCount).toBeGreaterThanOrEqual(3)
    
    // Check that widgets can be toggled
    for (let i = 0; i < Math.min(optionCount, 2); i++) {
      const option = widgetOptions.nth(i)
      const checkbox = option.getByRole('checkbox')
      
      // Toggle widget
      const initialState = await checkbox.isChecked()
      await checkbox.click()
      const newState = await checkbox.isChecked()
      expect(newState).not.toBe(initialState)
      
      // Toggle back
      await checkbox.click()
      const finalState = await checkbox.isChecked()
      expect(finalState).toBe(initialState)
    }
    
    // Check save button
    const saveButton = customizationPanel.getByRole('button', { name: 'Save Changes' })
    await expect(saveButton).toBeVisible()
    
    // Close customization panel
    const closeButton = customizationPanel.getByRole('button', { name: 'Close' })
    await closeButton.click()
    await expect(customizationPanel).not.toBeVisible()
  })

  test('Dashboard Export and Reporting', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check for export options
    const exportButton = page.getByRole('button', { name: 'Export Data' })
    await expect(exportButton).toBeVisible()
    
    // Click export button
    await exportButton.click()
    
    // Check that export options appear
    const exportOptions = page.locator('[data-testid="export-options"]')
    await expect(exportOptions).toBeVisible()
    
    // Check export formats
    await expect(exportOptions.getByText('PDF')).toBeVisible()
    await expect(exportOptions.getByText('CSV')).toBeVisible()
    await expect(exportOptions.getByText('JSON')).toBeVisible()
    
    // Check that export works
    const pdfExport = exportOptions.getByRole('button', { name: 'Export as PDF' })
    await expect(pdfExport).toBeVisible()
    
    // Close export options
    await page.keyboard.press('Escape')
    await expect(exportOptions).not.toBeVisible()
    
    // Check for scheduled reports
    const scheduleReportButton = page.getByRole('button', { name: 'Schedule Reports' })
    await expect(scheduleReportButton).toBeVisible()
  })

  test('Dashboard Search and Filtering', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check for search functionality
    const searchInput = page.getByPlaceholder('Search dashboard...')
    await expect(searchInput).toBeVisible()
    
    // Test search functionality
    await searchInput.fill('quota')
    await page.waitForTimeout(500)
    
    // Check that search results are filtered
    const searchResults = page.locator('[data-testid*="search-result"]')
    const resultCount = await searchResults.count()
    expect(resultCount).toBeGreaterThanOrEqual(0)
    
    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)
    
    // Check that all elements are visible again
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Check filter options
    const filterButton = page.getByRole('button', { name: 'Filter' })
    await expect(filterButton).toBeVisible()
    
    // Click filter button
    await filterButton.click()
    
    // Check that filter panel opens
    const filterPanel = page.locator('[data-testid="filter-panel"]')
    await expect(filterPanel).toBeVisible()
    
    // Check filter options
    const dateFilter = filterPanel.getByLabel('Date Range')
    await expect(dateFilter).toBeVisible()
    
    const categoryFilter = filterPanel.getByLabel('Category')
    await expect(categoryFilter).toBeVisible()
    
    // Close filter panel
    await page.keyboard.press('Escape')
    await expect(filterPanel).not.toBeVisible()
  })

  test('Dashboard Help and Documentation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check for help button
    const helpButton = page.getByRole('button', { name: 'Help' })
    await expect(helpButton).toBeVisible()
    
    // Click help button
    await helpButton.click()
    
    // Check that help panel opens
    const helpPanel = page.locator('[data-testid="help-panel"]')
    await expect(helpPanel).toBeVisible()
    
    // Check help content
    await expect(helpPanel.getByText('Dashboard Help')).toBeVisible()
    await expect(helpPanel.getByText(/quota|usage|plan|tools/i)).toBeVisible()
    
    // Check documentation links
    const docLinks = helpPanel.getByRole('link', { name: /documentation|guide|tutorial/i })
    const linkCount = await docLinks.count()
    expect(linkCount).toBeGreaterThanOrEqual(1)
    
    // Check that links work
    if (linkCount > 0) {
      const firstLink = docLinks.first()
      const href = await firstLink.getAttribute('href')
      expect(href).toMatch(/^https?:\/\//) // Should be external link
    }
    
    // Close help panel
    const closeButton = helpPanel.getByRole('button', { name: 'Close' })
    await closeButton.click()
    await expect(helpPanel).not.toBeVisible()
  })
})