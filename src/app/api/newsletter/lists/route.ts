import { NextResponse } from 'next/server'
import { getLists, createList } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const lists = await getLists()
    return NextResponse.json(lists)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blad pobierania list Brevo' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Podaj nazwe listy' }, { status: 400 })
    }
    const list = await createList(name.trim())
    return NextResponse.json(list, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blad tworzenia listy Brevo' },
      { status: 500 }
    )
  }
}
