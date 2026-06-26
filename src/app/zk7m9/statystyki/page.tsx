'use client'

import useSWR from 'swr'
import { useState } from 'react'
import {
  Eye,
  Users,
  CalendarDays,
  TrendingUp,
  Monitor,
  Globe,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState, ErrorState } from '@/components/ui/api-states'
import { ViewsChart } from '@/components/admin/analytics/views-chart'
import { DeviceChart } from '@/components/admin/analytics/device-chart'

type Stats = {
  range: string
  totalViews: number
  uniqueVisitors: number
  todayViews: number
  avgPerDay: number
  timeseries: { label: string; views: number; visitors: number }[]
  topPages: { name: string; value: number }[]
  devices: { name: string; value: number }[]
  browsers: { name: string; value: number }[]
  countries: { name: string; value: number }[]
  referrers: { name: string; value: number }[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const RANGES = [
  { key: '24h', label: '24 godz.' },
  { key: '7d', label: '7 dni' },
  { key: '30d', label: '30 dni' },
  { key: '90d', label: '90 dni' },
]

function BarList({ items, emptyLabel }: { items: { name: string; value: number }[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>
  }
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate text-foreground" title={item.name}>{item.name}</span>
            <span className="text-muted-foreground font-medium tabular-nums ml-2">{item.value.toLocaleString('pl-PL')}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StatystykiPage() {
  const [range, setRange] = useState('7d')
  const { data, error, isLoading } = useSWR<Stats>(`/api/analytics/stats?range=${range}`, fetcher, {
    revalidateOnFocus: false,
  })

  const statCards = [
    { title: 'Wszystkie odsłony', value: data?.totalViews ?? 0, icon: Eye },
    { title: 'Unikalni odwiedzający', value: data?.uniqueVisitors ?? 0, icon: Users },
    { title: 'Odsłony dzisiaj', value: data?.todayViews ?? 0, icon: CalendarDays },
    { title: 'Średnio dziennie', value: data?.avgPerDay ?? 0, icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Statystyki odwiedzin</h1>
          <p className="text-muted-foreground">Ruch na stronie ZWROTNY.pl — anonimowe dane, zgodne z RODO</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              variant={range === r.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message="Nie udało się załadować statystyk." />
      ) : isLoading || !data ? (
        <LoadingState message="Ładowanie statystyk..." />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground tabular-nums">
                        {stat.value.toLocaleString('pl-PL')}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Time series chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ruch w czasie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ViewsChart data={data.timeseries} hourly={range === '24h'} />
            </CardContent>
          </Card>

          {/* Devices + Browsers */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  Urządzenia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceChart data={data.devices} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Przeglądarki</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={data.browsers} emptyLabel="Brak danych" />
              </CardContent>
            </Card>
          </div>

          {/* Top pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Najczęściej odwiedzane strony
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topPages.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Ścieżka</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Odsłony</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topPages.map((page) => (
                        <tr key={page.name} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-2.5 px-3">
                            <a
                              href={page.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary inline-flex items-center gap-1.5"
                            >
                              <span className="truncate max-w-md">{page.name}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                            </a>
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                            {page.value.toLocaleString('pl-PL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">Brak danych w tym okresie</p>
              )}
            </CardContent>
          </Card>

          {/* Referrers + Countries */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Źródła ruchu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={data.referrers} emptyLabel="Brak zewnętrznych źródeł (ruch bezpośredni)" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Kraje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={data.countries} emptyLabel="Brak danych geolokalizacji" />
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Dane zbierane anonimowo, bez adresów IP ani danych osobowych. Panel administracyjny jest wykluczony ze
            statystyk.
          </p>
        </>
      )}
    </div>
  )
}
