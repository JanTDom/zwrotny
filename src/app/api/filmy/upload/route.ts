import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// Two modes:
// 1. JSON body {title, pathname, publicUrl} — after client direct-upload via signed URL
// 2. FormData {file, title} — server-side upload (fallback for small files)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentType = request.headers.get('content-type') || ''

  try {
    const supabase = createServiceClient()

    // Mode 1: JSON — client already uploaded, just register in DB
    if (contentType.includes('application/json')) {
      const { title, pathname, publicUrl, thumbnailUrl } = await request.json()
      if (!pathname || !publicUrl) {
        return NextResponse.json({ error: 'Brak pathname lub publicUrl' }, { status: 400 })
      }

      const finalTitle = (title || '').trim() || pathname.split('/').pop()?.replace(/\.[^.]+$/i, '') || 'Film'

      const { error } = await supabase.from('filmy').insert({
        title: finalTitle,
        video_url: publicUrl,
        video_pathname: pathname,
        thumbnail_url: thumbnailUrl || null,
        is_active: true,
        order: 0,
      })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ url: publicUrl, pathname })
    }

    // Mode 2: FormData — server-side upload (limited to small files on Vercel)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string | null) || ''

    if (!file) return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })

    const allowed = ['video/mp4', 'video/quicktime', 'video/webm']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|mov|webm)$/i)) {
      return NextResponse.json({ error: 'Tylko pliki wideo (MP4, MOV, WEBM)' }, { status: 400 })
    }

    const ts = Date.now()
    const rand = Math.random().toString(36).slice(2, 8)
    const ext = file.name.split('.').pop() || 'mp4'
    const filename = `video-${ts}-${rand}.${ext}`
    const storagePath = `filmy/${filename}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, arrayBuffer, { contentType: file.type || 'video/mp4', upsert: false })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(storagePath)
    const publicUrl = urlData.publicUrl
    const finalTitle = title.trim() || file.name.replace(/\.[^.]+$/i, '').replace(/[-_]/g, ' ').trim()

    const { error: dbError } = await supabase.from('filmy').insert({
      title: finalTitle,
      video_url: publicUrl,
      video_pathname: storagePath,
      is_active: true,
      order: 0,
    })

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ url: publicUrl, pathname: storagePath })
  } catch (error: any) {
    console.error('[v0] filmy upload error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Blad uploadu' }, { status: 500 })
  }
}
