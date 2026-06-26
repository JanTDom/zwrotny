'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Radio } from 'lucide-react'

interface TickerItem {
  id: string
  title: string
  sourceName: string
  originalUrl: string
  publishedAt?: string | null
  isPinned?: boolean
  relevanceScore?: number
}

interface TickerData {
  enabled: boolean
  speed: number
  allowClose: boolean
  fallbackMessage: string
  items: TickerItem[]
}

function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 3600000
  if (diff < 1) return 'przed chwilą'
  if (diff < 24) return `${Math.floor(diff)} godz. temu`
  const days = Math.floor(diff / 24)
  if (days === 1) return 'wczoraj'
  return `${days} dni temu`
}

interface TickerItemProps {
  item: TickerItem
  index: number
  total: number
}

function TickerItemEl({ item, index, total }: TickerItemProps) {
  return (
    <>
      <a
        href={item.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-baseline gap-2 whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm"
        aria-label={`${item.title} — ${item.sourceName}${item.publishedAt ? ', ' + formatRelativeDate(item.publishedAt) : ''}`}
      >
        {item.isPinned && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">
            Pilne
          </span>
        )}
        <span className="text-[13px] font-medium text-white/90 group-hover:text-primary transition-colors leading-snug">
          {item.title}
        </span>
        <span className="text-[11px] text-white/45 shrink-0">
          {item.sourceName}
          {item.publishedAt && (
            <span className="ml-1 opacity-70">{formatRelativeDate(item.publishedAt)}</span>
          )}
        </span>
      </a>
      {index < total - 1 && (
        <span className="inline-block mx-5 text-white/25 select-none" aria-hidden="true">·</span>
      )}
    </>
  )
}

const CLOSE_KEY = 'ticker_closed_until'
const CLOSE_DURATION_MS = 24 * 3600 * 1000

export function NewsTicker() {
  const [data, setData] = useState<TickerData | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [trackWidth, setTrackWidth] = useState(0)
  const originalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    try {
      const until = localStorage.getItem(CLOSE_KEY)
      if (until && Date.now() < Number(until)) setDismissed(true)
    } catch { /* localStorage unavailable */ }
  }, [])

  useEffect(() => {
    fetch('/api/news-ticker')
      .then(r => r.json())
      .then((d: TickerData) => setData(d))
      .catch(() => setData({ enabled: false, speed: 40, allowClose: true, fallbackMessage: '', items: [] }))
  }, [])

  useEffect(() => {
    if (!data?.items.length || reducedMotion) return
    const el = originalRef.current
    if (!el) return
    const measure = () => setTrackWidth(el.scrollWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [data, reducedMotion])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(CLOSE_KEY, String(Date.now() + CLOSE_DURATION_MS))
    } catch { /* ignore */ }
  }, [])

  if (!data || !data.enabled || dismissed) return null
  if (!data.items.length && !data.fallbackMessage) return null

  const speed = data.speed || 40
  const duration = trackWidth > 0 ? trackWidth / speed : 20

  return (
    <div
      className="relative w-full bg-[oklch(0.13_0.02_250)] border-b border-[oklch(0.22_0.02_250)] overflow-hidden"
      style={{ height: '32px' }}
      role="marquee"
      aria-label="Radar zwrotny.pl — aktualności z obszaru systemu kaucyjnego i recyklingu"
      aria-live="off"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {trackWidth > 0 && (
        <style>{`
          @keyframes ticker-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-${trackWidth}px); }
          }
        `}</style>
      )}

      <div className="flex items-center h-full">
        <div className="shrink-0 flex items-center gap-1.5 h-full px-3 bg-primary/20 border-r border-primary/30 z-10">
          <Radio className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary whitespace-nowrap select-none">
            Radar
          </span>
        </div>

        <div className="flex-1 overflow-hidden relative h-full">
          {data.items.length === 0 ? (
            <span className="absolute inset-0 flex items-center px-4 text-[12px] text-[oklch(0.70_0.01_250)]">
              {data.fallbackMessage}
            </span>
          ) : reducedMotion ? (
            <div className="flex items-center gap-4 h-full px-4 overflow-x-auto">
              {data.items.map((item, i) => (
                <TickerItemEl key={item.id} item={item} index={i} total={data.items.length} />
              ))}
            </div>
          ) : (
            <div
              className="flex items-center h-full"
              style={{
                whiteSpace: 'nowrap',
                willChange: 'transform',
                animation: trackWidth > 0 ? `ticker-scroll ${duration}s linear infinite` : 'none',
                animationPlayState: paused ? 'paused' : 'running',
              }}
            >
              <div ref={originalRef} className="inline-flex items-center px-6">
                {data.items.map((item, i) => (
                  <TickerItemEl key={item.id} item={item} index={i} total={data.items.length} />
                ))}
              </div>
              <div aria-hidden="true" className="inline-flex items-center px-6">
                {data.items.map((item, i) => (
                  <TickerItemEl key={`clone-${item.id}`} item={item} index={i} total={data.items.length} />
                ))}
              </div>
            </div>
          )}
        </div>

        {data.allowClose && (
          <button
            onClick={handleDismiss}
            className="shrink-0 flex items-center justify-center h-full w-8 text-[oklch(0.55_0.01_250)] hover:text-[oklch(0.80_0.01_250)] transition-colors border-l border-[oklch(0.22_0.02_250)] z-10"
            aria-label="Zamknij pasek aktualności"
            title="Zamknij na 24h"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
