import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('title', `%${search}%`)
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ error: 'Błąd pobierania dokumentów' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: body.title,
        description: body.description || null,
        file_url: body.fileUrl,
        file_pathname: body.filePathname,
        file_type: body.fileType || 'application/pdf',
        file_size_bytes: body.fileSizeBytes || null,
        category: body.category || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Documents POST error:', error)
    return NextResponse.json({ error: 'Błąd dodawania dokumentu' }, { status: 500 })
  }
}
