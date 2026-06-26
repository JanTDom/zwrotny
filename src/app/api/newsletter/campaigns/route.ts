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
  const status = searchParams.get('status')
  const offset = (page - 1) * limit

  let query = supabase
    .from('email_campaigns')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data, total: count, page, limit })
}

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const body = await req.json()
  const { title, subject, preheader, html_content, text_content, target_tags, post_id } = body

  if (!title || !subject || !html_content) {
    return NextResponse.json({ error: 'Brakuje wymaganych pol: title, subject, html_content' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({ title, subject, preheader, html_content, text_content, target_tags: target_tags ?? [], post_id: post_id ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
