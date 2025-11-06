import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ConversionFunnelData {
  /** Name of the conversion stage */
  stage: string
  /** Number of users at this stage */
  count: number
  /** Percentage of total users */
  percentage: number
}

interface ConversionFunnelProps {
  /** Array of conversion funnel stages */
  data: ConversionFunnelData[]
}

/**
 * ConversionFunnel Component
 * 
 * Displays a conversion funnel showing user progression through key stages
 * (signup → first tool use → subscription). Includes conversion rates between stages.
 * 
 * @param props - The component props
 * @returns A funnel visualization with stage cards and conversion rates
 */
export function ConversionFunnel({ data }: ConversionFunnelProps) {
  // Calculate conversion rates between stages
  const conversionRates = data.map((stage, index) => {
    if (index === 0) return { from: '', to: stage.stage, rate: 100 }
    
    const prevStage = data[index - 1]
    const rate = prevStage.count > 0 
      ? (stage.count / prevStage.count) * 100 
      : 0
    
    return {
      from: prevStage.stage,
      to: stage.stage,
      rate: parseFloat(rate.toFixed(2))
    }
  }).slice(1) // Skip the first item since it's the starting stage

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.map((stage, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium truncate">{stage.stage}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stage.count}</div>
              <p className="text-xs text-muted-foreground">{stage.percentage}% of total</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Conversion Rates Between Stages</h3>
        {conversionRates.map((rate, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{rate.from} → {rate.to}</span>
              <span>{rate.rate}%</span>
            </div>
            <Progress value={rate.rate} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  )
}