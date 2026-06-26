import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET - fetch filmy (public: only active; CMS ?all=1: all)
export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get('all') === '1'
    const supabase = createServiceClient()
    let query = supabase
      .from('filmy')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!all) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// PUT - update film (title, is_active, order)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, is_active, order } = body

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('filmy')
      .update({ title, is_active, order, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// DELETE - remove film + storage file
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Brak id' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch full record before deleting
    const { data: film } = await supabase
      .from('filmy')
      .select('video_url, video_pathname')
      .eq('id', id)
      .single()

    // Delete from database
    const { error } = await supabase.from('filmy').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Delete from Supabase Storage using video_pathname (format: bucket/file.mp4)
    if (film?.video_pathname) {
      try {
        const parts = film.video_pathname.split('/')
        const bucket = parts[0]
        const filePath = parts.slice(1).join('/')
        if (bucket && filePath) {
          await supabase.storage.from(bucket).remove([filePath])
        }
      } catch {}
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
