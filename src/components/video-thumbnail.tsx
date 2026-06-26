'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoThumbnailProps {
  src: string
  className?: string
}

function isBlankCanvas(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx) return true
  const { data } = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100))
  // Check if all sampled pixels are black/transparent
  for (let i = 0; i < data.length; i += 16) {
    if (data[i] > 10 || data[i + 1] > 10 || data[i + 2] > 10) return false
  }
  return true
}

export function VideoThumbnail({ src, className = '' }: VideoThumbnailProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!src) return
    let cancelled = false
    let captured = false
    let attempts = 0
    const MAX_ATTEMPTS = 20

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    // Append off-screen so browser fully decodes frames
    video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;'
    document.body.appendChild(video)

    const tryCapture = () => {
      if (cancelled || captured) return
      if (!video.videoWidth || !video.videoHeight) return

      attempts++
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(video, 0, 0)

        if (isBlankCanvas(canvas) && attempts < MAX_ATTEMPTS) {
          // Frame not decoded yet — retry after a short delay
          setTimeout(tryCapture, 100)
          return
        }

        const url = canvas.toDataURL('image/jpeg', 0.9)
        if (url.length > 500) {
          captured = true
          if (!cancelled) setDataUrl(url)
        }
      } catch {
        // SecurityError or other — give up silently
      }
    }

    const onReady = () => {
      if (cancelled) return
      video.currentTime = 0.1
    }

    const onSeeked = () => {
      if (cancelled) return
      // Play one frame then immediately pause to force decode
      const p = video.play()
      if (p) {
        p.then(() => {
          video.pause()
          setTimeout(tryCapture, 50)
        }).catch(() => {
          // Autoplay blocked — try canvas directly
          tryCapture()
        })
      } else {
        tryCapture()
      }
    }

    video.addEventListener('loadeddata', onReady)
    video.addEventListener('loadedmetadata', onReady)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('canplaythrough', () => {
      if (!captured) tryCapture()
    })

    video.src = src

    return () => {
      cancelled = true
      if (video.parentNode) video.parentNode.removeChild(video)
      video.src = ''
    }
  }, [src])

  if (dataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={dataUrl} alt="" className={`object-cover ${className}`} />
    )
  }

  // Fallback: raw video with currentTime set to 0.1 to show a frame
  return (
    <video
      ref={videoRef}
      src={src}
      crossOrigin="anonymous"
      muted
      playsInline
      preload="auto"
      className={`object-cover ${className}`}
      onLoadedData={(e) => { e.currentTarget.currentTime = 0.1 }}
      onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.1 }}
    />
  )
}
