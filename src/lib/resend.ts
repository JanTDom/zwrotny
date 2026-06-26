import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getResendApiKey(): Promise<string | null> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'resend_api_key')
    .single()
  return data?.value ?? process.env.RESEND_API_KEY ?? null
}

export async function getResendClient(): Promise<Resend | null> {
  const key = await getResendApiKey()
  if (!key) return null
  return new Resend(key)
}

export const SENDER_DEFAULT = 'Zwrotny.pl <info@zwrotny.pl>'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zwrotny.pl'

// Batch-send with rate limiting (50 per batch, 200ms between batches)
export async function sendInBatches(
  emails: Array<{ to: string; subject: string; html: string; text?: string }>,
  from: string = SENDER_DEFAULT,
  batchSize = 50
): Promise<{ sent: number; errors: number }> {
  const resend = await getResendClient()
  if (!resend) throw new Error('Brak klucza Resend API. Skonfiguruj go w ustawieniach newslettera.')

  let sent = 0
  let errors = 0

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (email) => {
        try {
          const { error } = await resend.emails.send({
            from,
            to: email.to,
            subject: email.subject,
            html: email.html,
            text: email.text,
          })
          if (error) errors++
          else sent++
        } catch {
          errors++
        }
      })
    )
    // Rate limit pause between batches
    if (i + batchSize < emails.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return { sent, errors }
}

// Generate or retrieve the unsubscribe token for a subscriber
export async function getOrCreateUnsubscribeToken(subscriberId: string): Promise<string> {
  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('subscriber_id', subscriberId)
    .single()

  if (existing?.token) return existing.token

  const token = crypto.randomUUID().replace(/-/g, '')
  await supabase.from('email_unsubscribe_tokens').insert({ subscriber_id: subscriberId, token })
  return token
}

// Build HTML for confirmation email
export function buildConfirmEmailHtml(confirmUrl: string, firstName?: string): string {
  const name = firstName ? `, ${firstName}` : ''
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Potwierdz subskrypcje</title></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0ea5e9;padding:28px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.5px;">Zwrotny.pl</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">System kaucyjny &bull; Recykling &bull; GOZ</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b;">Potwierdz swoj zapis${name}</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Kliknij przycisk ponizej, aby potwierdzic subskrypcje newslettera Zwrotny.pl. Bedziesz otrzymywac najnowsze informacje o systemie kaucyjnym, recyklingu i gospodarce cyrkularne w Polsce i UE.</p>
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="${confirmUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Potwierdz subskrypcje</a>
          </td></tr></table>
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;line-height:1.5;">Jezeli nie zapisywales sie do newslettera, zignoruj te wiadomosc. Link jest wazny przez 48 godzin.</p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">Zwrotny.pl &bull; Serwis o systemie kaucyjnym w Polsce</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// Build HTML for a campaign email
export function buildCampaignEmailHtml(opts: {
  subject: string
  htmlContent: string
  unsubscribeUrl: string
  siteUrl?: string
}): string {
  const { subject, htmlContent, unsubscribeUrl, siteUrl = SITE_URL } = opts
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0ea5e9;padding:28px 40px;">
          <a href="${siteUrl}" style="text-decoration:none;">
            <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.5px;">Zwrotny.pl</h1>
            <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:12px;">System kaucyjny &bull; Recykling &bull; GOZ</p>
          </a>
        </td></tr>
        <tr><td style="padding:40px;">
          <div style="color:#1e293b;line-height:1.7;font-size:15px;">
            ${htmlContent}
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;">
            Zwrotny.pl &bull; Serwis o systemie kaucyjnym w Polsce<br>
            <a href="${unsubscribeUrl}" style="color:#64748b;text-decoration:underline;">Wypisz sie z newslettera</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
