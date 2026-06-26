import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// Lightweight user-agent parser (no external dependency)
function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const s = ua.toLowerCase()

  // Device
  let device = 'desktop'
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    device = 'tablet'
  } else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/i.test(ua)) {
    device = 'mobile'
  }

  // Browser
  let browser = 'Inne'
  if (s.includes('edg/') || s.includes('edga') || s.includes('edgios')) browser = 'Edge'
  else if (s.includes('opr/') || s.includes('opera')) browser = 'Opera'
  else if (s.includes('chrome') || s.includes('crios')) browser = 'Chrome'
  else if (s.includes('firefox') || s.includes('fxios')) browser = 'Firefox'
  else if (s.includes('safari')) browser = 'Safari'

  // OS
  let os = 'Inne'
  if (s.includes('windows')) os = 'Windows'
  else if (s.includes('iphone') || s.includes('ipad') || s.includes('ipod')) os = 'iOS'
  else if (s.includes('mac os')) os = 'macOS'
  else if (s.includes('android')) os = 'Android'
  else if (s.includes('linux')) os = 'Linux'

  return { device, browser, os }
}

function getReferrerDomain(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, referrer, visitorId, sessionId } = body as {
      path?: string
      referrer?: string
      visitorId?: string
      sessionId?: string
    }

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    }

    // Ignore admin and api paths
    if (path.startsWith('/zk7m9') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const ua = request.headers.get('user-agent') || ''
    const { device, browser, os } = parseUserAgent(ua)

    // Vercel provides geo headers in production
    const country =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      null

    // Referrer domain — only keep external referrers
    const refDomain = getReferrerDomain(referrer)
    const selfHost = request.headers.get('host')?.replace(/^www\./, '') || ''
    const externalReferrer = refDomain && refDomain !== selfHost ? referrer : null
    const externalRefDomain = refDomain && refDomain !== selfHost ? refDomain : null

    const supabase = createServiceClient()
    const { error } = await supabase.from('page_views').insert({
      path: path.slice(0, 512),
      referrer: externalReferrer?.slice(0, 512) ?? null,
      referrer_domain: externalRefDomain,
      device,
      browser,
      os,
      country,
      visitor_id: visitorId ?? null,
      session_id: sessionId ?? null,
    })

    if (error) {
      console.error('[v0] analytics track error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[v0] analytics track exception:', err)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}
