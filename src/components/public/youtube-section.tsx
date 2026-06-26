import Link from 'next/link'
import { ArrowRight, Play, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { YouTubeVideo } from '@/types'

function VideoCard({ video, featured = false }: { video: YouTubeVideo; featured?: boolean }) {
  const thumbnailUrl = video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`
  
  if (featured) {
    return (
      <a 
        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative overflow-hidden rounded-2xl bg-card border border-border cursor-pointer block"
      >
        <div className="aspect-video relative">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${thumbnailUrl})` }}
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform group-hover:scale-110">
              <Play className="h-8 w-8 ml-1" fill="currentColor" />
            </div>
          </div>
          
          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-black/70 text-white text-sm font-medium">
              {video.duration}
            </div>
          )}
        </div>
        
        <div className="p-6">
          <h3 className="font-display font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2">
            {video.title}
          </h3>
          <p className="text-muted-foreground line-clamp-2">
            {video.description || ''}
          </p>
        </div>
      </a>
    )
  }

  return (
    <a 
      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 cursor-pointer transition-all duration-300 block"
    >
      <div className="aspect-video relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform group-hover:scale-110">
            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          </div>
        </div>
        
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
            {video.duration}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {video.title}
        </h3>
      </div>
    </a>
  )
}

interface YouTubeSectionProps {
  videos: YouTubeVideo[]
}

export function YouTubeSection({ videos }: YouTubeSectionProps) {
  if (videos.length === 0) {
    return null
  }

  const featuredVideo = videos.find(v => v.status === 'published') || videos[0]
  const otherVideos = videos.filter(v => v.id !== featuredVideo.id).slice(0, 3)

  return (
    <section className="relative py-12 lg:py-16 overflow-hidden my-8">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', borderRadius: '1rem' }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Youtube className="h-6 w-6 text-[#FF0000]" />
              <span className="text-sm font-medium text-muted-foreground">YouTube</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground">
              Filmy wideo
            </h2>
          </div>
          
          <Button 
            asChild
            variant="outline"
            className="border-border hover:bg-secondary text-foreground rounded-full"
          >
            <a href="https://youtube.com/@zwrotny" target="_blank" rel="noopener noreferrer">
              Kanal YouTube
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Videos Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Featured */}
          <div className="lg:row-span-2">
            <VideoCard video={featuredVideo} featured />
          </div>
          
          {/* Other videos */}
          <div className="grid gap-6">
            {otherVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
