import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Activity, 
  TrendingUp, 
  CheckCircle,
  BarChart3,
  Loader2 
} from 'lucide-react'
import { fetchAdminAnalytics } from '@/lib/analytics/queries'
import { StatsCard } from '@/components/admin/StatsCard'
import { ToolUsageChart } from '@/components/admin/ToolUsageChart'
import { RetentionChart } from '@/components/admin/RetentionChart'
import { ConversionFunnel } from '@/components/admin/ConversionFunnel'

/**
 * Admin Analytics Page
 * 
 * Provides comprehensive analytics dashboard for admin users including:
 * - General statistics (DAU, total usage, success rate)
 * - Tool-based usage charts
 * - User retention metrics
 * - Conversion funnel analysis
 * 
 * Requirements: 9.2, 9.3, 9.7
 */

interface AnalyticsData {
  totalUsers: number
  dailyActiveUsers: number
  totalUsage: number
  successRate: number
  conversionRate: number
  revenue: number
  toolUsage: Array<{
    toolName: string
    count: number
    percentage: number
  }>
  retentionData: Array<{
    day: number
    percentage: number
  }>
  conversionFunnel: Array<{
    stage: string
    count: number
    percentage: number
  }>
  dailyActiveUsersChart: Array<{
    date: string
    active_users: number
  }>
  processingTimeStats: Array<{
    tool_name: string
    avg_processing_time_ms: number
    total_operations: number
  }>
  successRateStats: Array<{
    tool_name: string
    success_rate: number
    total_operations: number
  }>
}

async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Check if user has admin role in user_metadata
  // For now, we'll use user metadata to determine admin access
  // In production, you might want to add a role column to profiles table
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'admin@designkit.com'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }
  
  return user
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    const data = await fetchAdminAnalytics(30)
    return data
  } catch (error) {
    console.error('Error fetching analytics:', error)
    throw new Error('Failed to load analytics data')
  }
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  // Check admin access first
  await checkAdminAccess()
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Analytics</h1>
        <p className="text-muted-foreground">
          Monitor platform performance, user engagement, and conversion metrics
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  )
}

async function AnalyticsContent() {
  const analyticsData = await getAnalyticsData()

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tools">Tool Usage</TabsTrigger>
        <TabsTrigger value="retention">Retention</TabsTrigger>
        <TabsTrigger value="funnel">Conversion</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={analyticsData.totalUsers.toLocaleString()}
            icon={<Users className="h-4 w-4" />}
            change="Registered users"
          />
          <StatsCard
            title="Daily Active Users"
            value={analyticsData.dailyActiveUsers.toLocaleString()}
            icon={<Activity className="h-4 w-4" />}
            change="Active today"
          />
          <StatsCard
            title="Total Usage"
            value={analyticsData.totalUsage.toLocaleString()}
            icon={<TrendingUp className="h-4 w-4" />}
            change="API operations (30 days)"
          />
          <StatsCard
            title="Success Rate"
            value={`${analyticsData.successRate.toFixed(1)}%`}
            icon={<CheckCircle className="h-4 w-4" />}
            change="Successful operations"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tool Usage Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.toolUsage.slice(0, 5).map((tool) => (
                  <div key={tool.toolName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {tool.toolName.replace('-', ' ')}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {tool.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <span className="text-sm font-semibold">{tool.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion & Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-sm font-semibold">
                    {analyticsData.conversionRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Revenue</span>
                  <span className="text-sm font-semibold">
                    ${analyticsData.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Processing Time</span>
                  <span className="text-sm font-semibold">
                    {analyticsData.processingTimeStats.length > 0 
                      ? `${(analyticsData.processingTimeStats.reduce((sum, stat) => sum + stat.avg_processing_time_ms, 0) / analyticsData.processingTimeStats.length / 1000).toFixed(1)}s`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Processing Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.processingTimeStats.slice(0, 5).map((stat) => (
                  <div key={stat.tool_name} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {stat.tool_name.replace('-', ' ')}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {(stat.avg_processing_time_ms / 1000).toFixed(1)}s
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stat.total_operations} ops
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success Rates by Tool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.successRateStats.slice(0, 5).map((stat) => (
                  <div key={stat.tool_name} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {stat.tool_name.replace('-', ' ')}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {stat.success_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stat.total_operations} ops
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="tools" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tool Usage Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ToolUsageChart data={analyticsData.toolUsage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Daily active users chart</p>
                <p className="text-sm">
                  {analyticsData.dailyActiveUsersChart.length} data points available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="retention" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Retention Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <RetentionChart data={analyticsData.retentionData} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="funnel" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversionFunnel data={analyticsData.conversionFunnel} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}