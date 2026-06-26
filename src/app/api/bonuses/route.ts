import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET - fetch bonuses (public: only active; CMS ?all=1: all)
export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get('all') === '1'
    const supabase = createServiceClient()
    let query = supabase
      .from('bonuses')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!all) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// PUT - update bonus (title, is_active, order, thumbnail_url)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, is_active, order, thumbnail_url } = body

    const supabase = createServiceClient()

    // Build update object — only include defined fields
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) update.title = title
    if (is_active !== undefined) update.is_active = is_active
    if (order !== undefined) update.order = order
    if (thumbnail_url !== undefined) update.thumbnail_url = thumbnail_url

    const { data, error } = await supabase
      .from('bonuses')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// DELETE - remove bonus + storage file
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Brak id' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch full record before deleting
    const { data: bonus } = await supabase
      .from('bonuses')
      .select('pdf_url, pdf_pathname')
      .eq('id', id)
      .single()

    // Delete from database
    const { error } = await supabase.from('bonuses').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Delete from Supabase Storage using pdf_pathname (format: bucket/file.pdf)
    if (bonus?.pdf_pathname) {
      try {
        const parts = bonus.pdf_pathname.split('/')
        const bucket = parts[0]
        const filePath = parts.slice(1).join('/')
        if (bucket && filePath) {
          await supabase.storage.from(bucket).remove([filePath])
        }
      } catch {}
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
