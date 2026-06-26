import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const maxDuration = 60

async function getOpenAIKey(): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'apiConfigs')
    .maybeSingle()
  if (!data?.value) return null
  const configs = data.value as { envKey: string; value: string }[]
  return configs.find(c => c.envKey === 'OPENAI_API_KEY')?.value || null
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, style = 'photo' } = await request.json()

    if (!imageUrl) return NextResponse.json({ error: 'Brak URL zdjecia' }, { status: 400 })

    const apiKey = await getOpenAIKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Brak klucza OpenAI API - ustaw go w Ustawieniach API' },
        { status: 400 }
      )
    }

    // Build enhancement prompt
    const stylePrompts: Record<string, string> = {
      photo: 'Make this a professional, high-quality editorial photo. Improve lighting, contrast, and composition. Keep it photorealistic.',
      vibrant: 'Make the colors more vibrant and saturated. Enhance the visual impact. Keep photorealistic quality.',
      minimal: 'Make this clean and minimalist. Reduce visual noise, improve whitespace and composition.',
      dramatic: 'Add dramatic lighting and cinematic mood. Deep shadows, strong contrast, cinematic color grading.',
      natural: 'Make this look like a natural, candid photo. Soft natural light, authentic feel.',
    }

    const enhancementInstruction = prompt?.trim()
      ? prompt.trim()
      : (stylePrompts[style] || stylePrompts.photo)

    const fullPrompt = `${enhancementInstruction} The image should be suitable for an editorial article cover. Wide 16:9 format, professional quality, no text overlays.`

    // Download the source image
    const imgResponse = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZwrotnyBot/1.0)' },
    })
    if (!imgResponse.ok) {
      return NextResponse.json({ error: 'Nie mozna pobrac zdjecia zrodlowego' }, { status: 400 })
    }

    const imgBuffer = await imgResponse.arrayBuffer()
    const imgBlob = new Blob([imgBuffer], { type: 'image/png' })

    // Use DALL-E gpt-image-1 (variations/edits) — falls back to pure generation if image edit fails
    // Since gpt-image-1 supports image input natively, use the images/edits endpoint
    const formData = new FormData()
    formData.append('image', imgBlob, 'source.png')
    formData.append('prompt', fullPrompt)
    formData.append('n', '1')
    formData.append('size', '1792x1024')
    formData.append('model', 'gpt-image-1')

    const editResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    })

    let generatedUrl: string | null = null

    if (editResponse.ok) {
      const editData = await editResponse.json()
      // gpt-image-1 returns base64
      const b64 = editData.data?.[0]?.b64_json
      if (b64) {
        // Upload base64 to Supabase storage
        const binaryStr = atob(b64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
        const buffer = bytes.buffer

        const filename = `enhanced-${Date.now()}.png`
        const supabase = createServiceClient()
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filename, buffer, { contentType: 'image/png', upsert: false })

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename)
          generatedUrl = urlData.publicUrl
        }
      }
    }

    if (!generatedUrl) {
      // Fallback: generate new image based on prompt only (DALL-E 3)
      const genRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: fullPrompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
        }),
      })

      if (!genRes.ok) {
        const errData = await genRes.json()
        return NextResponse.json(
          { error: errData.error?.message || 'Blad AI enhancement' },
          { status: 500 }
        )
      }

      const genData = await genRes.json()
      const tempUrl = genData.data?.[0]?.url
      if (!tempUrl) return NextResponse.json({ error: 'Blad AI - brak URL' }, { status: 500 })

      // Upload to Supabase
      const dlRes = await fetch(tempUrl)
      if (dlRes.ok) {
        const buf = await dlRes.arrayBuffer()
        const filename = `enhanced-${Date.now()}.png`
        const supabase = createServiceClient()
        const { error: uploadErr } = await supabase.storage
          .from('images')
          .upload(filename, buf, { contentType: 'image/png', upsert: false })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename)
          generatedUrl = urlData.publicUrl
        } else {
          generatedUrl = tempUrl
        }
      } else {
        generatedUrl = tempUrl
      }
    }

    return NextResponse.json({ imageUrl: generatedUrl })
  } catch (err) {
    console.error('[enhance] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Nieznany blad' },
      { status: 500 }
    )
  }
}
