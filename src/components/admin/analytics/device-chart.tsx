'use client'

import { Pie, PieChart, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type Slice = { name: string; value: number }

const LABELS: Record<string, string> = {
  mobile: 'Mobilne',
  desktop: 'Komputer',
  tablet: 'Tablet',
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function DeviceChart({ data }: { data: Slice[] }) {
  const chartData = data.map((d) => ({ ...d, label: LABELS[d.name] || d.name }))
  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  const config: ChartConfig = Object.fromEntries(
    chartData.map((d, i) => [d.name, { label: d.label, color: COLORS[i % COLORS.length] }])
  )

  if (total === 0) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Brak danych</div>
  }

  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
        <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={50} outerRadius={85} paddingAngle={2}>
          {chartData.map((d, i) => (
            <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
