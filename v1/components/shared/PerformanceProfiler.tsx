/**
 * Performance Profiler Component
 * Provides real-time performance monitoring and profiling for React components
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  X,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { getLongTaskMonitor, useLongTaskMonitor, type LongTask } from '@/lib/utils/longTaskMonitor'
import { getCoreWebVitalsMonitor } from '@/lib/utils/core-web-vitals'
import { cn } from '@/lib/utils/cn'

interface PerformanceProfilerProps {
  /**
   * Whether to show the profiler (typically only in development)
   */
  enabled?: boolean
  
  /**
   * Position of the profiler on screen
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  
  /**
   * Whether to start minimized
   */
  minimized?: boolean
  
  /**
   * Custom className for styling
   */
  className?: string
}

export function PerformanceProfiler({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  minimized: initialMinimized = true,
  className
}: PerformanceProfilerProps) {
  const [isMinimized, setIsMinimized] = React.useState(initialMinimized)
  const [recentTasks, setRecentTasks] = React.useState<LongTask[]>([])
  const { stats, measure } = useLongTaskMonitor()
  
  // Get Core Web Vitals
  const [webVitals, setWebVitals] = React.useState<{
    lcp: number | null
    fid: number | null
    cls: number | null
  }>({ lcp: null, fid: null, cls: null })
  
  React.useEffect(() => {
    const monitor = getCoreWebVitalsMonitor()
    if (monitor) {
      const metrics = monitor.getMetrics()
      setWebVitals({
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls
      })
    }
  }, [])
  
  // Update recent tasks
  React.useEffect(() => {
    const monitor = getLongTaskMonitor()
    const cleanup = monitor.onLongTask((task) => {
      setRecentTasks(prev => [task, ...prev.slice(0, 4)]) // Keep last 5 tasks
    })
    
    return cleanup
  }, [])
  
  if (!enabled) {
    return null
  }
  
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
      default:
        return 'bottom-4 right-4'
    }
  }
  
  const getMetricStatus = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'unknown'
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.poor) return 'needs-improvement'
    return 'poor'
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'needs-improvement':
        return 'text-yellow-600'
      case 'poor':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }
  
  const lcpStatus = getMetricStatus(webVitals.lcp, { good: 2500, poor: 4000 })
  const fidStatus = getMetricStatus(webVitals.fid, { good: 100, poor: 300 })
  const clsStatus = getMetricStatus(webVitals.cls, { good: 0.1, poor: 0.25 })
  
  return (
    <div 
      className={cn(
        'fixed z-50 max-w-sm',
        getPositionClasses(),
        className
      )}
    >
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="space-y-3">
            {/* Core Web Vitals */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Core Web Vitals</h4>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getStatusIcon(lcpStatus)}
                    <span className="font-medium">LCP</span>
                  </div>
                  <div className={getStatusColor(lcpStatus)}>
                    {webVitals.lcp ? `${webVitals.lcp.toFixed(0)}ms` : 'N/A'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getStatusIcon(fidStatus)}
                    <span className="font-medium">FID</span>
                  </div>
                  <div className={getStatusColor(fidStatus)}>
                    {webVitals.fid ? `${webVitals.fid.toFixed(0)}ms` : 'N/A'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getStatusIcon(clsStatus)}
                    <span className="font-medium">CLS</span>
                  </div>
                  <div className={getStatusColor(clsStatus)}>
                    {webVitals.cls ? webVitals.cls.toFixed(3) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Long Tasks */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Long Tasks</h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-1 font-medium">{stats.totalTasks}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg:</span>
                  <span className="ml-1 font-medium">
                    {stats.averageDuration.toFixed(0)}ms
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max:</span>
                  <span className="ml-1 font-medium text-red-600">
                    {stats.maxDuration.toFixed(0)}ms
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Critical:</span>
                  <span className="ml-1 font-medium text-red-600">
                    {stats.tasksAboveCritical}
                  </span>
                </div>
              </div>
              
              {stats.maxDuration > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Performance</span>
                    <span>{Math.max(0, 100 - stats.maxDuration).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - stats.maxDuration)} 
                    className="h-1"
                  />
                </div>
              )}
            </div>
            
            {/* Recent Tasks */}
            {recentTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Recent Long Tasks</h4>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {recentTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1 mr-2" title={task.name}>
                        {task.name}
                      </span>
                      <Badge 
                        variant={task.duration >= 100 ? 'destructive' : 'secondary'}
                        className="text-xs px-1 py-0"
                      >
                        {task.duration.toFixed(0)}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => {
                  getLongTaskMonitor().clear()
                  setRecentTasks([])
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </CardContent>
        )}
        
        {isMinimized && (
          <CardContent className="py-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {stats.tasksAboveCritical > 0 ? (
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                ) : stats.tasksAboveWarning > 0 ? (
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                )}
                <span>{stats.totalTasks} tasks</span>
              </div>
              <span className="text-muted-foreground">
                {stats.maxDuration.toFixed(0)}ms max
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}