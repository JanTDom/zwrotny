import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createEmailCampaign,
  sendCampaignNow,
  scheduleCampaign,
  buildCampaignEmailHtml,
  SENDER_DEFAULT,
} from '@/lib/brevo'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { id } = await params
  const { scheduleFor, brevoListId } = await req.json().catch(() => ({}))

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Kampania nie istnieje.' }, { status: 404 })
  if (campaign.status === 'sent') return NextResponse.json({ error: 'Kampania juz zostala wyslana.' }, { status: 409 })

  const listId: number = brevoListId ?? campaign.brevo_list_id
  if (!listId) {
    return NextResponse.json(
      { error: 'Wybierz liste Brevo do wysylki. Podaj brevoListId w body.' },
      { status: 400 }
    )
  }

  // Zaplanuj na pozniej
  if (scheduleFor) {
    await supabase
      .from('email_campaigns')
      .update({ status: 'scheduled', scheduled_for: scheduleFor, brevo_list_id: listId, updated_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({ ok: true, scheduled: true, scheduledFor: scheduleFor })
  }

  // Wyslij od razu
  await supabase
    .from('email_campaigns')
    .update({ status: 'sending', brevo_list_id: listId, updated_at: new Date().toISOString() })
    .eq('id', id)

  try {
    // Brevo wymaga {unsubscribeLink} w HTML — zastepuje go automatycznie
    const html = buildCampaignEmailHtml({
      subject: campaign.subject,
      htmlContent: campaign.html_content,
      unsubscribeUrl: '{unsubscribeLink}',
    })

    const bревоId = await createEmailCampaign({
      name: `${campaign.title} [${id}]`,
      subject: campaign.subject,
      sender: SENDER_DEFAULT,
      type: 'classic',
      htmlContent: html,
      recipients: { listIds: [listId] },
      mirrorActive: true,
      inlineImageActivation: false,
    })

    await sendCampaignNow(bревоId)

    await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        brevo_campaign_id: bревоId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ ok: true, brevo_campaign_id: bревоId })
  } catch (err: unknown) {
    await supabase
      .from('email_campaigns')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blad wysylki przez Brevo' },
      { status: 500 }
    )
  }
}
