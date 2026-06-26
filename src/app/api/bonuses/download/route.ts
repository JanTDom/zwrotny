import { NextRequest, NextResponse } from 'next/server'

// Proxy download — needed because <a download> is ignored for cross-origin URLs (Supabase CDN).
// Fetches the PDF server-side and streams it back with Content-Disposition: attachment.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const filename = searchParams.get('filename') || 'dokument.pdf'

  if (!url) {
    return NextResponse.json({ error: 'Brak url' }, { status: 400 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: 'Nie mozna pobrac pliku' }, { status: 502 })
    }

    const buffer = await res.arrayBuffer()
    const safeFilename = encodeURIComponent(filename).replace(/%20/g, '_')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Blad serwera' }, { status: 500 })
  }
}
