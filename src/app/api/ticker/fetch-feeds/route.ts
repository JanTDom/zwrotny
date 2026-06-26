import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeRelevanceScore } from '@/lib/ticker-scoring'

export const dynamic = 'force-dynamic'


// ─── RSS/Atom XML parser ──────────────────────────────────────────────────────

interface ParsedItem {
  title: string
  link: string
  description: string
  pubDate: string | null
}

function extractText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i')
  const m = xml.match(re)
  if (!m) return ''
  return (m[1] ?? m[2] ?? '').trim()
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i')
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

function parseXmlFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = []
  const itemRe = /<(item|entry)[\s>]([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null) {
    const chunk = m[2]
    const title = extractText(chunk, 'title') || '(bez tytułu)'
    let link = extractText(chunk, 'link')
    if (!link) link = extractAttr(chunk, 'link', 'href')
    // Google News wraps real URL in <link>; also try <guid>
    if (!link) link = extractText(chunk, 'guid')
    const pubDate =
      extractText(chunk, 'pubDate') ||
      extractText(chunk, 'published') ||
      extractText(chunk, 'updated') ||
      extractText(chunk, 'dc:date') || null
    const description =
      extractText(chunk, 'description') ||
      extractText(chunk, 'summary') ||
      extractText(chunk, 'content') || ''
    if (title && link) items.push({ title, link, description, pubDate })
  }
  return items
}

// ─── HTML scraper (fallback when no RSS) ─────────────────────────────────────

function scrapeArticlesFromHtml(html: string, baseUrl: string, sourceName: string): ParsedItem[] {
  const items: ParsedItem[] = []
  const seen = new Set<string>()

  // Match <a href="...">title</a> inside article/h1/h2/h3 elements
  // Strategy: find all <a> tags that look like article links (long text, relative/absolute path)
  const linkRe = /<a[^>]+href=["']([^"'#?]+)["'][^>]*>\s*([\s\S]{20,200}?)\s*<\/a>/gi
  let m: RegExpExecArray | null

  while ((m = linkRe.exec(html)) !== null) {
    try {
      const href = new URL(m[1], baseUrl).href
      const title = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

      // Filter: must be on same domain, not nav/footer links, real title length
      if (!href.startsWith(baseUrl.replace(/\/$/, '').split('/').slice(0, 3).join('/'))) continue
      if (title.length < 20 || title.length > 200) continue
      if (seen.has(href)) continue
      seen.add(href)

      items.push({ title, link: href, description: '', pubDate: null })
      if (items.length >= 30) break
    } catch { /* skip */ }
  }
  return items
}

// ─── Google News RSS URL builder ─────────────────────────────────────────────

function buildGoogleNewsUrl(name: string, homepageUrl: string, keywords: string[]): string {
  try {
    const domain = new URL(homepageUrl).hostname.replace(/^www\./, '')
    const kws = keywords.slice(0, 4).join(' OR ')
    // Prefer site-specific query, fallback to keywords-only
    const q = kws
      ? `site:${domain} OR (${kws}) recykling opakowania kaucja`
      : `${name} recykling opakowania kaucja`
    return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pl&gl=PL&ceid=PL:pl`
  } catch { return '' }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function titleHash(title: string): string {
  const s = title.toLowerCase().replace(/\s+/g, ' ').trim()
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

function normaliseUrl(url: string): string {
  try {
    const u = new URL(url)
    for (const p of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ref','fbclid','gclid']) {
      u.searchParams.delete(p)
    }
    return u.origin + u.pathname.replace(/\/$/, '') + (u.search || '')
  } catch { return url }
}

async function fetchWithTimeout(url: string, ms = 12000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Zwrotny.pl news aggregator/1.0)' },
    })
  } finally { clearTimeout(timer) }
}

// ─── Per-source fetch: tries RSS → Google News RSS → HTML scrape ──────────────

interface SourceRow {
  id: string
  name: string
  homepage_url: string
  feed_url: string | null
  trust_level: string
  include_keywords: string[]
  exclude_keywords: string[]
  is_active: boolean
}

async function fetchItemsForSource(src: SourceRow): Promise<ParsedItem[]> {
  // 1. Own RSS/Atom feed
  if (src.feed_url) {
    try {
      const r = await fetchWithTimeout(src.feed_url, 10000)
      if (r.ok) {
        const xml = await r.text()
        if (/<(rss|feed|channel)\b/i.test(xml)) return parseXmlFeed(xml)
      }
    } catch { /* fall through */ }
  }

  // 2. Google News RSS (no API key needed, covers all Polish sites)
  const googleUrl = buildGoogleNewsUrl(src.name, src.homepage_url, src.include_keywords ?? [])
  if (googleUrl) {
    try {
      const r = await fetchWithTimeout(googleUrl, 10000)
      if (r.ok) {
        const xml = await r.text()
        if (/<(rss|feed|channel)\b/i.test(xml)) {
          const items = parseXmlFeed(xml)
          if (items.length > 0) return items
        }
      }
    } catch { /* fall through */ }
  }

  // 3. HTML scraping (last resort)
  try {
    const r = await fetchWithTimeout(src.homepage_url, 10000)
    if (r.ok) {
      const html = await r.text()
      return scrapeArticlesFromHtml(html, src.homepage_url, src.name)
    }
  } catch { /* give up */ }

  return []
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { data: sources, error: srcErr } = await supabase
      .from('ticker_sources')
      .select('*')
      .eq('is_active', true)

    if (srcErr) throw srcErr
    if (!sources?.length) {
      return NextResponse.json({ message: 'Brak aktywnych źródeł', fetched: 0, inserted: 0 })
    }

    // Load existing dedup sets
    const { data: existing } = await supabase
      .from('ticker_items')
      .select('original_url, content_hash')
      .eq('is_manual', false)

    const existingUrls = new Set((existing ?? []).map(e => normaliseUrl(e.original_url)))
    const existingHashes = new Set((existing ?? []).map(e => e.content_hash).filter(Boolean))

    let totalInserted = 0
    let totalFetched = 0
    const results: { source: string; method: string; fetched: number; inserted: number; error?: string }[] = []

    for (const src of sources) {
      try {
        const parsedItems = await fetchItemsForSource(src)
        totalFetched += parsedItems.length

        const toInsert = []

        for (const item of parsedItems) {
          if (!item.link || !item.title) continue

          const normUrl = normaliseUrl(item.link)
          const hash = titleHash(item.title)

          if (existingUrls.has(normUrl)) continue
          if (existingHashes.has(hash)) continue

          let publishedAt: string | null = null
          if (item.pubDate) {
            const d = new Date(item.pubDate)
            if (!isNaN(d.getTime())) publishedAt = d.toISOString()
          }

          const score = computeRelevanceScore({
            title: item.title,
            excerpt: item.description,
            sourceTrustLevel: src.trust_level as 'wysokie' | 'srednie' | 'niskie',
            publishedAt,
          })

          // Minimum score threshold — higher for less trusted sources
          const scoreThreshold = src.trust_level === 'wysokie' ? 15 : src.trust_level === 'srednie' ? 20 : 30
          if (score < scoreThreshold) continue

          // Exclude keywords hard-block
          const text = `${item.title} ${item.description}`.toLowerCase()
          if (src.exclude_keywords?.length) {
            if (src.exclude_keywords.some((kw: string) => text.includes(kw.toLowerCase()))) continue
          }

          // Include keywords: skip this filter for Google News feeds (already topic-targeted by query)
          const isGoogleNews = src.feed_url?.includes('news.google.com')
          if (!isGoogleNews && src.include_keywords?.length) {
            const hasMatch = src.include_keywords.some((kw: string) => text.includes(kw.toLowerCase()))
            if (!hasMatch) continue
          }

          existingUrls.add(normUrl)
          existingHashes.add(hash)

          toInsert.push({
            title: item.title.slice(0, 300),
            excerpt: item.description ? item.description.replace(/<[^>]+>/g, '').slice(0, 500) : null,
            source_name: src.name,
            source_url: src.homepage_url,
            original_url: item.link.slice(0, 1000),
            published_at: publishedAt,
            topic_tags: [],
            relevance_score: Math.min(100, score),
            source_trust_level: src.trust_level,
            is_pinned: false,
            is_hidden: false,
            is_manual: false,
            content_hash: hash,
          })
        }

        if (toInsert.length > 0) {
          const { error: insErr } = await supabase
            .from('ticker_items')
            .insert(toInsert)
          if (!insErr) totalInserted += toInsert.length
        }

        await supabase.from('ticker_sources').update({
          last_fetched_at: new Date().toISOString(),
          last_fetch_error: null,
        }).eq('id', src.id)

        results.push({ source: src.name, method: src.feed_url ? 'rss' : 'google_news+html', fetched: parsedItems.length, inserted: toInsert.length })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await supabase.from('ticker_sources').update({ last_fetch_error: msg }).eq('id', src.id)
        results.push({ source: src.name, method: 'error', fetched: 0, inserted: 0, error: msg })
      }
    }

    // Prune items older than 60 days
    const cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()
    await supabase.from('ticker_items').delete()
      .eq('is_pinned', false).eq('is_manual', false).lt('published_at', cutoff)

    return NextResponse.json({ message: 'OK', fetched: totalFetched, inserted: totalInserted, sources: results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
