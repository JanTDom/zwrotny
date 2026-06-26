import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' | 'favicon'

    if (!file) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'png'
    const filename = `branding/${type}-${Date.now()}.${ext}`

    const blob = await put(filename, file, { access: 'private' })

    // Return a proxy URL so the private blob can be served to the browser
    const proxyUrl = `/api/upload/branding/serve?pathname=${encodeURIComponent(blob.pathname)}`
    return NextResponse.json({ url: proxyUrl, pathname: blob.pathname })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Branding upload error:', msg, error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
