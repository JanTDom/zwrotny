'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  Search,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  Check,
  Wand2,
  Image as ImageIcon,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import type { StockPhoto } from '@/app/api/images/search/route'

const ENHANCE_STYLES = [
  { value: 'photo', label: 'Profesjonalne' },
  { value: 'vibrant', label: 'Kolory' },
  { value: 'minimal', label: 'Minimalizm' },
  { value: 'dramatic', label: 'Dramatyczne' },
  { value: 'natural', label: 'Naturalne' },
]

interface ImagePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  articleTitle?: string
  articleContent?: string
}

export function ImagePickerModal({ open, onClose, onSelect, articleTitle, articleContent }: ImagePickerModalProps) {
  // Stock search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StockPhoto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchPage, setSearchPage] = useState(1)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedSource, setSelectedSource] = useState<'all' | 'unsplash' | 'pexels'>('all')

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // URL state
  const [urlInput, setUrlInput] = useState('')

  // AI Generate state
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // AI Enhance state — shown after selecting a stock/upload photo
  const [pendingImage, setPendingImage] = useState<{ url: string; source: 'stock' | 'upload' | 'url' } | null>(null)
  const [enhancePrompt, setEnhancePrompt] = useState('')
  const [enhanceStyle, setEnhanceStyle] = useState('photo')
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Auto-search when modal opens and article has a title — no need to type anything
  useEffect(() => {
    if (open && articleTitle && !hasSearched && !isSearching) {
      handleSearch(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, articleTitle])

  // --- Helpers ---
  const reset = () => {
    setPendingImage(null)
    setEnhancePrompt('')
    setEnhanceStyle('photo')
  }

  const handleSelect = (url: string) => {
    onSelect(url)
    onClose()
    reset()
  }

  // --- Stock photo search ---
  const handleSearch = useCallback(async (page = 1) => {
    const q = searchQuery.trim() || articleTitle?.trim()
    if (!q) { toast.error('Wpisz fraze do wyszukania'); return }

    setIsSearching(true)
    setHasSearched(true)
    if (page === 1) setSearchResults([])

    try {
      const params = new URLSearchParams({
        q,
        source: selectedSource,
        page: String(page),
        ...(articleTitle ? { title: articleTitle } : {}),
      })
      const res = await fetch(`/api/images/search?${params}`)
      const data = await res.json()

      if (data.errors?.length > 0 && data.photos?.length === 0) {
        toast.error(data.errors[0])
      }
      if (page === 1) {
        setSearchResults(data.photos || [])
      } else {
        setSearchResults(prev => [...prev, ...(data.photos || [])])
      }
      setSearchPage(page)
    } catch {
      toast.error('Blad wyszukiwania')
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, selectedSource, articleTitle])

  // --- Upload from computer ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Wybierz plik obrazu'); return }
    if (file.size > 15 * 1024 * 1024) { toast.error('Plik max 15MB'); return }

    setIsUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filename = `article-${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('images').upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path)
      setPendingImage({ url: urlData.publicUrl, source: 'upload' })
    } catch (err) {
      toast.error('Blad wgrywania: ' + (err instanceof Error ? err.message : 'nieznany'))
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  // --- AI Generate ---
  const handleAIGenerate = async () => {
    // If no prompt typed, API will auto-build one from articleTitle + articleContent
    if (!aiPrompt.trim() && !articleTitle) {
      toast.error('Wpisz opis obrazu lub otwórz modal z poziomu artykułu z tytułem')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim() || undefined,
          articleTitle: articleTitle || undefined,
          articleContent: articleContent || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd generowania')
      if (data.warning) toast.warning(data.warning)
      handleSelect(data.imageUrl)
      toast.success('Obraz wygenerowany!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Błąd AI')
    } finally {
      setIsGenerating(false)
    }
  }

  // --- AI Enhance ---
  const handleEnhance = async () => {
    if (!pendingImage) return
    setIsEnhancing(true)
    try {
      const res = await fetch('/api/images/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: pendingImage.url,
          prompt: enhancePrompt || null,
          style: enhanceStyle,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Blad AI enhance')
      handleSelect(data.imageUrl)
      toast.success('Zdjecie podrasowane przez AI')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Blad AI enhance')
    } finally {
      setIsEnhancing(false)
    }
  }

  // --- Select stock photo (opens enhance prompt) ---
  const handleStockSelect = (photo: StockPhoto) => {
    setPendingImage({ url: photo.previewUrl, source: 'stock' })
  }

  // --- Render enhance step ---
  if (pendingImage) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset() } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Podrasuj zdjecie przez AI (opcjonalnie)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
              <img src={pendingImage.url} alt="Podglad" className="w-full h-full object-cover" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={reset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Enhance options */}
            <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Podrasuj to zdjecie przez AI
              </p>

              <div className="space-y-1">
                <Label className="text-xs">Styl (jesli nie podajesz wlasnego opisu)</Label>
                <div className="flex flex-wrap gap-2">
                  {ENHANCE_STYLES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setEnhanceStyle(s.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        enhanceStyle === s.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Lub wpisz wlasny opis co AI ma zmienic</Label>
                <Textarea
                  placeholder="np. Dodaj mocniejsze kolory, bardziej dynamiczne oswietlenie, klimat ekologiczny..."
                  value={enhancePrompt}
                  onChange={e => setEnhancePrompt(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              <Button
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="w-full gap-2"
              >
                {isEnhancing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Podrasowuje...</>
                ) : (
                  <><Wand2 className="h-4 w-4" />Podrasuj przez AI</>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSelect(pendingImage.url)}
              >
                <Check className="h-4 w-4 mr-2" />
                Uzyj bez zmian
              </Button>
              <Button variant="ghost" onClick={reset}>
                Wróc
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Wybierz zdjecie
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stock">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="stock">
              <Search className="h-4 w-4 mr-1.5" />
              Bazy zdjec
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-1.5" />
              Z komputera
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-1.5" />
              URL
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-1.5" />
              Generuj AI
            </TabsTrigger>
          </TabsList>

          {/* ---- TAB: Stock photos ---- */}
          <TabsContent value="stock" className="space-y-4 mt-4">
            <div className="space-y-3">
              {/* Source filter */}
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-sm text-muted-foreground">Zrodlo:</span>
                {(['all', 'unsplash', 'pexels'] as const).map(src => (
                  <button
                    key={src}
                    onClick={() => setSelectedSource(src)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedSource === src
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {src === 'all' ? 'Wszystkie' : src === 'unsplash' ? 'Unsplash' : 'Pexels'}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={articleTitle ? `np. "${articleTitle.slice(0, 30)}..."` : 'Wpisz fraze, np. kaucja, recykling, opakowania...'}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => handleSearch(1)} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {/* Active query info — shows what was auto-searched */}
              {articleTitle && !searchQuery && hasSearched && (
                <p className="text-xs text-muted-foreground">
                  Wyniki dla tytulu artykulu: &ldquo;{articleTitle.slice(0, 60)}&rdquo;
                </p>
              )}
            </div>

            {/* Results grid */}
            {isSearching && searchResults.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchResults.map(photo => (
                    <div
                      key={photo.id}
                      className="group relative rounded-lg overflow-hidden border bg-muted cursor-pointer"
                      onClick={() => handleStockSelect(photo)}
                    >
                      <div className="aspect-video">
                        <img
                          src={photo.thumbUrl}
                          alt={photo.alt}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <Button size="sm" variant="secondary" className="gap-1 text-xs">
                          <Check className="h-3 w-3" />
                          Wybierz
                        </Button>
                        <a
                          href={photo.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-white/80 hover:text-white text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {photo.source === 'unsplash' ? 'Unsplash' : 'Pexels'}
                        </a>
                      </div>
                      {/* Source badge */}
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1.5 left-1.5 text-[10px] px-1.5 py-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {photo.source}
                      </Badge>
                    </div>
                  ))}
                </div>
                {/* Load more */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleSearch(searchPage + 1)}
                  disabled={isSearching}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Wiecej wynikow
                </Button>
              </div>
            ) : hasSearched ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Brak wynikow</p>
                <p className="text-sm mt-1">Sprawdz czy klucze Unsplash/Pexels sa dodane w Ustawieniach API</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Wyszukaj zdjecia</p>
                <p className="text-sm mt-1">Korzystasz z Unsplash i Pexels — miliony darmowych, legalnych zdjec</p>
                <p className="text-xs mt-1 text-muted-foreground/60">
                  Dodaj klucze w CMS &rarr; Ustawienia API
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Zdjecia dostarczone przez Unsplash i Pexels na licencji darmowej do uzytkow komercyjnych.
              Po wyborze pojawi sie opcja podrasowania przez AI.
            </p>
          </TabsContent>

          {/* ---- TAB: Upload ---- */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-3">
              <label
                className={`flex flex-col items-center justify-center gap-3 w-full py-12 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  isUploading
                    ? 'border-muted bg-muted pointer-events-none'
                    : 'border-border hover:border-primary hover:bg-muted/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  className="sr-only"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                    <p className="text-sm font-medium">Wgrywanie...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">Przeciagnij plik lub kliknij</p>
                      <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP — max 15MB</p>
                    </div>
                  </>
                )}
              </label>
              <p className="text-xs text-muted-foreground">
                Po wgraniu pojawi sie mozliwosc podrasowania zdjecia przez AI.
              </p>
            </div>
          </TabsContent>

          {/* ---- TAB: URL ---- */}
          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>URL zdjecia</Label>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                />
              </div>
              {urlInput && (
                <div className="rounded-lg overflow-hidden border bg-muted aspect-video">
                  <img
                    src={urlInput}
                    alt="Podglad"
                    className="w-full h-full object-cover"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2"
                  disabled={!urlInput.trim()}
                  onClick={() => {
                    if (urlInput.trim()) setPendingImage({ url: urlInput.trim(), source: 'url' })
                  }}
                >
                  <Wand2 className="h-4 w-4" />
                  Dalej (z opcja AI)
                </Button>
                <Button
                  variant="outline"
                  disabled={!urlInput.trim()}
                  onClick={() => { if (urlInput.trim()) handleSelect(urlInput.trim()) }}
                >
                  Uzyj bez zmian
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ---- TAB: AI Generate ---- */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Wygeneruj zdjecie przez DALL-E 3
              </p>
              <div className="space-y-2">
                <Label>Opis obrazu</Label>
                <Textarea
                  placeholder={
                    articleTitle
                      ? `np. Profesjonalne zdjecie do artykulu "${articleTitle.slice(0, 40)}..." — butelki PET, recykling, Polska...`
                      : 'Opisz co chcesz zobaczyc na zdjeciu...'
                  }
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={3}
                />
                {articleTitle && (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => setAiPrompt(`Profesjonalne zdjecie editorialne ilustrujace artykul pt. "${articleTitle}". Tematyka systemu kaucyjnego, recyklingu, ekologii. Bez tekstu na obrazie, szerokie 16:9.`)}
                  >
                    Wype⁠lnij automatycznie na podstawie tytulu
                  </button>
                )}
              </div>
              <Button
                onClick={handleAIGenerate}
                disabled={isGenerating || (!aiPrompt.trim() && !articleTitle)}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Generuje...</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Wygeneruj obraz</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Wymaga klucza OpenAI API (Ustawienia API). Generuje unikalny, niepowtarzalny obraz.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
