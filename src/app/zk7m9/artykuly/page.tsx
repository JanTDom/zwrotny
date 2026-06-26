'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Sparkles,
  FileText,
  Download,
  Loader2,
  Facebook,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAdminPosts, adminApi } from '@/hooks/use-admin-data'
import { LoadingState } from '@/components/ui/api-states'
import { toast } from 'sonner'
import type { Post } from '@/types'

// Sample articles - simplified type for creation
const sampleArticles: Array<{
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  status: string
  authorName?: string
}> = [
  {
    title: 'System kaucyjny rusza 1 stycznia 2025 - co musisz wiedzieć',
    slug: 'system-kaucyjny-rusza-2025',
    excerpt: 'Od nowego roku Polska dołącza do grona krajów z systemem kaucyjnym. Wyjaśniamy najważniejsze zasady i rozwiewamy wątpliwości.',
    content: '<p>System kaucyjny w Polsce oficjalnie startuje 1 stycznia 2025 roku...</p>',
    category: 'aktualnosci',
    status: 'published',
    authorName: 'Redakcja',
  },
  {
    title: 'Gdzie oddać butelki? Mapa punktów zwrotu w Polsce',
    slug: 'mapa-punktow-zwrotu',
    excerpt: 'Interaktywna mapa wszystkich automatów i punktów zwrotu opakowań kaucyjnych w Polsce. Znajdź najbliższy punkt.',
    content: '<p>Punkty zwrotu opakowań kaucyjnych znajdziesz w każdym większym sklepie...</p>',
    category: 'poradniki',
    status: 'published',
    authorName: 'Redakcja',
  },
  {
    title: '50 groszy za butelkę - ile można zarobić na zwrotach?',
    slug: 'ile-mozna-zarobic-na-zwrotach',
    excerpt: 'Policzyliśmy ile może zaoszczędzić przeciętna polska rodzina oddając wszystkie opakowania kaucyjne.',
    content: '<p>Przy kaucji 50 groszy za opakowanie...</p>',
    category: 'ekologia',
    status: 'published',
    authorName: 'Jan Kowalski',
  },
  {
    title: 'Ustawa o systemie kaucyjnym - pełny tekst z komentarzem',
    slug: 'ustawa-pelny-tekst',
    excerpt: 'Publikujemy pełny tekst ustawy o systemie kaucyjnym wraz z praktycznym komentarzem prawnym.',
    content: '<p>Ustawa z dnia 13 lipca 2023 r. o systemie kaucyjnym...</p>',
    category: 'prawo',
    status: 'published',
    authorName: 'Redakcja',
  },
  {
    title: 'Sklepy szykują się na system kaucyjny - raport z przygotowań',
    slug: 'sklepy-przygotowania-raport',
    excerpt: 'Sprawdziliśmy jak duże sieci handlowe przygotowują się do wdrożenia systemu kaucyjnego.',
    content: '<p>Biedronka, Lidl, Żabka - wszystkie duże sieci instalują już automaty...</p>',
    category: 'biznes',
    status: 'published',
    authorName: 'Anna Nowak',
  },
  {
    title: 'Jak działają automaty do zwrotu butelek? Technologia od środka',
    slug: 'jak-dzialaja-automaty',
    excerpt: 'Zaglądamy do wnętrza recyklomatu i wyjaśniamy jak rozpoznaje on opakowania i nalicza kaucję.',
    content: '<p>Nowoczesne automaty wykorzystują kamery i czujniki...</p>',
    category: 'technologia',
    status: 'published',
    authorName: 'Redakcja',
  },
]

const categories = [
  { value: 'aktualnosci', label: 'Aktualności' },
  { value: 'poradniki', label: 'Poradniki' },
  { value: 'prawo', label: 'Prawo' },
  { value: 'ekologia', label: 'Ekologia' },
  { value: 'biznes', label: 'Biznes' },
  { value: 'technologia', label: 'Technologia' },
]

export default function ArticlesPage() {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // FB publish modal
  const [fbPost, setFbPost] = useState<{ id: string; title: string; slug: string; coverImage?: string; excerpt?: string; tags?: string[] } | null>(null)
  const [fbMessage, setFbMessage] = useState('')
  const [fbPublishing, setFbPublishing] = useState(false)
  const [fbGenerating, setFbGenerating] = useState(false)

  function openFbModal(post: typeof fbPost) {
    if (!post) return
    setFbPost(post)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
    setFbMessage(
      `${post.title}\n\n${post.excerpt ?? ''}\n\nCzytaj wiecej: ${siteUrl}/artykul/${post.slug}`.trim()
    )
  }

  async function generateFbCaption() {
    if (!fbPost) return
    setFbGenerating(true)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
      const r = await fetch('/api/fb/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fbPost.title,
          excerpt: fbPost.excerpt,
          postUrl: `${siteUrl}/artykul/${fbPost.slug}`,
          tags: fbPost.tags,
        }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setFbMessage(d.caption)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Blad generowania opisu AI')
    } finally {
      setFbGenerating(false)
    }
  }

  async function handleFbPublish() {
    if (!fbPost || !fbMessage.trim()) return
    setFbPublishing(true)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
      const r = await fetch('/api/fb/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: fbPost.id,
          postTitle: fbPost.title,
          postUrl: `${siteUrl}/artykul/${fbPost.slug}`,
          message: fbMessage,
          imageUrl: fbPost.coverImage ?? undefined,
        }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success('Opublikowano na Facebooku!')
      setFbPost(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Blad publikacji na FB')
    } finally {
      setFbPublishing(false)
    }
  }

  const { posts, isLoading, mutate } = useAdminPosts()

  const handleLoadSampleArticles = async () => {
    setIsUploading(true)
    try {
      for (const article of sampleArticles) {
        await adminApi.createPost(article as unknown as Partial<Post>)
      }
      await mutate()
      toast.success(`Załadowano ${sampleArticles.length} przykładowych artykułów`)
    } catch (error) {
      console.error('Failed to upload:', error)
      toast.error('Błąd podczas ładowania przykładowych artykułów')
    } finally {
      setIsUploading(false)
    }
  }
  const filteredPosts = posts.filter(post => {
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false
    if (statusFilter !== 'all' && post.status !== statusFilter) return false
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(filteredPosts.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedPosts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten artykuł?')) return
    
    try {
      await adminApi.deletePost(id)
      toast.success('Artykul zostal usuniety')
      mutate()
    } catch {
      toast.error('Blad podczas usuwania artykulu')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Czy na pewno chcesz usunąć ${selectedPosts.length} artykułów?`)) return
    
    try {
      await Promise.all(selectedPosts.map(id => adminApi.deletePost(id)))
      toast.success('Artykuły zostały usunięte')
      setSelectedPosts([])
      mutate()
    } catch {
      toast.error('Błąd podczas usuwania artykułów')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await adminApi.updatePost(id, { status: 'published' })
      await mutate()
      toast.success('Artykuł opublikowany')
    } catch {
      toast.error('Błąd podczas publikacji')
    }
  }

  const handleBulkPublish = async () => {
    try {
      await Promise.all(selectedPosts.map(id => 
        adminApi.updatePost(id, { status: 'published' })
      ))
      await mutate()
      toast.success(`Opublikowano ${selectedPosts.length} artykułów`)
      setSelectedPosts([])
    } catch {
      toast.error('Błąd podczas publikacji artykułów')
    }
  }

  // Don't show error state - show empty list instead when API fails
  // This allows the page to be usable even without backend connection

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Artykuły</h1>
          <p className="text-muted-foreground">
            Zarządzaj artykułami na portalu ({posts.length} łącznie)
          </p>
        </div>
        <div className="flex gap-3">
          {posts.length === 0 && (
            <Button variant="outline" className="gap-2" onClick={handleLoadSampleArticles} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isUploading ? 'Ładuję...' : 'Załaduj przykładowe'}
            </Button>
          )}
          <Button asChild>
            <Link href="/zk7m9/artykuly/nowy">
              <Plus className="mr-2 h-4 w-4" />
              Nowy artykuł
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Szukaj artykułów..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="published">Opublikowane</SelectItem>
                <SelectItem value="draft">Szkice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedPosts.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Zaznaczono {selectedPosts.length} {selectedPosts.length === 1 ? 'artykuł' : 'artykułów'}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkPublish}>Opublikuj</Button>
                <Button variant="outline" size="sm">Archiwizuj</Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Usuń</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState message="Ładowanie artykułów..." />
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Brak artykułów do wyświetlenia</p>
              <Button asChild className="mt-4">
                <Link href="/zk7m9/artykuly/nowy">
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj pierwszy artykuł
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="w-12 py-3 px-4">
                        <Checkbox
                          checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tytul</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kategoria</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Autor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Zrodlo</th>
                      <th className="w-12 py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post) => {
                      const categoryLabel = categories.find(c => c.value === post.category)?.label || post.category

                      return (
                        <tr key={post.id} className="border-b border-border hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <Checkbox
                              checked={selectedPosts.includes(post.id)}
                              onCheckedChange={() => toggleSelect(post.id)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {post.coverImage ? (
                                <div 
                                  className="w-12 h-8 rounded bg-muted shrink-0 bg-cover bg-center"
                                  style={{ backgroundImage: `url(${post.coverImage})` }}
                                />
                              ) : (
                                <div className="w-12 h-8 rounded bg-muted shrink-0" />
                              )}
                              <div className="min-w-0">
                                <Link
                                  href={`/zk7m9/artykuly/${post.id}`}
                                  className="font-medium hover:text-primary line-clamp-1"
                                >
                                  {post.title}
                                </Link>
                                <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                  {post.excerpt}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{categoryLabel}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {post.author?.name || 'Redakcja'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                post.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {post.status === 'published' ? 'Opublikowany' : 'Szkic'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(post.publishedAt || post.updatedAt || Date.now()).toLocaleDateString('pl-PL')}
                          </td>
                          <td className="py-3 px-4">
                            {post.aiGenerated ? (
                              <Badge variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <FileText className="h-3 w-3" />
                                Recznie
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/zk7m9/artykuly/${post.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edytuj
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/artykul/${post.slug}`} target="_blank">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Podglad
                                  </Link>
                                </DropdownMenuItem>
                                {post.status !== 'published' && (
                                  <DropdownMenuItem onClick={() => handlePublish(post.id)}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Opublikuj
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openFbModal({
                                  id: post.id,
                                  title: post.title,
                                  slug: post.slug,
                                  coverImage: post.coverImage,
                                  excerpt: post.excerpt,
                                  tags: post.tags,
                                })}>
                                  <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                                  Udostepnij na FB
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(post.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Usun
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Pokazuje {filteredPosts.length} z {posts.length} artykułów
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>Poprzednia</Button>
                  <Button variant="outline" size="sm">Następna</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Facebook publish modal */}
      <Dialog open={!!fbPost} onOpenChange={open => { if (!open) setFbPost(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Facebook className="w-5 h-5 text-[#1877F2]" />
              Udostepnij na Facebooku
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {fbPost?.coverImage && (
              <div
                className="w-full h-40 rounded-lg bg-cover bg-center bg-muted"
                style={{ backgroundImage: `url(${fbPost.coverImage})` }}
              />
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Tresc wpisu (mozesz edytowac)</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateFbCaption}
                  disabled={fbGenerating}
                  className="gap-1.5 h-7 text-xs"
                >
                  {fbGenerating
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Sparkles className="w-3 h-3 text-amber-500" />
                  }
                  {fbGenerating ? 'Generuje AI...' : 'Generuj opis AI'}
                </Button>
              </div>
              <Textarea
                rows={7}
                value={fbMessage}
                onChange={e => setFbMessage(e.target.value)}
                className="resize-none text-sm font-mono"
                placeholder="Tresc wpisu na Facebooka..."
              />
              <p className="text-xs text-muted-foreground text-right">{fbMessage.length} / 63206</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFbPost(null)}>Anuluj</Button>
            <Button
              onClick={handleFbPublish}
              disabled={fbPublishing || !fbMessage.trim()}
              className="gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white"
            >
              {fbPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Facebook className="w-4 h-4" />}
              {fbPublishing ? 'Publikowanie...' : 'Opublikuj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
