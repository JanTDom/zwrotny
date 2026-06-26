import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


// Called by Vercel Cron every 5 minutes — picks up scheduled campaigns due to send
export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Validate cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: dueCampaigns } = await supabase
    .from('email_campaigns')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())

  if (!dueCampaigns?.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zwrotny.pl'
  const results = []

  for (const campaign of dueCampaigns) {
    try {
      const r = await fetch(`${baseUrl}/api/newsletter/campaigns/${campaign.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const d = await r.json()
      results.push({ id: campaign.id, ...d })
    } catch (err) {
      results.push({ id: campaign.id, error: String(err) })
    }
  }

  return NextResponse.json({ ok: true, processed: dueCampaigns.length, results })
}
