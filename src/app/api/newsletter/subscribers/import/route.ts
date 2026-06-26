import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { importContactsToList } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const body = await req.json()
  const { rows, brevoListId } = body // [{ email, firstName?, tags? }]

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Brak danych do importu' }, { status: 400 })
  }

  const toInsert = rows
    .filter(r => r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email))
    .map(r => ({
      email: r.email.trim().toLowerCase(),
      first_name: r.firstName ?? r.first_name ?? null,
      tags: r.tags ?? [],
      source: 'import' as const,
      confirmed: true,
      confirmed_at: new Date().toISOString(),
    }))

  if (!toInsert.length) {
    return NextResponse.json({ error: 'Brak poprawnych adresow email w danych.' }, { status: 400 })
  }

  // Upsert do Supabase
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .upsert(toInsert, { onConflict: 'email', ignoreDuplicates: true })
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Synchronizuj z Brevo (jesli podano listId)
  let brevoResult: { processId: number } | null = null
  if (brevoListId) {
    try {
      brevoResult = await importContactsToList(
        toInsert.map(r => ({ email: r.email, firstName: r.first_name ?? undefined })),
        Number(brevoListId)
      )
    } catch (brevoErr) {
      console.error('[brevo] importContactsToList error:', brevoErr)
      // Nie blokuj — Supabase import sie udal
    }
  }

  return NextResponse.json({
    imported: data?.length ?? toInsert.length,
    total: rows.length,
    brevo: brevoResult ? { processId: brevoResult.processId } : null,
  })
}
