import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export const SENDER_DEFAULT = 'Zwrotny.pl <redakcja@zwrotny.pl>'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zwrotny.pl'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'smtp_config')
    .single()

  if (data?.value) return data.value as SmtpConfig

  // Fallback: env vars
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: process.env.SMTP_SECURE !== 'false',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      fromName: process.env.SMTP_FROM_NAME ?? 'Zwrotny.pl',
      fromEmail: process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER,
    }
  }

  return null
}

export async function getMailTransporter(): Promise<nodemailer.Transporter | null> {
  const cfg = await getSmtpConfig()
  if (!cfg) return null

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  })
}

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig()
  if (!cfg) return { ok: false, error: 'Brak konfiguracji SMTP. Skonfiguruj go w Ustawieniach newslettera.' }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  })

  const from = opts.from ?? `${cfg.fromName} <${cfg.fromEmail}>`

  try {
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Blad wysylki' }
  }
}

export async function sendInBatches(
  emails: Array<{ to: string; subject: string; html: string; text?: string }>,
  from?: string,
  batchSize = 10
): Promise<{ sent: number; errors: number; lastError?: string }> {
  const cfg = await getSmtpConfig()
  if (!cfg) throw new Error('Brak konfiguracji SMTP. Skonfiguruj go w Ustawieniach newslettera.')

  const resolvedFrom = from ?? `${cfg.fromName} <${cfg.fromEmail}>`

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    pool: true,
    maxConnections: 3,
  })

  let sent = 0
  let errors = 0
  let lastError: string | undefined

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (email) => {
        try {
          await transporter.sendMail({
            from: resolvedFrom,
            to: email.to,
            subject: email.subject,
            html: email.html,
            text: email.text,
          })
          sent++
        } catch (err) {
          errors++
          lastError = err instanceof Error ? err.message : String(err)
          console.error('[v0] sendInBatches error for', email.to, ':', lastError)
        }
      })
    )
    if (i + batchSize < emails.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  transporter.close()
  return { sent, errors, lastError }
}

// Generate or retrieve the unsubscribe token for a subscriber
export async function getOrCreateUnsubscribeToken(subscriberId: string): Promise<string> {
  const supabase = getSupabase()

  // Try to get existing token first
  const { data: existing } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('subscriber_id', subscriberId)
    .maybeSingle()

  if (existing?.token) return existing.token

  // Create new token — use upsert to avoid duplicate key errors
  const token = crypto.randomUUID().replace(/-/g, '')
  const { error } = await supabase
    .from('email_unsubscribe_tokens')
    .upsert({ subscriber_id: subscriberId, token }, { onConflict: 'subscriber_id', ignoreDuplicates: false })

  if (error) {
    // If upsert failed, try fetching again (race condition)
    const { data: retry } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('subscriber_id', subscriberId)
      .maybeSingle()
    if (retry?.token) return retry.token
    throw new Error('Nie mozna utworzyc tokenu wypisania: ' + error.message)
  }

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
          <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Kliknij przycisk ponizej, aby potwierdzic subskrypcje newslettera Zwrotny.pl.</p>
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
