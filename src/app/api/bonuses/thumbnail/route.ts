import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const id = formData.get('id') as string | null
    const thumbnail = formData.get('thumbnail') as File | null

    if (!id || !thumbnail || thumbnail.size === 0) {
      return NextResponse.json({ error: 'Brak danych' }, { status: 400 })
    }

    const ts = Date.now()
    const blob = await put(`bonuses/thumb/${ts}.jpg`, thumbnail, {
      access: 'private',
      contentType: 'image/jpeg',
    })

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('bonuses')
      .update({ thumbnail_url: blob.pathname })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ url: blob.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Błąd' }, { status: 500 })
  }
}
