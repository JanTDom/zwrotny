import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { data: doc } = await supabase
      .from('documents')
      .select('file_pathname')
      .eq('id', id)
      .single()

    if (doc?.file_pathname) {
      await supabase.storage.from('documents').remove([doc.file_pathname])
    }

    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document DELETE error:', error)
    return NextResponse.json({ error: 'Błąd usuwania dokumentu' }, { status: 500 })
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

    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Document PATCH error:', error)
    return NextResponse.json({ error: 'Błąd aktualizacji dokumentu' }, { status: 500 })
  }
}
