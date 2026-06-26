import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


const FB_APP_ID = process.env.FB_APP_ID!
const FB_APP_SECRET = process.env.FB_APP_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/api/fb/callback`

/**
 * GET /api/fb/callback
 * Handles Facebook OAuth callback:
 * 1. Exchanges code for short-lived user token
 * 2. Exchanges for long-lived user token (60 days)
 * 3. Fetches list of managed pages
 * 4. Stores the page access token in DB (page tokens never expire)
 * 5. Redirects to CMS Facebook panel
 */
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/zk7m9/facebook?error=${encodeURIComponent(error || 'no_code')}`
    )
  }

  try {
    // Step 1: Exchange code for short-lived user token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: FB_APP_ID,
        client_secret: FB_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      })
    )
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error.message)

    const shortLivedToken: string = tokenData.access_token

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: FB_APP_ID,
        client_secret: FB_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      })
    )
    const longData = await longRes.json()
    if (longData.error) throw new Error(longData.error.message)

    const longLivedToken: string = longData.access_token
    const expiresIn: number = longData.expires_in ?? 5184000 // 60 days default

    // Step 3: Get pages managed by this user
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}`
    )
    const pagesData = await pagesRes.json()
    if (pagesData.error) throw new Error(pagesData.error.message)

    const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data ?? []

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/zk7m9/facebook?error=no_pages`
      )
    }

    // Store all pages in a cookie / query param for user to choose in CMS
    // Then save the first page by default (user can change in CMS)
    const page = pages[0]

    await supabase.from('fb_connection').upsert({
      id: 1,
      page_id: page.id,
      page_name: page.name,
      page_access_token: page.access_token,
      user_access_token: longLivedToken,
      connected_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    })

    // Pass available pages to the CMS panel via query string so user can pick one
    const pagesParam = encodeURIComponent(JSON.stringify(
      pages.map(p => ({ id: p.id, name: p.name, token: p.access_token }))
    ))

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/zk7m9/facebook?connected=1&pages=${pagesParam}`
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown'
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/zk7m9/facebook?error=${encodeURIComponent(message)}`
    )
  }
}
