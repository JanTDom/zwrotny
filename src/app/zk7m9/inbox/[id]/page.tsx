'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Sparkles,
  Loader2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  X,
  Send,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { adminApi } from '@/hooks/use-admin-data'
import { ImagePickerModal } from '@/components/admin/image-picker-modal'
import type { AINewsCandidate, PostCategory, Post } from '@/types'

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

const categoryLabels: Record<string, string> = {
  aktualnosci: 'Aktualności',
  poradniki: 'Poradniki',
  ekologia: 'Ekologia',
  prawo: 'Prawo',
  biznes: 'Biznes',
  technologia: 'Technologia',
}

export default function EditNewsArticlePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  
  const [newsItem, setNewsItem] = useState<AINewsCandidate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  const [customArticlePrompt, setCustomArticlePrompt] = useState('')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'aktualnosci',
    coverImage: '',
    tags: [] as string[],
  })

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  const INBOX_STORAGE_KEY = 'zwrotny_cms_inbox'

  const fillFormFromItem = (item: AINewsCandidate) => {
    setNewsItem(item)
    if (item.aiGeneratedPost) {
      setFormData({
        title: item.aiGeneratedPost.title || item.originalTitle,
        slug: generateSlug(item.aiGeneratedPost.title || item.originalTitle),
        excerpt: item.aiGeneratedPost.excerpt || item.summary,
        content: item.aiGeneratedPost.content || '',
        category: item.suggestedCategory || 'aktualnosci',
        coverImage: '',
        tags: (item.aiGeneratedPost as { suggestedTags?: string[] })?.suggestedTags || [],
      })
    } else {
      setFormData({
        title: item.originalTitle,
        slug: generateSlug(item.originalTitle),
        excerpt: item.summary,
        content: '',
        category: item.suggestedCategory || 'aktualnosci',
        coverImage: '',
        tags: [],
      })
    }
  }

  // Load news item from localStorage
  useEffect(() => {
    const loadNewsItem = async () => {
      let found = false
      
      // Load from localStorage
      try {
        const saved = localStorage.getItem(INBOX_STORAGE_KEY)
        if (saved) {
          const allNews: AINewsCandidate[] = JSON.parse(saved)
          const item = allNews.find(n => n.id === id)
          if (item) {
            fillFormFromItem(item)
            found = true
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
      
      if (!found) {
        toast.error('Nie znaleziono newsa')
      }
      
      setIsLoading(false)
    }
    loadNewsItem()
  }, [id])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[ąàáâãäå]/g, 'a')
      .replace(/[ćčç]/g, 'c')
      .replace(/[ęèéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[łľ]/g, 'l')
      .replace(/[ńñň]/g, 'n')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[śšş]/g, 's')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[źżž]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
  }

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



  const handleGenerateContent = async () => {
    if (!newsItem) {
      toast.error('Brak danych newsa')
      return
    }

    const promptToUse = customArticlePrompt.trim()
    setIsGeneratingContent(true)
    toast.info('Generuję treść artykułu...')

    try {
      // Call server-side API with custom prompt
      const response = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          customPrompt: promptToUse,
          sourceTitle: newsItem.originalTitle,
          sourceContent: newsItem.originalContent || newsItem.summary || '',
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.content) {
        updateForm({ 
          title: data.title || formData.title,
          excerpt: data.excerpt || formData.excerpt,
          content: data.content,
        })
        toast.success('Wygenerowano tytuł, zajawkę i treść!')
      } else {
        toast.error(data.error || 'Błąd generowania treści')
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error('Błąd połączenia z serwerem')
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const handleSave = async (publish: boolean) => {
    setIsSaving(true)
    setIsDirty(false)
    
    const newPost = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      content: formData.content,
      category: formData.category as PostCategory,
      coverImage: formData.coverImage,
      status: publish ? 'published' as const : 'draft' as const,
    }

    try {
      await adminApi.createPost(newPost as Partial<Post>)
      
      if (publish) {
        // Remove from inbox localStorage
        try {
          const saved = localStorage.getItem(INBOX_STORAGE_KEY)
          if (saved) {
            const inbox = JSON.parse(saved)
            const filtered = inbox.filter((n: { id: string }) => n.id !== id)
            localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(filtered))
          }
        } catch (e) {
          console.error('Failed to update inbox:', e)
        }
        await adminApi.deleteCandidate(id)
      }
      
      toast.success(publish ? 'Artykuł opublikowany!' : 'Zapisano szkic')
      router.push('/zk7m9/inbox')
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Błąd podczas zapisywania artykułu')
    }
    
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!newsItem) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Nie znaleziono newsa</p>
        <Button asChild>
          <Link href="/zk7m9/inbox">Wróć do Inbox</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/zk7m9/inbox">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edytuj artykuł z newsa</h1>
            <p className="text-muted-foreground text-sm">
              Zredaguj treść wygenerowaną przez AI przed publikacją
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Podgląd
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            Zapisz szkic
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving || !formData.title}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Opublikuj
          </Button>
        </div>
      </div>

      {/* Source info */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{newsItem.originalSource}</Badge>
              <span className="text-sm text-muted-foreground">
                Pobrano: {new Date(newsItem.fetchedAt).toLocaleString('pl-PL')}
              </span>
            </div>
            <a
              href={newsItem.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Zobacz źródło
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Treść artykułu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    updateForm({
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }}
                  placeholder="Tytuł artykułu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => updateForm({ slug: e.target.value })}
                  placeholder="slug-artykulu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Zajawka</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => updateForm({ excerpt: e.target.value })}
                  placeholder="Krótki opis artykułu..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Treść artykułu</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
                    onClick={() => setShowAIPanel(v => !v)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Wygeneruj przez AI
                  </Button>
                </div>

                {showAIPanel && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI przepisze tytuł, zajawkę i treść na podstawie źródła
                    </p>
                    <Textarea
                      placeholder="Dodatkowe instrukcje (opcjonalne): np. &quot;napisz bardziej formalnie&quot;, &quot;skróć do 500 słów&quot;..."
                      value={customArticlePrompt}
                      onChange={e => setCustomArticlePrompt(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setShowAIPanel(false); setCustomArticlePrompt('') }}
                      >
                        Anuluj
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={async () => {
                          await handleGenerateContent()
                          setShowAIPanel(false)
                          setCustomArticlePrompt('')
                        }}
                        disabled={isGeneratingContent || !formData.title}
                      >
                        {isGeneratingContent ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Generuję...</>
                        ) : (
                          <><Sparkles className="h-4 w-4" />Generuj</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => updateForm({ content })}
                  placeholder="Pełna treść artykułu..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kategoria</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.category}
                onValueChange={(value) => updateForm({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Cover image */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Obraz wyróżniający</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsImagePickerOpen(true)}
              >
                <ImageIcon className="h-4 w-4" />
                Wybierz zdjęcie
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
                      Zmień
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateForm({ coverImage: '' })}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Usuń
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
                    <p className="font-medium">Kliknij, aby wybrać zdjęcie</p>
                    <p className="text-sm text-muted-foreground">Unsplash, Pexels, wgraj z dysku lub generuj AI</p>
                  </div>
                </button>
              )}

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image picker — rendered outside cards to avoid overflow-hidden clipping */}
      <ImagePickerModal
        open={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(url) => { updateForm({ coverImage: url }); setIsImagePickerOpen(false) }}
        articleTitle={formData.title}
        articleContent={formData.content}
      />

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Podgląd artykułu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formData.coverImage && (
              <img 
                src={formData.coverImage} 
                alt="Cover" 
                className="w-full aspect-video object-cover rounded-lg"
              />
            )}
            <Badge>{categoryLabels[formData.category]}</Badge>
            <h1 className="text-2xl font-bold">{formData.title || 'Brak tytułu'}</h1>
            <p className="text-muted-foreground">{formData.excerpt || 'Brak zajawki'}</p>
            <hr />
            <div className="prose-zwrotny">
              {formData.content ? (
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              ) : (
                <p className="text-muted-foreground italic">Brak treści</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  )
}
