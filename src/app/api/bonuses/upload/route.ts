import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// Two modes:
// 1. JSON body {title, pathname, publicUrl} — after client direct-upload via signed URL
// 2. FormData {file, title} — server-side upload (fallback)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentType = request.headers.get('content-type') || ''

  try {
    const supabase = createServiceClient()

    // Mode 1: JSON — client already uploaded, just register in DB
    if (contentType.includes('application/json')) {
      const { title, pathname, publicUrl } = await request.json()
      if (!pathname || !publicUrl) {
        return NextResponse.json({ error: 'Brak pathname lub publicUrl' }, { status: 400 })
      }

      const finalTitle = (title || '').trim() || pathname.split('/').pop()?.replace(/\.pdf$/i, '') || 'Dokument'

      const { error } = await supabase.from('bonuses').insert({
        title: finalTitle,
        pdf_url: publicUrl,
        pdf_pathname: pathname,
        thumbnail_url: null,
        is_active: true,
        order: 0,
      })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ url: publicUrl, pathname })
    }

    // Mode 2: FormData — server-side upload
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string | null) || ''

    if (!file) return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Tylko pliki PDF' }, { status: 400 })
    }

    const ts = Date.now()
    const rand = Math.random().toString(36).slice(2, 8)
    const filename = `pdf-${ts}-${rand}.pdf`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('bonuses')
      .upload(filename, arrayBuffer, { contentType: 'application/pdf', upsert: false })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from('bonuses').getPublicUrl(filename)
    const publicUrl = urlData.publicUrl
    const finalTitle = title.trim() || file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim()

    const { error: dbError } = await supabase.from('bonuses').insert({
      title: finalTitle,
      pdf_url: publicUrl,
      pdf_pathname: filename,
      thumbnail_url: null,
      is_active: true,
      order: 0,
    })

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ url: publicUrl, pathname: filename })
  } catch (error: any) {
    console.error('[v0] bonuses upload error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Blad uploadu' }, { status: 500 })
  }
}
