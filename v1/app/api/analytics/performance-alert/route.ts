import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for performance alert data
const PerformanceAlertSchema = z.object({
  metric: z.enum(['fcp', 'lcp', 'tti', 'cls', 'fid']),
  value: z.number(),
  threshold: z.number(),
  severity: z.enum(['warning', 'critical']),
  timestamp: z.number(),
  url: z.string().url(),
  userAgent: z.string(),
  viewport: z.object({
    width: z.number(),
    height: z.number()
  }),
  connection: z.object({
    effectiveType: z.string(),
    downlink: z.number()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json()
    const alertData = PerformanceAlertSchema.parse(body)

    // In a real application, you would:
    // 1. Store this data in a database
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Trigger alerts in monitoring systems (Sentry, DataDog, etc.)
    // 4. Update performance dashboards

    // For now, we'll just log it and return success
    console.log('[Performance Analytics] Alert received:', {
      metric: alertData.metric,
      value: alertData.value,
      severity: alertData.severity,
      url: alertData.url,
      timestamp: new Date(alertData.timestamp).toISOString()
    })

    // Example: Send to external analytics service
    if (process.env.ANALYTICS_ENDPOINT) {
      try {
        await fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
          },
          body: JSON.stringify({
            event: 'performance_alert',
            properties: alertData
          })
        })
      } catch (error) {
        console.error('[Performance Analytics] Failed to send to external service:', error)
        // Don't fail the request if external service is down
      }
    }

    // Example: Send to Sentry for critical alerts
    if (alertData.severity === 'critical' && process.env.SENTRY_DSN) {
      // This would be handled by the Sentry client-side integration
      // but you could also send server-side events here
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Performance alert recorded' 
    })

  } catch (error) {
    console.error('[Performance Analytics] Error processing alert:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid alert data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}