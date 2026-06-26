'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { X, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react'

interface Banner {
  id: string
  position?: string
  imageUrl?: string
  linkUrl?: string
  title?: string
  isActive?: boolean
}

interface InfographicFromBannersProps {
  banners: Banner[]
}

function InfographicLightbox({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const offsetRef = useRef({ x: 0, y: 0 })

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const zoom = useCallback((delta: number) => {
    setScale(s => Math.min(5, Math.max(0.5, s + delta)))
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    zoom(e.deltaY < 0 ? 0.15 : -0.15)
  }, [zoom])

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    const next = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }
    offsetRef.current = next
    setOffset(next)
  }

  const handleMouseUp = () => { dragging.current = false }

  const handleDownload = async () => {
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt.replace(/\s+/g, '-').toLowerCase() + '.jpg'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(src, '_blank')
    }
  }

  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    offsetRef.current = { x: 0, y: 0 }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Toolbar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => zoom(0.25)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          title="Powiększ"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoom(-0.25)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          title="Pomniejsz"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          title="Resetuj widok"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          title="Pobierz"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
          title="Zamknij"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs tabular-nums">
        {Math.round(scale * 100)}%
      </div>

      {/* Image canvas */}
      <div
        className="overflow-hidden w-full h-full flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (dragging.current ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: dragging.current ? 'none' : 'transform 0.15s ease',
            maxWidth: '90vw',
            maxHeight: '88vh',
            objectFit: 'contain',
            borderRadius: '0.5rem',
            userSelect: 'none',
          }}
        />
      </div>
    </div>
  )
}

export function InfographicFromBanners({ banners }: InfographicFromBannersProps) {
  const [imgError, setImgError] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const infographic = banners.find(
    b => b.position === 'homepage-infographic' && b.isActive && b.imageUrl
  )

  if (!infographic) return null

  const imageEl = imgError ? (
    <div className="w-full rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-16 text-muted-foreground">
      <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm">Infografika niedostepna — wgraj ponownie w CMS &rarr; Banery</p>
    </div>
  ) : (
    <div className="relative w-full max-w-4xl mx-auto group">
      <img
        src={infographic.imageUrl!}
        alt={infographic.title || 'Infografika'}
        className="w-full h-auto rounded-xl shadow-lg"
        onError={() => setImgError(true)}
      />
      {/* Hover overlay hint */}
      <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 cursor-zoom-in">
        <div className="flex items-center gap-2 bg-black/60 text-white text-sm font-medium px-4 py-2 rounded-full">
          <ZoomIn className="w-4 h-4" />
          Kliknij aby powiększyć
        </div>
      </div>
    </div>
  )

  return (
    <>
      <section className="py-12 relative my-8">
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 'min(calc(100% - 1rem), calc(80rem + 3rem))',
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            borderRadius: '1rem',
          }}
        />
        <div className="relative container mx-auto px-4">
          {infographic.title && infographic.title.trim() && (
            <h2 className="text-2xl font-bold text-center mb-8">{infographic.title}</h2>
          )}
          {infographic.linkUrl && !lightboxOpen ? (
            <Link href={infographic.linkUrl} className="block hover:opacity-90 transition-opacity">
              {imageEl}
            </Link>
          ) : (
            <button
              type="button"
              className="block w-full text-left"
              onClick={() => !imgError && setLightboxOpen(true)}
            >
              {imageEl}
            </button>
          )}
        </div>
      </section>

      {lightboxOpen && (
        <InfographicLightbox
          src={infographic.imageUrl!}
          alt={infographic.title || 'Infografika'}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
