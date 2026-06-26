'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Image as ImageIcon, Trash2, Plus, Save, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Banner {
  id: string
  title: string
  position: string
  image_url: string
  link_url: string
  is_active: boolean
  order: number
}

const POSITIONS = [
  { value: 'header', label: 'Nagłówek strony' },
  { value: 'homepage-hero', label: 'Hero strony głównej' },
  { value: 'homepage-infographic', label: 'Infografika strony głównej' },
  { value: 'inline', label: 'W treści artykułów' },
  { value: 'sidebar', label: 'Pasek boczny' },
  { value: 'footer', label: 'Stopka' },
]

export default function BaneryPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Load banners on mount
  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      const response = await fetch('/api/banners')
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)
      
      // Map from API format to local format
      const mapped = (result.data || []).map((b: Record<string, unknown>) => ({
        id: b.id,
        title: b.title,
        position: b.position,
        image_url: b.imageUrl,
        link_url: b.linkUrl,
        is_active: b.isActive,
        order: b.order,
      }))
      setBanners(mapped)
    } catch (e) {
      console.error('Failed to load banners:', e)
      toast.error('Błąd ładowania banerów')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper to update banner and mark dirty
  const updateBanner = (bannerId: string, updates: Partial<Banner>) => {
    setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, ...updates } : b))
    setIsDirty(true)
  }

  const handleFileUpload = async (bannerId: string, file: File) => {
    // Validate file
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']
    
    if (!allowedExtensions.includes(extension)) {
      toast.error('Niedozwolony format. Dozwolone: PNG, JPG, WebP, GIF, SVG')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Plik za duży. Max 10MB')
      return
    }

    setUploadingId(bannerId)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.url) {
        setBanners(prev => prev.map(b =>
          b.id === bannerId ? { ...b, image_url: result.url } : b
        ))
        setIsDirty(true)
        toast.success('Obraz wgrany! Kliknij "Zapisz" aby zachować zmiany.')
      } else {
        toast.error(result.error || 'Błąd uploadu')
      }
    } catch (error) {
      toast.error('Błąd połączenia')
    } finally {
      setUploadingId(null)
    }
  }

  const addBanner = () => {
    const newBanner: Banner = {
      id: `new-${Date.now()}`,
      title: 'Nowa infografika',
      position: 'homepage-infographic',
      image_url: '',
      link_url: '',
      is_active: true, // Default to active so it shows immediately after saving
      order: banners.length,
    }
    setBanners(prev => [...prev, newBanner])
    setIsDirty(true)
    toast.info('Dodano banner - wgraj obraz i kliknij Zapisz')
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten banner?')) return

    // If it's a new banner (not saved yet), just remove from state
    if (id.startsWith('new-')) {
      setBanners(prev => prev.filter(b => b.id !== id))
      return
    }

    try {
      const response = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)
      
      setBanners(prev => prev.filter(b => b.id !== id))
      toast.success('Banner usunięty')
    } catch (e) {
      console.error('Failed to delete banner:', e)
      toast.error('Błąd usuwania')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      for (const banner of banners) {
        const bannerData = {
          id: banner.id.startsWith('new-') ? undefined : banner.id,
          title: banner.title,
          position: banner.position,
          image_url: banner.image_url,
          link_url: banner.link_url,
          is_active: banner.is_active,
          order: banner.order,
        }

        if (banner.id.startsWith('new-')) {
          // Insert new banner via API
          const response = await fetch('/api/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bannerData),
          })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error)
        } else {
          // Update existing banner via API
          const response = await fetch('/api/banners', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bannerData),
          })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error)
        }
      }

      setIsDirty(false)
      toast.success('Zapisano wszystkie banery!')
      loadBanners() // Reload to get proper IDs
    } catch (e) {
      console.error('Failed to save banners:', e)
      toast.error('Błąd zapisywania: ' + (e instanceof Error ? e.message : 'Nieznany błąd'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Banery i infografiki</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj grafikami na stronie (Vercel Blob)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={addBanner}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj banner
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Zapisz
          </Button>
        </div>
      </div>

      {/* Info card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Wgrywanie obrazów</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Obrazy są przechowywane w Vercel Blob (szybki CDN). Zalecane rozmiary:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>- Infografika: 1200x800px (lub proporcja 3:2)</li>
                <li>- Hero: 1920x600px</li>
                <li>- Sidebar: 300x600px</li>
                <li>- Formaty: PNG, JPG, WebP, GIF, SVG (max 10MB)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banners list */}
      {banners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-1">Brak banerów</h3>
            <p className="text-sm text-muted-foreground mb-4">Dodaj pierwszy banner</p>
            <Button variant="outline" onClick={addBanner}>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <Card key={banner.id} className={`${!banner.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <Input
                      value={banner.title}
                      onChange={(e) => updateBanner(banner.id, { title: e.target.value })}
                      className="font-semibold"
                      placeholder="Nazwa bannera"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(checked) => updateBanner(banner.id, { is_active: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBanner(banner.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image preview / upload */}
                <div className="aspect-video rounded-lg bg-muted/50 border-2 border-dashed border-border relative overflow-hidden">
                  {banner.image_url ? (
                    <>
                      <Image
                        src={banner.image_url}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => updateBanner(banner.id, { image_url: '' })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Brak obrazu</p>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[banner.id] = el }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(banner.id, file)
                      e.target.value = ''
                    }}
                  />
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRefs.current[banner.id]?.click()}
                    disabled={uploadingId === banner.id}
                  >
                    {uploadingId === banner.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Wgraj obraz
                  </Button>
                </div>

                {/* URL input */}
                <div className="space-y-2">
                  <Label>lub wklej URL obrazu</Label>
                  <Input
                    value={banner.image_url}
                    onChange={(e) => updateBanner(banner.id, { image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label>Pozycja na stronie</Label>
                  <Select
                    value={banner.position}
                    onValueChange={(value) => updateBanner(banner.id, { position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(pos => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <Label>Link (opcjonalnie)</Label>
                  <Input
                    value={banner.link_url}
                    onChange={(e) => updateBanner(banner.id, { link_url: e.target.value })}
                    placeholder="https://... lub /poradniki"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
