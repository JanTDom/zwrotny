import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


/**
 * POST /api/fb/select-page
 * Body: { pageId, pageName, pageToken }
 * Saves selected page to DB.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { pageId, pageName, pageToken } = await req.json()
  if (!pageId || !pageToken) {
    return NextResponse.json({ error: 'Missing pageId or pageToken' }, { status: 400 })
  }
  await supabase.from('fb_connection').upsert({
    id: 1,
    page_id: pageId,
    page_name: pageName,
    page_access_token: pageToken,
  })
  return NextResponse.json({ ok: true })
}
