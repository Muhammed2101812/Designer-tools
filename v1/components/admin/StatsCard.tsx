import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  /** The title/label for the statistic */
  title: string
  /** The main value to display */
  value: string
  /** Icon to display in the header */
  icon: React.ReactNode
  /** Change indicator (e.g., "+12%" or "-5%") */
  change: string
  /** Additional CSS classes */
  className?: string
}

/**
 * StatsCard Component
 * 
 * Displays a statistic with title, value, icon, and change indicator.
 * Used in admin analytics dashboard to show key metrics.
 * 
 * @param props - The component props
 * @returns A card component displaying the statistic
 */
export function StatsCard({ 
  title, 
  value, 
  icon, 
  change, 
  className 
}: StatsCardProps) {
  const isPositive = change.includes('+')
  const changeValue = change.replace(/[+%]/g, '')

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'} mt-1`}>
          {change}
        </p>
      </CardContent>
    </Card>
  )
}