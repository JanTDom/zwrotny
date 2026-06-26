'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Pencil,
  X,
  ExternalLink,
  Clock,
  TrendingUp,
  Search,
  CheckCircle,
  Loader2,
  Download,
  RefreshCw,
  ImagePlus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAICandidates, adminApi } from '@/hooks/use-admin-data'
import { LoadingState } from '@/components/ui/api-states'
import type { AINewsCandidate } from '@/types'

// Sample AI candidates
const sampleCandidates: AINewsCandidate[] = [
  {
    id: '1',
    originalTitle: 'System kaucyjny w Polsce - pierwsze miesiące działania',
    originalUrl: 'https://example.com/news/1',
    originalSource: 'Gazeta Wyborcza',
    summary: 'Podsumowanie pierwszych miesięcy działania systemu kaucyjnego w Polsce. Eksperci oceniają, że start był udany, choć pojawiły się problemy z dostępnością automatów w mniejszych miejscowościach.',
    suggestedCategory: 'aktualnosci',
    relevanceScore: 0.92,
    fetchedAt: new Date().toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    originalTitle: 'Lidl instaluje 500 nowych recyklomatów',
    originalUrl: 'https://example.com/news/2',
    originalSource: 'Puls Biznesu',
    summary: 'Sieć Lidl ogłosiła plan instalacji 500 nowych automatów do zwrotu opakowań do końca roku. Inwestycja ma kosztować ponad 100 mln złotych.',
    suggestedCategory: 'biznes',
    relevanceScore: 0.88,
    fetchedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    originalTitle: 'Jak Niemcy radzą sobie z systemem kaucyjnym od 20 lat',
    originalUrl: 'https://example.com/news/3',
    originalSource: 'Deutsche Welle',
    summary: 'Reportaż o niemieckim systemie kaucyjnym, który działa od 2003 roku. Wskaźnik zwrotu opakowań przekracza 98%, a system jest wzorem dla innych krajów europejskich.',
    suggestedCategory: 'poradniki',
    relevanceScore: 0.85,
    fetchedAt: new Date(Date.now() - 7200000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    originalTitle: 'Nowe przepisy dotyczące opakowań wielokrotnego użytku',
    originalUrl: 'https://example.com/news/4',
    originalSource: 'Rzeczpospolita',
    summary: 'Ministerstwo Klimatu pracuje nad nowelizacją przepisów dotyczących opakowań wielokrotnego użytku. Zmiany mają wejść w życie w 2026 roku.',
    suggestedCategory: 'prawo',
    relevanceScore: 0.79,
    fetchedAt: new Date(Date.now() - 14400000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '5',
    originalTitle: 'Recyklomat zepsuty? Oto co możesz zrobić',
    originalUrl: 'https://example.com/news/5',
    originalSource: 'WP Tech',
    summary: 'Praktyczny poradnik co zrobić, gdy automat do zwrotu butelek nie działa. Gdzie zgłosić awarię i jakie są alternatywne sposoby zwrotu opakowań.',
    suggestedCategory: 'poradniki',
    relevanceScore: 0.82,
    fetchedAt: new Date(Date.now() - 28800000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    updatedAt: new Date(Date.now() - 28800000).toISOString(),
  },
]

const statusLabels: Record<AINewsCandidate['status'], { label: string; color: string }> = {
  pending: { label: 'Oczekujący', color: 'bg-amber-100 text-amber-700' },
  ai_processing: { label: 'AI przetwarza', color: 'bg-blue-100 text-blue-700' },
  ai_done: { label: 'AI gotowe', color: 'bg-green-100 text-green-700' },
  manual: { label: 'Do ręcznej edycji', color: 'bg-purple-100 text-purple-700' },
  rejected: { label: 'Odrzucony', color: 'bg-red-100 text-red-700' },
  published: { label: 'Opublikowany', color: 'bg-primary text-primary-foreground' },
}

const categoryLabels: Record<string, string> = {
  aktualnosci: 'Aktualności',
  poradniki: 'Poradniki',
  prawo: 'Prawo',
  biznes: 'Biznes',
  ekologia: 'Ekologia',
}

const INBOX_STORAGE_KEY = 'zwrotny_cms_inbox'

export default function InboxPage() {
  const [selectedNews, setSelectedNews] = useState<AINewsCandidate | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | AINewsCandidate['status']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [localNews, setLocalNews] = useState<AINewsCandidate[]>([])
  const [isLocalLoaded, setIsLocalLoaded] = useState(false)
  const [promptDialogOpen, setPromptDialogOpen] = useState(false)
  const [customArticlePrompt, setCustomArticlePrompt] = useState('')
  const [newsToProcess, setNewsToProcess] = useState<AINewsCandidate | null>(null)
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null)

  const { candidates: backendNews, isLoading, mutate } = useAICandidates()

  // Load from localStorage as fallback
  // Also reset any stuck "processing" status to "new" (page refresh means processing was interrupted)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(INBOX_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as AINewsCandidate[]
        // Reset any stuck "ai_processing" status back to "pending"
        const fixed = parsed.map(item => 
          item.status === 'ai_processing' ? { ...item, status: 'pending' as const } : item
        )
        // If we fixed any items, save back to localStorage
        const hadStuck = fixed.some((item, i) => item.status !== parsed[i].status)
        if (hadStuck) {
          localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(fixed))
        }
        setLocalNews(fixed)
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    setIsLocalLoaded(true)
  }, [])

  // Always use localNews as the source of truth for inbox items
  // (backend doesn't store inbox candidates - they're local only)
  const news = localNews
  const [serpApiKey, setSerpApiKey] = useState<string | null>(null)

  // Load API keys from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await adminApi.getSettings()
        const data = response.data as { apiConfigs?: { envKey: string; value: string }[] } | null
        if (data?.apiConfigs) {
          const configs = data.apiConfigs
          const serpConfig = configs.find(c => c.envKey === 'GOOGLE_NEWS_API_KEY')
          if (serpConfig?.value) {
            setSerpApiKey(serpConfig.value)
          }
        }
      } catch (e) {
        console.error('Failed to load API keys from Supabase:', e)
      }
    }
    loadSettings()
  }, [])

  const handleFetchFromSerpApi = async () => {
    const apiKey = serpApiKey
    
    if (!apiKey) {
      toast.error('Brak klucza Google News API. Skonfiguruj go w ustawieniach API.')
      return
    }

    setIsFetching(true)
    
    try {
      const response = await fetch('/api/news/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd pobierania newsów')
      }

      if (data.news && data.news.length > 0) {
        // Transform to AINewsCandidate format
        const newCandidates: AINewsCandidate[] = data.news.map((item: {
          id: string
          title: string
          url: string
          snippet: string
          fullContent?: string
          source: string
          publishedAt: string
          thumbnail?: string
        }) => ({
          id: item.id,
          originalTitle: item.title,
          originalUrl: item.url,
          originalSource: item.source,
          originalContent: item.fullContent || item.snippet, // Pełna treść lub snippet jako fallback
          summary: item.snippet,
          suggestedCategory: 'aktualnosci',
          relevanceScore: 0.8,
          fetchedAt: new Date().toISOString(),
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))

        // Merge with existing news, avoiding duplicates by URL
        const existingUrls = new Set(news.map(n => n.originalUrl))
        const uniqueNew = newCandidates.filter(n => !existingUrls.has(n.originalUrl))
        
        if (uniqueNew.length > 0) {
          // Save to localStorage first
          const merged = [...uniqueNew, ...localNews]
          localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(merged))
          setLocalNews(merged)
          
          // Try to save to backend too
          try {
            for (const candidate of uniqueNew) {
              await adminApi.createCandidate(candidate)
            }
            await mutate()
          } catch (e) {
            console.error('Failed to save to backend:', e)
          }
          toast.success(`Pobrano ${uniqueNew.length} nowych newsów z Google News`)
        } else {
          toast.info('Brak nowych newsów do pobrania')
        }
      } else {
        toast.info('Nie znaleziono newsów dla zapytania')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error(error instanceof Error ? error.message : 'Błąd pobierania newsów')
    } finally {
      setIsFetching(false)
    }
  }

  const handleLoadSampleNews = async () => {
    setIsUploading(true)
    try {
      // Save to localStorage first
      const candidatesWithIds = sampleCandidates.map((c, i) => ({
        ...c,
        id: c.id || `sample-${i + 1}`,
      }))
      localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(candidatesWithIds))
      setLocalNews(candidatesWithIds)
      
      // Try to save to backend too
      for (const candidate of candidatesWithIds) {
        await adminApi.createCandidate(candidate)
      }
      await mutate()
      toast.success(`Załadowano ${sampleCandidates.length} przykładowych newsów`)
    } catch (error) {
      console.error('Failed to upload to backend:', error)
      toast.success(`Załadowano ${sampleCandidates.length} przykładowych newsów (lokalnie)`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadImage = async (newsItem: AINewsCandidate, file: File) => {
    setUploadingImageId(newsItem.id)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/images/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd uploadu')
      const updated = localNews.map(n =>
        n.id === newsItem.id
          ? { ...n, aiGeneratedPost: { ...(n.aiGeneratedPost || {}), coverImage: data.url } }
          : n
      )
      setLocalNews(updated)
      localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(updated))
      toast.success('Zdjęcie dodane')
    } catch (e: any) {
      toast.error(e.message || 'Błąd uploadu zdjęcia')
    } finally {
      setUploadingImageId(null)
    }
  }

  const filteredNews = news
    .filter(n => filter === 'all' || n.status === filter)
    .filter(n => 
      searchQuery === '' || 
      n.originalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchQuery.toLowerCase())
    )
  
  const pendingCount = news.filter(n => n.status === 'pending').length

  // Open prompt dialog before AI processing
  const handleAIProcess = (newsItem: AINewsCandidate) => {
    setNewsToProcess(newsItem)
    setCustomArticlePrompt('')
    setPromptDialogOpen(true)
  }

  // Actually process with AI after prompt is confirmed
  const executeAIProcess = async () => {
    if (!newsToProcess) return
    
    const promptToUse = customArticlePrompt.trim()
    setPromptDialogOpen(false)
    const newsItem = newsToProcess
    setProcessingId(newsItem.id)
    
    try {
    let generatedContent = ''
    let generatedTitle = `${newsItem.originalTitle} - analiza i komentarz`
    let generatedExcerpt = newsItem.summary
      
      toast.info('Generuję treść artykułu przez AI...')
      
      // Call server-side API with explicit cache control
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
        generatedContent = data.content
        generatedTitle = data.title || generatedTitle
        generatedExcerpt = data.excerpt || newsItem.summary
        toast.success('Treść wygenerowana!')
      } else {
        toast.error(data.error || 'Błąd generowania')
        generatedContent = `## ${newsItem.originalTitle}\n\n${newsItem.summary}\n\nTen artykuł wymaga uzupełnienia treści.`
      }
      
      // Update locally with generated content
    const updatedNews = localNews.map(n => 
      n.id === newsItem.id 
        ? { 
            ...n, 
            status: 'ai_done' as const,
            aiGeneratedPost: {
              title: generatedTitle,
              excerpt: generatedExcerpt,
              content: generatedContent,
              suggestedTags: ['system-kaucyjny', 'aktualności'],
            },
            processedAt: new Date().toISOString(),
          }
        : n
    )
    setLocalNews(updatedNews)
    localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(updatedNews))
    
    // Refresh SWR cache
    try {
      await mutate()
    } catch (error) {
      console.error('Failed to refresh cache:', error)
    }
    
    if (generatedContent) {
      toast.success('AI zakończyło przetwarzanie')
    }
    } finally {
      // ALWAYS reset processingId, even on errors
      setProcessingId(null)
    }
  }

  const handleManual = async (newsItem: AINewsCandidate) => {
    // Update locally first
    const updatedNews = localNews.map(n => 
      n.id === newsItem.id 
        ? { ...n, status: 'manual' as const }
        : n
    )
    setLocalNews(updatedNews)
    localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(updatedNews))
    
    // Try backend too
    try {
      await adminApi.updateCandidate(newsItem.id, { status: 'manual' })
      await mutate()
    } catch (error) {
      console.error('Failed to update on backend:', error)
    }
    
    toast.info('News oznaczony do ręcznej edycji')
  }

  const handleReject = async () => {
    if (!selectedNews) return
    
    // Update locally first
    const updatedNews = localNews.map(n => 
      n.id === selectedNews.id 
        ? { ...n, status: 'rejected' as const, rejectedReason: rejectReason }
        : n
    )
    setLocalNews(updatedNews)
    localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(updatedNews))
    
    // Try backend too
    try {
      await adminApi.rejectCandidate(selectedNews.id, rejectReason)
      await mutate()
    } catch (error) {
      console.error('Failed to reject on backend:', error)
    }
    
    setRejectDialogOpen(false)
    setRejectReason('')
    setSelectedNews(null)
    toast.success('News odrzucony')
  }

  if (isLoading && !isLocalLoaded) {
    return <LoadingState message="Ładowanie newsów..." />
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inbox AI</h1>
          <p className="text-muted-foreground">
            Przeglądaj i przetwarzaj newsy znalezione przez AI ({pendingCount} oczekujących)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            className="gap-2" 
            onClick={handleFetchFromSerpApi}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isFetching ? 'Pobieram...' : 'Pobierz z Google News'}
          </Button>
          {news.length === 0 && (
            <Button variant="outline" className="gap-2" onClick={handleLoadSampleNews} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isUploading ? 'Ładuję...' : 'Załaduj przykładowe'}
            </Button>
          )}
          <Button 
            variant="destructive" 
            className="gap-2" 
            onClick={async () => {
              // Clear ALL possible localStorage keys for inbox
              localStorage.removeItem(INBOX_STORAGE_KEY) // zwrotny_cms_inbox
              localStorage.removeItem('zwrotny_ai_candidates') // hook key
              localStorage.removeItem('zwrotny_ai_inbox') // old key
              // Clear React state
              setLocalNews([])
              setProcessingId(null)
              // Clear SWR cache
              await mutate([], false)
              toast.success('Wyczyszczono inbox')
              // Hard reload
              window.location.reload()
            }}
          >
            Wyczyść Inbox
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Szukaj newsów..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            Wszystkie
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Oczekujące
          </Button>
          <Button 
            variant={filter === 'ai_done' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('ai_done')}
          >
            AI gotowe
          </Button>
          <Button 
            variant={filter === 'rejected' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('rejected')}
          >
            Odrzucone
          </Button>
        </div>
      </div>

      {/* News list */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Brak newsów do przetworzenia</h3>
              <p className="text-muted-foreground">
                {news.length === 0 
                  ? 'Załaduj przykładowe newsy lub skonfiguruj Google News API w ustawieniach.'
                  : 'Wszystkie newsy zostały przetworzone lub odrzucone.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNews.map((newsItem) => {
            const isProcessing = processingId === newsItem.id
            // Use ai_processing status ONLY if currently processing (based on processingId), 
            // otherwise treat ai_processing as pending (stuck state)
            const displayStatus = isProcessing ? 'ai_processing' 
              : (newsItem.status === 'ai_processing' ? 'pending' : newsItem.status)
            const statusInfo = statusLabels[displayStatus]
            const categoryLabel = categoryLabels[newsItem.suggestedCategory] || newsItem.suggestedCategory

            return (
              <Card key={newsItem.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={statusInfo.color}>
                            {isProcessing && (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            )}
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline">{categoryLabel}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {newsItem.originalSource}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-foreground mb-2">
                          {newsItem.originalTitle}
                        </h3>

                        <p className="text-muted-foreground text-sm mb-4">
                          {newsItem.summary}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Trafność: {Math.round(newsItem.relevanceScore * 100)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(newsItem.fetchedAt).toLocaleDateString('pl-PL', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <a
                            href={newsItem.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Źródło</span>
                          </a>
                        </div>

                        {/* AI Generated preview */}
                        {newsItem.aiGeneratedPost && (
                          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs text-primary font-medium mb-1">Wygenerowane przez AI:</p>
                            <p className="font-semibold text-foreground">{newsItem.aiGeneratedPost.title}</p>
                            {newsItem.aiGeneratedPost.excerpt && (
                              <p className="text-sm text-muted-foreground mt-1">{newsItem.aiGeneratedPost.excerpt}</p>
                            )}
                          </div>
                        )}

                        {/* Cover image upload */}
                        <div className="mt-3 flex items-center gap-3">
                          {newsItem.aiGeneratedPost?.coverImage ? (
                            <img
                              src={newsItem.aiGeneratedPost.coverImage}
                              alt="cover"
                              className="h-14 w-24 object-cover rounded border shrink-0"
                            />
                          ) : null}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingImageId === newsItem.id}
                              onChange={e => {
                                const f = e.target.files?.[0]
                                if (f) handleUploadImage(newsItem, f)
                                e.target.value = ''
                              }}
                            />
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border rounded px-2 py-1">
                              {uploadingImageId === newsItem.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <ImagePlus className="h-3 w-3" />
                              }
                              {newsItem.aiGeneratedPost?.coverImage ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2 shrink-0">
                        {(newsItem.status === 'pending' || (newsItem.status === 'ai_processing' && !isProcessing)) && (
                          <>
                            <Button
                              onClick={() => handleAIProcess(newsItem)}
                              disabled={isProcessing}
                              className="gap-2"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              Zrób AI
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleManual(newsItem)}
                              className="gap-2"
                            >
                              <Pencil className="h-4 w-4" />
                              Zrobię ręcznie
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSelectedNews(newsItem)
                                setRejectDialogOpen(true)
                              }}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                              Odrzuć
                            </Button>
                          </>
                        )}
                        {isProcessing && (
                          <Button disabled className="gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Przetwarzanie...
                          </Button>
                        )}
                        {newsItem.status === 'ai_done' && (
                          <>
                            <Button className="gap-2" asChild>
                              <Link href={`/zk7m9/inbox/${newsItem.id}`}>
                                <Pencil className="h-4 w-4" />
                                Edytuj i opublikuj
                              </Link>
                            </Button>
                            <Button variant="outline" className="gap-2" asChild>
                              <Link href={`/zk7m9/inbox/${newsItem.id}`}>
                                Podgląd
                              </Link>
                            </Button>
                          </>
                        )}
                        {newsItem.status === 'manual' && (
                          <Button className="gap-2" asChild>
                            <Link href={`/zk7m9/inbox/${newsItem.id}`}>
                              <Pencil className="h-4 w-4" />
                              Napisz artykuł
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rejected reason */}
                  {newsItem.status === 'rejected' && newsItem.rejectedReason && (
                    <div className="px-6 py-3 bg-destructive/5 border-t border-border">
                      <p className="text-sm">
                        <span className="font-medium text-destructive">Powód odrzucenia:</span>{' '}
                        <span className="text-muted-foreground">{newsItem.rejectedReason}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odrzuć news</DialogTitle>
            <DialogDescription>
              Podaj powód odrzucenia tego newsa. Pomoże to ulepszyć AI w przyszłości.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Powód odrzucenia (opcjonalnie)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Odrzuć
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt Dialog for AI processing */}
      <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wygeneruj artykuł przez AI</DialogTitle>
            <DialogDescription>
              Opcjonalnie wpisz instrukcje dla tego konkretnego artykułu
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Źródło:</p>
              <p className="text-muted-foreground">{newsToProcess?.originalTitle}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customPrompt">
                Instrukcje dla AI (opcjonalne)
              </Label>
              <Textarea
                id="customPrompt"
                value={customArticlePrompt}
                onChange={(e) => setCustomArticlePrompt(e.target.value)}
                placeholder="Np. 'Napisz krótki artykuł 300 słów' lub 'Skup się na aspektach prawnych' - możesz zostawić puste"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Opcjonalne dodatkowe instrukcje dla tego artykułu. Prompty z ustawień (globalny + artykułów) są zawsze używane automatycznie.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={executeAIProcess} disabled={!!processingId}>
              {processingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generuję...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generuj artykuł
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
