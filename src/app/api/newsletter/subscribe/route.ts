import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendTransactionalEmail as sendMail,
  SENDER_DEFAULT,
  SITE_URL,
  buildConfirmEmailHtml,
  addContactToList,
} from '@/lib/brevo'
import { getOrCreateUnsubscribeToken } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

// Domyslna lista Brevo "Newsletter" — ustaw BREVO_NEWSLETTER_LIST_ID w env
const DEFAULT_LIST_ID = Number(process.env.BREVO_NEWSLETTER_LIST_ID ?? 0)

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { email, firstName, source = 'form', tags = [] } = await req.json()

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Podaj poprawny adres email.' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, confirmed, unsubscribed_at')
    .eq('email', normalizedEmail)
    .single()

  if (existing) {
    if (existing.confirmed && !existing.unsubscribed_at) {
      return NextResponse.json({ error: 'Ten adres email jest juz zapisany do newslettera.' }, { status: 409 })
    }
    await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: null, confirmed: false, first_name: firstName ?? null, tags })
      .eq('id', existing.id)
    await sendConfirmEmail(existing.id, normalizedEmail, firstName)
    return NextResponse.json({ ok: true, message: 'Wyslalismy nowy email potwierdzajacy.' })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? null

  const { data: subscriber, error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: normalizedEmail, first_name: firstName ?? null, source, tags, ip_address: ip })
    .select('id')
    .single()

  if (error || !subscriber) {
    return NextResponse.json({ error: 'Blad zapisu. Sprobuj ponownie.' }, { status: 500 })
  }

  // Dodaj do Brevo (bez blokowania — nie wazniejse niz potwierdzenie)
  if (DEFAULT_LIST_ID) {
    addContactToList(normalizedEmail, DEFAULT_LIST_ID, firstName).catch((e) =>
      console.error('[brevo] addContactToList error:', e)
    )
  }

  await sendConfirmEmail(subscriber.id, normalizedEmail, firstName)
  return NextResponse.json({ ok: true, message: 'Sprawdz skrzynke — wyslalismy email z potwierdzeniem.' })
}

async function sendConfirmEmail(subscriberId: string, email: string, firstName?: string) {
  await getOrCreateUnsubscribeToken(subscriberId)
  const confirmToken = Buffer.from(`${subscriberId}:confirm`).toString('base64url')
  const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${confirmToken}`
  await sendMail({
    to: email,
    subject: 'Potwierdz subskrypcje newslettera Zwrotny.pl',
    html: buildConfirmEmailHtml(confirmUrl, firstName),
  })
}
