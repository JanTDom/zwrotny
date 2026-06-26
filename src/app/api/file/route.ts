import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

/**
 * Unified file proxy:
 * - For Supabase Storage files: serve via supabase.storage.from(bucket).download(path)
 *   which works server-side with service role key and supports streaming.
 * - For legacy Vercel Blob URLs (suspended): return 503 with a clear error.
 * - Query params: ?pathname=bucket/path  OR  ?url=https://...
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')
  const rawPathname = request.nextUrl.searchParams.get('pathname')

  let pathname: string | null = rawPathname

  // If given a full URL, extract the path portion
  if (!pathname && rawUrl) {
    try {
      const u = new URL(rawUrl)
      pathname = u.pathname.replace(/^\//, '')
    } catch {
      return new NextResponse('Invalid url', { status: 400 })
    }
  }

  if (!pathname) {
    return new NextResponse('Missing pathname or url', { status: 400 })
  }

  try {
    const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(pathname)

    // Detect if this is a Supabase Storage path (bucket/file.ext)
    // Supabase buckets we use: bonuses, videos, images
    const supabaseBuckets = ['bonuses', 'videos', 'images']
    const bucketMatch = pathname.match(/^([^/]+)\/(.+)$/)
    const bucketName = bucketMatch?.[1] ?? ''
    const filePath = bucketMatch?.[2] ?? ''

    if (supabaseBuckets.includes(bucketName) && filePath) {
      const supabase = createServiceClient()

      // For Range requests (video seeking), use getPublicUrl since the bucket is public
      // Public buckets deliver directly via CDN — redirect to public URL
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)
      if (urlData?.publicUrl) {
        // For video, support Range by proxying through public URL
        if (isVideo) {
          const rangeHeader = request.headers.get('range')
          const fetchHeaders: Record<string, string> = {}
          if (rangeHeader) fetchHeaders['Range'] = rangeHeader

          const upstream = await fetch(urlData.publicUrl, { headers: fetchHeaders })
          const responseHeaders: Record<string, string> = {
            'Content-Type': upstream.headers.get('content-type') || 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
          }
          const cl = upstream.headers.get('content-length')
          const cr = upstream.headers.get('content-range')
          if (cl) responseHeaders['Content-Length'] = cl
          if (cr) responseHeaders['Content-Range'] = cr

          return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders })
        }

        // For PDF: download via service client (works for all buckets regardless of public/private)
        const { data, error } = await supabase.storage.from(bucketName).download(filePath)
        if (error || !data) {
          return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 })
        }
        const arrayBuffer = await data.arrayBuffer()
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': String(arrayBuffer.byteLength),
            'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    }

    // Fallback: legacy Vercel Blob store is suspended — return clear error
    return NextResponse.json(
      { error: 'Store Vercel Blob jest zawieszony. Wgraj pliki ponownie przez CMS.' },
      { status: 503 }
    )
  } catch (e: any) {
    console.error('[v0] /api/file error:', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Błąd' }, { status: 500 })
  }
}
