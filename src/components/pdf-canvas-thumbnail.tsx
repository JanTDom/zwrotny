'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'

interface PdfCanvasThumbnailProps {
  url: string
  className?: string
  style?: React.CSSProperties
  onReady?: (canvas: HTMLCanvasElement) => void
}

export function PdfCanvasThumbnail({ url, className = '', style, onReady }: PdfCanvasThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    if (!url) { setStatus('error'); return }
    let cancelled = false

    async function render() {
      try {
        // Load pdfjs dynamically — browser build, no worker needed for single page
        const pdfjsLib = await import('pdfjs-dist')
        // Use legacy build worker bundled with pdfjs-dist
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()

        const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false })
        const pdf = await loadingTask.promise
        if (cancelled) return

        const page = await pdf.getPage(1)
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return

        const viewport = page.getViewport({ scale: 1 })
        // Scale to fit container width (assume ~200px wide at 2× for retina)
        const scale = (canvas.offsetWidth || 200) / viewport.width * 2
        const scaledViewport = page.getViewport({ scale })

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height
        canvas.style.width = '100%'
        canvas.style.height = '100%'

        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
        if (cancelled) return

        setStatus('ok')
        if (onReady && canvas) onReady(canvas)
        pdf.destroy()
      } catch (err) {
        if (!cancelled) setStatus('error')
      }
    }

    render()
    return () => { cancelled = true }
  }, [url])

  return (
    <div className={`relative bg-white ${className}`} style={{ overflow: 'hidden', ...style }}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40 animate-pulse">
          <FileText className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <FileText className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ display: status === 'ok' ? 'block' : 'none' }}
      />
    </div>
  )
}
