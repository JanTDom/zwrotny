import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { data: dl } = await supabase
      .from('downloads')
      .select('file_pathname')
      .eq('id', id)
      .single()

    if (dl?.file_pathname) {
      await supabase.storage.from('downloads').remove([dl.file_pathname])
    }

    const { error } = await supabase.from('downloads').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Download DELETE error:', error)
    return NextResponse.json({ error: 'Błąd usuwania pliku' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    const body = await request.json()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.order !== undefined) updateData.order = body.order

    const { data, error } = await supabase
      .from('downloads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Download PATCH error:', error)
    return NextResponse.json({ error: 'Błąd aktualizacji pliku' }, { status: 500 })
  }
}
