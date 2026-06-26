import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.searchParams.get('pathname')

    if (!pathname) {
      return NextResponse.json({ error: 'Missing pathname' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase.storage
      .from('images')
      .download(pathname)

    if (error || !data) {
      return new NextResponse('Not found', { status: 404 })
    }

    const ext = pathname.split('.').pop()?.toLowerCase() || 'png'
    const contentTypeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentTypeMap[ext] || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
