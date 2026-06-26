'use client'

import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { MapPin, ArrowRight, X, User } from 'lucide-react'

const ButelkomatyMap = dynamic(
  () => import('@/components/ButelkomatyMap').then(m => m.default ?? m),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        Ładowanie mapy…
      </div>
    ),
  }
)

export function FounderBio({ photoUrl }: { photoUrl?: string }) {
  const [mapOpen, setMapOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  const effectivePhoto = (!imgError && photoUrl) ? photoUrl : null

  // Lock body scroll + close on Escape while modal is open
  useEffect(() => {
    if (!mapOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMapOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [mapOpen])

  return (
    <section className="relative overflow-hidden my-6">
      <div
        className="relative mx-auto"
        style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))' }}
      >
        <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4">
          {/* Founder panel */}
          <Link
            href="https://multinewsroom.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block flex-1 rounded-2xl overflow-hidden"
            aria-label="Jan Domaniewski – twórca i naczelny ZWROTNY.pl"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                borderRadius: '1rem',
              }}
            />
            <div className="relative flex items-center gap-5 py-4 sm:py-5 px-4 sm:px-6">
              {/* Photo or initials fallback */}
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/70 transition-all duration-300 shadow-md">
                {effectivePhoto ? (
                  <Image
                    src={effectivePhoto}
                    alt="Jan Domaniewski"
                    fill
                    className="object-cover object-top"
                    sizes="80px"
                    onError={() => setImgError(true)}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary">
                    <span className="text-primary-foreground font-bold text-2xl">JD</span>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary mb-0.5">
                  Twórca i Naczelny Portalu ZWROTNY.pl
                </p>
                <p className="text-lg sm:text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors duration-200">
                  Jan Domaniewski
                </p>
                <p className="text-sm sm:text-base text-muted-foreground mt-0.5 leading-snug">
                  Dziennikarz i innowator, ekspert ds. komunikacji w przestrzeni publicznej i projektów społecznych.
                </p>
              </div>
            </div>
          </Link>

          {/* Map CTA panel */}
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="group relative block text-left rounded-2xl overflow-hidden w-full sm:w-60 lg:w-72 shrink-0 cursor-pointer"
            aria-label="Otwórz mapę butelkomatów"
          >
            <div
              className="absolute inset-0 pointer-events-none transition-colors duration-300 group-hover:bg-primary/10"
              style={{
                backgroundColor: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                borderRadius: '1rem',
              }}
            />
            <div className="relative flex items-center gap-4 py-4 sm:py-5 px-5 h-full">
              {/* Icon */}
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-105">
                  <MapPin className="h-7 w-7" strokeWidth={2.2} />
                </div>
                <span className="absolute -right-1 -top-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
                </span>
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5">
                  Znajdź najbliższy
                </p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight flex items-center gap-1.5">
                  Mapa butelkomatów
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  Punkty zbiórki w całej Polsce
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Map modal */}
      {mapOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMapOpen(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Mapa butelkomatów"
        >
          <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" strokeWidth={2.2} />
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  Mapa butelkomatów
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Zamknij mapę"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Map body */}
            <div className="relative flex-1 overflow-auto">
              <ButelkomatyMap />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
