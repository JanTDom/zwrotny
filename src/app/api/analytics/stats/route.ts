import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Row = {
  path: string
  referrer_domain: string | null
  device: string | null
  browser: string | null
  os: string | null
  country: string | null
  visitor_id: string | null
  created_at: string
}

const RANGES: Record<string, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

function topN<T extends string>(counts: Map<T, number>, n: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const days = RANGES[range] ?? 7

    const now = new Date()
    const from = new Date(now)
    from.setDate(from.getDate() - days)
    from.setHours(0, 0, 0, 0)

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('page_views')
      .select('path, referrer_domain, device, browser, os, country, visitor_id, created_at')
      .gte('created_at', from.toISOString())
      .order('created_at', { ascending: true })
      .limit(100000)

    if (error) {
      console.error('[v0] analytics stats error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data || []) as Row[]

    // Aggregations
    const uniqueVisitors = new Set<string>()
    const pageCounts = new Map<string, number>()
    const deviceCounts = new Map<string, number>()
    const browserCounts = new Map<string, number>()
    const countryCounts = new Map<string, number>()
    const referrerCounts = new Map<string, number>()

    // Time buckets
    const hourly = range === '24h'
    const timeMap = new Map<string, { views: number; visitorSet: Set<string> }>()

    // Pre-fill time buckets so the chart has continuous points
    if (hourly) {
      for (let h = 0; h < 24; h++) {
        const d = new Date(now)
        d.setHours(now.getHours() - (23 - h), 0, 0, 0)
        const key = d.toISOString().slice(0, 13) // yyyy-mm-ddThh
        timeMap.set(key, { views: 0, visitorSet: new Set() })
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        const key = d.toISOString().slice(0, 10) // yyyy-mm-dd
        timeMap.set(key, { views: 0, visitorSet: new Set() })
      }
    }

    const todayKey = now.toISOString().slice(0, 10)
    let todayViews = 0

    for (const r of rows) {
      const vid = r.visitor_id || 'anon'
      uniqueVisitors.add(vid)

      pageCounts.set(r.path, (pageCounts.get(r.path) || 0) + 1)
      if (r.device) deviceCounts.set(r.device, (deviceCounts.get(r.device) || 0) + 1)
      if (r.browser) browserCounts.set(r.browser, (browserCounts.get(r.browser) || 0) + 1)
      if (r.country) countryCounts.set(r.country, (countryCounts.get(r.country) || 0) + 1)
      if (r.referrer_domain) referrerCounts.set(r.referrer_domain, (referrerCounts.get(r.referrer_domain) || 0) + 1)

      const key = hourly ? r.created_at.slice(0, 13) : r.created_at.slice(0, 10)
      const bucket = timeMap.get(key)
      if (bucket) {
        bucket.views++
        bucket.visitorSet.add(vid)
      }

      if (r.created_at.slice(0, 10) === todayKey) todayViews++
    }

    const timeseries = [...timeMap.entries()].map(([key, v]) => ({
      label: key,
      views: v.views,
      visitors: v.visitorSet.size,
    }))

    return NextResponse.json({
      range,
      totalViews: rows.length,
      uniqueVisitors: uniqueVisitors.size,
      todayViews,
      avgPerDay: Math.round(rows.length / days),
      timeseries,
      topPages: topN(pageCounts, 10),
      devices: topN(deviceCounts, 5),
      browsers: topN(browserCounts, 6),
      countries: topN(countryCounts, 8),
      referrers: topN(referrerCounts, 8),
    })
  } catch (err) {
    console.error('[v0] analytics stats exception:', err)
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 })
  }
}
