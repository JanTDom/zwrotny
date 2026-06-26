import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


/**
 * POST /api/fb/disconnect
 * Clears stored Facebook tokens from DB.
 */
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase.from('fb_connection').upsert({
    id: 1,
    page_id: null,
    page_name: null,
    page_access_token: null,
    user_access_token: null,
    connected_at: null,
    expires_at: null,
  })
  return NextResponse.json({ ok: true })
}
