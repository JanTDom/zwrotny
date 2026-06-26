'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, Eye, FileText as FileIcon, X, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PdfCanvasThumbnail } from '@/components/pdf-canvas-thumbnail'

interface Bonus {
  id: string
  title: string
  pdf_url: string
  pdf_pathname: string
  thumbnail_url?: string | null
}

interface BonusesSectionProps {
  bonuses: Bonus[]
}

function PdfViewer({ pdfUrl, title, onClose }: { pdfUrl: string; title: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex items-center justify-between bg-background px-4 py-2 border-b shrink-0">
        <span className="text-sm font-semibold truncate pr-4">{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-xs text-primary underline hidden sm:inline"
          >
            Pobierz PDF
          </a>
          <button
            onClick={onClose}
            className="rounded-sm p-1 hover:bg-accent transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto overscroll-contain bg-neutral-100"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          className="w-full h-full border-0 bg-white hidden sm:block"
          style={{ minHeight: '80vh' }}
          title={title}
        />
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full border-0 bg-white block sm:hidden"
          style={{ minHeight: '80vh' }}
          aria-label={title}
        >
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Twoja przeglądarka nie obsługuje wyświetlania PDF.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Download className="w-4 h-4" />
              Otwórz PDF
            </a>
          </div>
        </object>
      </div>
    </div>,
    document.body
  )
}

function BonusCard({ bonus, copiedId, onView, onCopy }: {
  bonus: Bonus
  copiedId: string | null
  onView: () => void
  onCopy: () => void
}) {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-border/50">
      <button
        onClick={onView}
        className="w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group relative"
        title={`Podgląd: ${bonus.title}`}
        aria-label={`Podgląd bonusu: ${bonus.title}`}
      >
        <PdfCanvasThumbnail
          url={bonus.pdf_url}
          className="w-full"
          style={{ aspectRatio: '3/4', display: 'block' }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
        </div>
      </button>
      <div className="bg-white/90 border-t border-border/50 px-2 py-2 flex flex-col gap-1.5">
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
          {bonus.title}
        </p>
        <div className="flex gap-1 w-full">
          <Button size="icon" variant="outline" className="flex-1 h-7" onClick={onView} title="Wyswietl">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <a
            href={`/api/bonuses/download?url=${encodeURIComponent(bonus.pdf_url)}&filename=${encodeURIComponent(bonus.title + '.pdf')}`}
            download={`${bonus.title}.pdf`}
            className="flex-1"
          >
            <Button size="icon" className="w-full h-7" title="Pobierz">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-6 gap-1 text-[10px] px-1"
          onClick={onCopy}
        >
          {copiedId === bonus.id
            ? <><Check className="h-3 w-3 text-green-600" />Skopiowano!</>
            : <><Copy className="h-3 w-3" />Kopiuj link FB</>
          }
        </Button>
      </div>
    </div>
  )
}

export function BonusesSection({ bonuses }: BonusesSectionProps) {
  const [viewerBonus, setViewerBonus] = useState<Bonus | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [updateArrows, bonuses])

  function scrollTrack(dir: 'left' | 'right') {
    const el = trackRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const needsScroll = bonuses.length > 6

  return (
    <section className="relative my-8 overflow-hidden">
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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {(!bonuses || bonuses.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Brak dostepnych materialow. Wgraj pliki w panelu CMS.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Strzałka lewa — tylko desktop scroll */}
            <button
              onClick={() => scrollTrack('left')}
              aria-label="Przewin w lewo"
              className={[
                'hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10',
                'w-10 h-10 rounded-full bg-white shadow-lg border border-border/60',
                'items-center justify-center transition-all duration-200',
                'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
              ].join(' ')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Mobile: grid 3 kolumny */}
            <div className="grid grid-cols-3 gap-3 pb-2 md:hidden">
              {bonuses.map((bonus) => (
                <BonusCard
                  key={bonus.id}
                  bonus={bonus}
                  copiedId={copiedId}
                  onView={() => setViewerBonus(bonus)}
                  onCopy={() => copyShareLink(bonus.id)}
                />
              ))}
            </div>

            {/* Desktop: horizontal scroll */}
            <div
              ref={trackRef}
              className={[
                'hidden md:flex gap-3 pb-2',
                needsScroll ? 'overflow-x-auto overscroll-x-contain' : '',
              ].join(' ')}
              style={{
                ...(needsScroll ? {
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                } : {}),
              } as React.CSSProperties}
            >
              {bonuses.map((bonus) => (
                <div
                  key={bonus.id}
                  className="flex flex-col"
                  style={{
                    flex: needsScroll ? '0 0 calc((100% - 5 * 0.75rem) / 6)' : '1 1 0',
                    minWidth: needsScroll ? 'calc((100% - 5 * 0.75rem) / 6)' : 0,
                    scrollSnapAlign: 'start',
                  }}
                >
                  <BonusCard
                    bonus={bonus}
                    copiedId={copiedId}
                    onView={() => setViewerBonus(bonus)}
                    onCopy={() => copyShareLink(bonus.id)}
                  />
                </div>
              ))}
            </div>

            {/* Strzałka prawa — tylko desktop scroll */}
            <button
              onClick={() => scrollTrack('right')}
              aria-label="Przewin w prawo"
              className={[
                'hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10',
                'w-10 h-10 rounded-full bg-white shadow-lg border border-border/60',
                'items-center justify-center transition-all duration-200',
                'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
              ].join(' ')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {needsScroll && canScrollLeft && (
              <div className="hidden md:block absolute left-0 top-0 bottom-2 w-10 pointer-events-none bg-gradient-to-r from-white/70 to-transparent" />
            )}
            {needsScroll && canScrollRight && (
              <div className="hidden md:block absolute right-0 top-0 bottom-2 w-10 pointer-events-none bg-gradient-to-l from-white/70 to-transparent" />
            )}
          </div>
        )}
      </div>

      {viewerBonus && (
        <PdfViewer
          pdfUrl={viewerBonus.pdf_url}
          title={viewerBonus.title}
          onClose={() => setViewerBonus(null)}
        />
      )}
    </section>
  )
}
