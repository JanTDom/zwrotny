import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/mailer'

export const dynamic = 'force-dynamic'


export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}?newsletter=error`)
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const [subscriberId, marker] = decoded.split(':')

    if (marker !== 'confirm' || !subscriberId) {
      return NextResponse.redirect(`${SITE_URL}?newsletter=error`)
    }

    const { data: subscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id, confirmed')
      .eq('id', subscriberId)
      .single()

    if (!subscriber) {
      return NextResponse.redirect(`${SITE_URL}?newsletter=error`)
    }

    if (!subscriber.confirmed) {
      await supabase
        .from('newsletter_subscribers')
        .update({ confirmed: true, confirmed_at: new Date().toISOString() })
        .eq('id', subscriberId)
    }

    return NextResponse.redirect(`${SITE_URL}?newsletter=confirmed`)
  } catch {
    return NextResponse.redirect(`${SITE_URL}?newsletter=error`)
  }
}
