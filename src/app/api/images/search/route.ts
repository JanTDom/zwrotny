import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

async function getApiKeys(): Promise<{ unsplash: string | null; pexels: string | null }> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'apiConfigs')
    .maybeSingle()

  if (!data?.value) return { unsplash: null, pexels: null }
  const configs = data.value as { envKey: string; value: string }[]
  return {
    unsplash: configs.find(c => c.envKey === 'UNSPLASH_ACCESS_KEY')?.value || null,
    pexels: configs.find(c => c.envKey === 'PEXELS_API_KEY')?.value || null,
  }
}

export interface StockPhoto {
  id: string
  source: 'unsplash' | 'pexels'
  url: string          // full-size URL
  previewUrl: string   // small preview (400px wide)
  thumbUrl: string     // tiny thumb (200px)
  author: string
  authorUrl: string
  sourceUrl: string
  alt: string
  width: number
  height: number
}

// Smart query builder: translates Polish/environmental keywords for better results
function buildSearchQuery(query: string, title?: string): string {
  const base = query.trim() || title?.trim() || ''
  // Add recycling/environment context if query seems related to the site topic
  const envKeywords = ['kaucja', 'zwrotny', 'kaucyjny', 'recykling', 'ekologia', 'opakowanie']
  const isEnvTopic = envKeywords.some(k => base.toLowerCase().includes(k))
  if (isEnvTopic && !base.toLowerCase().includes('recycling')) {
    return base + ' recycling environment'
  }
  return base
}

async function searchUnsplash(query: string, key: string, page = 1, perPage = 20): Promise<StockPhoto[]> {
  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('page', String(page))
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('lang', 'pl') // prefer Polish results

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}` },
    next: { revalidate: 300 },
  })

  if (!res.ok) return []
  const data = await res.json()

  return (data.results || []).map((photo: Record<string, unknown>) => {
    const urls = photo.urls as Record<string, string>
    const user = photo.user as Record<string, unknown>
    const links = photo.links as Record<string, string>
    const altDesc = photo.alt_description as string | null
    const desc = photo.description as string | null
    return {
      id: `unsplash-${photo.id}`,
      source: 'unsplash' as const,
      url: urls.full,
      previewUrl: urls.regular, // 1080px wide
      thumbUrl: urls.small,     // 400px wide
      author: (user?.name as string) || 'Unsplash',
      authorUrl: `https://unsplash.com/@${user?.username}`,
      sourceUrl: links.html,
      alt: altDesc || desc || query,
      width: (photo.width as number) || 1920,
      height: (photo.height as number) || 1080,
    }
  })
}

async function searchPexels(query: string, key: string, page = 1, perPage = 20): Promise<StockPhoto[]> {
  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('page', String(page))
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('locale', 'pl-PL')

  const res = await fetch(url.toString(), {
    headers: { Authorization: key },
    next: { revalidate: 300 },
  })

  if (!res.ok) return []
  const data = await res.json()

  return (data.photos || []).map((photo: Record<string, unknown>) => {
    const src = photo.src as Record<string, string>
    const photographer = photo.photographer as string
    const photographerUrl = photo.photographer_url as string
    const url_ = photo.url as string
    const alt = photo.alt as string
    return {
      id: `pexels-${photo.id}`,
      source: 'pexels' as const,
      url: src.original,
      previewUrl: src.large,     // ~1920px
      thumbUrl: src.medium,      // ~1200px
      author: photographer || 'Pexels',
      authorUrl: photographerUrl || 'https://pexels.com',
      sourceUrl: url_,
      alt: alt || query,
      width: (photo.width as number) || 1920,
      height: (photo.height as number) || 1280,
    }
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const title = searchParams.get('title') || ''
  const source = searchParams.get('source') || 'all' // 'unsplash' | 'pexels' | 'all'
  const page = parseInt(searchParams.get('page') || '1')

  if (!query && !title) {
    return NextResponse.json({ error: 'Brak zapytania' }, { status: 400 })
  }

  const keys = await getApiKeys()
  const effectiveQuery = buildSearchQuery(query, title)

  const results: StockPhoto[] = []
  const errors: string[] = []

  const fetchers: Promise<void>[] = []

  if ((source === 'all' || source === 'unsplash') && keys.unsplash) {
    fetchers.push(
      searchUnsplash(effectiveQuery, keys.unsplash, page, source === 'all' ? 12 : 20)
        .then(photos => { results.push(...photos) })
        .catch(() => { errors.push('Unsplash') })
    )
  } else if (source === 'unsplash' && !keys.unsplash) {
    errors.push('Brak klucza Unsplash Access Key w ustawieniach API')
  }

  if ((source === 'all' || source === 'pexels') && keys.pexels) {
    fetchers.push(
      searchPexels(effectiveQuery, keys.pexels, page, source === 'all' ? 12 : 20)
        .then(photos => { results.push(...photos) })
        .catch(() => { errors.push('Pexels') })
    )
  } else if (source === 'pexels' && !keys.pexels) {
    errors.push('Brak klucza Pexels API Key w ustawieniach API')
  }

  await Promise.all(fetchers)

  // Interleave results from both sources for variety
  if (source === 'all' && results.length > 0) {
    const unsplashResults = results.filter(r => r.source === 'unsplash')
    const pexelsResults = results.filter(r => r.source === 'pexels')
    const interleaved: StockPhoto[] = []
    const max = Math.max(unsplashResults.length, pexelsResults.length)
    for (let i = 0; i < max; i++) {
      if (unsplashResults[i]) interleaved.push(unsplashResults[i])
      if (pexelsResults[i]) interleaved.push(pexelsResults[i])
    }
    return NextResponse.json({ photos: interleaved, errors, query: effectiveQuery })
  }

  return NextResponse.json({ photos: results, errors, query: effectiveQuery })
}
