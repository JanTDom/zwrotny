'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Eye,
  Sparkles,
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
  Upload,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImagePickerModal } from '@/components/admin/image-picker-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import dynamic from 'next/dynamic'
import { adminApi } from '@/hooks/use-admin-data'
import { toast } from 'sonner'
import type { PostCategory } from '@/types'

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then(m => ({ default: m.RichTextEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-lg min-h-[400px] flex items-center justify-center text-muted-foreground text-sm">
        Wczytywanie edytora...
      </div>
    ),
  }
)

const postCategories = [
  { id: 'news', name: 'Aktualności', slug: 'aktualnosci' },
  { id: 'guides', name: 'Poradniki', slug: 'poradniki' },
  { id: 'law', name: 'Prawo', slug: 'prawo' },
  { id: 'business', name: 'Dla biznesu', slug: 'dla-biznesu' },
]

const mockAuthors = [
  { id: '1', name: 'Redakcja ZWROTNY.pl' },
]

// TODO: Backend Railway - Replace with API calls for saving

export default function NewArticlePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [originalSource, setOriginalSource] = useState<{ title: string; content: string } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    coverImage: '',
    authorId: mockAuthors[0].id,
    status: 'draft',
    seo: {
      title: '',
      description: '',
      ogImage: '',
      keywords: [] as string[],
    },
  })
  const [newTag, setNewTag] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [openAIKey, setOpenAIKey] = useState<string | null>(null)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)

  // Load OpenAI key from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await adminApi.getSettings()
        const data = response.data as { apiConfigs?: { envKey: string; value: string }[] } | null
        if (data?.apiConfigs) {
          const configs = data.apiConfigs
          const openaiConfig = configs.find(c => c.envKey === 'OPENAI_API_KEY')
          if (openaiConfig?.value) {
            setOpenAIKey(openaiConfig.value)
          }
        }
      } catch (e) {
        console.error('Failed to load OpenAI key from Supabase:', e)
      }
    }
    loadSettings()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Wybierz plik obrazu (JPG, PNG, GIF, WebP)')
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
      const filename = `article-${timestamp}.${ext}`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      setFormData(prev => ({ ...prev, coverImage: urlData.publicUrl }))
      toast.success('Obraz wgrany!')
    } catch (error) {
      console.error('Image upload failed:', error)
      toast.error('Błąd wgrywania: ' + (error instanceof Error ? error.message : 'nieznany błąd'))
    } finally {
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleGenerateImage = async () => {
    if (!formData.title && !imagePrompt) {
      toast.error('Wpisz tytuł artykułu lub prompt obrazu.')
      return
    }

    const prompt = imagePrompt || `Profesjonalne zdjęcie ilustrujące artykuł o temacie: "${formData.title}". Styl: nowoczesny, czysty, minimalistyczny. Bez tekstu na obrazie.`

    setIsGeneratingImage(true)

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd generowania obrazu')
      }

      setFormData(prev => ({ ...prev, coverImage: data.imageUrl }))
      setImagePrompt('')
      toast.success('Obraz został wygenerowany')
    } catch (error) {
      console.error('Image generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Błąd generowania obrazu')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[ąĄ]/g, 'a')
      .replace(/[ćĆ]/g, 'c')
      .replace(/[ęĘ]/g, 'e')
      .replace(/[łŁ]/g, 'l')
      .replace(/[ńŃ]/g, 'n')
      .replace(/[óÓ]/g, 'o')
      .replace(/[śŚ]/g, 's')
      .replace(/[źŹżŻ]/g, 'z')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }))
  }

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const handleAIGenerate = async () => {
    if (!formData.title) {
      toast.error('Wpisz najpierw tytuł artykułu.')
      return
    }
    setIsGenerating(true)
    try {
      // On first generation save the raw input as originalSource so every
      // subsequent re-generation rewrites the same raw material, not AI output
      const source = originalSource ?? { title: formData.title, content: formData.excerpt || formData.content || formData.title }
      if (!originalSource) setOriginalSource(source)

      const response = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTitle: source.title,
          sourceContent: source.content,
          customPrompt: aiPrompt.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Błąd generowania')
      setFormData(prev => ({
        ...prev,
        ...(data.title ? { title: data.title } : {}),
        ...(data.excerpt ? { excerpt: data.excerpt } : {}),
        ...(data.content ? { content: data.content } : {}),
      }))
      toast.success('Artykul wygenerowany przez AI')
      setShowAIPanel(false)
      setAiPrompt('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Błąd generowania przez AI')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setIsSaving(true)
    
    try {
      await adminApi.createPost({
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category as PostCategory,
        coverImage: formData.coverImage,
        status: status,
      })
      
      toast.success(status === 'published' ? 'Artykuł opublikowany' : 'Zapisano szkic')
      router.push('/zk7m9/artykuly')
    } catch (e) {
      console.error('Failed to save article:', e)
      toast.error('Błąd podczas zapisywania')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/zk7m9/artykuly">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nowy artykuł</h1>
            <p className="text-muted-foreground">
              Utwórz nowy artykuł ręcznie lub z pomocą AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Podgląd
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz szkic
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Opublikuj
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main editor */}
        <div className="space-y-6">
          {/* Title & slug */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł artykułu</Label>
                <Input
                  id="title"
                  placeholder="Wpisz tytuł artykułu..."
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/artykul/</span>
                  <Input
                    id="slug"
                    placeholder="slug-artykulu"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover image */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Obraz wyrozniajacy</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsImagePickerOpen(true)}
              >
                <ImageIcon className="h-4 w-4" />
                Wybierz zdjecie
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.coverImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden group">
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsImagePickerOpen(true)}
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Zmien
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Usun
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsImagePickerOpen(true)}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 hover:border-primary hover:bg-muted/70 transition-colors flex flex-col items-center justify-center gap-3"
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Kliknij, aby wybrac zdjecie</p>
                    <p className="text-sm text-muted-foreground">Unsplash, Pexels, wgraj z dysku lub generuj AI</p>
                  </div>
                </button>
              )}
            </CardContent>
          </Card>

          <ImagePickerModal
            open={isImagePickerOpen}
            onClose={() => setIsImagePickerOpen(false)}
            onSelect={(url) => { setFormData(prev => ({ ...prev, coverImage: url })); setIsImagePickerOpen(false) }}
            articleTitle={formData.title}
          />

          {/* Content editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Treść artykułu</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
                onClick={() => setShowAIPanel(v => !v)}
              >
                <Sparkles className="h-4 w-4" />
                Wygeneruj przez AI
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Generate panel */}
              {showAIPanel && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI przepisze tytul, zajawke i tresc na podstawie obecnej zawartosci
                  </p>
                  <Textarea
                    placeholder="Dodatkowe instrukcje (opcjonalne): np. &quot;napisz bardziej formalnie&quot;, &quot;skroc do 500 slow&quot;..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowAIPanel(false); setAiPrompt('') }}
                    >
                      Anuluj
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={handleAIGenerate}
                      disabled={isGenerating || !formData.title}
                    >
                      {isGenerating ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Generuje...</>
                      ) : (
                        <><Sparkles className="h-4 w-4" />Generuj</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="excerpt">Zajawka</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Krotki opis artykulu wyswietlany na listach..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Tresc artykulu</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  placeholder="Zacznij pisac tresc artykulu..."
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Meta Title</Label>
                <Input
                  id="seo-title"
                  placeholder="Tytuł dla wyszukiwarek..."
                  value={formData.seo.title}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { ...prev.seo, title: e.target.value },
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seo.title.length}/60 znaków
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  placeholder="Opis dla wyszukiwarek..."
                  value={formData.seo.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { ...prev.seo, description: e.target.value },
                  }))}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seo.description.length}/160 znaków
                </p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ustawienia publikacji</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {postCategories.map(cat => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Select
                  value={formData.authorId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, authorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAuthors.map(author => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tagi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Dodaj tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button variant="outline" size="icon" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {formData.tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">Brak tagów</p>
                )}
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  )
}
