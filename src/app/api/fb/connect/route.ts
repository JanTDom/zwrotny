import { NextResponse } from 'next/server'

const FB_APP_ID = process.env.FB_APP_ID!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/api/fb/callback`

const SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'publish_to_groups',
].join(',')

/**
 * GET /api/fb/connect
 * Redirects to Facebook OAuth dialog.
 */
export async function GET() {
  if (!FB_APP_ID) {
    return NextResponse.json({ error: 'FB_APP_ID not configured' }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    response_type: 'code',
    state: 'zk7m9_fb_connect',
  })

  const url = `https://www.facebook.com/v19.0/dialog/oauth?${params}`
  return NextResponse.redirect(url)
}
