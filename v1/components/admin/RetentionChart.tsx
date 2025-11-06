import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface RetentionData {
  /** Day number (e.g., 1, 7, 30) */
  day: number
  /** Retention percentage for that day */
  percentage: number
}

interface RetentionChartProps {
  /** Array of retention data points */
  data: RetentionData[]
}

/**
 * RetentionChart Component
 * 
 * Displays a line chart showing user retention over time.
 * Used in admin analytics to track how well the platform retains users.
 * 
 * @param props - The component props
 * @returns A responsive line chart component
 */
export function RetentionChart({ data }: RetentionChartProps) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="day" 
            label={{ value: 'Days', position: 'insideBottomRight', offset: -5 }} 
          />
          <YAxis 
            label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Retention']}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="percentage" 
            stroke="#10b981" 
            name="Retention Rate" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}