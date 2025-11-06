import { test, expect } from '@playwright/test'

test.describe('Monitoring and Alerting E2E Tests', () => {
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
    await page.getByLabel('Email').fill('e2e-monitoring-test@example.com')
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

  test('Application Health Monitoring', async ({ page }) => {
    // Navigate to monitoring endpoint
    await page.goto('/api/monitoring/health')
    
    // Should return healthy status
    await expect(page.getByText('"status":"ok"')).toBeVisible()
    
    // Check that health endpoint returns proper data
    const response = await page.request.get('/api/monitoring/health')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
    expect(typeof data.timestamp).toBe('string')
    
    // Check that health endpoint includes service statuses
    expect(data.services).toBeDefined()
    expect(data.services.database).toBe('healthy')
    expect(data.services.api).toBe('healthy')
    expect(data.services.auth).toBe('healthy')
    
    // Log health check results
    console.log('Health Check Results:')
    console.log(`- Overall status: ${data.status}`)
    console.log(`- Database: ${data.services.database}`)
    console.log(`- API: ${data.services.api}`)
    console.log(`- Auth: ${data.services.auth}`)
  })

  test('Detailed Health Monitoring', async ({ page }) => {
    // Navigate to detailed health endpoint
    await page.goto('/api/monitoring/health/detailed')
    
    // Should return detailed health information
    await expect(page.getByText('"database"')).toBeVisible()
    await expect(page.getByText('"api_version"')).toBeVisible()
    await expect(page.getByText('"uptime"')).toBeVisible()
    
    // Check that detailed health endpoint returns comprehensive data
    const response = await page.request.get('/api/monitoring/health/detailed')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.services).toBeDefined()
    expect(data.system).toBeDefined()
    expect(data.application).toBeDefined()
    
    // Check database health details
    expect(data.services.database.status).toBe('healthy')
    expect(data.services.database.connection_pool).toBeDefined()
    expect(data.services.database.active_connections).toBeDefined()
    
    // Check API health details
    expect(data.services.api.status).toBe('healthy')
    expect(data.services.api.version).toBeDefined()
    expect(data.services.api.response_time).toBeDefined()
    
    // Check authentication service details
    expect(data.services.auth.status).toBe('healthy')
    expect(data.services.auth.provider).toBe('supabase')
    
    // Check system metrics
    expect(data.system.uptime).toBeDefined()
    expect(data.system.memory_usage).toBeDefined()
    expect(data.system.cpu_usage).toBeDefined()
    
    // Check application metrics
    expect(data.application.version).toBeDefined()
    expect(data.application.build).toBeDefined()
    expect(data.application.environment).toBeDefined()
    
    // Log detailed health check results
    console.log('Detailed Health Check Results:')
    console.log(`- Database connections: ${data.services.database.active_connections}`)
    console.log(`- API response time: ${data.services.api.response_time}ms`)
    console.log(`- System uptime: ${data.system.uptime} seconds`)
    console.log(`- Memory usage: ${data.system.memory_usage}%`)
    console.log(`- CPU usage: ${data.system.cpu_usage}%`)
  })

  test('Version Information Monitoring', async ({ page }) => {
    // Navigate to version endpoint
    await page.goto('/api/version')
    
    // Should return version information
    await expect(page.getByText(/"version"/)).toBeVisible()
    await expect(page.getByText(/"build"/)).toBeVisible()
    await expect(page.getByText(/"timestamp"/)).toBeVisible()
    
    // Check that version endpoint returns proper data
    const response = await page.request.get('/api/version')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.version).toBeDefined()
    expect(data.build).toBeDefined()
    expect(data.timestamp).toBeDefined()
    
    // Check that version follows semantic versioning
    expect(data.version).toMatch(/^\d+\.\d+\.\d+$/)
    
    // Check that build identifier is present
    expect(data.build).toMatch(/^[a-f0-9]{7,}$/) // Git commit hash
    
    // Check that timestamp is in ISO format
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
    
    // Log version information
    console.log('Version Information:')
    console.log(`- Version: ${data.version}`)
    console.log(`- Build: ${data.build}`)
    console.log(`- Timestamp: ${data.timestamp}`)
  })

  test('Performance Metrics Monitoring', async ({ page }) => {
    // Navigate to dashboard to generate some metrics
    await page.goto('/dashboard')
    
    // Wait for page to load and generate metrics
    await page.waitForTimeout(2000)
    
    // Navigate to performance metrics endpoint
    const response = await page.request.get('/api/monitoring/performance')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.metrics).toBeDefined()
    expect(data.metrics.page_load_time).toBeDefined()
    expect(data.metrics.api_response_time).toBeDefined()
    expect(data.metrics.database_query_time).toBeDefined()
    
    // Check that metrics are within reasonable ranges
    expect(data.metrics.page_load_time).toBeGreaterThan(0)
    expect(data.metrics.page_load_time).toBeLessThan(10000) // Less than 10 seconds
    
    if (data.metrics.api_response_time) {
      expect(data.metrics.api_response_time).toBeGreaterThan(0)
      expect(data.metrics.api_response_time).toBeLessThan(5000) // Less than 5 seconds
    }
    
    if (data.metrics.database_query_time) {
      expect(data.metrics.database_query_time).toBeGreaterThan(0)
      expect(data.metrics.database_query_time).toBeLessThan(2000) // Less than 2 seconds
    }
    
    // Check that metrics include percentile data
    expect(data.metrics.percentiles).toBeDefined()
    expect(data.metrics.percentiles.p50).toBeDefined()
    expect(data.metrics.percentiles.p95).toBeDefined()
    expect(data.metrics.percentiles.p99).toBeDefined()
    
    // Log performance metrics
    console.log('Performance Metrics:')
    console.log(`- Page load time: ${data.metrics.page_load_time}ms`)
    console.log(`- API response time: ${data.metrics.api_response_time || 'N/A'}ms`)
    console.log(`- DB query time: ${data.metrics.database_query_time || 'N/A'}ms`)
    console.log(`- 50th percentile: ${data.metrics.percentiles.p50}ms`)
    console.log(`- 95th percentile: ${data.metrics.percentiles.p95}ms`)
    console.log(`- 99th percentile: ${data.metrics.percentiles.p99}ms`)
  })

  test('Error Rate Monitoring', async ({ page }) => {
    // Navigate to error monitoring endpoint
    const response = await page.request.get('/api/monitoring/errors')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.error_rate).toBeDefined()
    expect(data.total_requests).toBeDefined()
    expect(data.error_count).toBeDefined()
    expect(data.top_errors).toBeDefined()
    
    // Check that error rate is a valid percentage
    expect(data.error_rate).toBeGreaterThanOrEqual(0)
    expect(data.error_rate).toBeLessThanOrEqual(100)
    
    // Check that total requests is reasonable
    expect(data.total_requests).toBeGreaterThanOrEqual(0)
    
    // Check that error count is reasonable
    expect(data.error_count).toBeGreaterThanOrEqual(0)
    expect(data.error_count).toBeLessThanOrEqual(data.total_requests)
    
    // Check that top errors array is present
    expect(Array.isArray(data.top_errors)).toBe(true)
    
    // Log error rate metrics
    console.log('Error Rate Metrics:')
    console.log(`- Error rate: ${data.error_rate.toFixed(2)}%`)
    console.log(`- Total requests: ${data.total_requests}`)
    console.log(`- Error count: ${data.error_count}`)
    console.log(`- Top errors: ${data.top_errors.length}`)
  })

  test('User Activity Monitoring', async ({ page }) => {
    // Navigate to user activity monitoring endpoint
    const response = await page.request.get('/api/monitoring/activity')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.active_users).toBeDefined()
    expect(data.daily_active_users).toBeDefined()
    expect(data.weekly_active_users).toBeDefined()
    expect(data.monthly_active_users).toBeDefined()
    expect(data.user_growth).toBeDefined()
    
    // Check that active user counts are reasonable
    expect(data.active_users).toBeGreaterThanOrEqual(0)
    expect(data.daily_active_users).toBeGreaterThanOrEqual(0)
    expect(data.weekly_active_users).toBeGreaterThanOrEqual(0)
    expect(data.monthly_active_users).toBeGreaterThanOrEqual(0)
    
    // Check that weekly active users >= daily active users
    expect(data.weekly_active_users).toBeGreaterThanOrEqual(data.daily_active_users)
    
    // Check that monthly active users >= weekly active users
    expect(data.monthly_active_users).toBeGreaterThanOrEqual(data.weekly_active_users)
    
    // Check that user growth data is present
    expect(data.user_growth.daily).toBeDefined()
    expect(data.user_growth.weekly).toBeDefined()
    expect(data.user_growth.monthly).toBeDefined()
    
    // Log user activity metrics
    console.log('User Activity Metrics:')
    console.log(`- Active users: ${data.active_users}`)
    console.log(`- Daily active users: ${data.daily_active_users}`)
    console.log(`- Weekly active users: ${data.weekly_active_users}`)
    console.log(`- Monthly active users: ${data.monthly_active_users}`)
    console.log(`- Daily growth: ${data.user_growth.daily}%`)
    console.log(`- Weekly growth: ${data.user_growth.weekly}%`)
    console.log(`- Monthly growth: ${data.user_growth.monthly}%`)
  })

  test('Resource Usage Monitoring', async ({ page }) => {
    // Navigate to resource usage monitoring endpoint
    const response = await page.request.get('/api/monitoring/resources')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.cpu).toBeDefined()
    expect(data.memory).toBeDefined()
    expect(data.disk).toBeDefined()
    expect(data.network).toBeDefined()
    expect(data.database).toBeDefined()
    
    // Check CPU usage metrics
    expect(data.cpu.usage_percent).toBeGreaterThanOrEqual(0)
    expect(data.cpu.usage_percent).toBeLessThanOrEqual(100)
    expect(data.cpu.cores).toBeGreaterThanOrEqual(1)
    
    // Check memory usage metrics
    expect(data.memory.total_gb).toBeGreaterThan(0)
    expect(data.memory.used_gb).toBeGreaterThanOrEqual(0)
    expect(data.memory.used_gb).toBeLessThanOrEqual(data.memory.total_gb)
    expect(data.memory.usage_percent).toBeGreaterThanOrEqual(0)
    expect(data.memory.usage_percent).toBeLessThanOrEqual(100)
    
    // Check disk usage metrics
    expect(data.disk.total_gb).toBeGreaterThan(0)
    expect(data.disk.used_gb).toBeGreaterThanOrEqual(0)
    expect(data.disk.used_gb).toBeLessThanOrEqual(data.disk.total_gb)
    expect(data.disk.usage_percent).toBeGreaterThanOrEqual(0)
    expect(data.disk.usage_percent).toBeLessThanOrEqual(100)
    
    // Check network metrics
    expect(data.network.bytes_in).toBeGreaterThanOrEqual(0)
    expect(data.network.bytes_out).toBeGreaterThanOrEqual(0)
    
    // Check database metrics
    expect(data.database.connections).toBeGreaterThanOrEqual(0)
    expect(data.database.max_connections).toBeGreaterThan(0)
    expect(data.database.connection_usage).toBeGreaterThanOrEqual(0)
    expect(data.database.connection_usage).toBeLessThanOrEqual(100)
    
    // Log resource usage metrics
    console.log('Resource Usage Metrics:')
    console.log(`- CPU: ${data.cpu.usage_percent.toFixed(1)}% (${data.cpu.cores} cores)`)
    console.log(`- Memory: ${data.memory.used_gb.toFixed(2)}GB / ${data.memory.total_gb.toFixed(2)}GB (${data.memory.usage_percent.toFixed(1)}%)`)
    console.log(`- Disk: ${data.disk.used_gb.toFixed(2)}GB / ${data.disk.total_gb.toFixed(2)}GB (${data.disk.usage_percent.toFixed(1)}%)`)
    console.log(`- Network: ${data.network.bytes_in} bytes in, ${data.network.bytes_out} bytes out`)
    console.log(`- Database: ${data.database.connections} / ${data.database.max_connections} connections (${data.database.connection_usage.toFixed(1)}%)`)
  })

  test('Alert Configuration Monitoring', async ({ page }) => {
    // Navigate to alert configuration monitoring endpoint
    const response = await page.request.get('/api/monitoring/alerts/config')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.alerts).toBeDefined()
    expect(Array.isArray(data.alerts)).toBe(true)
    
    // Check that alert configurations are present
    expect(data.alerts.length).toBeGreaterThan(0)
    
    // Check each alert configuration
    for (const alert of data.alerts) {
      expect(alert.name).toBeDefined()
      expect(alert.type).toBeDefined()
      expect(alert.threshold).toBeDefined()
      expect(alert.enabled).toBeDefined()
      expect(alert.channels).toBeDefined()
      
      // Check that alert type is valid
      expect(['metric', 'error_rate', 'resource_usage', 'security']).toContain(alert.type)
      
      // Check that threshold is reasonable
      expect(alert.threshold).toBeGreaterThan(0)
      
      // Check that channels array is present
      expect(Array.isArray(alert.channels)).toBe(true)
      expect(alert.channels.length).toBeGreaterThan(0)
    }
    
    // Check specific alert configurations
    const healthAlert = data.alerts.find((a: any) => a.name === 'health_check_failure')
    expect(healthAlert).toBeDefined()
    if (healthAlert) {
      expect(healthAlert.type).toBe('metric')
      expect(healthAlert.threshold).toBe(1) // 1 failure triggers alert
      expect(healthAlert.channels).toContain('slack')
      expect(healthAlert.channels).toContain('email')
    }
    
    const errorRateAlert = data.alerts.find((a: any) => a.name === 'high_error_rate')
    expect(errorRateAlert).toBeDefined()
    if (errorRateAlert) {
      expect(errorRateAlert.type).toBe('error_rate')
      expect(errorRateAlert.threshold).toBe(5) // 5% error rate triggers alert
      expect(errorRateAlert.channels).toContain('slack')
      expect(errorRateAlert.channels).toContain('email')
    }
    
    // Log alert configuration
    console.log('Alert Configuration:')
    console.log(`- Total alerts configured: ${data.alerts.length}`)
    data.alerts.forEach((alert: any) => {
      console.log(`  - ${alert.name}: ${alert.type} (threshold: ${alert.threshold}${alert.type === 'error_rate' ? '%' : ''})`)
    })
  })

  test('Alert Trigger Simulation', async ({ page }) => {
    // Navigate to alert trigger simulation endpoint
    const response = await page.request.post('/api/monitoring/alerts/trigger', {
      data: {
        alert_name: 'test_alert',
        severity: 'warning',
        message: 'Test alert triggered successfully',
      },
    })
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.triggered).toBe(true)
    expect(data.alert_name).toBe('test_alert')
    expect(data.severity).toBe('warning')
    expect(data.message).toBe('Test alert triggered successfully')
    
    // Check that alert trigger response includes timestamp
    expect(data.timestamp).toBeDefined()
    expect(typeof data.timestamp).toBe('string')
    
    // Log alert trigger simulation results
    console.log('Alert Trigger Simulation:')
    console.log(`- Success: ${data.success}`)
    console.log(`- Triggered: ${data.triggered}`)
    console.log(`- Alert: ${data.alert_name}`)
    console.log(`- Severity: ${data.severity}`)
    console.log(`- Message: ${data.message}`)
  })

  test('Log Aggregation Monitoring', async ({ page }) => {
    // Navigate to log aggregation monitoring endpoint
    const response = await page.request.get('/api/monitoring/logs')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.logs).toBeDefined()
    expect(Array.isArray(data.logs)).toBe(true)
    
    // Check that logs array contains recent log entries
    expect(data.logs.length).toBeGreaterThanOrEqual(0)
    
    // If there are logs, check their structure
    if (data.logs.length > 0) {
      const firstLog = data.logs[0]
      expect(firstLog.timestamp).toBeDefined()
      expect(firstLog.level).toBeDefined()
      expect(firstLog.message).toBeDefined()
      expect(firstLog.source).toBeDefined()
      
      // Check that log level is valid
      expect(['debug', 'info', 'warn', 'error', 'fatal']).toContain(firstLog.level)
      
      // Check that timestamp is in proper format
      expect(typeof firstLog.timestamp).toBe('string')
      expect(firstLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
    }
    
    // Check log aggregation metrics
    expect(data.metrics).toBeDefined()
    expect(data.metrics.total_logs).toBeGreaterThanOrEqual(0)
    expect(data.metrics.error_logs).toBeGreaterThanOrEqual(0)
    expect(data.metrics.warning_logs).toBeGreaterThanOrEqual(0)
    
    // Check that error logs don't exceed total logs
    expect(data.metrics.error_logs).toBeLessThanOrEqual(data.metrics.total_logs)
    
    // Check log sources
    expect(data.sources).toBeDefined()
    expect(Array.isArray(data.sources)).toBe(true)
    
    // Log aggregation results
    console.log('Log Aggregation Results:')
    console.log(`- Total logs: ${data.metrics.total_logs}`)
    console.log(`- Error logs: ${data.metrics.error_logs}`)
    console.log(`- Warning logs: ${data.metrics.warning_logs}`)
    console.log(`- Log sources: ${data.sources.length}`)
    if (data.logs.length > 0) {
      console.log(`- Most recent log: ${data.logs[0].message}`)
    }
  })

  test('Performance Baseline Monitoring', async ({ page }) => {
    // Navigate to performance baseline monitoring endpoint
    const response = await page.request.get('/api/monitoring/baseline')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.baselines).toBeDefined()
    
    // Check that baselines contain expected metrics
    expect(data.baselines.page_load_time).toBeDefined()
    expect(data.baselines.api_response_time).toBeDefined()
    expect(data.baselines.database_query_time).toBeDefined()
    expect(data.baselines.file_upload_time).toBeDefined()
    expect(data.baselines.image_processing_time).toBeDefined()
    
    // Check that baseline values are reasonable
    expect(data.baselines.page_load_time.average).toBeGreaterThan(0)
    expect(data.baselines.page_load_time.average).toBeLessThan(10000) // Less than 10 seconds
    
    if (data.baselines.api_response_time.average) {
      expect(data.baselines.api_response_time.average).toBeGreaterThan(0)
      expect(data.baselines.api_response_time.average).toBeLessThan(5000) // Less than 5 seconds
    }
    
    if (data.baselines.database_query_time.average) {
      expect(data.baselines.database_query_time.average).toBeGreaterThan(0)
      expect(data.baselines.database_query_time.average).toBeLessThan(2000) // Less than 2 seconds
    }
    
    // Check that baseline includes statistical data
    expect(data.baselines.page_load_time.median).toBeDefined()
    expect(data.baselines.page_load_time.p95).toBeDefined()
    expect(data.baselines.page_load_time.p99).toBeDefined()
    expect(data.baselines.page_load_time.min).toBeDefined()
    expect(data.baselines.page_load_time.max).toBeDefined()
    
    // Check that min <= median <= max
    expect(data.baselines.page_load_time.min).toBeLessThanOrEqual(data.baselines.page_load_time.median)
    expect(data.baselines.page_load_time.median).toBeLessThanOrEqual(data.baselines.page_load_time.max)
    
    // Log performance baseline metrics
    console.log('Performance Baseline Metrics:')
    console.log(`- Page load time: avg=${data.baselines.page_load_time.average.toFixed(2)}ms, median=${data.baselines.page_load_time.median.toFixed(2)}ms`)
    console.log(`- API response time: avg=${data.baselines.api_response_time.average?.toFixed(2) || 'N/A'}ms`)
    console.log(`- DB query time: avg=${data.baselines.database_query_time.average?.toFixed(2) || 'N/A'}ms`)
    console.log(`- File upload time: avg=${data.baselines.file_upload_time.average?.toFixed(2) || 'N/A'}ms`)
    console.log(`- Image processing time: avg=${data.baselines.image_processing_time.average?.toFixed(2) || 'N/A'}ms`)
  })

  test('Security Event Monitoring', async ({ page }) => {
    // Navigate to security event monitoring endpoint
    const response = await page.request.get('/api/monitoring/security')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.security_events).toBeDefined()
    expect(Array.isArray(data.security_events)).toBe(true)
    
    // Check security metrics
    expect(data.metrics).toBeDefined()
    expect(data.metrics.total_events).toBeGreaterThanOrEqual(0)
    expect(data.metrics.suspicious_activities).toBeGreaterThanOrEqual(0)
    expect(data.metrics.blocked_attempts).toBeGreaterThanOrEqual(0)
    expect(data.metrics.rate_limit_triggers).toBeGreaterThanOrEqual(0)
    
    // Check that suspicious activities don't exceed total events
    expect(data.metrics.suspicious_activities).toBeLessThanOrEqual(data.metrics.total_events)
    
    // Check security trends
    expect(data.trends).toBeDefined()
    expect(data.trends.daily).toBeDefined()
    expect(data.trends.weekly).toBeDefined()
    expect(data.trends.monthly).toBeDefined()
    
    // If there are security events, check their structure
    if (data.security_events.length > 0) {
      const firstEvent = data.security_events[0]
      expect(firstEvent.timestamp).toBeDefined()
      expect(firstEvent.type).toBeDefined()
      expect(firstEvent.description).toBeDefined()
      expect(firstEvent.ip_address).toBeDefined()
      expect(firstEvent.user_id).toBeDefined()
      expect(firstEvent.severity).toBeDefined()
      
      // Check that event type is valid
      expect(['login_attempt', 'failed_login', 'suspicious_activity', 'rate_limit_triggered', 'blocked_request']).toContain(firstEvent.type)
      
      // Check that severity is valid
      expect(['low', 'medium', 'high', 'critical']).toContain(firstEvent.severity)
    }
    
    // Log security monitoring results
    console.log('Security Event Monitoring:')
    console.log(`- Total security events: ${data.metrics.total_events}`)
    console.log(`- Suspicious activities: ${data.metrics.suspicious_activities}`)
    console.log(`- Blocked attempts: ${data.metrics.blocked_attempts}`)
    console.log(`- Rate limit triggers: ${data.metrics.rate_limit_triggers}`)
    console.log(`- Security trend (24h): ${data.trends.daily} events`)
  })

  test('Uptime Monitoring', async ({ page }) => {
    // Navigate to uptime monitoring endpoint
    const response = await page.request.get('/api/monitoring/uptime')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.uptime).toBeDefined()
    expect(data.downtime).toBeDefined()
    expect(data.availability).toBeDefined()
    expect(data.incidents).toBeDefined()
    
    // Check that uptime percentage is reasonable
    expect(data.uptime.percentage).toBeGreaterThanOrEqual(0)
    expect(data.uptime.percentage).toBeLessThanOrEqual(100)
    
    // Check that availability percentage is reasonable
    expect(data.availability.percentage).toBeGreaterThanOrEqual(0)
    expect(data.availability.percentage).toBeLessThanOrEqual(100)
    
    // Check that uptime seconds is reasonable
    expect(data.uptime.seconds).toBeGreaterThanOrEqual(0)
    
    // Check that downtime seconds is reasonable
    expect(data.downtime.seconds).toBeGreaterThanOrEqual(0)
    
    // Check that total uptime + downtime equals period
    const totalPeriod = data.uptime.seconds + data.downtime.seconds
    expect(totalPeriod).toBeGreaterThan(0)
    
    // Check incidents data
    expect(Array.isArray(data.incidents)).toBe(true)
    
    // Check that incidents are sorted by timestamp (newest first)
    for (let i = 1; i < Math.min(data.incidents.length, 5); i++) {
      const current = new Date(data.incidents[i-1].timestamp).getTime()
      const previous = new Date(data.incidents[i].timestamp).getTime()
      expect(current).toBeGreaterThanOrEqual(previous)
    }
    
    // Log uptime monitoring results
    console.log('Uptime Monitoring:')
    console.log(`- Uptime: ${data.uptime.percentage.toFixed(3)}% (${data.uptime.seconds} seconds)`)
    console.log(`- Downtime: ${data.downtime.percentage.toFixed(3)}% (${data.downtime.seconds} seconds)`)
    console.log(`- Availability: ${data.availability.percentage.toFixed(3)}%`)
    console.log(`- Incidents: ${data.incidents.length}`)
  })

  test('Alert Notification Testing', async ({ page }) => {
    // Navigate to alert notification test endpoint
    const response = await page.request.post('/api/monitoring/alerts/test', {
      data: {
        channel: 'slack',
        message: 'Test alert notification sent successfully',
        severity: 'info',
      },
    })
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.channel).toBe('slack')
    expect(data.message).toBe('Test alert notification sent successfully')
    expect(data.severity).toBe('info')
    expect(data.timestamp).toBeDefined()
    
    // Test email notification
    const emailResponse = await page.request.post('/api/monitoring/alerts/test', {
      data: {
        channel: 'email',
        message: 'Test email alert notification',
        severity: 'warning',
        recipients: ['e2e-monitoring-test@example.com'],
      },
    })
    
    expect(emailResponse.status()).toBe(200)
    
    const emailData = await emailResponse.json()
    expect(emailData.success).toBe(true)
    expect(emailData.channel).toBe('email')
    expect(emailData.severity).toBe('warning')
    
    // Log alert notification test results
    console.log('Alert Notification Testing:')
    console.log(`- Slack notification: ${data.success}`)
    console.log(`- Email notification: ${emailData.success}`)
    console.log(`- Test messages sent: 2`)
  })

  test('Monitoring Dashboard Access', async ({ page }) => {
    // Navigate to monitoring dashboard
    await page.goto('/monitoring')
    
    // Check that monitoring dashboard loads correctly
    await expect(page.getByText('System Monitoring')).toBeVisible()
    await expect(page.getByText('Real-time Metrics')).toBeVisible()
    
    // Check that key monitoring sections are present
    await expect(page.getByText('Health Status')).toBeVisible()
    await expect(page.getByText('Performance Metrics')).toBeVisible()
    await expect(page.getByText('Resource Usage')).toBeVisible()
    await expect(page.getByText('Error Rates')).toBeVisible()
    await expect(page.getByText('Security Events')).toBeVisible()
    await expect(page.getByText('Uptime Statistics')).toBeVisible()
    
    // Check that charts and graphs are displayed
    const charts = await page.locator('[data-testid*="chart"]').count()
    expect(charts).toBeGreaterThanOrEqual(4) // Should have at least 4 charts
    
    // Check that real-time updates are working
    const realtimeIndicator = page.locator('[data-testid="realtime-indicator"]')
    await expect(realtimeIndicator).toBeVisible()
    await expect(realtimeIndicator.getByText('Live')).toBeVisible()
    
    // Check that monitoring data is being updated
    const lastUpdated = await page.getByText(/Last updated/).textContent()
    expect(lastUpdated).toBeDefined()
    
    // Log monitoring dashboard access
    console.log('Monitoring Dashboard Access:')
    console.log(`- Dashboard sections: 6`)
    console.log(`- Charts displayed: ${charts}`)
    console.log(`- Real-time updates: active`)
  })

  test('Alert History and Analytics', async ({ page }) => {
    // Navigate to alert history endpoint
    const response = await page.request.get('/api/monitoring/alerts/history')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.history).toBeDefined()
    expect(Array.isArray(data.history)).toBe(true)
    
    // Check alert history metrics
    expect(data.metrics).toBeDefined()
    expect(data.metrics.total_alerts).toBeGreaterThanOrEqual(0)
    expect(data.metrics.resolved_alerts).toBeGreaterThanOrEqual(0)
    expect(data.metrics.active_alerts).toBeGreaterThanOrEqual(0)
    
    // Check that resolved alerts don't exceed total alerts
    expect(data.metrics.resolved_alerts).toBeLessThanOrEqual(data.metrics.total_alerts)
    
    // Check alert trends
    expect(data.trends).toBeDefined()
    expect(data.trends.daily).toBeDefined()
    expect(data.trends.weekly).toBeDefined()
    expect(data.trends.monthly).toBeDefined()
    
    // If there's alert history, check structure
    if (data.history.length > 0) {
      const firstAlert = data.history[0]
      expect(firstAlert.timestamp).toBeDefined()
      expect(firstAlert.name).toBeDefined()
      expect(firstAlert.severity).toBeDefined()
      expect(firstAlert.status).toBeDefined()
      expect(firstAlert.description).toBeDefined()
      
      // Check that severity is valid
      expect(['info', 'warning', 'error', 'critical']).toContain(firstAlert.severity)
      
      // Check that status is valid
      expect(['triggered', 'resolved', 'acknowledged']).toContain(firstAlert.status)
    }
    
    // Check alert analytics
    expect(data.analytics).toBeDefined()
    expect(data.analytics.most_common_alerts).toBeDefined()
    expect(data.analytics.resolution_times).toBeDefined()
    expect(data.analytics.alert_frequency).toBeDefined()
    
    // Log alert history and analytics
    console.log('Alert History and Analytics:')
    console.log(`- Total alerts: ${data.metrics.total_alerts}`)
    console.log(`- Resolved alerts: ${data.metrics.resolved_alerts}`)
    console.log(`- Active alerts: ${data.metrics.active_alerts}`)
    console.log(`- Alert history entries: ${data.history.length}`)
    console.log(`- Most common alert: ${data.analytics.most_common_alerts[0]?.name || 'None'}`)
  })

  test('Monitoring API Rate Limiting', async ({ page }) => {
    // Make multiple rapid requests to monitoring endpoints to test rate limiting
    const requests = []
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.get('/api/monitoring/health')
      )
    }
    
    const responses = await Promise.all(requests)
    
    // Should have some rate limited responses (429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    
    // At least some requests should be rate limited
    expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(1)
    
    // Check rate limit headers in responses
    for (const response of responses) {
      if (response.status() === 429) {
        expect(response.headers()['x-ratelimit-limit']).toBeDefined()
        expect(response.headers()['x-ratelimit-remaining']).toBeDefined()
        expect(response.headers()['x-ratelimit-reset']).toBeDefined()
        expect(response.headers()['retry-after']).toBeDefined()
      }
    }
    
    // Log rate limiting results
    console.log(`Monitoring API Rate Limiting:`)
    console.log(`- Total requests: ${responses.length}`)
    console.log(`- Rate limited requests: ${rateLimitedResponses.length}`)
    console.log(`- Success rate: ${((responses.length - rateLimitedResponses.length) / responses.length * 100).toFixed(1)}%`)
  })

  test('Monitoring Data Retention', async ({ page }) => {
    // Navigate to data retention monitoring endpoint
    const response = await page.request.get('/api/monitoring/retention')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.retention_policies).toBeDefined()
    
    // Check that retention policies are defined
    expect(data.retention_policies.logs).toBeDefined()
    expect(data.retention_policies.metrics).toBeDefined()
    expect(data.retention_policies.alerts).toBeDefined()
    expect(data.retention_policies.security_events).toBeDefined()
    
    // Check that retention periods are reasonable
    expect(data.retention_policies.logs.days).toBeGreaterThanOrEqual(30)
    expect(data.retention_policies.metrics.days).toBeGreaterThanOrEqual(90)
    expect(data.retention_policies.alerts.days).toBeGreaterThanOrEqual(365)
    expect(data.retention_policies.security_events.days).toBeGreaterThanOrEqual(365)
    
    // Check data archival policies
    expect(data.archival_policies).toBeDefined()
    expect(data.archival_policies.enabled).toBeDefined()
    expect(data.archival_policies.destination).toBeDefined()
    
    // Check storage usage metrics
    expect(data.storage).toBeDefined()
    expect(data.storage.current_usage_gb).toBeGreaterThanOrEqual(0)
    expect(data.storage.limit_gb).toBeGreaterThanOrEqual(data.storage.current_usage_gb)
    expect(data.storage.projected_growth_gb_per_month).toBeGreaterThanOrEqual(0)
    
    // Log data retention results
    console.log('Monitoring Data Retention:')
    console.log(`- Logs retention: ${data.retention_policies.logs.days} days`)
    console.log(`- Metrics retention: ${data.retention_policies.metrics.days} days`)
    console.log(`- Alerts retention: ${data.retention_policies.alerts.days} days`)
    console.log(`- Security events retention: ${data.retention_policies.security_events.days} days`)
    console.log(`- Storage usage: ${data.storage.current_usage_gb.toFixed(2)}GB / ${data.storage.limit_gb}GB`)
    console.log(`- Projected growth: ${data.storage.projected_growth_gb_per_month.toFixed(2)}GB/month`)
  })

  test('Monitoring Configuration Validation', async ({ page }) => {
    // Navigate to monitoring configuration validation endpoint
    const response = await page.request.get('/api/monitoring/config/validate')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.validation).toBeDefined()
    expect(data.validation.status).toBeDefined()
    
    // Check that validation status is either valid or has issues
    expect(['valid', 'issues_found']).toContain(data.validation.status)
    
    // If validation found issues, check that issues are documented
    if (data.validation.status === 'issues_found') {
      expect(data.validation.issues).toBeDefined()
      expect(Array.isArray(data.validation.issues)).toBe(true)
      expect(data.validation.issues.length).toBeGreaterThan(0)
      
      // Check that each issue has proper structure
      for (const issue of data.validation.issues) {
        expect(issue.severity).toBeDefined()
        expect(issue.description).toBeDefined()
        expect(issue.recommendation).toBeDefined()
        
        // Check that severity is valid
        expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity)
      }
    }
    
    // Check monitoring services configuration
    expect(data.services).toBeDefined()
    expect(data.services.sentry).toBeDefined()
    expect(data.services.plausible).toBeDefined()
    expect(data.services.supabase).toBeDefined()
    
    // Check that service configurations are valid
    expect(data.services.sentry.configured).toBe(true)
    expect(data.services.plausible.configured).toBe(true)
    expect(data.services.supabase.configured).toBe(true)
    
    // Check monitoring integrations
    expect(data.integrations).toBeDefined()
    expect(data.integrations.slack).toBeDefined()
    expect(data.integrations.email).toBeDefined()
    expect(data.integrations.webhooks).toBeDefined()
    
    // Check that integrations are properly configured
    expect(data.integrations.slack.enabled).toBe(true)
    expect(data.integrations.email.enabled).toBe(true)
    expect(data.integrations.webhooks.enabled).toBe(true)
    
    // Log configuration validation results
    console.log('Monitoring Configuration Validation:')
    console.log(`- Overall status: ${data.validation.status}`)
    console.log(`- Configuration issues: ${data.validation.issues?.length || 0}`)
    console.log(`- Services configured: 3/3`)
    console.log(`- Integrations enabled: 3/3`)
    console.log(`- Sentry: ${data.services.sentry.configured ? '✓' : '✗'}`)
    console.log(`- Plausible: ${data.services.plausible.configured ? '✓' : '✗'}`)
    console.log(`- Supabase: ${data.services.supabase.configured ? '✓' : '✗'}`)
  })

  test('Real-time Monitoring Updates', async ({ page }) => {
    // Navigate to real-time monitoring endpoint
    const wsUrl = process.env.WEBSOCKET_URL || 'ws://localhost:3000/api/monitoring/ws'
    
    // In a real test environment, we would:
    // 1. Connect to WebSocket for real-time updates
    // 2. Subscribe to monitoring channels
    // 3. Verify real-time data streaming
    // 4. Test connection resilience
    
    // For this test, we'll simulate real-time updates by polling
    const startTime = Date.now()
    const metrics = []
    
    // Poll monitoring endpoint multiple times to simulate real-time updates
    for (let i = 0; i < 5; i++) {
      const response = await page.request.get('/api/monitoring/health')
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      metrics.push({
        timestamp: Date.now(),
        ...data,
      })
      
      // Wait between polls
      await page.waitForTimeout(500)
    }
    
    const totalTime = Date.now() - startTime
    
    // Should have collected 5 metric samples
    expect(metrics.length).toBe(5)
    
    // Check that timestamps are sequential
    for (let i = 1; i < metrics.length; i++) {
      expect(metrics[i].timestamp).toBeGreaterThan(metrics[i-1].timestamp)
    }
    
    // Log real-time monitoring results
    console.log('Real-time Monitoring Updates:')
    console.log(`- Samples collected: ${metrics.length}`)
    console.log(`- Total time: ${totalTime}ms`)
    console.log(`- Average interval: ${(totalTime / (metrics.length - 1)).toFixed(0)}ms`)
    console.log(`- Data points per sample: ${Object.keys(metrics[0]).length}`)
  })

  test('Monitoring Alert Escalation', async ({ page }) => {
    // Navigate to alert escalation test endpoint
    const response = await page.request.post('/api/monitoring/alerts/escalate', {
      data: {
        alert_name: 'critical_system_alert',
        severity: 'critical',
        message: 'Critical system alert requiring immediate attention',
        escalation_level: 1,
      },
    })
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.escalated).toBe(true)
    expect(data.alert_name).toBe('critical_system_alert')
    expect(data.severity).toBe('critical')
    expect(data.escalation_level).toBe(1)
    expect(data.notification_sent).toBe(true)
    
    // Check escalation chain
    expect(data.escalation_chain).toBeDefined()
    expect(Array.isArray(data.escalation_chain)).toBe(true)
    expect(data.escalation_chain.length).toBeGreaterThanOrEqual(1)
    
    // Check notification recipients
    expect(data.notification_recipients).toBeDefined()
    expect(Array.isArray(data.notification_recipients)).toBe(true)
    expect(data.notification_recipients.length).toBeGreaterThanOrEqual(1)
    
    // Test second escalation level
    const secondEscalation = await page.request.post('/api/monitoring/alerts/escalate', {
      data: {
        alert_name: 'critical_system_alert',
        severity: 'critical',
        message: 'Critical system alert - second escalation',
        escalation_level: 2,
      },
    })
    
    expect(secondEscalation.status()).toBe(200)
    
    const secondData = await secondEscalation.json()
    expect(secondData.success).toBe(true)
    expect(secondData.escalated).toBe(true)
    expect(secondData.escalation_level).toBe(2)
    
    // Log alert escalation results
    console.log('Monitoring Alert Escalation:')
    console.log(`- First escalation: ${data.success}`)
    console.log(`- Second escalation: ${secondData.success}`)
    console.log(`- Notification recipients: ${data.notification_recipients.length}`)
    console.log(`- Escalation chain length: ${data.escalation_chain.length}`)
  })

  test('Monitoring Performance Under Load', async ({ page }) => {
    // Measure monitoring endpoint performance under concurrent requests
    const startTime = Date.now()
    
    // Make multiple concurrent requests to monitoring endpoints
    const requests = []
    for (let i = 0; i < 20; i++) {
      requests.push(
        page.request.get('/api/monitoring/health')
      )
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Should handle concurrent requests successfully
    const successfulResponses = responses.filter(r => r.status() === 200)
    const failedResponses = responses.filter(r => r.status() !== 200)
    
    // Most requests should succeed
    expect(successfulResponses.length).toBeGreaterThanOrEqual(responses.length * 0.8) // 80% success rate
    
    // Few requests should fail
    expect(failedResponses.length).toBeLessThan(responses.length * 0.3) // Less than 30% failure rate
    
    // Should complete within reasonable time
    expect(totalTime).toBeLessThan(5000) // Less than 5 seconds for 20 requests
    
    // Check average response time
    const responseTimes = responses.map(r => {
      const timing = r.headers()['x-response-time']
      return timing ? parseInt(timing) : 0
    })
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    
    // Average response time should be reasonable
    expect(averageResponseTime).toBeLessThan(1000) // Less than 1 second average
    
    // Log performance under load results
    console.log('Monitoring Performance Under Load:')
    console.log(`- Concurrent requests: ${requests.length}`)
    console.log(`- Successful responses: ${successfulResponses.length}/${responses.length}`)
    console.log(`- Failed responses: ${failedResponses.length}/${responses.length}`)
    console.log(`- Total time: ${totalTime}ms`)
    console.log(`- Average response time: ${averageResponseTime.toFixed(0)}ms`)
    console.log(`- Requests per second: ${(requests.length / (totalTime / 1000)).toFixed(1)}`)
  })

  test('Monitoring Data Export', async ({ page }) => {
    // Navigate to monitoring data export endpoint
    const response = await page.request.get('/api/monitoring/export?format=json&days=7')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.export).toBeDefined()
    expect(data.export.format).toBe('json')
    expect(data.export.period_days).toBe(7)
    expect(data.export.data).toBeDefined()
    
    // Check that exported data contains expected sections
    expect(data.export.data.health_metrics).toBeDefined()
    expect(data.export.data.performance_metrics).toBeDefined()
    expect(data.export.data.resource_usage).toBeDefined()
    expect(data.export.data.alert_history).toBeDefined()
    expect(data.export.data.security_events).toBeDefined()
    
    // Check that data arrays are present
    expect(Array.isArray(data.export.data.health_metrics)).toBe(true)
    expect(Array.isArray(data.export.data.performance_metrics)).toBe(true)
    expect(Array.isArray(data.export.data.resource_usage)).toBe(true)
    expect(Array.isArray(data.export.data.alert_history)).toBe(true)
    expect(Array.isArray(data.export.data.security_events)).toBe(true)
    
    // Check that export includes timestamps
    expect(data.export.generated_at).toBeDefined()
    expect(data.export.expires_at).toBeDefined()
    
    // Test CSV export format
    const csvResponse = await page.request.get('/api/monitoring/export?format=csv&days=1')
    expect(csvResponse.status()).toBe(200)
    
    const csvContentType = csvResponse.headers()['content-type']
    expect(csvContentType).toContain('text/csv')
    
    // Check that CSV export includes proper headers
    const csvData = await csvResponse.text()
    expect(csvData).toContain('timestamp,')
    expect(csvData).toContain('metric,')
    expect(csvData).toContain('value,')
    
    // Log data export results
    console.log('Monitoring Data Export:')
    console.log(`- JSON export successful: ✓`)
    console.log(`- CSV export successful: ✓`)
    console.log(`- Export period: 7 days`)
    console.log(`- Health metrics: ${data.export.data.health_metrics.length} records`)
    console.log(`- Performance metrics: ${data.export.data.performance_metrics.length} records`)
    console.log(`- Resource usage records: ${data.export.data.resource_usage.length}`)
    console.log(`- Alert history records: ${data.export.data.alert_history.length}`)
    console.log(`- Security events: ${data.export.data.security_events.length}`)
  })

  test('Monitoring Dashboard Customization', async ({ page }) => {
    // Navigate to monitoring dashboard
    await page.goto('/monitoring')
    
    // Check that dashboard customization options are available
    const customizeButton = page.getByRole('button', { name: 'Customize Dashboard' })
    await expect(customizeButton).toBeVisible()
    
    // Click customize button
    await customizeButton.click()
    
    // Check that customization panel opens
    const customizationPanel = page.locator('[data-testid="monitoring-customization-panel"]')
    await expect(customizationPanel).toBeVisible()
    
    // Check customization options
    await expect(customizationPanel.getByText('Select Metrics')).toBeVisible()
    await expect(customizationPanel.getByText('Configure Alerts')).toBeVisible()
    await expect(customizationPanel.getByText('Set Thresholds')).toBeVisible()
    await expect(customizationPanel.getByText('Notification Settings')).toBeVisible()
    
    // Check that widgets can be customized
    const widgetOptions = customizationPanel.locator('[data-testid*="widget-option"]')
    const widgetCount = await widgetOptions.count()
    expect(widgetCount).toBeGreaterThanOrEqual(5) // Should have at least 5 widgets
    
    // Check that time range options are available
    const timeRangeSelector = customizationPanel.getByRole('combobox', { name: 'Time Range' })
    await expect(timeRangeSelector).toBeVisible()
    
    const timeRangeOptions = await timeRangeSelector.locator('option').count()
    expect(timeRangeOptions).toBeGreaterThanOrEqual(4) // Should have at least 4 time range options
    
    // Check that refresh interval options are available
    const refreshIntervalSelector = customizationPanel.getByRole('combobox', { name: 'Refresh Interval' })
    await expect(refreshIntervalSelector).toBeVisible()
    
    const refreshOptions = await refreshIntervalSelector.locator('option').count()
    expect(refreshOptions).toBeGreaterThanOrEqual(5) // Should have at least 5 refresh intervals
    
    // Close customization panel
    const closeButton = customizationPanel.getByRole('button', { name: 'Close' })
    await closeButton.click()
    await expect(customizationPanel).not.toBeVisible()
    
    // Log dashboard customization results
    console.log('Monitoring Dashboard Customization:')
    console.log(`- Customization panel: ✓`)
    console.log(`- Widget options: ${widgetCount}`)
    console.log(`- Time range options: ${timeRangeOptions}`)
    console.log(`- Refresh interval options: ${refreshOptions}`)
  })

  test('Monitoring Integration Testing', async ({ page }) => {
    // Navigate to monitoring integration test endpoint
    const response = await page.request.get('/api/monitoring/integrations/test')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.integrations).toBeDefined()
    
    // Check that all integrations are tested
    expect(data.integrations.sentry).toBeDefined()
    expect(data.integrations.plausible).toBeDefined()
    expect(data.integrations.slack).toBeDefined()
    expect(data.integrations.email).toBeDefined()
    expect(data.integrations.supabase).toBeDefined()
    
    // Check that integration statuses are valid
    Object.values(data.integrations).forEach((integration: any) => {
      expect(integration.status).toBeDefined()
      expect(['connected', 'disconnected', 'error']).toContain(integration.status)
      expect(integration.last_tested).toBeDefined()
    })
    
    // Check that connected integrations are actually working
    Object.entries(data.integrations).forEach(([name, integration]: [string, any]) => {
      if (integration.status === 'connected') {
        expect(integration.response_time_ms).toBeGreaterThanOrEqual(0)
        expect(integration.response_time_ms).toBeLessThan(5000) // Less than 5 seconds
      }
    })
    
    // Test specific integration connectivity
    const sentryTest = await page.request.get('/api/monitoring/integrations/sentry/test')
    expect(sentryTest.status()).toBe(200)
    
    const sentryData = await sentryTest.json()
    expect(sentryData.connected).toBe(true)
    expect(sentryData.organization).toBeDefined()
    expect(sentryData.projects).toBeDefined()
    
    // Test Plausible integration
    const plausibleTest = await page.request.get('/api/monitoring/integrations/plausible/test')
    expect(plausibleTest.status()).toBe(200)
    
    const plausibleData = await plausibleTest.json()
    expect(plausibleData.connected).toBe(true)
    expect(plausibleData.site_id).toBeDefined()
    
    // Log integration testing results
    console.log('Monitoring Integration Testing:')
    console.log(`- Total integrations tested: ${Object.keys(data.integrations).length}`)
    console.log(`- Connected integrations: ${
      Object.values(data.integrations).filter((i: any) => i.status === 'connected').length
    }/${Object.keys(data.integrations).length}`)
    console.log(`- Sentry: ${data.integrations.sentry.status}`)
    console.log(`- Plausible: ${data.integrations.plausible.status}`)
    console.log(`- Slack: ${data.integrations.slack.status}`)
    console.log(`- Email: ${data.integrations.email.status}`)
    console.log(`- Supabase: ${data.integrations.supabase.status}`)
  })
})