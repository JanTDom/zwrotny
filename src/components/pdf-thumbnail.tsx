'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'

interface PdfThumbnailProps {
  url: string
  className?: string
}

export function PdfThumbnail({ url, className = '' }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function render() {
      if (!canvasRef.current) return
      setLoading(true)
      setError(false)

      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

        const loadingTask = pdfjs.getDocument({ url, disableStream: false, disableAutoFetch: false })
        const pdf = await loadingTask.promise
        if (cancelled) return

        const page = await pdf.getPage(1)
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return

        const containerWidth = canvas.parentElement?.clientWidth || 200

        // Render at 2x for sharpness, display at natural size via CSS
        const desiredWidth = containerWidth * 2
        const unscaledViewport = page.getViewport({ scale: 1 })
        const scale = desiredWidth / unscaledViewport.width
        const viewport = page.getViewport({ scale })

        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = '100%'
        canvas.style.height = '100%'

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        await page.render({ canvasContext: ctx, viewport }).promise
        if (!cancelled) setLoading(false)
      } catch (e) {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [url])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <FileText className="w-8 h-8 text-muted-foreground/50" />
      </div>
    )
  }

  return (
    <div className={`relative bg-white ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <FileText className="w-6 h-6 text-muted-foreground/30" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  )
}
