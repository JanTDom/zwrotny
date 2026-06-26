import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

/**
 * Returns a signed upload URL for Supabase Storage.
 * Client uploads directly to Supabase — bypasses Vercel Function body size limits.
 * Query params: ?bucket=videos&filename=video-xxx.mp4&contentType=video/mp4
 */
export async function GET(request: NextRequest) {
  const bucket = request.nextUrl.searchParams.get('bucket')
  const filename = request.nextUrl.searchParams.get('filename')
  const contentType = request.nextUrl.searchParams.get('contentType') || 'application/octet-stream'

  if (!bucket || !filename) {
    return NextResponse.json({ error: 'Missing bucket or filename' }, { status: 400 })
  }

  const allowedBuckets = ['videos', 'bonuses', 'images']
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  // Validate content types per bucket
  if (bucket === 'videos' && !contentType.startsWith('video/')) {
    return NextResponse.json({ error: 'Only video files allowed in videos bucket' }, { status: 400 })
  }
  if (bucket === 'bonuses' && contentType !== 'application/pdf' && contentType !== 'image/jpeg' && contentType !== 'image/png') {
    return NextResponse.json({ error: 'Only PDF or image files allowed in bonuses bucket' }, { status: 400 })
  }

  const supabase = createServiceClient()
  // For videos bucket: files stored under "filmy/" subfolder
  // For bonuses bucket: PDFs at root, thumbnails under "thumbnails/" subfolder
  const prefix = bucket === 'videos' ? 'filmy' : (contentType.startsWith('image/') ? 'thumbnails' : '')
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const ext = filename.split('.').pop() || (bucket === 'videos' ? 'mp4' : 'pdf')
  const baseKey = bucket === 'videos' ? `video-${ts}-${rand}.${ext}` : `${contentType.startsWith('image/') ? 'thumb' : 'pdf'}-${ts}-${rand}.${ext}`
  const fileKey = baseKey
  const pathname = prefix ? `${prefix}/${fileKey}` : fileKey

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(pathname)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create upload URL' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(pathname)

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    pathname,
    publicUrl: urlData.publicUrl,
  })
}
