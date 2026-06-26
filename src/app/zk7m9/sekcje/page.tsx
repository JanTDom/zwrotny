'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GripVertical, Eye, EyeOff, Save, RotateCcw, X, Video, Upload, Loader2, ImageIcon, Type, LayoutTemplate } from 'lucide-react'
import { toast } from 'sonner'

const SETTINGS_STORAGE_KEY = 'zwrotny_home_settings'

interface Section {
  id: string
  name: string
  description: string
  enabled: boolean
  order: number
}

const initialSections: Section[] = [
  { id: 'hero', name: 'Hero', description: 'Główny banner z nagłówkiem i CTA', enabled: true, order: 1 },
  { id: 'founder', name: 'Twórca portalu', description: 'Pasek z informacją o twórcy portalu', enabled: true, order: 2 },
  { id: 'infographic', name: 'Infografika', description: 'Statystyki i liczby', enabled: true, order: 3 },
  { id: 'bonuses', name: 'Bonusy PDF', description: 'Pliki PDF do pobrania', enabled: true, order: 4 },
  { id: 'filmy', name: 'Filmy MP4', description: 'Filmy wideo 9:16', enabled: true, order: 5 },
  { id: 'articles', name: 'Artykuły', description: 'Lista najnowszych wpisów', enabled: true, order: 6 },
  { id: 'youtube', name: 'YouTube', description: 'Sekcja z filmami', enabled: true, order: 7 },
  { id: 'guides', name: 'Poradniki', description: 'Karty edukacyjne', enabled: true, order: 8 },
  { id: 'myths', name: 'Mity vs Fakty', description: 'Obalanie mitów', enabled: true, order: 9 },
  { id: 'newsletter', name: 'Newsletter', description: 'Formularz zapisu', enabled: true, order: 10 },
]

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [articlesCount, setArticlesCount] = useState(6)
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [imageEnabled, setImageEnabled] = useState(false)

  const [heroMode, setHeroMode] = useState<'full' | 'compact'>('full')

  // Hero text states
  const [heroTagline, setHeroTagline] = useState('Portal, który')
  const [heroTaglineHighlight, setHeroTaglineHighlight] = useState('odczarowuje')
  const [heroTaglineSuffix, setHeroTaglineSuffix] = useState('system kaucyjny w Polsce!')
  const [heroTitle, setHeroTitle] = useState('Kaucja?')
  const [heroTitleHighlight, setHeroTitleHighlight] = useState('To proste.')
  const [heroDescription, setHeroDescription] = useState('Jedyny portal o systemie kaucyjnym, który nie usypia.\nWiadomości, poradniki i zero ekologicznego bełkotu.')
  const [heroCtaPrimaryText, setHeroCtaPrimaryText] = useState('Jak to działa?')
  const [heroCtaPrimaryUrl, setHeroCtaPrimaryUrl] = useState('/jak-to-dziala')
  const [heroCtaSecondaryText, setHeroCtaSecondaryText] = useState('Aktualności')
  const [heroCtaSecondaryUrl, setHeroCtaSecondaryUrl] = useState('/aktualnosci')

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        const result = await res.json()
        if (result.data?.homepageSettings) {
          const settings = result.data.homepageSettings
          if (settings.articlesCount) setArticlesCount(settings.articlesCount)
          if (settings.sections) {
            // Merge: saved order/enabled wins, but always include ALL initialSections (adds new ones)
            const saved: Section[] = settings.sections
            const merged = initialSections.map(def => {
              const found = saved.find(s => s.id === def.id)
              return found ? { ...def, ...found } : def
            }).sort((a, b) => a.order - b.order)
            setSections(merged)
          }
          if (settings.backgroundVideo) setBackgroundVideo(settings.backgroundVideo)
          if (settings.videoEnabled !== undefined) setVideoEnabled(settings.videoEnabled)
          if (settings.backgroundImage) setBackgroundImage(settings.backgroundImage)
          if (settings.imageEnabled !== undefined) setImageEnabled(settings.imageEnabled)
          if (settings.heroTagline) setHeroTagline(settings.heroTagline)
          if (settings.heroTaglineHighlight) setHeroTaglineHighlight(settings.heroTaglineHighlight)
          if (settings.heroTaglineSuffix) setHeroTaglineSuffix(settings.heroTaglineSuffix)
          if (settings.heroTitle) setHeroTitle(settings.heroTitle)
          if (settings.heroTitleHighlight) setHeroTitleHighlight(settings.heroTitleHighlight)
          if (settings.heroDescription) setHeroDescription(settings.heroDescription)
          if (settings.heroCtaPrimaryText) setHeroCtaPrimaryText(settings.heroCtaPrimaryText)
          if (settings.heroCtaPrimaryUrl) setHeroCtaPrimaryUrl(settings.heroCtaPrimaryUrl)
          if (settings.heroCtaSecondaryText) setHeroCtaSecondaryText(settings.heroCtaSecondaryText)
          if (settings.heroCtaSecondaryUrl) setHeroCtaSecondaryUrl(settings.heroCtaSecondaryUrl)
          if (settings.heroMode) setHeroMode(settings.heroMode)
        }
      } catch (e) {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.articlesCount) setArticlesCount(parsed.articlesCount)
            if (parsed.sections) setSections(parsed.sections)
          }
        } catch {
          // ignore
        }
      }
    }
    loadSettings()
  }, [])

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
    setHasChanges(true)
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    setSections(prev => {
      const draggedIndex = prev.findIndex(s => s.id === draggedId)
      const targetIndex = prev.findIndex(s => s.id === targetId)
      const newSections = [...prev]
      const [dragged] = newSections.splice(draggedIndex, 1)
      newSections.splice(targetIndex, 0, dragged)
      return newSections.map((s, i) => ({ ...s, order: i + 1 }))
    })
    setHasChanges(true)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const settings = {
      sections,
      articlesCount,
      backgroundVideo,
      videoEnabled,
      backgroundImage,
      imageEnabled,
      heroTagline,
      heroTaglineHighlight,
      heroTaglineSuffix,
      heroTitle,
      heroTitleHighlight,
      heroDescription,
      heroCtaPrimaryText,
      heroCtaPrimaryUrl,
      heroCtaSecondaryText,
      heroCtaSecondaryUrl,
      heroMode,
    }
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homepageSettings: settings }),
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      // Also save to localStorage as backup
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      setHasChanges(false)
      toast.success('Zapisano ustawienia strony głównej!')
    } catch (e) {
      console.error('Failed to save settings:', e)
      toast.error('Błąd zapisywania ustawień')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSections(initialSections)
    setHasChanges(false)
  }

  const handleRemoveVideo = () => {
    setBackgroundVideo(null)
    setVideoEnabled(false)
    setHasChanges(true)
  }

  const handleRemoveImage = () => {
    setBackgroundImage(null)
    setImageEnabled(false)
    setHasChanges(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Wybierz plik obrazu (JPG, PNG)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Plik jest za duży. Maksymalny rozmiar to 10MB.')
      return
    }

    setIsUploadingImage(true)
    
    try {
      const supabase = createClient()
      const timestamp = Date.now()
      const ext = file.name.split('.').pop()
      const filename = `background-image-${timestamp}.${ext}`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      setBackgroundImage(urlData.publicUrl)
      setImageEnabled(true)
      setHasChanges(true)
      toast.success('Obraz wgrany! Kliknij "Zapisz zmiany" aby zachować.')
    } catch (error) {
      console.error('Image upload failed:', error)
      toast.error('Błąd wgrywania: ' + (error instanceof Error ? error.message : 'nieznany błąd'))
    } finally {
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Wybierz plik wideo (MP4, WebM)')
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Plik jest za duży. Maksymalny rozmiar to 50MB.')
      return
    }

    setIsUploadingVideo(true)
    
    try {
      const supabase = createClient()
      
      // Generate unique filename
      const timestamp = Date.now()
      const ext = file.name.split('.').pop()
      const filename = `background-${timestamp}.${ext}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(data.path)

      setBackgroundVideo(urlData.publicUrl)
      setVideoEnabled(true)
      setHasChanges(true)
      toast.success('Film wgrany! Kliknij "Zapisz zmiany" aby zachować.')
    } catch (error) {
      console.error('Video upload failed:', error)
      toast.error('Błąd wgrywania: ' + (error instanceof Error ? error.message : 'nieznany błąd'))
    } finally {
      setIsUploadingVideo(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Sekcje strony</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj kolejnością i widocznością sekcji na stronie głównej</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetuj
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Zapisz zmiany
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" />
            Tryb wyświetlania Hero
          </CardTitle>
          <CardDescription>Wybierz czy hero ma być pełnym banerem czy zminimalizowanym paskiem w headerze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setHeroMode('full'); setHasChanges(true) }}
              className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                heroMode === 'full'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80 hover:bg-muted/40'
              }`}
            >
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${heroMode === 'full' ? 'border-primary' : 'border-muted-foreground'}`}>
                {heroMode === 'full' && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="font-medium text-sm">Pełny hero</p>
                <p className="text-xs text-muted-foreground mt-0.5">Logo, tytuł, opis, przyciski CTA i statystyki — standardowy duży baner na stronie głównej</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setHeroMode('compact'); setHasChanges(true) }}
              className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                heroMode === 'compact'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80 hover:bg-muted/40'
              }`}
            >
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${heroMode === 'compact' ? 'border-primary' : 'border-muted-foreground'}`}>
                {heroMode === 'compact' && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="font-medium text-sm">Zminimalizowany (w headerze)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tagline i przycisk CTA przeniesione do paska pod nawigacją — hero znika ze strony głównej</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Teksty sekcji Hero
          </CardTitle>
          <CardDescription>Edytuj wszystkie teksty widoczne na głównym banerze strony</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroTagline">Tagline — tekst przed wyróżnieniem</Label>
              <Input
                id="heroTagline"
                value={heroTagline}
                onChange={(e) => { setHeroTagline(e.target.value); setHasChanges(true) }}
                placeholder="Portal, który"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroTaglineHighlight">Tagline — wyróżnione słowo (gradient)</Label>
              <Input
                id="heroTaglineHighlight"
                value={heroTaglineHighlight}
                onChange={(e) => { setHeroTaglineHighlight(e.target.value); setHasChanges(true) }}
                placeholder="odczarowuje"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroTaglineSuffix">Tagline — tekst po wyróżnieniu</Label>
            <Input
              id="heroTaglineSuffix"
              value={heroTaglineSuffix}
              onChange={(e) => { setHeroTaglineSuffix(e.target.value); setHasChanges(true) }}
              placeholder="system kaucyjny w Polsce!"
            />
            <p className="text-xs text-muted-foreground">Efekt: <span className="font-medium">{heroTagline} <span className="text-primary">{heroTaglineHighlight}</span> {heroTaglineSuffix}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Tytuł główny (linia 1)</Label>
              <Input
                id="heroTitle"
                value={heroTitle}
                onChange={(e) => { setHeroTitle(e.target.value); setHasChanges(true) }}
                placeholder="Kaucja?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroTitleHighlight">Tytuł główny linia 2 (gradient)</Label>
              <Input
                id="heroTitleHighlight"
                value={heroTitleHighlight}
                onChange={(e) => { setHeroTitleHighlight(e.target.value); setHasChanges(true) }}
                placeholder="To proste."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroDescription">Opis pod tytułem</Label>
            <Textarea
              id="heroDescription"
              value={heroDescription}
              onChange={(e) => { setHeroDescription(e.target.value); setHasChanges(true) }}
              placeholder="Jedyny portal o systemie kaucyjnym..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroCtaPrimaryText">Przycisk główny — tekst</Label>
              <Input
                id="heroCtaPrimaryText"
                value={heroCtaPrimaryText}
                onChange={(e) => { setHeroCtaPrimaryText(e.target.value); setHasChanges(true) }}
                placeholder="Jak to działa?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroCtaPrimaryUrl">Przycisk główny — URL</Label>
              <Input
                id="heroCtaPrimaryUrl"
                value={heroCtaPrimaryUrl}
                onChange={(e) => { setHeroCtaPrimaryUrl(e.target.value); setHasChanges(true) }}
                placeholder="/jak-to-dziala"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroCtaSecondaryText">Przycisk drugorzędny — tekst</Label>
              <Input
                id="heroCtaSecondaryText"
                value={heroCtaSecondaryText}
                onChange={(e) => { setHeroCtaSecondaryText(e.target.value); setHasChanges(true) }}
                placeholder="Aktualności"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroCtaSecondaryUrl">Przycisk drugorzędny — URL</Label>
              <Input
                id="heroCtaSecondaryUrl"
                value={heroCtaSecondaryUrl}
                onChange={(e) => { setHeroCtaSecondaryUrl(e.target.value); setHasChanges(true) }}
                placeholder="/aktualnosci"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Kolejność sekcji</CardTitle>
          <CardDescription>Przeciągnij sekcje aby zmienić ich kolejność. Użyj przełącznika aby włączyć/wyłączyć.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-move ${
                draggedId === section.id 
                  ? 'border-primary bg-primary/5 opacity-50' 
                  : 'border-border bg-background hover:border-primary/50'
              } ${!section.enabled ? 'opacity-60' : ''}`}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{section.name}</span>
                  {!section.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Wyłączona
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{section.description}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {section.enabled ? (
                  <Eye className="w-4 h-4 text-primary" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Switch
                  checked={section.enabled}
                  onCheckedChange={() => toggleSection(section.id)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Ustawienia sekcji Aktualności</CardTitle>
          <CardDescription>Określ ile artykułów wyświetlać na stronie głównej</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="articlesCount" className="whitespace-nowrap">
              Liczba artykułów na stronie głównej:
            </Label>
            <Input
              id="articlesCount"
              type="number"
              min={1}
              max={12}
              value={articlesCount}
              onChange={(e) => {
                setArticlesCount(parseInt(e.target.value) || 6)
                setHasChanges(true)
              }}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">
              (1 duży + {Math.max(0, articlesCount - 1)} mniejszych)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Tło wideo
          </CardTitle>
          <CardDescription>
            Wgraj film, który będzie wyświetlany jako tło strony głównej. Film będzie widoczny na obrzeżach ekranu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="videoEnabled">Włącz tło wideo</Label>
            <Switch
              id="videoEnabled"
              checked={videoEnabled}
              onCheckedChange={(checked) => {
                setVideoEnabled(checked)
                setHasChanges(true)
              }}
              disabled={!backgroundVideo}
            />
          </div>

          {backgroundVideo ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video">
                <video
                  src={backgroundVideo}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleRemoveVideo}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Film jest wgrany. Możesz go usunąć i wgrać nowy.
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Wgraj film MP4 lub WebM (max 50MB)
              </p>
              <label className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${isUploadingVideo ? 'bg-muted text-muted-foreground pointer-events-none' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleVideoUpload}
                  className="sr-only"
                  disabled={isUploadingVideo}
                />
                {isUploadingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wgrywanie...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Wybierz film
                  </>
                )}
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Tło obrazkowe
          </CardTitle>
          <CardDescription>
            Wgraj zdjęcie, które będzie wyświetlane jako tło strony głównej. Zdjęcie będzie widoczne na obrzeżach ekranu z płynnym rozmyciem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="imageEnabled">Włącz tło obrazkowe</Label>
            <Switch
              id="imageEnabled"
              checked={imageEnabled}
              onCheckedChange={(checked) => {
                setImageEnabled(checked)
                setHasChanges(true)
              }}
              disabled={!backgroundImage}
            />
          </div>

          {backgroundImage ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-border aspect-video">
                <img
                  src={backgroundImage}
                  alt="Tło"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleRemoveImage}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Obraz jest wgrany. Możesz go usunąć i wgrać nowy.
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Wgraj obraz JPG lub PNG (max 10MB)
              </p>
              <label className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${isUploadingImage ? 'bg-muted text-muted-foreground pointer-events-none' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="sr-only"
                  disabled={isUploadingImage}
                />
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wgrywanie...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Wybierz obraz
                  </>
                )}
              </label>
            </div>
          )}

          {backgroundVideo && backgroundImage && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Uwaga: Masz wgrane zarówno wideo jak i obraz. Na stronie wyświetlone zostanie tylko jedno tło - wideo ma priorytet jeśli jest włączone.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Podgląd kolejności</CardTitle>
          <CardDescription>Tak będą wyświetlane sekcje na stronie głównej</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sections.filter(s => s.enabled).map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                {section.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
