// Brevo API client dla zwrotny.pl
// Zastępuje nodemailer/SMTP

const BREVO_API_KEY = process.env.BREVO_API_KEY!
const BREVO_BASE = 'https://api.brevo.com/v3'

export const SENDER_DEFAULT = { name: 'Redakcja Zwrotny.pl', email: 'redakcja@zwrotny.pl' }
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zwrotny.pl'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function brevoFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BREVO_BASE}${path}`, {
    ...options,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? `Brevo error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// ─── Listy kontaktów ─────────────────────────────────────────────────────────

export interface BrevoList {
  id: number
  name: string
  totalSubscribers: number
  uniqueSubscribers: number
  folderId: number
  createdAt: string
}

export async function getLists(): Promise<BrevoList[]> {
  const data = await brevoFetch('/contacts/lists?limit=50&offset=0')
  return data?.lists ?? []
}

export async function createList(name: string): Promise<BrevoList> {
  const data = await brevoFetch('/contacts/lists', {
    method: 'POST',
    body: JSON.stringify({ name, folderId: 1 }),
  })
  // Pobierz pełne dane nowej listy
  const list = await brevoFetch(`/contacts/lists/${data.id}`)
  return list
}

export async function deleteList(listId: number): Promise<void> {
  await brevoFetch(`/contacts/lists/${listId}`, { method: 'DELETE' })
}

// ─── Kontakty ────────────────────────────────────────────────────────────────

export async function addContactToList(
  email: string,
  listId: number,
  firstName?: string
): Promise<void> {
  // Utwórz lub zaktualizuj kontakt
  await brevoFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify({
      email,
      listIds: [listId],
      attributes: firstName ? { FIRSTNAME: firstName } : undefined,
      updateEnabled: true,
    }),
  }).catch(async (err) => {
    // Jeśli kontakt istnieje, dodaj do listy
    if (err.message?.includes('Contact already exist')) {
      await brevoFetch(`/contacts/lists/${listId}/contacts/add`, {
        method: 'POST',
        body: JSON.stringify({ emails: [email] }),
      })
    } else {
      throw err
    }
  })
}

export async function removeContactFromList(email: string, listId: number): Promise<void> {
  await brevoFetch(`/contacts/lists/${listId}/contacts/remove`, {
    method: 'POST',
    body: JSON.stringify({ emails: [email] }),
  })
}

export async function importContactsToList(
  contacts: Array<{ email: string; firstName?: string; lastName?: string }>,
  listId: number
): Promise<{ processId: number }> {
  const jsonBody = contacts.map((c) => ({
    email: c.email,
    attributes: {
      FIRSTNAME: c.firstName ?? '',
      LASTNAME: c.lastName ?? '',
    },
  }))

  const data = await brevoFetch('/contacts/import', {
    method: 'POST',
    body: JSON.stringify({
      jsonBody,
      listIds: [listId],
      updateExistingContacts: true,
      emptyContactsAttributes: false,
    }),
  })
  return { processId: data?.processId ?? 0 }
}

// ─── Kampanie emailowe ────────────────────────────────────────────────────────

export interface BrevoEmailCampaignPayload {
  name: string
  subject: string
  sender: { name: string; email: string }
  type: 'classic'
  htmlContent: string
  recipients: { listIds: number[] }
  header?: string
  footer?: string
  inlineImageActivation?: boolean
  mirrorActive?: boolean
}

export async function createEmailCampaign(
  payload: BrevoEmailCampaignPayload
): Promise<number> {
  const data = await brevoFetch('/emailCampaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.id
}

export async function sendCampaignNow(campaignId: number): Promise<void> {
  await brevoFetch(`/emailCampaigns/${campaignId}/sendNow`, { method: 'POST' })
}

export async function scheduleCampaign(
  campaignId: number,
  scheduledAt: string
): Promise<void> {
  await brevoFetch(`/emailCampaigns/${campaignId}/sendAt`, {
    method: 'PUT',
    body: JSON.stringify({ scheduledAt }),
  })
}

export async function getCampaignStats(campaignId: number) {
  return brevoFetch(`/emailCampaigns/${campaignId}`)
}

// ─── Transakcyjny email (single) ──────────────────────────────────────────────

export async function sendTransactionalEmail(opts: {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
  fromEmail?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await brevoFetch('/smtp/email', {
      method: 'POST',
      body: JSON.stringify({
        sender: {
          name: opts.fromName ?? SENDER_DEFAULT.name,
          email: opts.fromEmail ?? SENDER_DEFAULT.email,
        },
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
      }),
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─── Szablony emaili ─────────────────────────────────────────────────────────

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

// Backward compat – stary kod importuje z mailer.ts
export { sendTransactionalEmail as sendMail }
