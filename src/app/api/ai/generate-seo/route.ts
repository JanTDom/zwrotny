import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

async function getOpenAIKey(): Promise<string> {
  // Try env var first (set on Vercel), then fall back to Supabase settings
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase.from('settings').select('value').eq('key', 'apiConfigs').single()
  if (data?.value) {
    const configs = data.value as { envKey: string; value: string }[]
    const match = configs.find(c => c.envKey === 'OPENAI_API_KEY')
    if (match?.value) return match.value
  }
  return ''
}

export async function POST(request: NextRequest) {
  try {
    const { title, excerpt, content } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Brak tytułu artykułu' }, { status: 400 })
    }

    const apiKey = await getOpenAIKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'Brak klucza OpenAI. Ustaw go w Ustawienia → API.' }, { status: 400 })
    }

    const plainContent = (content || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500)

    const systemPrompt = `Jesteś ekspertem SEO dla polskiego serwisu Zwrotny.pl o systemie kaucyjnym i recyklingu.
Generujesz metadane zoptymalizowane pod Google Search. Odpowiadasz TYLKO poprawnym JSON, zero innych słów.
Zasady:
- metaTitle: MAKSYMALNIE 60 znaków, naturalna fraza, zawiera główne słowo kluczowe
- metaDescription: DOKŁADNIE 140-160 znaków, aktywny głos (Dowiedz się / Sprawdź / Przeczytaj), zawiera słowo kluczowe
- keywords: 5-8 konkretnych fraz które Polacy wpisują w Google
- focusKeyword: musi wystąpić w metaTitle i metaDescription
- seoScore: realnie 60-75 dobry, 76-90 świetny, 90+ tylko perfekcyjny`

    const userPrompt = `Tytuł: ${title}
Zajawka: ${excerpt || '(brak)'}
Treść: ${plainContent || '(brak)'}

Zwróć JSON:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["...", "..."],
  "ogTitle": "...",
  "ogDescription": "...",
  "focusKeyword": "...",
  "seoScore": 0
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message || 'Błąd OpenAI' }, { status: response.status })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || '{}'
    const seo = JSON.parse(raw)

    return NextResponse.json({
      metaTitle: seo.metaTitle || '',
      metaDescription: seo.metaDescription || '',
      keywords: Array.isArray(seo.keywords) ? seo.keywords : [],
      ogTitle: seo.ogTitle || seo.metaTitle || '',
      ogDescription: seo.ogDescription || seo.metaDescription || '',
      focusKeyword: seo.focusKeyword || '',
      seoScore: typeof seo.seoScore === 'number' ? seo.seoScore : null,
    })
  } catch (error) {
    console.error('[generate-seo] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd generowania SEO' },
      { status: 500 }
    )
  }
}
