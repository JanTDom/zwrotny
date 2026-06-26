import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/serverless-client'
import { createServiceClient } from '@/lib/supabase/service'

fal.config({ credentials: process.env.FAL_KEY })

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { prompt, articleTitle, articleContent } = await request.json()

    // Build the final prompt — if nothing given, auto-build from article context
    let finalPrompt = prompt?.trim()
    if (!finalPrompt) {
      if (articleTitle) {
        const contextSnippet = articleContent
          ? articleContent.replace(/<[^>]+>/g, '').slice(0, 300)
          : ''
        finalPrompt = `High-quality editorial press photo illustrating a Polish news article titled: "${articleTitle}".${contextSnippet ? ` Context: ${contextSnippet}` : ''} Style: clean photojournalism, natural lighting, no text overlays, no logos.`
      } else {
        return NextResponse.json(
          { error: 'Wpisz opis obrazu lub otwórz modal z poziomu artykułu — tytuł wygeneruje prompt automatycznie.' },
          { status: 400 }
        )
      }
    }

    // Generate image with fal.ai flux/pro — high quality editorial photos
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: finalPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        num_images: 1,
        enable_safety_checker: true,
      },
    }) as { images?: { url: string }[] }

    const tempUrl = result.images?.[0]?.url
    if (!tempUrl) {
      return NextResponse.json({ error: 'Nie otrzymano obrazu z fal.ai' }, { status: 500 })
    }

    // Download the image and upload to Supabase Storage for permanent hosting
    const imgRes = await fetch(tempUrl)
    if (!imgRes.ok) {
      return NextResponse.json({
        imageUrl: tempUrl,
        warning: 'Obraz tymczasowy — nie udało się zapisać trwale.',
      })
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer())
    const filename = `ai-image-${Date.now()}.png`
    const supabase = createServiceClient()

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filename, buffer, { contentType: 'image/png', upsert: false })

    if (uploadError) {
      console.error('[v0] Supabase upload error:', uploadError.message)
      // Return fal URL as fallback — it persists for a while
      return NextResponse.json({ imageUrl: tempUrl, warning: 'Nie udało się zapisać trwale.' })
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename)
    return NextResponse.json({ imageUrl: urlData.publicUrl })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Błąd generowania obrazu'
    console.error('[v0] Image generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
