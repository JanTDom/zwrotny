import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get('prefix') ?? ''

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase.storage
    .from('images')
    .list(prefix, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images`
  const files = (data ?? []).map(f => ({
    name: f.name,
    url: `${baseUrl}/${prefix ? prefix + '/' : ''}${f.name}`,
    size: f.metadata?.size,
    created_at: f.created_at,
  }))

  return NextResponse.json({ files, prefix })
}
