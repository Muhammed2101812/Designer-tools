'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

interface UsageData {
  date: string
  api_tools_count: number
}

interface UsageChartProps {
  data: UsageData[]
}

export function UsageChart({ data }: UsageChartProps) {
  // Son 7 günün verilerini hazırla
  const chartData = data.map(item => ({
    date: item.date,
    usage: item.api_tools_count || 0,
    formattedDate: format(parseISO(item.date), 'dd MMM', { locale: tr })
  }))

  // Eğer veri yoksa son 7 günü 0 değerleriyle doldur
  if (chartData.length === 0) {
    const today = new Date()
    const emptyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      emptyData.push({
        date: date.toISOString().split('T')[0],
        usage: 0,
        formattedDate: format(date, 'dd MMM', { locale: tr })
      })
    }
    chartData.push(...emptyData)
  }

  const maxUsage = Math.max(...chartData.map(d => d.usage), 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Son 7 Günün Kullanımı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="formattedDate" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                domain={[0, maxUsage]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Tarih
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {label}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Kullanım
                            </span>
                            <span className="font-bold">
                              {payload[0].value} işlem
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar 
                dataKey="usage" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.every(d => d.usage === 0) && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Henüz kullanım verisi bulunmuyor
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}