import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const fallback = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.zwrotny.pl'}/og-image.jpg`

  try {
    const { data: bonus } = await getSupabase()
      .from('bonuses')
      .select('thumbnail_url')
      .eq('id', id)
      .maybeSingle()

    if (!bonus?.thumbnail_url) {
      return NextResponse.redirect(fallback, { status: 302 })
    }

    // thumbnail_url is a public Supabase Storage URL — fetch directly
    const img = await fetch(bonus.thumbnail_url, { cache: 'no-store' })

    if (!img.ok) {
      return NextResponse.redirect(fallback, { status: 302 })
    }

    const buffer = await img.arrayBuffer()
    const contentType = img.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return NextResponse.redirect(fallback, { status: 302 })
  }
}
