import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'


interface PublishBody {
  postId?: string
  postTitle?: string
  postUrl?: string
  message: string       // main text content for FB post
  imageUrl?: string     // optional image URL to attach
}

/**
 * POST /api/fb/publish
 * Publishes a post to the connected Facebook Page.
 * If imageUrl is provided — publishes a photo post with caption.
 * Otherwise — publishes a link post (message + link) or plain text post.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const body: PublishBody = await req.json()
  const { postId, postTitle, postUrl, message, imageUrl } = body

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  // Fetch stored page token
  const { data: conn } = await supabase
    .from('fb_connection')
    .select('page_id, page_name, page_access_token')
    .eq('id', 1)
    .single()

  if (!conn?.page_access_token || !conn.page_id) {
    return NextResponse.json({ error: 'Facebook page not connected' }, { status: 400 })
  }

  const pageId = conn.page_id
  const pageToken = conn.page_access_token

  try {
    let fbPostId: string

    if (imageUrl) {
      // Photo post: POST /{page-id}/photos
      const form = new FormData()
      form.append('url', imageUrl)
      form.append('caption', message)
      form.append('access_token', pageToken)

      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      fbPostId = data.post_id ?? data.id

    } else if (postUrl) {
      // Link post: POST /{page-id}/feed with link
      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          link: postUrl,
          access_token: pageToken,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      fbPostId = data.id

    } else {
      // Plain text post
      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          access_token: pageToken,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      fbPostId = data.id
    }

    // Log the publish action
    await supabase.from('fb_publish_log').insert({
      post_id: postId ?? null,
      post_title: postTitle ?? message.slice(0, 80),
      post_url: postUrl ?? null,
      fb_post_id: fbPostId,
      message,
      image_url: imageUrl ?? null,
      status: 'published',
      published_at: new Date().toISOString(),
    })

    const fbUrl = `https://www.facebook.com/${fbPostId.replace('_', '/posts/')}`

    return NextResponse.json({ ok: true, fbPostId, fbUrl })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'

    // Log failure
    await supabase.from('fb_publish_log').insert({
      post_id: postId ?? null,
      post_title: postTitle ?? '',
      post_url: postUrl ?? null,
      message: body.message,
      image_url: imageUrl ?? null,
      status: 'failed',
      error_message: message,
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/fb/publish
 * Returns connection status and publish history.
 */
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const [{ data: conn }, { data: logs }] = await Promise.all([
    supabase.from('fb_connection').select('page_id, page_name, connected_at, expires_at').eq('id', 1).single(),
    supabase.from('fb_publish_log').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  return NextResponse.json({
    connected: !!conn?.page_id,
    pageName: conn?.page_name ?? null,
    pageId: conn?.page_id ?? null,
    connectedAt: conn?.connected_at ?? null,
    expiresAt: conn?.expires_at ?? null,
    logs: logs ?? [],
  })
}
