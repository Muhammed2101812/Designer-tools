'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserClient } from '@/lib/supabase/client'
import { Loader2, TrendingUp, Activity, Zap, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface EventCount {
  event_category: string
  event_count: number
}

interface TopTool {
  tool_name: string
  usage_count: number
  last_used: string
}

interface ToolMetrics {
  metric: string
  value: number
}

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [eventCounts, setEventCounts] = useState<EventCount[]>([])
  const [topTools, setTopTools] = useState<TopTool[]>([])
  const [totalEvents, setTotalEvents] = useState(0)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get event counts by category
      const { data: counts } = await supabase.rpc('get_user_event_counts', {
        p_user_id: user.id,
        p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString(),
      })

      if (counts) {
        setEventCounts(counts as EventCount[])
        setTotalEvents(counts.reduce((sum: number, c: EventCount) => sum + c.event_count, 0))
      }

      // Get top tools
      const { data: tools } = await supabase.rpc('get_user_top_tools', {
        p_user_id: user.id,
        p_limit: 5,
      })

      if (tools) {
        setTopTools(tools as TopTool[])
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Prepare data for charts
  const categoryData = eventCounts.map((ec) => ({
    name: ec.event_category.charAt(0).toUpperCase() + ec.event_category.slice(1),
    value: ec.event_count,
  }))

  const toolsData = topTools.map((t) => ({
    name: t.tool_name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    count: t.usage_count,
  }))

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">Events in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tools Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topTools.length}</div>
            <p className="text-xs text-muted-foreground">Different tools accessed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topTools[0]?.tool_name
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')}
            </div>
            <p className="text-xs text-muted-foreground">
              {topTools[0]?.usage_count} times
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topTools[0]?.last_used
                ? new Date(topTools[0].last_used).toLocaleDateString()
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Recent tool usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Activity by Category</CardTitle>
            <CardDescription>Distribution of your activity types</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No activity data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Tools</CardTitle>
            <CardDescription>Your favorite tools in last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {toolsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toolsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No tool usage data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tools List */}
      {topTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tool Usage Details</CardTitle>
            <CardDescription>Detailed breakdown of your tool usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTools.map((tool, index) => (
                <div
                  key={tool.tool_name}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tool.tool_name
                          .split('-')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last used:{' '}
                        {new Date(tool.last_used).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{tool.usage_count}</p>
                    <p className="text-xs text-muted-foreground">uses</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
