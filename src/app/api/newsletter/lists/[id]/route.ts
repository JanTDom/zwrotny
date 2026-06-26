import { NextResponse } from 'next/server'
import { deleteList } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteList(Number(id))
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blad usuwania listy Brevo' },
      { status: 500 }
    )
  }
}
