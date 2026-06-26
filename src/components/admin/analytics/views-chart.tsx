'use client'

import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type Point = { label: string; views: number; visitors: number }

const config: ChartConfig = {
  views: { label: 'Odsłony', color: 'var(--chart-1)' },
  visitors: { label: 'Unikalni', color: 'var(--chart-4)' },
}

function formatLabel(label: string, hourly: boolean): string {
  if (hourly) {
    // yyyy-mm-ddThh
    const hour = label.slice(11, 13)
    return `${hour}:00`
  }
  // yyyy-mm-dd -> dd.mm
  const [, m, d] = label.split('-')
  return `${d}.${m}`
}

export function ViewsChart({ data, hourly }: { data: Point[]; hourly: boolean }) {
  const chartData = data.map((p) => ({ ...p, display: formatLabel(p.label, hourly) }))

  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="display"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="views"
          stroke="var(--color-views)"
          fill="url(#fillViews)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="visitors"
          stroke="var(--color-visitors)"
          fill="url(#fillVisitors)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
