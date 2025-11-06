import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ToolUsageData {
  /** Name of the tool */
  toolName: string
  /** Number of times the tool was used */
  count: number
  /** Percentage of total usage */
  percentage: number
}

interface ToolUsageChartProps {
  /** Array of tool usage data */
  data: ToolUsageData[]
}

/**
 * ToolUsageChart Component
 * 
 * Displays a bar chart showing tool usage statistics.
 * Used in admin analytics to visualize which tools are most popular.
 * 
 * @param props - The component props
 * @returns A responsive bar chart component
 */
export function ToolUsageChart({ data }: ToolUsageChartProps) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="toolName" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value, 'Usage Count']}
            labelFormatter={(label) => `Tool: ${label}`}
          />
          <Bar dataKey="count" fill="#3b82f6" name="Usage Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}