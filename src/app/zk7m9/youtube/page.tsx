'use client'

import { useState } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  Play,
  ExternalLink,
  Search,
  Star,
  Clock,
  Youtube
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAdminVideos, adminApi } from '@/hooks/use-admin-data'
import { LoadingState } from '@/components/ui/api-states'
import type { YouTubeVideo } from '@/types'

function VideoCard({ video }: { video: YouTubeVideo }) {
  const [isFeatured, setIsFeatured] = useState(video.status === 'published')

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-muted">
        <img 
          src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="icon" className="rounded-full h-12 w-12">
            <Play className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {video.duration || '0:00'}
        </div>
        {isFeatured && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-950">
            <Star className="h-3 w-3 mr-1" />
            Wyróżnione
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {video.description || ''}
        </p>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{video.category || 'Video'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{new Date(video.publishedAt || video.createdAt || Date.now()).toLocaleDateString('pl-PL')}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Wyróżnione:</span>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={`https://youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function YouTubeAdminPage() {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { videos, isLoading, error } = useAdminVideos()

  if (isLoading) return <LoadingState message="Ładowanie filmów..." />
  // Show empty state instead of error when API fails

  const filteredVideos = videos.filter(video => {
    return video.title.toLowerCase().includes(search.toLowerCase()) ||
           (video.description || '').toLowerCase().includes(search.toLowerCase())
  })

  const totalVideos = videos.length
  const publishedCount = videos.filter(v => v.status === 'published').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">YouTube</h1>
          <p className="text-muted-foreground">Zarządzaj filmami z kanału YouTube</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj film
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Dodaj film z YouTube</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link do filmu</label>
                <Input placeholder="https://youtube.com/watch?v=..." />
              </div>
              <p className="text-sm text-muted-foreground">
                Wklej link do filmu YouTube. Dane zostaną pobrane automatycznie.
              </p>
              <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                Dodaj film
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Youtube className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{videos.length}</p>
                <p className="text-sm text-muted-foreground">Filmów</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedCount}</p>
                <p className="text-sm text-muted-foreground">Opublikowanych</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVideos}</p>
                <p className="text-sm text-muted-foreground">Wszystkich filmów</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredVideos.length}</p>
                <p className="text-sm text-muted-foreground">Wyświetlanych</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj filmów..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Videos grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak filmów</h3>
            <p className="text-muted-foreground">
              Nie znaleziono filmów spełniających kryteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
