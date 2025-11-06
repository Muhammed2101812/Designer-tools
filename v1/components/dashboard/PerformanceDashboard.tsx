'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  getPerformanceDashboard, 
  type PerformanceReport, 
  type PerformanceTrend 
} from '@/lib/utils/performance-dashboard'
import { 
  getPerformanceAlertManager, 
  type StoredAlert 
} from '@/lib/utils/performance-alerts'
import { 
  getCoreWebVitalsMonitor,
  type CoreWebVitals,
  DEFAULT_THRESHOLDS
} from '@/lib/utils/core-web-vitals'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  Minus 
} from 'lucide-react'

export function PerformanceDashboard() {
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [currentMetrics, setCurrentMetrics] = useState<CoreWebVitals | null>(null)
  const [alerts, setAlerts] = useState<StoredAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = () => {
    setIsLoading(true)
    
    try {
      // Get dashboard data
      const dashboard = getPerformanceDashboard()
      if (dashboard) {
        const newReport = dashboard.generateReport(7) // Last 7 days
        setReport(newReport)
      }

      // Get current metrics
      const monitor = getCoreWebVitalsMonitor()
      if (monitor) {
        setCurrentMetrics(monitor.getMetrics())
      }

      // Get alerts
      const alertManager = getPerformanceAlertManager()
      if (alertManager) {
        setAlerts(alertManager.getStoredAlerts())
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const exportData = () => {
    const dashboard = getPerformanceDashboard()
    if (dashboard) {
      const data = dashboard.exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const clearData = () => {
    const dashboard = getPerformanceDashboard()
    const alertManager = getPerformanceAlertManager()
    
    if (dashboard) dashboard.clearData()
    if (alertManager) alertManager.clearAlerts()
    
    loadData()
  }

  const getMetricStatus = (value: number | null, metric: keyof CoreWebVitals) => {
    if (value === null || metric === 'timestamp') return 'unknown'
    
    const thresholds = DEFAULT_THRESHOLDS[metric]
    if (!thresholds) return 'unknown'
    
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return <Badge variant="default" className="bg-green-100 text-green-800">Good</Badge>
      case 'needs-improvement': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Needs Improvement</Badge>
      case 'poor': return <Badge variant="destructive">Poor</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="h-4 w-4 text-green-600" />
      case 'degrading': return <TrendingUp className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading performance data...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor Core Web Vitals and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" onClick={clearData}>
            Clear Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Current Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {report && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.summary.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {report.summary.averageLoadTime.toFixed(0)}ms
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average across all pages
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.summary.alertCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Performance issues detected
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Worst Metric</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {report.summary.worstMetric.metric.toUpperCase()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {report.summary.worstMetric.value.toFixed(0)}ms average
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {currentMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(currentMetrics).map(([key, value]) => {
                if (key === 'timestamp' || value === null) return null
                
                const metric = key as keyof CoreWebVitals
                const status = getMetricStatus(value, metric)
                const thresholds = DEFAULT_THRESHOLDS[metric]
                
                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        {metric.toUpperCase()}
                        {getStatusBadge(status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${getStatusColor(status)}`}>
                        {value.toFixed(metric === 'cls' ? 3 : 0)}
                        {metric === 'cls' ? '' : 'ms'}
                      </div>
                      {thresholds && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Good: ≤{thresholds.good}{metric === 'cls' ? '' : 'ms'}</span>
                            <span>Poor: &gt;{thresholds.poor}{metric === 'cls' ? '' : 'ms'}</span>
                          </div>
                          <Progress 
                            value={Math.min((value / thresholds.poor) * 100, 100)} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {report && report.trends.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {report.trends.map((trend: PerformanceTrend) => (
                <Card key={trend.metric}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {trend.metric.toUpperCase()}
                      {getTrendIcon(trend.trend)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {trend.average.toFixed(trend.metric === 'cls' ? 3 : 0)}
                      {trend.metric === 'cls' ? '' : 'ms'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trend.trend} ({trend.changePercent.toFixed(1)}% change)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {trend.values.length} data points
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Performance Alerts</h3>
                    <p className="text-muted-foreground">
                      All metrics are within acceptable thresholds
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span>{alert.metric.toUpperCase()} Alert</span>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {new Date(alert.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Value: <strong>{alert.value.toFixed(2)}{alert.metric === 'cls' ? '' : 'ms'}</strong>
                    </p>
                    <p className="text-sm">
                      Threshold: <strong>{alert.threshold}{alert.metric === 'cls' ? '' : 'ms'}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      URL: {alert.url}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}