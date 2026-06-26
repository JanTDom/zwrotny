import { NextRequest, NextResponse } from 'next/server'

// Common RSS/Atom feed paths to probe when no <link rel="alternate"> found
const COMMON_FEED_PATHS = [
  '/feed', '/feed.xml', '/feed.atom', '/feed.rss',
  '/rss', '/rss.xml', '/rss2.xml',
  '/atom.xml', '/atom',
  '/index.xml',
  '/blog/feed', '/blog/rss.xml', '/news/feed', '/news/rss.xml',
  '/aktualnosci/feed', '/aktualnosci/rss',
  '/wiadomosci/feed', '/wiadomosci/rss',
  '/wp-json/wp/v2/posts', // WordPress REST — indicates WP, check /feed
]

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Zwrotny.pl RSS bot/1.0)' },
    })
  } finally {
    clearTimeout(timer)
  }
}

function extractFeedLinksFromHtml(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const re = /<link[^>]+type=["'](application\/(rss|atom)\+xml|text\/xml)[^>]*href=["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try { links.push(new URL(m[3], baseUrl).href) } catch { /* skip */ }
  }
  const re2 = /<link[^>]+href=["']([^"']+)["'][^>]+type=["'](application\/(rss|atom)\+xml)[^>]*>/gi
  while ((m = re2.exec(html)) !== null) {
    try {
      const u = new URL(m[1], baseUrl).href
      if (!links.includes(u)) links.push(u)
    } catch { /* skip */ }
  }
  return links
}

async function isValidFeed(url: string): Promise<boolean> {
  try {
    const r = await fetchWithTimeout(url, 5000)
    if (!r.ok) return false
    const ct = r.headers.get('content-type') ?? ''
    if (['application/rss+xml','application/atom+xml','application/xml','text/xml'].some(m => ct.includes(m))) return true
    const text = await r.text()
    return text.trimStart().startsWith('<?xml') || /<(rss|feed|channel)\b/i.test(text)
  } catch { return false }
}

/**
 * Generates a Google News RSS URL for a given domain/name + keywords.
 * Google News supports per-query RSS without API key.
 */
function buildGoogleNewsRss(name: string, homepageUrl: string, keywords?: string[]): string {
  try {
    const domain = new URL(homepageUrl).hostname.replace(/^www\./, '')
    // Build query: site-specific + core keywords
    const coreKws = keywords?.slice(0, 3).join(' ') ?? 'kaucja recykling opakowania'
    const q = `site:${domain} OR (${coreKws})`
    return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pl&gl=PL&ceid=PL:pl`
  } catch {
    return ''
  }
}

/**
 * GET /api/ticker/discover-rss?url=https://example.com&name=Nazwa&keywords=kaucja,recykling
 * Returns { feedUrl: string | null, method: string }
 * method: 'html_link' | 'probe' | 'google_news' | 'not_found'
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const name = req.nextUrl.searchParams.get('name') ?? ''
  const keywordsParam = req.nextUrl.searchParams.get('keywords') ?? ''
  const keywords = keywordsParam ? keywordsParam.split(',').map(k => k.trim()).filter(Boolean) : []

  if (!url) return NextResponse.json({ error: 'Brak parametru url' }, { status: 400 })

  let base: URL
  try { base = new URL(url) } catch {
    return NextResponse.json({ error: 'Nieprawidłowy URL' }, { status: 400 })
  }

  // Step 1: fetch homepage HTML and look for <link rel="alternate">
  let html = ''
  try {
    const r = await fetchWithTimeout(base.href, 8000)
    if (r.ok) {
      html = await r.text()
      const fromHtml = extractFeedLinksFromHtml(html, base.href)
      if (fromHtml.length > 0) {
        return NextResponse.json({ feedUrl: fromHtml[0], method: 'html_link' })
      }
    }
  } catch { /* continue */ }

  // Step 2: probe common paths (parallel for speed)
  const probeResults = await Promise.allSettled(
    COMMON_FEED_PATHS.map(async (path) => {
      const candidate = new URL(path, base).href
      return (await isValidFeed(candidate)) ? candidate : null
    })
  )
  for (const r of probeResults) {
    if (r.status === 'fulfilled' && r.value) {
      return NextResponse.json({ feedUrl: r.value, method: 'probe' })
    }
  }

  // Step 3: fallback — Google News RSS (works for every site, no API key needed)
  const googleFeed = buildGoogleNewsRss(name || base.hostname, base.href, keywords)
  if (googleFeed) {
    return NextResponse.json({ feedUrl: googleFeed, method: 'google_news' })
  }

  return NextResponse.json({ feedUrl: null, method: 'not_found' })
}
