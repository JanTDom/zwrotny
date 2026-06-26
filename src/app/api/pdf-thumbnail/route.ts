/* eslint-disable @typescript-eslint/no-var-requires */
import { type NextRequest, NextResponse } from 'next/server'
import { head } from '@vercel/blob'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Both packages are in serverExternalPackages in next.config.mjs so they are
// NOT bundled by webpack — they run as plain Node.js requires at runtime.

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname) return new NextResponse('Missing pathname', { status: 400 })

  try {
    const blob = await head(pathname, { access: 'private' })
    if (!blob) return new NextResponse('Not found', { status: 404 })

    const pdfRes = await fetch(blob.downloadUrl)
    if (!pdfRes.ok) return new NextResponse('Failed to fetch PDF', { status: 502 })
    const pdfData = new Uint8Array(await pdfRes.arrayBuffer())

    // Loaded via require — excluded from webpack bundle
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas } = require('@napi-rs/canvas') as typeof import('@napi-rs/canvas')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs') as typeof import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''

    const loadingTask = pdfjsLib.getDocument({ data: pdfData, disableFontFace: true, verbosity: 0 })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1.5 })

    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height))
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({ canvasContext: ctx, viewport }).promise

    const buffer = canvas.toBuffer('image/png')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[v0] pdf-thumbnail error:', msg)
    // Return transparent 1x1 PNG so <img> doesn't show broken icon
    const empty1x1 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const buf = Buffer.from(empty1x1, 'base64')
    return new NextResponse(buf, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    })
  }
}
