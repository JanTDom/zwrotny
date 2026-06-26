import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 50)
  const search = searchParams.get('search') ?? ''
  const confirmed = searchParams.get('confirmed')
  const offset = (page - 1) * limit

  let query = supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) query = query.ilike('email', `%${search}%`)
  if (confirmed === 'true') query = query.eq('confirmed', true).is('unsubscribed_at', null)
  if (confirmed === 'false') query = query.eq('confirmed', false)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscribers: data, total: count, page, limit })
}

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { email, firstName, tags = [], source = 'manual' } = await req.json()
  if (!email) return NextResponse.json({ error: 'Brak emaila' }, { status: 400 })

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: email.trim().toLowerCase(), first_name: firstName ?? null, tags, source, confirmed: true, confirmed_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { ids } = await req.json()
  if (!ids?.length) return NextResponse.json({ error: 'Brak id' }, { status: 400 })
  const { error } = await supabase.from('newsletter_subscribers').delete().in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
