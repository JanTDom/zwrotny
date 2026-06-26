import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase.storage
    .from('images')
    .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images`
  const files = (data ?? []).map(f => ({
    name: f.name,
    url: `${baseUrl}/${f.name}`,
    size: f.metadata?.size,
    created_at: f.created_at,
  }))

  return NextResponse.json({ files })
}
