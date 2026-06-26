import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']
    const videoExtensions = ['mp4', 'webm', 'ogg']
    const allowedExtensions = [...imageExtensions, ...videoExtensions]

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json({
        error: `Niedozwolony format pliku (.${extension}). Dozwolone: PNG, JPG, WebP, GIF, SVG, MP4, WebM`
      }, { status: 400 })
    }

    const isVideo = videoExtensions.includes(extension)
    const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `Plik jest za duzy. Maksymalny rozmiar: ${isVideo ? '500MB' : '10MB'}`
      }, { status: 400 })
    }

    const timestamp = Date.now()
    const rand = Math.random().toString(36).substring(2, 8)
    const filename = `uploads/${timestamp}-${rand}.${extension}`
    const bucket = isVideo ? 'videos' : 'images'

    const supabase = createServiceClient()
    const arrayBuffer = await file.arrayBuffer()

    const contentTypeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
      mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg',
    }
    const contentType = contentTypeMap[extension] || file.type || 'application/octet-stream'

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, arrayBuffer, { contentType, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename)

    // For backward compatibility return url as the serve route URL (images)
    // and also the direct publicUrl
    const serveUrl = isVideo
      ? urlData.publicUrl
      : `/api/images/serve?pathname=${encodeURIComponent(filename)}`

    return NextResponse.json({
      url: serveUrl,
      publicUrl: urlData.publicUrl,
      pathname: filename,
      size: file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Blad uploadu'
    }, { status: 500 })
  }
}

