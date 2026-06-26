import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
// Allow up to 60s for fetching and processing video thumbnail
export const maxDuration = 60

// POST { id, thumbnailDataUrl } — client sends canvas dataURL, server saves to Storage and updates DB
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { id, thumbnailDataUrl } = await request.json()
    if (!id || !thumbnailDataUrl) {
      return NextResponse.json({ error: 'Brak id lub thumbnailDataUrl' }, { status: 400 })
    }

    // Convert base64 data URL to buffer
    const base64 = thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    const supabase = createServiceClient()
    const filename = `thumb-${id}-${Date.now()}.jpg`
    const storagePath = `thumbnails/${filename}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(storagePath)
    const publicUrl = urlData.publicUrl

    const { error: dbError } = await supabase
      .from('filmy')
      .update({ thumbnail_url: publicUrl })
      .eq('id', id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    return NextResponse.json({ thumbnailUrl: publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Blad' }, { status: 500 })
  }
}
