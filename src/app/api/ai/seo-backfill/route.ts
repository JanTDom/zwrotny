import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function getOpenAIKey(): Promise<string> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase.from('settings').select('value').eq('key', 'apiConfigs').single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = (data as any)?.value
  if (value) {
    const configs = value as { envKey: string; value: string }[]
    const match = configs.find(c => c.envKey === 'OPENAI_API_KEY')
    if (match?.value) return match.value
  }
  return ''
}

async function generateSeoForPost(title: string, excerpt: string | null, content: string | null, apiKey: string) {
  const plainContent = (content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Jesteś ekspertem SEO. Odpowiadasz TYLKO poprawnym JSON bez żadnych innych słów.' },
        { role: 'user', content: `Tytuł: ${title}\nZajawka: ${excerpt || '(brak)'}\nTreść: ${plainContent || '(brak)'}\n\nZwróć JSON: {"metaTitle":"max 60 znaków","metaDescription":"140-160 znaków, aktywny głos","keywords":["fraza1","fraza2"],"ogTitle":"...","ogDescription":"...","focusKeyword":"1-3 słowa","seoScore":75}` },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) throw new Error(`OpenAI error ${response.status}`)
  const data = await response.json()
  const seo = JSON.parse(data.choices?.[0]?.message?.content || '{}')
  return {
    metaTitle: seo.metaTitle || '',
    metaDescription: seo.metaDescription || '',
    keywords: Array.isArray(seo.keywords) ? seo.keywords : [],
    ogTitle: seo.ogTitle || seo.metaTitle || '',
    ogDescription: seo.ogDescription || seo.metaDescription || '',
    focusKeyword: seo.focusKeyword || '',
    seoScore: typeof seo.seoScore === 'number' ? seo.seoScore : null,
  }
}

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const apiKey = await getOpenAIKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'Brak klucza OpenAI. Ustaw go w Ustawienia → API.' }, { status: 400 })
    }

    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, excerpt, content, seo')
      .order('created_at', { ascending: false })

    if (error) throw error

    const postsNeedingSeo = (posts || []).filter(p => {
      const seo = p.seo as Record<string, unknown> | null
      return !seo || !seo.metaTitle
    })

    if (postsNeedingSeo.length === 0) {
      return NextResponse.json({ processed: 0, total: 0, failed: 0, errors: [], message: 'Wszystkie artykuły mają już SEO.' })
    }

    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const post of postsNeedingSeo) {
      try {
        const seoData = await generateSeoForPost(post.title, post.excerpt, post.content, apiKey)
        await supabase.from('posts').update({ seo: seoData }).eq('id', post.id)
        processed++
        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        failed++
        errors.push(`${post.title}: ${err instanceof Error ? err.message : 'błąd'}`)
      }
    }

    return NextResponse.json({ total: postsNeedingSeo.length, processed, failed, errors: errors.slice(0, 5) })
  } catch (error) {
    console.error('[seo-backfill] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd backfill SEO' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: posts } = await supabase
    .from('posts')
    .select('id, seo')

  const total = posts?.length ?? 0
  const withSeo = (posts || []).filter(p => {
    const seo = p.seo as Record<string, unknown> | null
    return seo && seo.metaTitle
  }).length

  return NextResponse.json({ total, withSeo, withoutSeo: total - withSeo })
}
