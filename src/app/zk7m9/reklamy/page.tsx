'use client'

import { useState } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Eye, 
  EyeOff,
  BarChart3,
  MousePointer,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Ad } from '@/types'

// TODO: Replace with useAdminAds hook when endpoint is ready
const mockAds: Ad[] = []

const positionLabels: Record<string, string> = {
  'hero-banner': 'Banner Hero',
  'sidebar': 'Pasek boczny',
  'in-content': 'W treści artykułu',
  'footer': 'Stopka',
}

const formatLabels: Record<string, string> = {
  'banner': 'Banner',
  'square': 'Kwadrat',
  'skyscraper': 'Wieżowiec',
  'native': 'Natywna',
}

function AdCard({ ad }: { ad: Ad }) {
  const [isActive, setIsActive] = useState(ad.isActive)

  return (
    <Card className={`transition-all ${!isActive ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Preview */}
          <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            {ad.imageUrl ? (
              <img 
                src={ad.imageUrl} 
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">{ad.title}</h3>
                <p className="text-sm text-muted-foreground">{ad.client}</p>
              </div>
              <Switch 
                checked={isActive} 
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary">
                {positionLabels[ad.position]}
              </Badge>
              <Badge variant="outline">
                {formatLabels[ad.format]}
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{ad.impressions.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MousePointer className="h-4 w-4" />
                <span>{ad.clicks.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-primary font-medium">
                <BarChart3 className="h-4 w-4" />
                <span>{((ad.clicks / ad.impressions) * 100).toFixed(2)}% CTR</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Date info */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex justify-between">
          <span>Start: {new Date(ad.startDate).toLocaleDateString('pl-PL')}</span>
          <span>Koniec: {new Date(ad.endDate).toLocaleDateString('pl-PL')}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdsPage() {
  const [filterPosition, setFilterPosition] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredAds = mockAds.filter(ad => {
    if (filterPosition !== 'all' && ad.position !== filterPosition) return false
    if (filterStatus === 'active' && !ad.isActive) return false
    if (filterStatus === 'inactive' && ad.isActive) return false
    return true
  })

  // Stats
  const totalImpressions = mockAds.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = mockAds.reduce((sum, ad) => sum + ad.clicks, 0)
  const activeAds = mockAds.filter(ad => ad.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reklamy</h1>
          <p className="text-muted-foreground">Zarządzaj kampaniami reklamowymi</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nowa reklama
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Dodaj nową reklamę</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nazwa kampanii</label>
                <Input placeholder="Np. EcoBottle - Banner Hero" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Klient</label>
                <Input placeholder="Nazwa klienta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pozycja</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero-banner">Banner Hero</SelectItem>
                      <SelectItem value="sidebar">Pasek boczny</SelectItem>
                      <SelectItem value="in-content">W treści</SelectItem>
                      <SelectItem value="footer">Stopka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Format</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="square">Kwadrat</SelectItem>
                      <SelectItem value="skyscraper">Wieżowiec</SelectItem>
                      <SelectItem value="native">Natywna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL docelowy</label>
                <Input placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Grafika</label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Przeciągnij plik lub kliknij aby wybrać
                  </p>
                </div>
              </div>
              <Button className="w-full">Dodaj reklamę</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAds.length}</p>
                <p className="text-xs text-muted-foreground">Wszystkie reklamy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAds}</p>
                <p className="text-xs text-muted-foreground">Aktywne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(totalImpressions / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground">Wyświetlenia</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <MousePointer className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{((totalClicks / totalImpressions) * 100).toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">Średni CTR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filterPosition} onValueChange={setFilterPosition}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pozycja" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie pozycje</SelectItem>
            <SelectItem value="hero-banner">Banner Hero</SelectItem>
            <SelectItem value="sidebar">Pasek boczny</SelectItem>
            <SelectItem value="in-content">W treści</SelectItem>
            <SelectItem value="footer">Stopka</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="active">Aktywne</SelectItem>
            <SelectItem value="inactive">Nieaktywne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ads list */}
      <div className="space-y-4">
        {filteredAds.map(ad => (
          <AdCard key={ad.id} ad={ad} />
        ))}

        {filteredAds.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <EyeOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Brak reklam</h3>
              <p className="text-muted-foreground mb-4">
                Nie znaleziono reklam spełniających kryteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
