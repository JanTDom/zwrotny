'use client'

interface BackgroundMediaProps {
  videoUrl?: string | null
  videoEnabled?: boolean
  imageUrl?: string | null
  imageEnabled?: boolean
}

export function VideoBackground({
  videoUrl,
  videoEnabled = true,
  imageUrl,
  imageEnabled = true,
}: BackgroundMediaProps) {
  const showVideo = videoEnabled && videoUrl
  const showImage = !showVideo && imageEnabled && imageUrl

  if (!showVideo && !showImage) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {showVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl!}
        />
      ) : (
        <img
          src={imageUrl!}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  )
}
