import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { filterAndRankItems } from '@/lib/ticker-scoring'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Next.js ISR: re-run at most every 5 min

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Trigger background RSS fetch if any active source hasn't been fetched
// within its refresh_interval (minutes). Fire-and-forget — doesn't block response.
async function maybeRefreshFeeds(baseUrl: string) {
  try {
    const { data: sources } = await supabase
      .from('ticker_sources')
      .select('id, refresh_interval, last_fetched_at')
      .eq('is_active', true)
      .not('feed_url', 'is', null)

    if (!sources?.length) return

    const now = Date.now()
    const stale = sources.some(src => {
      if (!src.last_fetched_at) return true
      const ageMinutes = (now - new Date(src.last_fetched_at).getTime()) / 60000
      return ageMinutes >= (src.refresh_interval ?? 60)
    })

    if (stale) {
      // Fire-and-forget: no await, response not blocked
      fetch(`${baseUrl}/api/ticker/fetch-feeds`, { method: 'POST' }).catch(() => {})
    }
  } catch { /* non-critical */ }
}

/**
 * GET /api/news-ticker
 * Returns active ticker items. Auto-triggers RSS fetch in background when stale.
 */
export async function GET(req: Request) {
  try {
    // Extract base URL for the internal fetch-feeds call
    const url = new URL(req.url)
    const baseUrl = `${url.protocol}//${url.host}`

    // Trigger background RSS refresh if any source is stale (non-blocking)
    maybeRefreshFeeds(baseUrl)
    // Load settings
    const { data: settings } = await supabase
      .from('ticker_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (!settings?.is_enabled) {
      return NextResponse.json({ enabled: false, items: [], fallbackMessage: settings?.fallback_message ?? '' })
    }

    const freshnessDays = settings.freshness_days ?? 7
    const maxItems = settings.max_items ?? 20
    const cutoff = new Date(Date.now() - freshnessDays * 24 * 3600 * 1000).toISOString()

    // Load items
    const { data: items, error } = await supabase
      .from('ticker_items')
      .select('*')
      .eq('is_hidden', false)
      .or(`published_at.gte.${cutoff},is_pinned.eq.true`)
      .order('is_pinned', { ascending: false })
      .order('relevance_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Map snake_case DB fields to camelCase BEFORE filtering
    const mapped = (items ?? []).map(item => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      sourceName: item.source_name,
      sourceUrl: item.source_url,
      originalUrl: item.original_url,
      publishedAt: item.published_at,
      topicTags: item.topic_tags,
      relevanceScore: item.relevance_score,
      isPinned: item.is_pinned,
      isHidden: item.is_hidden,
    }))

    const filtered = filterAndRankItems(mapped, maxItems)

    return NextResponse.json({
      enabled: true,
      speed: settings.speed,
      allowClose: settings.allow_close,
      fallbackMessage: settings.fallback_message,
      items: filtered,
    })
  } catch (err) {
    console.error('[news-ticker]', err)
    return NextResponse.json({ enabled: false, items: [], fallbackMessage: '' }, { status: 500 })
  }
}
