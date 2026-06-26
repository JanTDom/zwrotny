'use client'

import { useState, useEffect, use } from 'react'
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
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImagePickerModal } from '@/components/admin/image-picker-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { adminApi } from '@/hooks/use-admin-data'
import type { Post, PostCategory } from '@/types'

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then(m => ({ default: m.RichTextEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-lg min-h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        Wczytywanie edytora...
      </div>
    ),
  }
)

const categories = [
  { value: 'aktualnosci', label: 'Aktualności' },
  { value: 'poradniki', label: 'Poradniki' },
  { value: 'prawo', label: 'Prawo' },
  { value: 'ekologia', label: 'Ekologia' },
  { value: 'biznes', label: 'Biznes' },
  { value: 'technologia', label: 'Technologia' },
]

const mockAuthors = [
  { id: '1', name: 'Redakcja ZWROTNY.pl' },
  { id: '2', name: 'Jan Kowalski' },
  { id: '3', name: 'Anna Nowak' },
]

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    coverImage: '',
    authorId: '1',
    featured: false,
    status: 'draft' as 'draft' | 'published',
    seo: {
      title: '',
      description: '',
      ogImage: '',
      keywords: [] as string[],
      ogTitle: '',
      ogDescription: '',
      focusKeyword: '',
      seoScore: null as number | null,
    },
  })
  const [newTag, setNewTag] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenPrompt, setRegenPrompt] = useState('')
  const [showRegenPanel, setShowRegenPanel] = useState(false)
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false)
  // Preserve the original source data (before any AI generation) for re-generation
  const [originalSource, setOriginalSource] = useState<{ title: string; content: string } | null>(null)
  
  // Helper to update form and mark as dirty
  const updateForm = (updates: Partial<typeof formData> | ((prev: typeof formData) => typeof formData)) => {
    setFormData(prev => typeof updates === 'function' ? updates(prev) : { ...prev, ...updates })
    setIsDirty(true)
  }
  const [imagePrompt, setImagePrompt] = useState('')
  const [openAIKey, setOpenAIKey] = useState<string | null>(null)

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Wybierz plik obrazu (JPG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Plik jest za duży. Maksymalny rozmiar to 10MB.')
      return
    }

    setIsUploadingImage(true)
    
    try {
      const supabase = createClient()
      
      // Generate unique filename
      const timestamp = Date.now()
      const ext = file.name.split('.').pop()
      const filename = `article-${timestamp}.${ext}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      updateForm({ coverImage: urlData.publicUrl })
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

      updateForm({ coverImage: data.imageUrl })
      setImagePrompt('')
      toast.success('Obraz został wygenerowany')
    } catch (error) {
      console.error('Image generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Błąd generowania obrazu')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleRegenerate = async () => {
    if (!formData.title) {
      toast.error('Artykuł musi mieć tytuł aby wygenerować treść przez AI.')
      return
    }
    setIsRegenerating(true)
    try {
      const response = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Always use the original source (pre-AI) so re-generation rewrites
          // raw material instead of the AI's own previous output
          sourceTitle: originalSource?.title || formData.title,
          // Never pass formData.content (AI-generated HTML) as source.
          // Fall back to excerpt or title only.
          sourceContent: originalSource?.content || formData.excerpt || formData.title,
          customPrompt: regenPrompt.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Błąd generowania')
      updateForm({
        ...(data.title ? { title: data.title } : {}),
        ...(data.excerpt ? { excerpt: data.excerpt } : {}),
        ...(data.content ? { content: data.content } : {}),
      })
      toast.success('Artykuł przetworzony przez AI')
      setShowRegenPanel(false)
      setRegenPrompt('')
    } catch (error) {
      console.error('Regenerate error:', error)
      toast.error(error instanceof Error ? error.message : 'Błąd generowania przez AI')
    } finally {
      setIsRegenerating(false)
    }
  }

  const ARTICLES_STORAGE_KEY = 'zwrotny_cms_articles'

  const fillFormFromArticle = (article: Partial<Post>) => {
    setFormData({
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      category: article.category || '',
      tags: article.tags || [],
      coverImage: article.coverImage || '',
      authorId: '1',
      featured: article.featured ?? false,
      status: (article.status as 'draft' | 'published') || 'draft',
      seo: {
        title: (article as any).seo?.metaTitle || (article as any).seo?.title || '',
        description: (article as any).seo?.metaDescription || (article as any).seo?.description || '',
        ogImage: (article as any).seo?.ogImage || '',
        keywords: (article as any).seo?.keywords || [],
        ogTitle: (article as any).seo?.ogTitle || '',
        ogDescription: (article as any).seo?.ogDescription || '',
        focusKeyword: (article as any).seo?.focusKeyword || '',
        seoScore: (article as any).seo?.seoScore ?? null,
      },
    })
  }

  // Load article from Supabase API
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const response = await fetch(`/api/posts/${id}`)
        if (response.ok) {
          const data = await response.json()
          const article = data.data
          if (article) {
            fillFormFromArticle(article)
            // Save original source once — used for all future re-generations
            // so AI always rewrites from raw material, not its own previous output
            // Use only the excerpt as source — it's the raw news summary.
            // Never use article.content which is already AI-generated HTML.
            setOriginalSource({
              title: article.title || '',
              content: article.excerpt || '',
            })
          } else {
            toast.error('Nie znaleziono artykułu')
          }
        } else {
          toast.error('Błąd ładowania artykułu')
        }
      } catch (e) {
        console.error('Failed to load article:', e)
        toast.error('Błąd ładowania artykułu')
      }
      
      setIsLoading(false)
    }
    loadArticle()
  }, [id])

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
    updateForm(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }))
  }

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      updateForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    updateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const handleGenerateSeo = async () => {
    if (!formData.title) {
      toast.error('Wpisz najpierw tytuł artykułu')
      return
    }
    setIsGeneratingSeo(true)
    try {
      const res = await fetch('/api/ai/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd generowania SEO')
      updateForm(prev => ({
        ...prev,
        seo: {
          title: data.metaTitle || prev.seo.title,
          description: data.metaDescription || prev.seo.description,
          ogImage: prev.seo.ogImage,
          keywords: data.keywords || prev.seo.keywords,
          ogTitle: data.ogTitle || prev.seo.ogTitle,
          ogDescription: data.ogDescription || prev.seo.ogDescription,
          focusKeyword: data.focusKeyword || prev.seo.focusKeyword,
          seoScore: data.seoScore ?? prev.seo.seoScore,
        },
      }))
      toast.success('SEO wygenerowane przez AI')
    } catch (e) {
      console.error('SEO generation error:', e)
      toast.error(e instanceof Error ? e.message : 'Błąd generowania SEO')
    } finally {
      setIsGeneratingSeo(false)
    }
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setIsSaving(true)

    // Auto-generate SEO if not yet set
    let seoData = {
      metaTitle: formData.seo.title,
      metaDescription: formData.seo.description,
      keywords: formData.seo.keywords,
      ogTitle: formData.seo.ogTitle,
      ogDescription: formData.seo.ogDescription,
      ogImage: formData.seo.ogImage,
      focusKeyword: formData.seo.focusKeyword,
      seoScore: formData.seo.seoScore,
    }

    if (!seoData.metaTitle && formData.title) {
      try {
        const res = await fetch('/api/ai/generate-seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content,
          }),
        })
        if (res.ok) {
          const generated = await res.json()
          seoData = {
            metaTitle: generated.metaTitle || '',
            metaDescription: generated.metaDescription || '',
            keywords: generated.keywords || [],
            ogTitle: generated.ogTitle || '',
            ogDescription: generated.ogDescription || '',
            ogImage: formData.seo.ogImage,
            focusKeyword: generated.focusKeyword || '',
            seoScore: generated.seoScore ?? null,
          }
          // Update form state so user sees it in the SEO card
          updateForm(prev => ({
            ...prev,
            seo: {
              ...prev.seo,
              title: seoData.metaTitle,
              description: seoData.metaDescription,
              keywords: seoData.keywords,
              ogTitle: seoData.ogTitle,
              ogDescription: seoData.ogDescription,
              focusKeyword: seoData.focusKeyword,
              seoScore: seoData.seoScore,
            },
          }))
        }
      } catch {
        // Non-blocking — save continues even if SEO generation fails
      }
    }

    const updatedArticle = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      content: formData.content,
      category: formData.category as PostCategory,
      coverImage: formData.coverImage,
      tags: formData.tags,
      featured: formData.featured,
      status: status,
      seo: seoData,
    }

    try {
      await adminApi.updatePost(id, updatedArticle as unknown as Partial<Post>)
      setIsDirty(false)
      toast.success(status === 'published' ? 'Artykuł opublikowany' : 'Zapisano szkic')
      router.push('/zk7m9/artykuly')
    } catch (e) {
      console.error('Failed to save:', e)
      toast.error('Błąd zapisywania artykułu')
    }

    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć ten artykuł?')) return
    
    try {
      await adminApi.deletePost(id)
      toast.success('Artykuł usunięty')
      router.push('/zk7m9/artykuly')
    } catch (e) {
      console.error('Failed to delete:', e)
      toast.error('Błąd usuwania artykułu')
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
            <h1 className="text-2xl font-bold text-foreground">Edytuj artykuł</h1>
            <p className="text-muted-foreground">
              Modyfikuj treść i ustawienia artykułu
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
            onClick={() => setShowRegenPanel(v => !v)}
          >
            <Sparkles className="h-4 w-4" />
            Wygeneruj przez AI
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/artykul/${formData.slug}`} target="_blank">
              <Eye className="h-4 w-4" />
              Podgląd
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={isSaving || !isDirty}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz szkic
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={isSaving || !formData.title}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Opublikuj
          </Button>
        </div>
      </div>

      {/* AI Regenerate panel */}
      {showRegenPanel && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="flex items-center gap-1.5 text-primary font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Wygeneruj artykuł ponownie przez AI
                </Label>
                <p className="text-xs text-muted-foreground">
                  AI przepisze tytuł, lead i treść na podstawie obecnej zawartości. Mozesz podac dodatkowe instrukcje.
                </p>
                <Textarea
                  placeholder="Dodatkowe instrukcje dla AI (opcjonalnie): np. &quot;napisz bardziej formalnie&quot;, &quot;skróć do 500 słów&quot;, &quot;dodaj więcej przykładów&quot;..."
                  value={regenPrompt}
                  onChange={e => setRegenPrompt(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowRegenPanel(false); setRegenPrompt('') }}
                >
                  Anuluj
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleRegenerate}
                  disabled={isRegenerating || !formData.title}
                >
                  {isRegenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generuję...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Generuj</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                    onChange={(e) => updateForm({ slug: e.target.value })}
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
                      onClick={() => updateForm({ coverImage: '' })}
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

          {/* Content editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Treść artykułu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="excerpt">Zajawka (excerpt)</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Krótki opis artykułu wyświetlany na listach..."
                  value={formData.excerpt}
                  onChange={(e) => updateForm({ excerpt: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Treść artykułu</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => updateForm({ content })}
                  placeholder="Zacznij pisać treść artykułu..."
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">SEO</CardTitle>
                  {formData.seo.seoScore !== null && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      formData.seo.seoScore >= 80 ? 'bg-green-100 text-green-700' :
                      formData.seo.seoScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {formData.seo.seoScore}/100
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateSeo}
                  disabled={isGeneratingSeo || !formData.title}
                  className="text-xs gap-1.5"
                >
                  {isGeneratingSeo
                    ? <><Loader2 className="h-3 w-3 animate-spin" />Generuję...</>
                    : <><Sparkles className="h-3 w-3" />Generuj AI</>
                  }
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* SERP Preview */}
              {(formData.seo.title || formData.seo.description) && (
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Podgląd w Google</p>
                  <p className="text-xs text-muted-foreground truncate">
                    zwrotny.pl › {formData.slug || 'artykul'}
                  </p>
                  <p className="text-sm font-medium text-blue-600 leading-snug line-clamp-1">
                    {formData.seo.title || formData.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {formData.seo.description || formData.excerpt}
                  </p>
                </div>
              )}

              {/* Focus keyword */}
              <div className="space-y-1.5">
                <Label htmlFor="seo-focus">Słowo kluczowe (focus)</Label>
                <Input
                  id="seo-focus"
                  placeholder="np. system kaucyjny Polska"
                  value={formData.seo.focusKeyword}
                  onChange={(e) => updateForm(prev => ({
                    ...prev,
                    seo: { ...prev.seo, focusKeyword: e.target.value },
                  }))}
                />
              </div>

              {/* Meta Title */}
              <div className="space-y-1.5">
                <Label htmlFor="seo-title">Meta Title</Label>
                <Input
                  id="seo-title"
                  placeholder="Tytuł dla wyszukiwarek..."
                  value={formData.seo.title}
                  onChange={(e) => updateForm(prev => ({
                    ...prev,
                    seo: { ...prev.seo, title: e.target.value },
                  }))}
                />
                <p className={`text-xs ${formData.seo.title.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.seo.title.length}/60 znaków
                </p>
              </div>

              {/* Meta Description */}
              <div className="space-y-1.5">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  placeholder="Opis dla wyszukiwarek..."
                  value={formData.seo.description}
                  onChange={(e) => updateForm(prev => ({
                    ...prev,
                    seo: { ...prev.seo, description: e.target.value },
                  }))}
                  rows={3}
                />
                <p className={`text-xs ${formData.seo.description.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.seo.description.length}/160 znaków
                </p>
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <Label>Słowa kluczowe</Label>
                {formData.seo.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.seo.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => updateForm(prev => ({
                            ...prev,
                            seo: { ...prev.seo, keywords: prev.seo.keywords.filter((_, j) => j !== i) },
                          }))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Dodaj słowo kluczowe..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val && !formData.seo.keywords.includes(val)) {
                          updateForm(prev => ({
                            ...prev,
                            seo: { ...prev.seo, keywords: [...prev.seo.keywords, val] },
                          }));
                          (e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                    className="text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Naciśnij Enter aby dodać</p>
              </div>

              {/* OG Title */}
              <div className="space-y-1.5">
                <Label htmlFor="og-title">Open Graph Title (Facebook / X)</Label>
                <Input
                  id="og-title"
                  placeholder="Tytuł dla social media..."
                  value={formData.seo.ogTitle}
                  onChange={(e) => updateForm(prev => ({
                    ...prev,
                    seo: { ...prev.seo, ogTitle: e.target.value },
                  }))}
                />
              </div>

              {/* OG Description */}
              <div className="space-y-1.5">
                <Label htmlFor="og-desc">Open Graph Description</Label>
                <Textarea
                  id="og-desc"
                  placeholder="Opis dla social media..."
                  value={formData.seo.ogDescription}
                  onChange={(e) => updateForm(prev => ({
                    ...prev,
                    seo: { ...prev.seo, ogDescription: e.target.value },
                  }))}
                  rows={2}
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured - top priority */}
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">Wyróżniony na stronie głównej</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pojawi się jako główny artykuł. Jeśli żaden nie jest wyróżniony, pokazywany jest najnowszy.</p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(val) => updateForm({ featured: val })}
                />
              </div>
            </CardContent>
          </Card>

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
                  onValueChange={(value) => updateForm({ category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Select
                  value={formData.authorId}
                  onValueChange={(value) => updateForm({ authorId: value })}
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

          {/* Delete */}
          <Card className="border-destructive/50">
            <CardContent className="p-4">
              <Button 
                variant="destructive" 
                className="w-full gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Usuń artykuł
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image picker rendered outside layout cards to avoid overflow-hidden clipping */}
      <ImagePickerModal
        open={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(url) => { updateForm({ coverImage: url }); setIsImagePickerOpen(false) }}
        articleTitle={formData.title}
        articleContent={formData.content}
      />
    </div>
  )
}
