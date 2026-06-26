import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()
    const { customPrompt, sourceTitle, sourceContent } = body
    
    console.log('[AI Generate] Received request')
    console.log('[AI Generate] Custom prompt:', customPrompt || '(none)')
    
    // Get OpenAI key from settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'apiConfigs')
      .single()
    
    let openAIKey = ''
    if (settingsData?.value) {
      const configs = settingsData.value as { envKey: string; value: string }[]
      const openaiConfig = configs.find(c => c.envKey === 'OPENAI_API_KEY')
      if (openaiConfig?.value) {
        openAIKey = openaiConfig.value
      }
    }
    
    if (!openAIKey) {
      return NextResponse.json({ error: 'Brak klucza OpenAI API' }, { status: 400 })
    }
    
    // Get prompts from settings
    let globalPrompt = ''
    let articlePrompt = ''
    
    const { data: promptsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'prompts')
      .single()
    
    if (promptsData?.value) {
      // Prompts are stored either directly or nested under "prompts" key
      const val = promptsData.value as Record<string, unknown>
      const prompts = (val.prompts as Record<string, string>) ?? (val as Record<string, string>)
      globalPrompt = prompts.globalSystemPrompt || ''
      articlePrompt = prompts.articlePrompt || ''
    }


    const trimmedCustom = customPrompt?.trim() || ''

    // System prompt: use saved global prompt or default
    const systemPrompt = globalPrompt ||
      `Jesteś redaktorem serwisu o systemie kaucyjnym w Polsce. Piszesz dla zwykłych ludzi — konsumentów, którzy nie są prawnikami ani ekonomistami. Twój język jest prosty, konkretny i ludzki. Tłumaczysz zawiłości tak, żeby każdy zrozumiał.

ŻELAZNE ZASADY STYLU (łamanie ich jest niedopuszczalne):
1. Zdania krótkie — maksimum 20 słów. Długie zdanie? Podziel na dwa.
2. Słowa proste — zamiast "implementacja" napisz "wdrożenie", zamiast "konsument" napisz "klient" albo "ty".
3. Zero urzędowego żargonu — zakaz: "warto zaznaczyć", "należy podkreślić", "co jest istotne", "warto zauważyć", "w kontekście", "w związku z powyższym", "przedmiotowy".
4. Aktywna forma — zamiast "zostało wprowadzone" napisz "rząd wprowadził".
5. Zamiłość do konkretu — liczby, daty, kwoty. Nie "duże kary" tylko "kary do 500 zł".
6. Tłumacz przez analogie — jeśli coś jest skomplikowane, użyj porównania z codziennym życiem.
7. Zacznij mocno — pierwsze zdanie musi wciągnąć, nie streszczać.`

    // Build style block — custom prompt overrides articlePrompt
    const styleBlock = trimmedCustom
      ? `DODATKOWE INSTRUKCJE REDAKTORA (mają NAJWYŻSZY priorytet):\n${trimmedCustom}`
      : articlePrompt
        ? `DODATKOWE WYTYCZNE REDAKCYJNE:\n${articlePrompt}`
        : `Długość artykułu: 400–700 słów.`

    const userMessage = `MATERIAŁ ŹRÓDŁOWY:
Tytuł: ${sourceTitle}
Treść: ${sourceContent}

---

${styleBlock}

---

ZADANIE: Napisz artykuł na podstawie powyższego materiału. Stosuj się ściśle do zasad stylu z instrukcji systemowej — prosty język, krótkie zdania, zero żargonu.

WYMAGANY FORMAT ODPOWIEDZI (dokładnie ta struktura, bez odstępstw):
---TYTUŁ---
[Chwytliwy tytuł — maksymalnie 80 znaków, BEZ tagów HTML ani Markdown]

---ZAJAWKA---
[1–2 zdania zachęcające do czytania, BEZ tagów HTML ani Markdown]

---TREŚĆ---
[Pełna treść artykułu jako czysty HTML.

ZASADY HTML:
- Dozwolone tagi: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote>
- BEZ Markdown, BEZ atrybutów class/style/id, BEZ tagów <html>/<body>/<div>
- Każdy akapit w osobnym <p>...</p>
- Pogrubienie: <strong> | kursywa: <em> | cytaty: <blockquote>

ŚRÓDTYTUŁY — WYMÓG BEZWZGLĘDNY:
Wstaw DOKŁADNIE 2 tagi <h2> z PRAWDZIWĄ treścią nawiązującą do artykułu.
WAŻNE: śródtytuły MUSZĄ być konkretne i odnosić się do treści artykułu.
Przykładowa struktura (TYLKO STRUKTURA — wypełnij własną treścią):
<p>pierwszy akapit wprowadzający</p>
<p>drugi akapit rozwijający</p>
<h2>Konkretny nagłówek nawiązujący do tego co poniżej</h2>
<p>trzeci akapit</p>
<p>czwarty akapit</p>
<h2>Drugi konkretny nagłówek nawiązujący do treści</h2>
<p>piąty akapit</p>
<p>szósty akapit zamykający</p>

Artykuł bez dwóch tagów <h2> z prawdziwą treścią jest nieprawidłowy.]`

    console.log('[AI Generate] Sending to OpenAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.85,
        max_tokens: 3000,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Generate] OpenAI error:', errorText)
      return NextResponse.json({ error: `OpenAI error: ${response.status}` }, { status: 500 })
    }
    
    const data = await response.json()
    const rawContent = data.choices[0]?.message?.content || ''
    
    console.log('[AI Generate] Success! Content length:', rawContent.length)
    
    // Parse the structured response
    let title = ''
    let excerpt = ''
    let content = ''
    
    // Extract title
    const titleMatch = rawContent.match(/---TYTUŁ---\s*([\s\S]*?)(?=---ZAJAWKA---|$)/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
    }
    
    // Extract excerpt
    const excerptMatch = rawContent.match(/---ZAJAWKA---\s*([\s\S]*?)(?=---TREŚĆ---|$)/i)
    if (excerptMatch) {
      excerpt = excerptMatch[1].trim()
    }
    
    // Extract content
    const contentMatch = rawContent.match(/---TREŚĆ---\s*([\s\S]*?)$/i)
    if (contentMatch) {
      content = contentMatch[1].trim()
    }

    // Fallback: if parsing failed, use whole response as content
    if (!content && !title) {
      content = rawContent
    }

    // Strip any code fences the model may have wrapped around the HTML
    content = content.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim()

    // Convert leftover Markdown headings/bold/italic to HTML
    content = content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Ensure block tags are on their own lines, then wrap bare text in <p>.
    // We insert newlines BEFORE opening tags and AFTER closing tags,
    // then split and only wrap lines that are pure text (not already a tag).
    content = content
      // newline before every opening block tag
      .replace(/(<(h[1-6]|p|ul|ol|li|blockquote)(\s[^>]*)?>)/g, '\n$1')
      // newline after every closing block tag
      .replace(/(<\/(h[1-6]|p|ul|ol|li|blockquote)>)/g, '$1\n')
      .split('\n')
      .map(line => {
        const trimmed = line.trim()
        if (!trimmed) return ''
        // Already starts with a block tag — keep as-is
        if (/^<\/?(?:h[1-6]|p|ul|ol|li|blockquote)/.test(trimmed)) return trimmed
        // Bare text — wrap in <p>
        return `<p>${trimmed}</p>`
      })
      .filter(Boolean)
      .join('\n')
    
    return NextResponse.json({ 
      success: true, 
      title,
      excerpt,
      content,
      promptUsed: customPrompt || '(default)'
    })
    
  } catch (error) {
    console.error('[AI Generate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
