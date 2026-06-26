import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


async function getOpenAIKey(): Promise<string | null> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'openai_api_key')
    .single()
  return data?.value ?? process.env.OPENAI_API_KEY ?? null
}

const PORTAL_TONE = `Jestes ekspertem od komunikacji dla portalu Zwrotny.pl — polskiego serwisu o systemie kaucyjnym, recyklingu opakowa i gospodarce cyrkularnej.
Twoj ton: ekspercki, ale przystepny. Angazu cy, z lekka nutka aktywizmu proekologicznego. Bez korporacyjnego jezyka.
Portal kieruje sie haslem: "Wiemy co wrocic. Wiemy dlaczego."
`

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { title, excerpt, postUrl, tags } = await req.json()

  if (!title) return NextResponse.json({ error: 'Brak tytulu' }, { status: 400 })

  const apiKey = await getOpenAIKey()
  if (!apiKey) return NextResponse.json({ error: 'Brak klucza OpenAI API. Skonfiguruj go w ustawieniach CMS.' }, { status: 500 })

  const prompt = `${PORTAL_TONE}

Na podstawie ponizszego artykulu z Zwrotny.pl wygeneruj angazu cy wpis na strone Facebook portalu.

Tytul artykulu: ${title}
${excerpt ? `Lead/zajawka: ${excerpt}` : ''}
${tags?.length ? `Tagi artykulu: ${tags.join(', ')}` : ''}

Wymagania wobec wpisu:
1. Glowna tresc: max 220 znakow (bez hashtagow i URL). Ma byc angazu ca, zadawac pytanie lub podawac zadziwiajacy fakt.
2. Oddzielna linia z 4-6 hashtagami po polsku i angielsku. Zawsze uzyj: #SystemKaucyjny #Recykling. Dodaj tematyczne np. #Kaucja #PPWR #GOZ #DepositReturn #CircularEconomy.
3. Nie dodawaj URL — system doda automatycznie.
4. Nie uzywaj emoji (chyba ze 1 odpowiedni na poczatku).
5. Styl: krotkie zdania, aktywna forma, bez korporacyjnego jezyka.

Odpowiedz TYLKO tekstem wpisu (tresc + hashtagi). Zadnych komentarzy.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 350,
      temperature: 0.75,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return NextResponse.json({ error: err?.error?.message ?? 'Blad OpenAI API' }, { status: 500 })
  }

  const data = await response.json()
  const caption = data.choices?.[0]?.message?.content?.trim() ?? ''

  // Append post URL if provided
  const fullCaption = postUrl ? `${caption}\n\n${postUrl}` : caption

  return NextResponse.json({ caption: fullCaption })
}
