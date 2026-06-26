import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/resend'

export const dynamic = 'force-dynamic'


export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}?newsletter=unsubscribe-error`)
  }

  const { data: tokenRow } = await supabase
    .from('email_unsubscribe_tokens')
    .select('id, subscriber_id, used_at')
    .eq('token', token)
    .single()

  if (!tokenRow) {
    return NextResponse.redirect(`${SITE_URL}?newsletter=unsubscribe-error`)
  }

  await supabase
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', tokenRow.subscriber_id)

  if (!tokenRow.used_at) {
    await supabase
      .from('email_unsubscribe_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)
  }

  return NextResponse.redirect(`${SITE_URL}?newsletter=unsubscribed`)
}
