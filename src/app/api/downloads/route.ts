import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query = supabase
      .from('downloads')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('title', `%${search}%`)
    if (category) query = query.eq('category', category)
    if (activeOnly) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Downloads GET error:', error)
    return NextResponse.json({ error: 'Błąd pobierania plików' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('downloads')
      .insert({
        title: body.title,
        description: body.description || null,
        file_url: body.fileUrl,
        file_pathname: body.filePathname,
        file_type: body.fileType || 'application/pdf',
        file_size_bytes: body.fileSizeBytes || null,
        category: body.category || null,
        is_active: true,
        order: 0,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Downloads POST error:', error)
    return NextResponse.json({ error: 'Błąd dodawania pliku' }, { status: 500 })
  }
}
