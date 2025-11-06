/**
 * Analytics Query Functions
 * 
 * This module provides functions to query analytics data from the database.
 * All functions use Supabase admin client to bypass RLS for analytics purposes.
 * 
 * Requirements covered:
 * - 9.3: En çok kullanılan araçları getiren query
 * - 9.4: Günlük aktif kullanıcı sayısını hesaplayan query
 * - 9.5: Ortalama işlem süresini hesaplayan query
 * - 9.6: Başarı oranını hesaplayan query
 * - 9.6: Retention metriklerini hesaplayan query
 */

import { createAdminClient } from '@/lib/supabase/server'

// Types for analytics data
export interface ToolUsageStats {
  tool_name: string
  usage_count: number
  success_rate: number
  avg_processing_time_ms: number | null
  avg_file_size_mb: number | null
}

export interface DailyActiveUsers {
  date: string
  active_users: number
}

export interface ProcessingTimeStats {
  tool_name: string
  avg_processing_time_ms: number
  min_processing_time_ms: number
  max_processing_time_ms: number
  total_operations: number
}

export interface SuccessRateStats {
  tool_name: string
  total_operations: number
  successful_operations: number
  success_rate: number
}

export interface RetentionMetrics {
  period: '7_day' | '30_day'
  cohort_date: string
  total_users: number
  retained_users: number
  retention_rate: number
}

export interface ConversionFunnelStats {
  total_signups: number
  users_with_first_tool_use: number
  users_with_subscription: number
  signup_to_first_use_rate: number
  first_use_to_subscription_rate: number
  overall_conversion_rate: number
}

/**
 * Get most used tools with comprehensive statistics
 * 
 * @param days Number of days to look back (default: 30)
 * @param limit Maximum number of tools to return (default: 10)
 * @returns Array of tool usage statistics
 */
export async function getMostUsedTools(
  days: number = 30,
  limit: number = 10
): Promise<ToolUsageStats[]> {
  const supabase = createAdminClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('tool_usage')
    .select('tool_name, success, processing_time_ms, file_size_mb')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(`Failed to fetch tool usage data: ${error.message}`)
  }
  
  // Group and calculate statistics
  const toolStats = new Map<string, {
    total: number
    successful: number
    processingTimes: number[]
    fileSizes: number[]
  }>()
  
  data.forEach(usage => {
    const stats = toolStats.get(usage.tool_name) || {
      total: 0,
      successful: 0,
      processingTimes: [],
      fileSizes: []
    }
    
    stats.total++
    if (usage.success) stats.successful++
    if (usage.processing_time_ms) stats.processingTimes.push(usage.processing_time_ms)
    if (usage.file_size_mb) stats.fileSizes.push(usage.file_size_mb)
    
    toolStats.set(usage.tool_name, stats)
  })
  
  // Convert to result format and sort by usage count
  const results: ToolUsageStats[] = Array.from(toolStats.entries())
    .map(([tool_name, stats]) => ({
      tool_name,
      usage_count: stats.total,
      success_rate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      avg_processing_time_ms: stats.processingTimes.length > 0 
        ? stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length 
        : null,
      avg_file_size_mb: stats.fileSizes.length > 0
        ? stats.fileSizes.reduce((a, b) => a + b, 0) / stats.fileSizes.length
        : null
    }))
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, limit)
  
  return results
}

/**
 * Get daily active users count for a date range
 * 
 * @param days Number of days to look back (default: 30)
 * @returns Array of daily active user counts
 */
export async function getDailyActiveUsers(days: number = 30): Promise<DailyActiveUsers[]> {
  const supabase = createAdminClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Note: get_daily_active_users RPC function doesn't exist yet
  // Fall back to manual query for now
  const { data: toolUsageData, error } = await supabase
    .from('tool_usage')
    .select('user_id, created_at')
    .gte('created_at', startDate.toISOString())
    .not('user_id', 'is', null)
  
  if (error) {
    throw new Error(`Failed to fetch daily active users: ${error.message}`)
  }
  
  // Group by date and count unique users
  const dailyUsers = new Map<string, Set<string>>()
  
  toolUsageData.forEach(usage => {
    const date = usage.created_at.split('T')[0]
    if (!dailyUsers.has(date)) {
      dailyUsers.set(date, new Set())
    }
    if (usage.user_id) {
      dailyUsers.get(date)!.add(usage.user_id)
    }
  })
  
  return Array.from(dailyUsers.entries())
    .map(([date, users]) => ({
      date,
      active_users: users.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get average processing time statistics by tool
 * 
 * @param days Number of days to look back (default: 30)
 * @returns Array of processing time statistics
 */
export async function getProcessingTimeStats(days: number = 30): Promise<ProcessingTimeStats[]> {
  const supabase = createAdminClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('tool_usage')
    .select('tool_name, processing_time_ms')
    .gte('created_at', startDate.toISOString())
    .not('processing_time_ms', 'is', null)
    .eq('success', true)
  
  if (error) {
    throw new Error(`Failed to fetch processing time data: ${error.message}`)
  }
  
  // Group by tool and calculate statistics
  const toolStats = new Map<string, number[]>()
  
  data.forEach(usage => {
    if (!toolStats.has(usage.tool_name)) {
      toolStats.set(usage.tool_name, [])
    }
    if (usage.processing_time_ms !== null) {
      toolStats.get(usage.tool_name)!.push(usage.processing_time_ms)
    }
  })
  
  return Array.from(toolStats.entries())
    .map(([tool_name, times]) => ({
      tool_name,
      avg_processing_time_ms: times.reduce((a, b) => a + b, 0) / times.length,
      min_processing_time_ms: Math.min(...times),
      max_processing_time_ms: Math.max(...times),
      total_operations: times.length
    }))
    .sort((a, b) => b.total_operations - a.total_operations)
}

/**
 * Get success rate statistics by tool
 * 
 * @param days Number of days to look back (default: 30)
 * @returns Array of success rate statistics
 */
export async function getSuccessRateStats(days: number = 30): Promise<SuccessRateStats[]> {
  const supabase = createAdminClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('tool_usage')
    .select('tool_name, success')
    .gte('created_at', startDate.toISOString())
  
  if (error) {
    throw new Error(`Failed to fetch success rate data: ${error.message}`)
  }
  
  // Group by tool and calculate success rates
  const toolStats = new Map<string, { total: number; successful: number }>()
  
  data.forEach(usage => {
    const stats = toolStats.get(usage.tool_name) || { total: 0, successful: 0 }
    stats.total++
    if (usage.success) stats.successful++
    toolStats.set(usage.tool_name, stats)
  })
  
  return Array.from(toolStats.entries())
    .map(([tool_name, stats]) => ({
      tool_name,
      total_operations: stats.total,
      successful_operations: stats.successful,
      success_rate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.total_operations - a.total_operations)
}

/**
 * Get user retention metrics
 * 
 * @param cohortDays Number of days to look back for cohorts (default: 90)
 * @returns Array of retention metrics for 7-day and 30-day periods
 */
export async function getRetentionMetrics(cohortDays: number = 90): Promise<RetentionMetrics[]> {
  const supabase = createAdminClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - cohortDays)
  
  // Get user first activity dates (signup cohorts)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, created_at')
    .gte('created_at', startDate.toISOString())
  
  if (profilesError) {
    throw new Error(`Failed to fetch user profiles: ${profilesError.message}`)
  }
  
  // Get all tool usage for retention analysis
  const { data: toolUsage, error: usageError } = await supabase
    .from('tool_usage')
    .select('user_id, created_at')
    .gte('created_at', startDate.toISOString())
    .not('user_id', 'is', null)
  
  if (usageError) {
    throw new Error(`Failed to fetch tool usage for retention: ${usageError.message}`)
  }
  
  // Group usage by user and date
  const userActivity = new Map<string, Date[]>()
  toolUsage.forEach(usage => {
    if (usage.user_id) {
      if (!userActivity.has(usage.user_id)) {
        userActivity.set(usage.user_id, [])
      }
      userActivity.get(usage.user_id)!.push(new Date(usage.created_at))
    }
  })
  
  const results: RetentionMetrics[] = []
  
  // Calculate retention for each cohort week
  const cohortWeeks = new Map<string, { signupDate: Date; userId: string }[]>()
  
  profiles.forEach(profile => {
    const signupDate = new Date(profile.created_at)
    const weekStart = new Date(signupDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!cohortWeeks.has(weekKey)) {
      cohortWeeks.set(weekKey, [])
    }
    cohortWeeks.get(weekKey)!.push({ signupDate, userId: profile.id })
  })
  
  // Calculate 7-day and 30-day retention for each cohort
  for (const [weekKey, cohortUsers] of cohortWeeks.entries()) {
    const cohortDate = new Date(weekKey)
    
    // 7-day retention
    const sevenDayRetention = cohortUsers.filter(user => {
      const userActivities = userActivity.get(user.userId) || []
      const retentionWindow = new Date(user.signupDate)
      retentionWindow.setDate(retentionWindow.getDate() + 7)
      
      return userActivities.some(activity => 
        activity > user.signupDate && activity <= retentionWindow
      )
    })
    
    results.push({
      period: '7_day',
      cohort_date: weekKey,
      total_users: cohortUsers.length,
      retained_users: sevenDayRetention.length,
      retention_rate: cohortUsers.length > 0 ? (sevenDayRetention.length / cohortUsers.length) * 100 : 0
    })
    
    // 30-day retention (only for cohorts old enough)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    if (cohortDate <= thirtyDaysAgo) {
      const thirtyDayRetention = cohortUsers.filter(user => {
        const userActivities = userActivity.get(user.userId) || []
        const retentionWindow = new Date(user.signupDate)
        retentionWindow.setDate(retentionWindow.getDate() + 30)
        
        return userActivities.some(activity => 
          activity > user.signupDate && activity <= retentionWindow
        )
      })
      
      results.push({
        period: '30_day',
        cohort_date: weekKey,
        total_users: cohortUsers.length,
        retained_users: thirtyDayRetention.length,
        retention_rate: cohortUsers.length > 0 ? (thirtyDayRetention.length / cohortUsers.length) * 100 : 0
      })
    }
  }
  
  return results.sort((a, b) => a.cohort_date.localeCompare(b.cohort_date))
}

/**
 * Get conversion funnel statistics (signup → first tool use → subscription)
 * 
 * @param days Number of days to look back (default: 30)
 * @returns Conversion funnel statistics
 */
export async function getConversionFunnelStats(days: number = 30): Promise<ConversionFunnelStats> {
  const supabase = createAdminClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get total signups in period
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, created_at')
    .gte('created_at', startDate.toISOString())
  
  if (profilesError) {
    throw new Error(`Failed to fetch signups: ${profilesError.message}`)
  }
  
  const totalSignups = profiles.length
  const userIds = profiles.map(p => p.id)
  
  if (userIds.length === 0) {
    return {
      total_signups: 0,
      users_with_first_tool_use: 0,
      users_with_subscription: 0,
      signup_to_first_use_rate: 0,
      first_use_to_subscription_rate: 0,
      overall_conversion_rate: 0
    }
  }
  
  // Get users who used at least one tool
  const { data: toolUsers, error: toolError } = await supabase
    .from('tool_usage')
    .select('user_id')
    .in('user_id', userIds)
    .gte('created_at', startDate.toISOString())
  
  if (toolError) {
    throw new Error(`Failed to fetch tool usage: ${toolError.message}`)
  }
  
  const uniqueToolUsers = new Set(toolUsers.map(u => u.user_id)).size
  
  // Get users with active subscriptions
  const { data: subscribers, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .in('user_id', userIds)
    .eq('status', 'active')
  
  if (subError) {
    throw new Error(`Failed to fetch subscriptions: ${subError.message}`)
  }
  
  const totalSubscribers = subscribers.length
  
  return {
    total_signups: totalSignups,
    users_with_first_tool_use: uniqueToolUsers,
    users_with_subscription: totalSubscribers,
    signup_to_first_use_rate: totalSignups > 0 ? (uniqueToolUsers / totalSignups) * 100 : 0,
    first_use_to_subscription_rate: uniqueToolUsers > 0 ? (totalSubscribers / uniqueToolUsers) * 100 : 0,
    overall_conversion_rate: totalSignups > 0 ? (totalSubscribers / totalSignups) * 100 : 0
  }
}

/**
 * Get tool usage statistics for a specific date range
 * 
 * @param startDate Start date for the range
 * @param endDate End date for the range
 * @param toolName Optional tool name filter
 * @returns Array of daily usage counts
 */
export async function getToolUsageByDateRange(
  startDate: Date,
  endDate: Date,
  toolName?: string
): Promise<{ date: string; usage_count: number }[]> {
  const supabase = createAdminClient()
  
  let query = supabase
    .from('tool_usage')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  
  if (toolName) {
    query = query.eq('tool_name', toolName)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch tool usage by date range: ${error.message}`)
  }
  
  // Group by date
  const dailyUsage = new Map<string, number>()
  
  data.forEach(usage => {
    const date = usage.created_at.split('T')[0]
    dailyUsage.set(date, (dailyUsage.get(date) || 0) + 1)
  })
  
  // Fill in missing dates with 0 usage
  const results: { date: string; usage_count: number }[] = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    results.push({
      date: dateStr,
      usage_count: dailyUsage.get(dateStr) || 0
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return results
}

/**
 * Get comprehensive analytics summary
 * 
 * @param days Number of days to look back (default: 30)
 * @returns Complete analytics summary
 */
export async function getAnalyticsSummary(days: number = 30) {
  const [
    mostUsedTools,
    dailyActiveUsers,
    processingTimeStats,
    successRateStats,
    retentionMetrics,
    conversionFunnel
  ] = await Promise.all([
    getMostUsedTools(days, 5),
    getDailyActiveUsers(days),
    getProcessingTimeStats(days),
    getSuccessRateStats(days),
    getRetentionMetrics(90), // Longer period for retention
    getConversionFunnelStats(days)
  ])
  
  return {
    mostUsedTools,
    dailyActiveUsers,
    processingTimeStats,
    successRateStats,
    retentionMetrics,
    conversionFunnel,
    period: {
      days,
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  }
}

/**
 * Fetch admin analytics data for the admin dashboard
 * This function aggregates all analytics data needed for the admin interface
 * 
 * @param days Number of days to look back (default: 30)
 * @returns Formatted analytics data for admin dashboard
 */
export async function fetchAdminAnalytics(days: number = 30) {
  const supabase = createAdminClient()
  
  try {
    // Get comprehensive analytics summary
    const summary = await getAnalyticsSummary(days)
    
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // Calculate current DAU (today)
    const today = new Date().toISOString().split('T')[0]
    const todayDAU = summary.dailyActiveUsers.find(d => d.date === today)?.active_users || 0
    
    // Calculate total usage across all tools
    const totalUsage = summary.mostUsedTools.reduce((sum, tool) => sum + tool.usage_count, 0)
    
    // Calculate overall success rate
    const overallSuccessRate = summary.successRateStats.length > 0
      ? summary.successRateStats.reduce((sum, tool) => sum + tool.success_rate, 0) / summary.successRateStats.length
      : 0
    
    // Format tool usage data for charts
    const toolUsage = summary.mostUsedTools.map(tool => ({
      toolName: tool.tool_name,
      count: tool.usage_count,
      percentage: totalUsage > 0 ? (tool.usage_count / totalUsage) * 100 : 0
    }))
    
    // Format retention data (7-day retention percentages)
    const retentionData = summary.retentionMetrics
      .filter(r => r.period === '7_day')
      .slice(-7) // Last 7 cohorts
      .map((retention, index) => ({
        day: index + 1,
        percentage: retention.retention_rate
      }))
    
    // Format conversion funnel data
    const conversionFunnel = [
      {
        stage: 'Signups',
        count: summary.conversionFunnel.total_signups,
        percentage: 100
      },
      {
        stage: 'First Tool Use',
        count: summary.conversionFunnel.users_with_first_tool_use,
        percentage: summary.conversionFunnel.signup_to_first_use_rate
      },
      {
        stage: 'Subscription',
        count: summary.conversionFunnel.users_with_subscription,
        percentage: summary.conversionFunnel.overall_conversion_rate
      }
    ]
    
    // Calculate estimated revenue (simplified calculation)
    // Assuming Premium = $9/month, Pro = $29/month
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('status', 'active')
    
    const revenue = subscriptions?.reduce((sum, sub) => {
      if (sub.plan === 'premium') return sum + 9
      if (sub.plan === 'pro') return sum + 29
      return sum
    }, 0) || 0
    
    return {
      totalUsers: totalUsers || 0,
      dailyActiveUsers: todayDAU,
      totalUsage,
      successRate: overallSuccessRate,
      conversionRate: summary.conversionFunnel.overall_conversion_rate,
      revenue,
      toolUsage,
      retentionData,
      conversionFunnel,
      // Additional detailed data
      dailyActiveUsersChart: summary.dailyActiveUsers,
      processingTimeStats: summary.processingTimeStats,
      successRateStats: summary.successRateStats,
      retentionMetrics: summary.retentionMetrics
    }
  } catch (error) {
    console.error('Error fetching admin analytics:', error)
    throw new Error('Failed to fetch analytics data')
  }
}