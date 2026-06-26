'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Globe, Share2, BarChart3, Search, Image as ImageIcon, Loader2, CheckCircle2, Sparkles, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface BackfillStats {
  total: number
  withSeo: number
  withoutSeo: number
}

interface BackfillResult {
  total: number
  processed: number
  failed: number
  errors: string[]
}

const DEFAULT_SETTINGS = {
  siteTitle: 'ZWROTNY.pl - Portal o systemie kaucyjnym w Polsce',
  siteDescription: 'Najważniejsze informacje o systemie kaucyjnym w Polsce. Aktualności, poradniki, mity i fakty. Portal, który odczarowuje system kaucyjny!',
  keywords: 'system kaucyjny, kaucja, butelki, recykling, Polska, recyklomat, zwrot butelek',
  ogTitle: 'ZWROTNY.pl - System kaucyjny bez tajemnic',
  ogDescription: 'Wszystko co musisz wiedzieć o systemie kaucyjnym w Polsce. Aktualności, poradniki i obalanie mitów.',
  ogImage: '/images/og-default.jpg',
  twitterCard: 'summary_large_image',
  twitterSite: '@zwrotnypl',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',
  hotjarId: '',
  robotsIndex: true,
  robotsFollow: true,
  sitemapEnabled: true,
  sitemapFrequency: 'daily',
}

type SeoSettings = typeof DEFAULT_SETTINGS

export default function SEOPage() {
  const [settings, setSettings] = useState<SeoSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [backfillStats, setBackfillStats] = useState<BackfillStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [runningBackfill, setRunningBackfill] = useState(false)
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null)

  // Load settings from DB on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const saved = d.data?.seo_settings
        if (saved) {
          setSettings(s => ({ ...s, ...saved }))
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const update = (patch: Partial<SeoSettings>) =>
    setSettings(s => ({ ...s, ...patch }))

  const fetchBackfillStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/ai/seo-backfill')
      const data = await res.json()
      setBackfillStats(data)
    } catch {
      toast.error('Nie udało się pobrać statystyk SEO')
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const runBackfill = async () => {
    if (!backfillStats || backfillStats.withoutSeo === 0) return
    if (!confirm(`Wygenerować SEO dla ${backfillStats.withoutSeo} artykułów? Może to zająć kilka minut.`)) return
    setRunningBackfill(true)
    setBackfillResult(null)
    try {
      const res = await fetch('/api/ai/seo-backfill', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd backfill')
      setBackfillResult(data)
      toast.success(`Wygenerowano SEO dla ${data.processed} artykułów`)
      fetchBackfillStats()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd generowania SEO')
    } finally {
      setRunningBackfill(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const r = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo_settings: settings }),
      })
      const d = await r.json()
      if (d.success) {
        toast.success('Ustawienia SEO zostaly zapisane')
      } else {
        toast.error('Blad zapisu: ' + (d.error ?? 'Nieznany blad'))
      }
    } catch {
      toast.error('Blad polaczenia z serwerem')
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
          <h1 className="text-3xl font-display font-bold text-foreground">SEO i Analityka</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj meta tagami, Open Graph i narzędziami analitycznymi</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 gap-2">
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Zapisywanie...</>
          ) : (
            <><Save className="w-4 h-4" />Zapisz wszystko</>
          )}
        </Button>
      </div>

      <Tabs defaultValue="meta" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="meta" className="gap-2">
            <Search className="w-4 h-4" />
            Meta tagi
          </TabsTrigger>
          <TabsTrigger value="og" className="gap-2">
            <Share2 className="w-4 h-4" />
            Open Graph
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analityka
          </TabsTrigger>
          <TabsTrigger value="robots" className="gap-2">
            <Globe className="w-4 h-4" />
            Robots & Sitemap
          </TabsTrigger>
          <TabsTrigger value="autoseo" className="gap-2" onClick={() => { if (!backfillStats) fetchBackfillStats() }}>
            <Sparkles className="w-4 h-4" />
            Auto-SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Meta tagi globalne</CardTitle>
              <CardDescription>Domyślne meta tagi dla całej strony</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tytuł strony</label>
                <Input
                  value={settings.siteTitle}
                  onChange={(e) => update({ siteTitle: e.target.value })}
                  placeholder="Tytuł strony..."
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">{settings.siteTitle.length}/60 znaków (zalecane)</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Opis strony</label>
                <Textarea
                  value={settings.siteDescription}
                  onChange={(e) => update({ siteDescription: e.target.value })}
                  placeholder="Opis strony..."
                  rows={3}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">{settings.siteDescription.length}/160 znaków (zalecane)</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Słowa kluczowe</label>
                <Textarea
                  value={settings.keywords}
                  onChange={(e) => update({ keywords: e.target.value })}
                  placeholder="słowo1, słowo2, słowo3..."
                  rows={2}
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Podgląd w Google</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {settings.siteTitle || 'Tytuł strony'}
                </div>
                <div className="text-green-700 text-sm">https://zwrotny.pl</div>
                <div className="text-gray-600 text-sm mt-1">
                  {settings.siteDescription || 'Opis strony pojawi się tutaj...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="og" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Open Graph (Facebook, LinkedIn)</CardTitle>
              <CardDescription>Jak strona wygląda przy udostępnianiu w mediach społecznościowych</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">OG Tytuł</label>
                <Input
                  value={settings.ogTitle}
                  onChange={(e) => update({ ogTitle: e.target.value })}
                  placeholder="Tytuł dla social media..."
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">OG Opis</label>
                <Textarea
                  value={settings.ogDescription}
                  onChange={(e) => update({ ogDescription: e.target.value })}
                  placeholder="Opis dla social media..."
                  rows={2}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">OG Obraz</label>
                <div className="flex gap-3">
                  <Input
                    value={settings.ogImage}
                    onChange={(e) => update({ ogImage: e.target.value })}
                    placeholder="/images/og-default.jpg"
                    className="bg-background"
                  />
                  <Button variant="outline">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Wybierz
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Zalecany rozmiar: 1200x630px</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Twitter Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Typ karty</label>
                <select
                  value={settings.twitterCard}
                  onChange={(e) => update({ twitterCard: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Twitter @handle</label>
                <Input
                  value={settings.twitterSite}
                  onChange={(e) => update({ twitterSite: e.target.value })}
                  placeholder="@zwrotnypl"
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>Sledz ruch na stronie przez Google Analytics 4</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Google Analytics ID</label>
                <Input
                  value={settings.googleAnalyticsId}
                  onChange={(e) => update({ googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="bg-background font-mono"
                />
                {settings.googleAnalyticsId && (
                  <p className="text-xs flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Zapisany: {settings.googleAnalyticsId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Google Tag Manager ID</label>
                <Input
                  value={settings.googleTagManagerId}
                  onChange={(e) => update({ googleTagManagerId: e.target.value })}
                  placeholder="GTM-XXXXXXX"
                  className="bg-background font-mono"
                />
                {settings.googleTagManagerId && (
                  <p className="text-xs flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Zapisany: {settings.googleTagManagerId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Inne narzędzia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Facebook Pixel ID</label>
                <Input
                  value={settings.facebookPixelId}
                  onChange={(e) => update({ facebookPixelId: e.target.value })}
                  placeholder="XXXXXXXXXXXXXXX"
                  className="bg-background font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Hotjar ID</label>
                <Input
                  value={settings.hotjarId}
                  onChange={(e) => update({ hotjarId: e.target.value })}
                  placeholder="XXXXXXX"
                  className="bg-background font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="robots" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Robots.txt</CardTitle>
              <CardDescription>Kontroluj indeksowanie przez wyszukiwarki</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                <div>
                  <p className="font-medium">Pozwól na indeksowanie</p>
                  <p className="text-sm text-muted-foreground">Wyszukiwarki będą indeksować stronę</p>
                </div>
                <Switch
                  checked={settings.robotsIndex}
                  onCheckedChange={(checked) => update({ robotsIndex: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                <div>
                  <p className="font-medium">Pozwól na śledzenie linków</p>
                  <p className="text-sm text-muted-foreground">Wyszukiwarki będą podążać za linkami</p>
                </div>
                <Switch
                  checked={settings.robotsFollow}
                  onCheckedChange={(checked) => update({ robotsFollow: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Sitemap</CardTitle>
              <CardDescription>Automatyczna mapa strony dla wyszukiwarek</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                <div>
                  <p className="font-medium">Generuj sitemap.xml</p>
                  <p className="text-sm text-muted-foreground">Automatycznie generuj mapę strony</p>
                </div>
                <Switch
                  checked={settings.sitemapEnabled}
                  onCheckedChange={(checked) => update({ sitemapEnabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Częstotliwość aktualizacji</label>
                <select
                  value={settings.sitemapFrequency}
                  onChange={(e) => update({ sitemapFrequency: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  disabled={!settings.sitemapEnabled}
                >
                  <option value="always">Zawsze</option>
                  <option value="hourly">Co godzinę</option>
                  <option value="daily">Codziennie</option>
                  <option value="weekly">Co tydzień</option>
                  <option value="monthly">Co miesiąc</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="autoseo" className="space-y-6">
          {/* Coverage stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />
                    Pokrycie SEO artykułów
                  </CardTitle>
                  <CardDescription>Stan automatycznych metadanych dla wszystkich artykułów</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchBackfillStats} disabled={loadingStats}>
                  <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats && !backfillStats ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wczytuję statystyki...
                </div>
              ) : backfillStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pokrycie</span>
                    <span className="font-semibold">
                      {Math.round((backfillStats.withSeo / Math.max(backfillStats.total, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((backfillStats.withSeo / Math.max(backfillStats.total, 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                    <div>
                      <p className="text-2xl font-bold">{backfillStats.total}</p>
                      <p className="text-xs text-muted-foreground">Wszystkich</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{backfillStats.withSeo}</p>
                      <p className="text-xs text-muted-foreground">Z SEO</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{backfillStats.withoutSeo}</p>
                      <p className="text-xs text-muted-foreground">Bez SEO</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">Kliknij odśwież aby załadować statystyki.</p>
              )}
            </CardContent>
          </Card>

          {/* Backfill action */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Masowe generowanie SEO
              </CardTitle>
              <CardDescription>
                Wygeneruj metadane AI dla wszystkich artykułów które ich jeszcze nie mają.
                Nowe artykuły dostają SEO automatycznie przy każdym zapisie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2 text-muted-foreground">
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  Nowe artykuły — SEO generuje się automatycznie przy każdym zapisie/publikacji
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  Ręczna edycja — możesz nadpisać metadane w karcie SEO w edytorze artykułu
                </p>
                <p className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  Przycisk poniżej dotyczy tylko artykułów bez metadanych — nie nadpisze istniejących
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={runBackfill}
                  disabled={runningBackfill || !backfillStats || backfillStats.withoutSeo === 0}
                  className="gap-2"
                >
                  {runningBackfill ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Generuję SEO...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Generuj dla {backfillStats?.withoutSeo ?? '...'} artykułów</>
                  )}
                </Button>
              </div>

              {backfillResult && (
                <div className={`rounded-lg border p-4 text-sm ${backfillResult.failed > 0 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' : 'border-green-300 bg-green-50 dark:bg-green-950/20'}`}>
                  <p className="font-medium">
                    {backfillResult.failed === 0
                      ? `Wygenerowano SEO dla ${backfillResult.processed} artykułów.`
                      : `Wygenerowano ${backfillResult.processed} z ${backfillResult.total}. Błędy: ${backfillResult.failed}.`
                    }
                  </p>
                  {backfillResult.errors.length > 0 && (
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {backfillResult.errors.map((e, i) => <li key={i} className="truncate text-xs">{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jak działa auto-SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0">1</Badge>
                <p>Redaktor zapisuje lub publikuje artykuł</p>
              </div>
              <div className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0">2</Badge>
                <p>System sprawdza czy artykuł ma już meta title — jeśli nie, wywołuje AI automatycznie</p>
              </div>
              <div className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0">3</Badge>
                <p>GPT-4o-mini przez Vercel AI Gateway generuje: meta title (max 60 znaków), meta description (140–160 znaków), słowa kluczowe, OG tags i ocenę SEO 0–100</p>
              </div>
              <div className="flex gap-3 items-start">
                <Badge variant="outline" className="shrink-0">4</Badge>
                <p>Metadane zapisują się razem z artykułem i są widoczne w karcie SEO edytora do ewentualnej korekty</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
