'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuotaCardProps {
  currentUsage: number
  dailyLimit: number
  plan: string
}

export function QuotaCard({ currentUsage, dailyLimit, plan }: QuotaCardProps) {
  const remaining = dailyLimit - currentUsage
  const percentage = (currentUsage / dailyLimit) * 100
  
  // Color coding based on usage percentage
  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  const getProgressBgColor = () => {
    if (percentage >= 80) return 'bg-red-100'
    if (percentage >= 50) return 'bg-yellow-100'
    return 'bg-green-100'
  }
  
  const showWarning = percentage >= 80
  
  return (
    <Card className={cn(showWarning && 'border-red-200 bg-red-50/50')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Günlük API Kotası
          {showWarning && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Remaining count display */}
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">{remaining}</span>
            <span className="text-sm text-muted-foreground">
              / {dailyLimit} kalan
            </span>
          </div>
          
          {/* Custom progress bar with color coding */}
          <div className={cn(
            "relative h-3 w-full overflow-hidden rounded-full",
            getProgressBgColor()
          )}>
            <div
              className={cn(
                "h-full transition-all duration-300 ease-in-out rounded-full",
                getProgressColor()
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          {/* Usage details */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentUsage} kullanıldı
            </span>
            <span className="text-muted-foreground">
              Sıfırlanma: Gece yarısı
            </span>
          </div>
          
          {/* Warning message for high usage */}
          {showWarning && (
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Kota Uyarısı</span>
              </div>
              <p className="mt-1">
                Günlük kotanızın %{Math.round(percentage)}&apos;ini kullandınız. 
                Daha fazla işlem için planınızı yükseltin.
              </p>
            </div>
          )}
          
          {/* Upgrade button for free plan */}
          {plan === 'free' && (
            <Button asChild className="w-full" size="sm">
              <Link href="/pricing">
                Planı Yükselt
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}