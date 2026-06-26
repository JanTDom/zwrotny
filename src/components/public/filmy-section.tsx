'use client'

import { useState, useEffect, useRef } from 'react'

interface Film {
  id: string
  title: string
  video_url: string
  video_pathname: string
  thumbnail_url: string | null
  is_active: boolean
  order: number
}

// Generates a JPEG thumbnail from a public video URL using a hidden <video> element.
// The video is appended to DOM so the browser fully decodes frames.
function useVideoThumbnail(film: Film): string | null {
  const [thumb, setThumb] = useState<string | null>(film.thumbnail_url)
  const attempted = useRef(false)

  useEffect(() => {
    if (thumb || attempted.current) return
    attempted.current = true

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;'
    document.body.appendChild(video)

    let done = false

    const capture = () => {
      if (done) return
      if (!video.videoWidth || !video.videoHeight) return
      done = true
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')!.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        if (dataUrl.length > 500) {
          setThumb(dataUrl)
          // Persist to server so next load shows it instantly
          fetch('/api/filmy/generate-thumbnail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: film.id, thumbnailDataUrl: dataUrl }),
          }).catch(() => {})
        }
      } catch { /* SecurityError — skip silently */ }
      cleanup()
    }

    const cleanup = () => {
      if (video.parentNode) video.parentNode.removeChild(video)
    }

    const onSeeked = () => {
      video.play().then(() => { video.pause(); capture() }).catch(capture)
    }

    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('loadeddata', () => { video.currentTime = 0.5 }, { once: true })
    video.addEventListener('canplay', () => { if (!done) { video.currentTime = 0.5 } }, { once: true })
    video.addEventListener('error', cleanup, { once: true })
    video.src = film.video_url

    const timeout = setTimeout(() => { if (!done) { done = true; cleanup() } }, 10000)
    return () => { done = true; clearTimeout(timeout); cleanup() }
  }, [film.id, film.video_url, thumb])

  return thumb
}

interface FilmCardProps {
  film: Film
  onClick: () => void
}

function FilmCard({ film, onClick }: FilmCardProps) {
  const thumbnail = useVideoThumbnail(film)
  return (
    <div className="flex flex-col">
      <button
        className="relative w-full rounded-t-lg overflow-hidden bg-neutral-900 focus:outline-none group"
        style={{ aspectRatio: '9/16' }}
        onClick={onClick}
        title={film.title}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={film.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-800" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FF6B2C] shadow-lg group-hover:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </button>
      <div className="bg-white/90 rounded-b-lg border border-t-0 border-border/50 px-2 py-2">
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
          {film.title}
        </p>
      </div>
    </div>
  )
}

interface VideoModalProps {
  videoUrl: string
  title: string
  onClose: () => void
}

function VideoModal({ videoUrl, title, onClose }: VideoModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
        aria-label="Zamknij"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <div
        className="relative w-full max-w-sm mx-4"
        style={{ aspectRatio: '9/16' }}
        onClick={e => e.stopPropagation()}
      >
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="w-full h-full rounded-xl bg-black"
          title={title}
        />
      </div>
    </div>
  )
}

interface FilmySectionProps {
  filmy: Film[]
}

export function FilmySection({ filmy }: FilmySectionProps) {
  const [activeFilm, setActiveFilm] = useState<Film | null>(null)

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
        {(!filmy || filmy.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <svg className="w-12 h-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            <p className="text-sm">Brak dostepnych filmow. Wgraj pliki w panelu CMS.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filmy.map((film) => (
              <FilmCard key={film.id} film={film} onClick={() => setActiveFilm(film)} />
            ))}
          </div>
        )}
      </div>

      {activeFilm && (
        <VideoModal
          videoUrl={activeFilm.video_url}
          title={activeFilm.title}
          onClose={() => setActiveFilm(null)}
        />
      )}
    </section>
  )
}
