'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Radio, Plus, Trash2, Check, X, Eye, EyeOff, Pin, PinOff,
  Globe, RefreshCw, Save, ToggleLeft, ToggleRight, ExternalLink,
  Search, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TickerSettings {
  is_enabled: boolean
  speed: number
  max_items: number
  freshness_days: number
  allow_close: boolean
  fallback_message: string
}

interface TickerSource {
  id: string
  name: string
  homepage_url: string
  feed_url?: string | null
  source_type: string
  is_active: boolean
  priority: number
  trust_level: string
  refresh_interval: number
  include_keywords: string[]
  exclude_keywords: string[]
  semantic_hints: string[]
  last_fetched_at?: string | null
  last_fetch_error?: string | null
}

interface TickerItem {
  id: string
  title: string
  excerpt?: string | null
  source_name: string
  source_url: string
  original_url: string
  published_at?: string | null
  topic_tags: string[]
  relevance_score: number
  source_trust_level: string
  is_pinned: boolean
  is_hidden: boolean
  is_manual: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOURCE_TYPE_LABELS: Record<string, string> = {
  instytucja_publiczna: 'Instytucja publiczna',
  medium_branzowe: 'Medium branżowe',
  organizacja_ekologiczna: 'Org. ekologiczna',
  organizacja_branzowa: 'Org. branżowa',
  prawo_legislacja: 'Prawo / legislacja',
  inne: 'Inne',
}

const TRUST_COLORS: Record<string, string> = {
  wysokie: 'bg-green-100 text-green-800',
  srednie: 'bg-yellow-100 text-yellow-800',
  niskie: 'bg-red-100 text-red-800',
}

const FRESHNESS_OPTIONS = [
  { value: 1, label: 'Ostatnie 24h' },
  { value: 3, label: 'Ostatnie 3 dni' },
  { value: 7, label: 'Ostatnie 7 dni' },
  { value: 14, label: 'Ostatnie 14 dni' },
  { value: 30, label: 'Ostatnie 30 dni' },
]

function scoreColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel() {
  const [settings, setSettings] = useState<TickerSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/ticker/settings').then(r => r.json()).then(setSettings)
  }, [])

  async function save() {
    if (!settings) return
    setSaving(true)
    await fetch('/api/ticker/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) return <div className="p-6 text-sm text-muted-foreground">Ładowanie ustawień...</div>

  return (
    <div className="space-y-6 p-6">
      {/* Enable/disable */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="font-semibold text-sm">Pasek aktualności</p>
          <p className="text-xs text-muted-foreground mt-0.5">Widoczny nad głównym nagłówkiem strony</p>
        </div>
        <button
          onClick={() => setSettings(s => s ? { ...s, is_enabled: !s.is_enabled } : s)}
          className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
            settings.is_enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
        >
          {settings.is_enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {settings.is_enabled ? 'Włączony' : 'Wyłączony'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Speed */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <Label className="text-sm font-semibold">Prędkość przewijania</Label>
          <p className="text-xs text-muted-foreground">px/s — wyżej = szybciej (10–120)</p>
          <div className="flex items-center gap-3">
            <input
              type="range" min={10} max={120} step={5}
              value={settings.speed}
              onChange={e => setSettings(s => s ? { ...s, speed: Number(e.target.value) } : s)}
              className="flex-1 accent-primary"
            />
            <span className="w-10 text-center text-sm font-mono font-semibold">{settings.speed}</span>
          </div>
        </div>

        {/* Max items */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <Label className="text-sm font-semibold">Maks. liczba newsów</Label>
          <p className="text-xs text-muted-foreground">Ile zajawek maksymalnie w pasku</p>
          <Input
            type="number" min={1} max={50}
            value={settings.max_items}
            onChange={e => setSettings(s => s ? { ...s, max_items: Number(e.target.value) } : s)}
            className="w-24"
          />
        </div>

        {/* Freshness */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <Label className="text-sm font-semibold">Świeżość informacji</Label>
          <p className="text-xs text-muted-foreground">Ignoruj starsze newsy (oprócz przypiętych)</p>
          <div className="flex flex-wrap gap-2">
            {FRESHNESS_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setSettings(s => s ? { ...s, freshness_days: o.value } : s)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  settings.freshness_days === o.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/70')}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Allow close */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <Label className="text-sm font-semibold">Możliwość zamknięcia przez użytkownika</Label>
          <p className="text-xs text-muted-foreground">Przycisk X w pasku, zamknięcie na 24h</p>
          <button
            onClick={() => setSettings(s => s ? { ...s, allow_close: !s.allow_close } : s)}
            className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
              settings.allow_close ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
          >
            {settings.allow_close ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {settings.allow_close ? 'Tak' : 'Nie'}
          </button>
        </div>
      </div>

      {/* Fallback */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <Label className="text-sm font-semibold">Komunikat fallback</Label>
        <p className="text-xs text-muted-foreground">Gdy brak newsów spełniających kryteria</p>
        <Input
          value={settings.fallback_message}
          onChange={e => setSettings(s => s ? { ...s, fallback_message: e.target.value } : s)}
          placeholder="Brak aktualności..."
          className="max-w-lg"
        />
      </div>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saved ? <><Check className="w-4 h-4" />Zapisano</> : saving ? <><RefreshCw className="w-4 h-4 animate-spin" />Zapisuję...</> : <><Save className="w-4 h-4" />Zapisz ustawienia</>}
      </Button>
    </div>
  )
}

// ─── Sources Panel ────────────────────────────────────────────────────────────

function SourcesPanel() {
  const [sources, setSources] = useState<TickerSource[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState<{ inserted: number; fetched: number } | null>(null)

  // New source form state
  const [newUrl, setNewUrl] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [discoveredFeed, setDiscoveredFeed] = useState<string | null | undefined>(undefined)
  const [discoveryMethod, setDiscoveryMethod] = useState<string | null>(null)
  const [newSource, setNewSource] = useState({
    name: '', homepage_url: '', feed_url: '',
    source_type: 'inne', priority: 5, trust_level: 'srednie', is_active: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/ticker/sources')
    setSources(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-discover RSS when URL is entered and user stops typing
  const discoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleUrlChange(url: string) {
    setNewUrl(url)
    setNewSource(s => ({ ...s, homepage_url: url }))
    setDiscoveredFeed(undefined)
    setDiscoveryMethod(null)
    if (discoverTimer.current) clearTimeout(discoverTimer.current)
    if (!url.startsWith('http')) return
    discoverTimer.current = setTimeout(async () => {
      setDiscovering(true)
      try {
        const params = new URLSearchParams({ url })
        if (newSource.name) params.set('name', newSource.name)
        const r = await fetch(`/api/ticker/discover-rss?${params}`)
        const d = await r.json()
        setDiscoveredFeed(d.feedUrl ?? null)
        setDiscoveryMethod(d.method ?? null)
        if (d.feedUrl) setNewSource(s => ({ ...s, feed_url: d.feedUrl }))
      } catch { setDiscoveredFeed(null) }
      finally { setDiscovering(false) }
    }, 800)
  }

  async function toggle(id: string, val: boolean) {
    await fetch(`/api/ticker/sources/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: val }) })
    setSources(s => s.map(x => x.id === id ? { ...x, is_active: val } : x))
  }

  async function deleteSource(id: string) {
    if (!confirm('Usunąć to źródło?')) return
    await fetch(`/api/ticker/sources/${id}`, { method: 'DELETE' })
    setSources(s => s.filter(x => x.id !== id))
  }

  async function addSource() {
    if (!newSource.name || !newSource.homepage_url) return
    const r = await fetch('/api/ticker/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newSource, feed_url: newSource.feed_url || null }),
    })
    const d = await r.json()
    setSources(s => [d, ...s])
    setNewSource({ name: '', homepage_url: '', feed_url: '', source_type: 'inne', priority: 5, trust_level: 'srednie', is_active: true })
    setNewUrl('')
    setDiscoveredFeed(undefined)
    setShowAdd(false)
  }

  async function handleRefreshAll() {
    setRefreshing(true)
    setRefreshResult(null)
    try {
      const r = await fetch('/api/ticker/fetch-feeds', { method: 'POST' })
      const d = await r.json()
      setRefreshResult({ inserted: d.inserted ?? 0, fetched: d.fetched ?? 0 })
      await load()
    } finally { setRefreshing(false) }
  }

  function formatFetched(ts?: string | null) {
    if (!ts) return 'nigdy'
    const d = new Date(ts)
    const mins = Math.round((Date.now() - d.getTime()) / 60000)
    if (mins < 2) return 'przed chwilą'
    if (mins < 60) return `${mins} min temu`
    if (mins < 1440) return `${Math.round(mins / 60)} godz. temu`
    return d.toLocaleDateString('pl-PL')
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie źródeł...</div>

  return (
    <div className="space-y-4 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">{sources.length} skonfigurowanych źródeł</p>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            onClick={handleRefreshAll} disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            {refreshing ? 'Pobieranie...' : 'Pobierz newsy teraz'}
          </Button>
          <Button size="sm" onClick={() => setShowAdd(v => !v)} variant={showAdd ? 'outline' : 'default'} className="gap-1.5">
            {showAdd ? <><X className="w-3.5 h-3.5" />Anuluj</> : <><Plus className="w-3.5 h-3.5" />Dodaj źródło</>}
          </Button>
        </div>
      </div>

      {/* Refresh result */}
      {refreshResult && (
        <div className="flex items-center gap-2 text-sm rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Pobrano {refreshResult.fetched} pozycji z RSS, dodano {refreshResult.inserted} nowych do bazy.
        </div>
      )}

      {/* Add source form */}
      {showAdd && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
          <p className="text-sm font-semibold">Nowe źródło</p>

          {/* Step 1: URL — RSS auto-discovery */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Adres strony (www)</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="https://example.com"
                value={newUrl}
                onChange={e => handleUrlChange(e.target.value)}
                className="pl-8"
              />
              {discovering && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {/* RSS discovery feedback */}
            {discoveredFeed === null && !discovering && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Nie znaleziono RSS. Newsy z tej strony pobierane przez Google News. Możesz też wpisac URL RSS ręcznie.
              </p>
            )}
            {discoveredFeed && !discovering && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {discoveryMethod === 'google_news'
                  ? <>Brak RSS — newsy pobierane przez <strong>Google News</strong> (automatycznie).</>
                  : discoveryMethod === 'html_link'
                    ? <>Znaleziono RSS w HTML strony.</>
                    : discoveryMethod === 'probe'
                      ? <>Znaleziono RSS (standardowa ścieżka).</>
                      : <>Znaleziono feed.</>
                }
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nazwa wyświetlana</Label>
              <Input placeholder="np. Teraz Środowisko" value={newSource.name} onChange={e => setNewSource(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL RSS <span className="text-muted-foreground">(wykryte lub ręcznie)</span></Label>
              <Input
                placeholder="https://.../feed.xml"
                value={newSource.feed_url}
                onChange={e => setNewSource(s => ({ ...s, feed_url: e.target.value }))}
                className={cn(discoveredFeed && newSource.feed_url === discoveredFeed && 'border-green-400')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Typ źródła</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={newSource.source_type} onChange={e => setNewSource(s => ({ ...s, source_type: e.target.value }))}>
                {Object.entries(SOURCE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zaufanie</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={newSource.trust_level} onChange={e => setNewSource(s => ({ ...s, trust_level: e.target.value }))}>
                <option value="wysokie">Wysokie</option>
                <option value="srednie">Średnie</option>
                <option value="niskie">Niskie</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priorytet (1–10)</Label>
              <Input type="number" min={1} max={10} value={newSource.priority} onChange={e => setNewSource(s => ({ ...s, priority: Number(e.target.value) }))} className="w-24" />
            </div>
          </div>
          <Button
            size="sm" onClick={addSource}
            disabled={!newSource.name || !newSource.homepage_url}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />Dodaj źródło
          </Button>
        </div>
      )}

      {/* Sources list */}
      <div className="space-y-2">
        {sources.map(src => (
          <div key={src.id} className={cn('rounded-xl border bg-card p-3 transition-opacity', !src.is_active && 'opacity-50')}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{src.name}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', TRUST_COLORS[src.trust_level])}>
                    {src.trust_level === 'wysokie' ? 'Wysokie' : src.trust_level === 'srednie' ? 'Średnie' : 'Niskie'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                    {SOURCE_TYPE_LABELS[src.source_type] ?? src.source_type}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <a href={src.homepage_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Globe className="w-3 h-3" />{src.homepage_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                  {src.feed_url
                    ? src.feed_url.includes('news.google.com')
                      ? <span className="text-[10px] text-blue-600 flex items-center gap-1"><Search className="w-3 h-3" />Google News</span>
                      : <span className="text-[10px] text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />RSS aktywny</span>
                    : <span className="text-[10px] text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Brak RSS — HTML scraping</span>
                  }
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {src.last_fetch_error
                      ? <span className="text-red-500">Błąd: {src.last_fetch_error.slice(0, 40)}</span>
                      : `Ostatni fetch: ${formatFetched(src.last_fetched_at)}`
                    }
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" title={src.is_active ? 'Dezaktywuj' : 'Aktywuj'} onClick={() => toggle(src.id, !src.is_active)}>
                  {src.is_active ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Usuń" onClick={() => deleteSource(src.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Items Panel ──────────────────────────────────────────────────────────────

function ItemsPanel() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', excerpt: '', source_name: '', source_url: '', original_url: '', relevance_score: 90 })

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/ticker/items')
    setItems(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function patchItem(id: string, patch: Partial<TickerItem>) {
    await fetch(`/api/ticker/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    setItems(s => s.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  async function deleteItem(id: string) {
    if (!confirm('Usunąć ten news?')) return
    await fetch(`/api/ticker/items/${id}`, { method: 'DELETE' })
    setItems(s => s.filter(x => x.id !== id))
  }

  async function addItem() {
    const r = await fetch('/api/ticker/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newItem, source_trust_level: 'wysokie', topic_tags: [], published_at: new Date().toISOString() }) })
    const d = await r.json()
    setItems(s => [d, ...s])
    setNewItem({ title: '', excerpt: '', source_name: '', source_url: '', original_url: '', relevance_score: 90 })
    setShowAdd(false)
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie newsów...</div>

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} newsów w bazie</p>
        <Button size="sm" onClick={() => setShowAdd(v => !v)} variant={showAdd ? 'outline' : 'default'} className="gap-1.5">
          {showAdd ? <><X className="w-3.5 h-3.5" />Anuluj</> : <><Plus className="w-3.5 h-3.5" />Dodaj ręcznie</>}
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold">Nowa zajawka</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Tytuł</Label>
              <Input placeholder="Tytuł newsa" value={newItem.title} onChange={e => setNewItem(s => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Zajawka (opcjonalna)</Label>
              <Input placeholder="Krótki opis..." value={newItem.excerpt} onChange={e => setNewItem(s => ({ ...s, excerpt: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nazwa źródła</Label>
              <Input placeholder="np. gov.pl" value={newItem.source_name} onChange={e => setNewItem(s => ({ ...s, source_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL źródła</Label>
              <Input placeholder="https://..." value={newItem.source_url} onChange={e => setNewItem(s => ({ ...s, source_url: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">URL oryginalny (link do newsa)</Label>
              <Input placeholder="https://..." value={newItem.original_url} onChange={e => setNewItem(s => ({ ...s, original_url: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Scoring trafności (0–100)</Label>
              <Input type="number" min={0} max={100} value={newItem.relevance_score} onChange={e => setNewItem(s => ({ ...s, relevance_score: Number(e.target.value) }))} className="w-24" />
            </div>
          </div>
          <Button size="sm" onClick={addItem} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Dodaj zajawkę</Button>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={cn('rounded-xl border bg-card p-3 transition-opacity', item.is_hidden && 'opacity-40')}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {item.is_pinned && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-semibold">Przypięty</span>}
                  {item.is_manual && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Ręczny</span>}
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold', scoreColor(item.relevance_score))}>
                    Score: {item.relevance_score}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.source_name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(item.published_at)}</span>
                </div>
                <p className="text-sm font-medium leading-snug line-clamp-2">{item.title}</p>
                {item.excerpt && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.excerpt}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={item.original_url} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Otwórz"><ExternalLink className="w-3.5 h-3.5" /></Button>
                </a>
                <Button size="icon" variant="ghost" className="h-7 w-7" title={item.is_pinned ? 'Odepnij' : 'Przypnij'} onClick={() => patchItem(item.id, { is_pinned: !item.is_pinned })}>
                  {item.is_pinned ? <PinOff className="w-3.5 h-3.5 text-accent-foreground" /> : <Pin className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title={item.is_hidden ? 'Pokaż' : 'Ukryj'} onClick={() => patchItem(item.id, { is_hidden: !item.is_hidden })}>
                  {item.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Usuń" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'settings' | 'sources' | 'items'

export default function TickerPage() {
  const [tab, setTab] = useState<Tab>('settings')

  const tabs: { id: Tab; label: string; desc: string }[] = [
    { id: 'settings', label: 'Ustawienia', desc: 'Włącz/wyłącz, prędkość, filtry' },
    { id: 'sources', label: 'Źródła', desc: 'Zarządzaj źródłami newsów' },
    { id: 'items', label: 'Newsy', desc: 'Przeglądaj, przypnij, ukryj' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Radio className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Radar branżowy</h1>
          <p className="text-sm text-muted-foreground">Pasek aktualności — system kaucyjny, recykling, ROP, opakowania</p>
        </div>
      </div>

      {/* Preview strip */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-3 py-1.5 bg-muted border-b border-border flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-muted-foreground ml-2">Podgląd paska nad headerem</span>
        </div>
        <div className="h-8 bg-[oklch(0.13_0.02_250)] flex items-center overflow-hidden">
          <div className="flex items-center gap-1.5 h-full px-3 bg-primary/20 border-r border-primary/30 shrink-0">
            <Radio className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Radar</span>
          </div>
          <div className="flex-1 px-4 overflow-hidden">
            <p className="text-[12px] text-[oklch(0.75_0.01_250)] whitespace-nowrap overflow-hidden text-ellipsis">
              System kaucyjny w Polsce: startuje zbiórka butelek PET i puszek · PPWR: nowe wymagania UE dla opakowań wielokrotnego użytku · ROP — Rozszerzona Odpowiedzialność Producenta: co się zmienia w 2025 · ...
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('flex-1 flex flex-col items-center py-2 px-3 rounded-lg text-xs transition-all',
              tab === t.id ? 'bg-background text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            <span className="font-semibold">{t.label}</span>
            <span className={cn('text-[10px] mt-0.5', tab === t.id ? 'text-muted-foreground' : 'opacity-0')}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {tab === 'settings' && <SettingsPanel />}
        {tab === 'sources' && <SourcesPanel />}
        {tab === 'items' && <ItemsPanel />}
      </div>
    </div>
  )
}
