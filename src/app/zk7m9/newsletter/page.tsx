'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail, Users, Settings, Plus, Trash2, Send, Clock, CheckCircle2,
  AlertCircle, Search, Download, Upload, X, Loader2, Eye, RefreshCw,
  Calendar, ChevronRight, BarChart2, Link as LinkIcon, FileText, AtSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Campaign {
  id: string
  title: string
  subject: string
  preheader?: string
  html_content: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_for?: string | null
  sent_at?: string | null
  sent_count: number
  error_count: number
  target_tags: string[]
  created_at: string
}

interface Subscriber {
  id: string
  email: string
  first_name?: string | null
  confirmed: boolean
  unsubscribed_at?: string | null
  source: string
  tags: string[]
  created_at: string
}

interface BrevoList {
  id: number
  name: string
  totalSubscribers: number
}

interface SenderSettings {
  name: string
  email: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Campaign['status'], { label: string; icon: React.ReactNode; className: string }> = {
  draft:     { label: 'Szkic',        icon: <Clock className="w-3 h-3" />,                          className: 'bg-secondary text-secondary-foreground' },
  scheduled: { label: 'Zaplanowana',  icon: <Calendar className="w-3 h-3" />,                       className: 'bg-blue-100 text-blue-700' },
  sending:   { label: 'Wysylanie...', icon: <Loader2 className="w-3 h-3 animate-spin" />,           className: 'bg-amber-100 text-amber-700' },
  sent:      { label: 'Wyslana',      icon: <CheckCircle2 className="w-3 h-3" />,                   className: 'bg-green-100 text-green-700' },
  failed:    { label: 'Blad',         icon: <AlertCircle className="w-3 h-3" />,                    className: 'bg-red-100 text-red-700' },
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function buildHtmlFromFields(fields: {
  headline: string
  body: string
  articleUrl: string
  ctaLabel: string
  coverImageUrl: string
}): string {
  const { headline, body, articleUrl, ctaLabel, coverImageUrl } = fields
  const imgBlock = coverImageUrl
    ? `<div style="margin:0 0 24px;"><img src="${coverImageUrl}" alt="${headline}" style="width:100%;max-width:520px;border-radius:8px;display:block;" /></div>`
    : ''
  const ctaBlock = articleUrl
    ? `<div style="margin:28px 0 0;"><a href="${articleUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;">${ctaLabel || 'Czytaj artykul &rarr;'}</a></div>`
    : ''
  const bodyHtml = body.split('\n').filter(Boolean).map(p => `<p style="margin:0 0 14px;color:#475569;line-height:1.7;font-size:15px;">${p}</p>`).join('\n')

  return [
    imgBlock,
    `<h2 style="margin:0 0 18px;font-size:22px;color:#1e293b;line-height:1.3;">${headline}</h2>`,
    bodyHtml,
    ctaBlock,
  ].filter(Boolean).join('\n')
}

// ─── Campaigns Panel ────────────────────────────────────────────────────────

function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [preview, setPreview] = useState<Campaign | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [brevoLists, setBrevoLists] = useState<BrevoList[]>([])
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null)

  // Sender settings loaded from DB
  const [defaultSender, setDefaultSender] = useState<SenderSettings>({ name: 'Zwrotny.pl', email: 'redakcja@zwrotny.pl' })

  // New campaign form
  const [form, setForm] = useState({
    // internal
    title: '',
    subject: '',
    preheader: '',
    scheduleFor: '',
    // sender (overridable per-campaign)
    senderName: '',
    senderEmail: '',
    // content fields
    headline: '',
    body: '',
    articleUrl: '',
    ctaLabel: 'Czytaj artykul',
    coverImageUrl: '',
  })
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [posts, setPosts] = useState<{ id: string; title: string; excerpt?: string; slug: string; coverImage?: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/newsletter/campaigns?limit=100')
    const d = await r.json()
    setCampaigns(d.campaigns ?? [])
    setLoading(false)
  }, [])

  // Load sender defaults
  useEffect(() => {
    load()
    fetch('/api/newsletter/lists')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setBrevoLists(d)
      })
      .catch(() => {})
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const name = d.newsletter_sender_name || 'Zwrotny.pl'
        const email = d.newsletter_sender_email || 'redakcja@zwrotny.pl'
        setDefaultSender({ name, email })
        setForm(f => ({ ...f, senderName: name, senderEmail: email }))
      })
      .catch(() => {})
  }, [load])

  async function loadPosts() {
    setLoadingPosts(true)
    const r = await fetch('/api/posts?limit=50&status=published')
    const d = await r.json()
    setPosts(d.posts ?? d ?? [])
    setLoadingPosts(false)
  }

  function fillFromPost(post: typeof posts[0]) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zwrotny.pl'
    const postUrl = `${siteUrl}/artykul/${post.slug}`
    setForm(f => ({
      ...f,
      title: `Newsletter: ${post.title}`,
      subject: post.title,
      preheader: post.excerpt ?? '',
      headline: post.title,
      body: post.excerpt ?? '',
      articleUrl: postUrl,
      coverImageUrl: post.coverImage ?? '',
    }))
    setPosts([])
  }

  async function saveCampaign() {
    if (!form.title) { toast.error('Uzupelnij pole "Tytul wewnetrzny"'); return }
    if (!form.subject) { toast.error('Uzupelnij pole "Temat emaila"'); return }
    if (!form.headline && !form.body) { toast.error('Uzupelnij "Naglowek wiadomosci" lub "Opis / tresc"'); return }
    const html_content = buildHtmlFromFields({
      headline: form.headline,
      body: form.body,
      articleUrl: form.articleUrl,
      ctaLabel: form.ctaLabel,
      coverImageUrl: form.coverImageUrl,
    })
    const r = await fetch('/api/newsletter/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        subject: form.subject,
        preheader: form.preheader,
        html_content,
        target_tags: [],
      }),
    })
    const d = await r.json()
    if (d.error) { toast.error('Blad zapisu: ' + d.error); return }
    toast.success('Kampania zapisana jako szkic')
    setCampaigns(c => [d, ...c])
    setShowNew(false)
    resetForm()
  }

  function resetForm() {
    setForm(f => ({
      title: '', subject: '', preheader: '', scheduleFor: '',
      senderName: defaultSender.name, senderEmail: defaultSender.email,
      headline: '', body: '', articleUrl: '', ctaLabel: 'Czytaj artykul', coverImageUrl: '',
    }))
    setPosts([])
  }

  function senderFrom() {
    const name = form.senderName || defaultSender.name
    const email = form.senderEmail || defaultSender.email
    return `${name} <${email}>`
  }

  async function execSend(id: string, listId: number, scheduleAt?: string) {
    setSending(id)
    setSendTarget(null)
    const body: Record<string, unknown> = { brevoListId: listId }
    if (scheduleAt) body.scheduleFor = scheduleAt
    const r = await fetch(`/api/newsletter/campaigns/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json()
    setSending(null)
    if (d.error) { toast.error(d.error, { duration: 10000 }); return }
    if (scheduleAt) {
      toast.success(`Kampania zaplanowana`)
    } else {
      toast.success(`Kampania wyslana przez Brevo (ID: ${d.brevo_campaign_id ?? '—'})`)
    }
    load()
  }

  function sendNow(id: string) {
    if (brevoLists.length === 0) {
      toast.error('Brak list Brevo. Najpierw utworz liste w panelu subskrybentow.')
      return
    }
    const camp = campaigns.find(c => c.id === id) ?? null
    setSendTarget(camp)
    setSelectedListId(brevoLists[0]?.id ?? null)
  }

  async function schedule(id: string, scheduleFor: string) {
    if (!selectedListId) { toast.error('Wybierz liste Brevo'); return }
    await execSend(id, selectedListId, scheduleFor)
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Usunac kampanie?')) return
    await fetch(`/api/newsletter/campaigns/${id}`, { method: 'DELETE' })
    setCampaigns(c => c.filter(x => x.id !== id))
    toast.success('Kampania usunieta')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{campaigns.length} kampanii</p>
        <Button size="sm" onClick={() => { setShowNew(v => !v); if (!showNew) resetForm() }} variant={showNew ? 'outline' : 'default'} className="gap-1.5">
          {showNew ? <><X className="w-3.5 h-3.5" />Anuluj</> : <><Plus className="w-3.5 h-3.5" />Nowa kampania</>}
        </Button>
      </div>

      {/* ── New campaign form ─────────────────────────────────────────── */}
      {showNew && (
        <Card className="border-primary/30">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Nowa kampania</p>
              <Button size="sm" variant="outline" onClick={loadPosts} disabled={loadingPosts} className="gap-1.5 h-7 text-xs">
                {loadingPosts ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Wypelnij z artykulu
              </Button>
            </div>

            {/* Article picker */}
            {posts.length > 0 && (
              <div className="rounded-lg border bg-background p-2 max-h-48 overflow-y-auto space-y-1">
                {posts.map(p => (
                  <button key={p.id} onClick={() => fillFromPost(p)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors">
                    <span className="font-medium line-clamp-1">{p.title}</span>
                    {p.excerpt && <span className="block text-xs text-muted-foreground line-clamp-1">{p.excerpt}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* ── SEKCJA: Nadawca ─── */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <AtSign className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nadawca</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nazwa nadawcy</label>
                  <Input
                    value={form.senderName}
                    onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))}
                    placeholder={defaultSender.name}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Adres email nadawcy</label>
                  <Input
                    type="email"
                    value={form.senderEmail}
                    onChange={e => setForm(f => ({ ...f, senderEmail: e.target.value }))}
                    placeholder={defaultSender.email}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Odbiorca zobaczy: <span className="font-mono bg-background px-1 py-0.5 rounded border text-foreground">{senderFrom()}</span>
              </p>
            </div>

            {/* ── SEKCJA: Koperta ─── */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Koperta</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Tytul wewnetrzny <span className="text-muted-foreground">(tylko dla Ciebie)</span></label>
                  <Input placeholder="np. Newsletter maj 2026" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Temat emaila <span className="text-muted-foreground">(widzi odbiorca)</span></label>
                  <Input placeholder="Tytul ktory widzi odbiorca" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium">Preheader <span className="text-muted-foreground">(podglad w skrzynce, po temacie)</span></label>
                  <Input placeholder="Krotki zajawkowy tekst..." value={form.preheader} onChange={e => setForm(f => ({ ...f, preheader: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* ── SEKCJA: Tresc wiadomosci ─── */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tresc wiadomosci</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Naglowek wiadomosci</label>
                <Input
                  placeholder="np. Nowy artykul na Zwrotny.pl"
                  value={form.headline}
                  onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Opis / tresc <span className="text-muted-foreground">(kazdy akapit = nowa linia)</span></label>
                <Textarea
                  rows={5}
                  placeholder="Krotki opis artykulu lub wiadomosci do subskrybentow..."
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="resize-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Link do artykulu / strony <span className="text-muted-foreground">(opcjonalnie)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://zwrotny.pl/artykul/..."
                  value={form.articleUrl}
                  onChange={e => setForm(f => ({ ...f, articleUrl: e.target.value }))}
                />
              </div>

              {form.articleUrl && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Tekst przycisku CTA</label>
                  <Input
                    placeholder="Czytaj artykul"
                    value={form.ctaLabel}
                    onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium">URL zdj. naglowkowego <span className="text-muted-foreground">(opcjonalnie)</span></label>
                <Input
                  type="url"
                  placeholder="https://zwrotny.pl/..."
                  value={form.coverImageUrl}
                  onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))}
                />
              </div>

              {/* Live preview thumbnail */}
              {(form.headline || form.body || form.articleUrl) && (
                <div className="rounded-lg border bg-white p-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Podglad struktury emaila</p>
                  {form.coverImageUrl && (
                    <img src={form.coverImageUrl} alt="Cover" className="w-full max-w-xs rounded object-cover" style={{ maxHeight: 120 }} />
                  )}
                  {form.headline && <p className="font-bold text-sm text-foreground">{form.headline}</p>}
                  {form.body && <p className="text-xs text-muted-foreground line-clamp-3">{form.body}</p>}
                  {form.articleUrl && (
                    <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded">
                      {form.ctaLabel || 'Czytaj artykul'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── SEKCJA: Harmonogram ─── */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Harmonogram</p>
              </div>
              <div className="space-y-1 max-w-xs">
                <label className="text-xs font-medium">Zaplanuj na <span className="text-muted-foreground">(opcjonalnie — zostaw puste = wyslij teraz)</span></label>
                <Input
                  type="datetime-local"
                  value={form.scheduleFor}
                  onChange={e => setForm(f => ({ ...f, scheduleFor: e.target.value }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={saveCampaign} className="gap-1.5">
                <Clock className="w-3.5 h-3.5" />Zapisz szkic
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  await saveCampaign()
                  // After saving, newest campaign is first — trigger send
                  const r = await fetch('/api/newsletter/campaigns?limit=1')
                  const d = await r.json()
                  const newest = d.campaigns?.[0]
                  if (newest?.id) {
                    if (form.scheduleFor) {
                      await schedule(newest.id, new Date(form.scheduleFor).toISOString(), senderFrom())
                    } else {
                      await sendNow(newest.id, senderFrom())
                    }
                  }
                }}
                className="gap-1.5"
              >
                {form.scheduleFor
                  ? <><Calendar className="w-3.5 h-3.5" />Zaplanuj wysylke</>
                  : <><Send className="w-3.5 h-3.5" />Zapisz i wyslij teraz</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="text-sm text-muted-foreground p-4">Ladowanie...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Brak kampanii. Stworz pierwsza powyzej.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map(c => {
            const cfg = STATUS_CONFIG[c.status]
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{c.title}</span>
                        <span className={cn('inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium', cfg.className)}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Temat: {c.subject}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>Utworzona: {formatDate(c.created_at)}</span>
                        {c.scheduled_for && <span>Zaplanowana: {formatDate(c.scheduled_for)}</span>}
                        {c.sent_at && <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />Wyslano: {c.sent_count} / Bledy: {c.error_count}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Podglad" onClick={() => setPreview(c)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <Button
                          size="sm" variant="default" className="gap-1.5 h-8 text-xs"
                          disabled={sending === c.id}
                          onClick={() => sendNow(c.id)}
                        >
                          {sending === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Wyslij
                        </Button>
                      )}
                      {c.status === 'draft' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCampaign(c.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog wysylki — wybor listy Brevo */}
      <Dialog open={!!sendTarget} onOpenChange={o => { if (!o) setSendTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Wyslij kampanie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{sendTarget?.title}</p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Lista Brevo</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={selectedListId ?? ''}
                onChange={e => setSelectedListId(Number(e.target.value))}
              >
                {brevoLists.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.totalSubscribers} subs)</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Input type="datetime-local" id="schedule-send-input" className="text-xs h-8" />
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => {
                const v = (document.getElementById('schedule-send-input') as HTMLInputElement)?.value
                if (v && sendTarget) schedule(sendTarget.id, new Date(v).toISOString())
              }}>
                <Calendar className="w-3.5 h-3.5" />Zaplanuj
              </Button>
            </div>
            <Button
              size="sm" className="gap-1.5"
              disabled={!selectedListId}
              onClick={() => { if (sendTarget && selectedListId) execSend(sendTarget.id, selectedListId) }}
            >
              <Send className="w-3.5 h-3.5" />Wyslij teraz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview modal */}
      <Dialog open={!!preview} onOpenChange={o => { if (!o) setPreview(null) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.subject}</DialogTitle>
          </DialogHeader>
          <div
            className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/30"
            dangerouslySetInnerHTML={{ __html: preview?.html_content ?? '' }}
          />
          {preview && (preview.status === 'draft' || preview.status === 'scheduled') && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Input type="datetime-local" id="schedule-input" className="text-xs h-8"
                  defaultValue={preview.scheduled_for?.slice(0, 16) ?? ''} />
                <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => {
                  const v = (document.getElementById('schedule-input') as HTMLInputElement)?.value
                  if (v) schedule(preview.id, new Date(v).toISOString())
                }}>
                  <Calendar className="w-3.5 h-3.5" />Zaplanuj
                </Button>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => { sendNow(preview.id); setPreview(null) }}>
                <Send className="w-3.5 h-3.5" />Wyslij przez Brevo
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Subscribers Panel ───────────────────────────────────────────────────────

function SubscribersPanel() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [importing, setImporting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const LIMIT = 50

  const load = useCallback(async (p = 1, q = search) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (q) params.set('search', q)
    const r = await fetch(`/api/newsletter/subscribers?${params}`)
    const d = await r.json()
    setSubscribers(d.subscribers ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [search])

  useEffect(() => { load(1) }, [load])

  async function addSubscriber() {
    if (!newEmail) return
    const r = await fetch('/api/newsletter/subscribers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, firstName: newName }),
    })
    const d = await r.json()
    if (d.error) { toast.error(d.error); return }
    toast.success('Subskrybent dodany')
    setNewEmail(''); setNewName(''); setShowAdd(false)
    load(1)
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)

    // Reset input so same file can be selected again later
    e.target.value = ''

    try {
      const text = await file.text()

      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      // Normalize line endings
      const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean)

      if (lines.length === 0) {
        toast.error('Plik jest pusty')
        return
      }

      // Detect separator
      const firstLine = lines[0]
      const sep = firstLine.includes(';') ? ';' : ','

      // Parse a single CSV line handling quoted fields
      function parseLine(line: string): string[] {
        const result: string[] = []
        let cur = ''
        let inQ = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++ } else inQ = !inQ }
          else if (ch === sep && !inQ) { result.push(cur.trim().replace(/^"|"$/g, '')); cur = '' }
          else cur += ch
        }
        result.push(cur.trim().replace(/^"|"$/g, ''))
        return result
      }

      let rows: { email: string; firstName: string | null }[]

      // Case 1: first line is a valid email — no header, one email per line
      if (EMAIL_RE.test(firstLine.split(sep)[0].replace(/^"|"$/g, ''))) {
        rows = lines
          .map(l => ({ email: l.split(sep)[0].replace(/^"|"$/g, '').trim().toLowerCase(), firstName: null }))
          .filter(r => EMAIL_RE.test(r.email))
      } else {
        // Case 2: first line is a header row
        const headers = parseLine(firstLine).map(h => h.toLowerCase())
        const emailIdx = headers.findIndex(h => h === 'email' || h === 'e-mail' || h === 'mail')
        const nameIdx = headers.findIndex(h => ['name','first_name','firstname','imie','imię','nazwa','imię'].includes(h))

        if (emailIdx === -1) {
          // Case 3: no header found, try treating every cell as potential email
          rows = lines
            .flatMap(l => parseLine(l))
            .map(v => v.toLowerCase().trim())
            .filter(v => EMAIL_RE.test(v))
            .map(email => ({ email, firstName: null }))
        } else {
          rows = lines.slice(1)
            .map(l => {
              const cols = parseLine(l)
              return {
                email: (cols[emailIdx] ?? '').toLowerCase().trim(),
                firstName: nameIdx >= 0 ? (cols[nameIdx] ?? '').trim() || null : null,
              }
            })
            .filter(r => EMAIL_RE.test(r.email))
        }
      }

      if (rows.length === 0) {
        toast.error('Nie znaleziono poprawnych adresow email w pliku')
        return
      }

      const r = await fetch('/api/newsletter/subscribers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const d = await r.json()
      if (d.error) { toast.error(d.error); return }
      toast.success(`Zaimportowano ${d.imported} z ${rows.length} rekordow`)
      load(1)
    } catch (err) {
      toast.error('Blad podczas wczytywania pliku CSV')
      console.error('[csv import]', err)
    } finally {
      setImporting(false)
    }
  }

  async function deleteSelected() {
    if (!confirm(`Usunac ${selected.length} subskrybentow?`)) return
    await fetch('/api/newsletter/subscribers', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }),
    })
    setSelected([])
    toast.success('Usunieto')
    load(1)
  }

  function exportCSV() {
    const rows = subscribers.map(s => `${s.email},${s.first_name ?? ''}`)
    const csv = ['email,first_name', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'subskrybenci.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const confirmed = subscribers.filter(s => s.confirmed && !s.unsubscribed_at).length
  const unsubscribed = subscribers.filter(s => s.unsubscribed_at).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Laczna baza', value: total, icon: <Users className="w-4 h-4" /> },
          { label: 'Aktywni', value: confirmed, icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
          { label: 'Wypisani', value: unsubscribed, icon: <X className="w-4 h-4 text-muted-foreground" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Szukaj po emailu..." value={search}
            onChange={e => { setSearch(e.target.value); load(1, e.target.value) }}
            className="pl-8 h-8 text-sm" />
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowAdd(v => !v)}>
          <Plus className="w-3 h-3" />Dodaj
        </Button>
        <label
          htmlFor="csv-file-input"
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          style={importing ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        >
          {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Import CSV
        </label>
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={handleCSVImport}
          disabled={importing}
          style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0 }}
        />
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={exportCSV}>
          <Download className="w-3 h-3" />Export CSV
        </Button>
        {selected.length > 0 && (
          <Button size="sm" variant="destructive" className="gap-1.5 h-8 text-xs" onClick={deleteSelected}>
            <Trash2 className="w-3 h-3" />Usun ({selected.length})
          </Button>
        )}
      </div>
      {showAdd && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-end gap-2 flex-wrap">
            <div className="space-y-1 flex-1 min-w-[180px]">
              <label className="text-xs font-medium">Email</label>
              <Input placeholder="jan@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1 flex-1 min-w-[140px]">
              <label className="text-xs font-medium">Imie <span className="text-muted-foreground">(opcjonalnie)</span></label>
              <Input placeholder="Jan" value={newName} onChange={e => setNewName(e.target.value)} className="h-8" />
            </div>
            <Button size="sm" onClick={addSubscriber} disabled={!newEmail} className="gap-1.5">
              <Plus className="w-3 h-3" />Dodaj
            </Button>
          </CardContent>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">
              Format CSV: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">email,first_name</code> — separator przecinek lub srednik, kodowanie UTF-8, pierwszy wiersz = naglowek
      </p>
      {loading ? (
        <div className="text-sm text-muted-foreground p-4">Ladowanie...</div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                  <th className="py-2 px-3 w-8">
                    <input type="checkbox" checked={selected.length === subscribers.length && subscribers.length > 0}
                      onChange={e => setSelected(e.target.checked ? subscribers.map(s => s.id) : [])} />
                  </th>
                  <th className="py-2 px-3 text-left font-medium">Email</th>
                  <th className="py-2 px-3 text-left font-medium">Imie</th>
                  <th className="py-2 px-3 text-left font-medium">Status</th>
                  <th className="py-2 px-3 text-left font-medium">Zrodlo</th>
                  <th className="py-2 px-3 text-left font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-3">
                      <input type="checkbox" checked={selected.includes(s.id)}
                        onChange={e => setSelected(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))} />
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">{s.email}</td>
                    <td className="py-2 px-3 text-muted-foreground">{s.first_name ?? '—'}</td>
                    <td className="py-2 px-3">
                      {s.unsubscribed_at
                        ? <Badge variant="outline" className="text-[10px] text-muted-foreground">Wypisany</Badge>
                        : s.confirmed
                          ? <Badge className="text-[10px] bg-green-100 text-green-700">Aktywny</Badge>
                          : <Badge variant="outline" className="text-[10px] text-amber-600">Niepotwierdzony</Badge>}
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground capitalize">{s.source}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString('pl-PL')}</td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">Brak subskrybentow</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Strona {page} z {Math.ceil(total / LIMIT)}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}>Poprzednia</Button>
            <Button size="sm" variant="outline" disabled={page * LIMIT >= total} onClick={() => { setPage(p => p + 1); load(page + 1) }}>Nastepna</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Settings Panel ──────────────────────────────────────────────────────────

function SettingsPanel() {
  const [smtpHost, setSmtpHost] = useState('mail.nazwa.pl')
  const [smtpPort, setSmtpPort] = useState('465')
  const [smtpSecure, setSmtpSecure] = useState(true)
  const [smtpUser, setSmtpUser] = useState('redakcja@zwrotny.pl')
  const [smtpPass, setSmtpPass] = useState('')
  const [fromName, setFromName] = useState('Zwrotny.pl')
  const [fromEmail, setFromEmail] = useState('redakcja@zwrotny.pl')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const cfg = d.data?.smtp_config
        if (cfg) {
          if (cfg.host) setSmtpHost(cfg.host)
          if (cfg.port) setSmtpPort(String(cfg.port))
          if (cfg.secure !== undefined) setSmtpSecure(cfg.secure)
          if (cfg.user) setSmtpUser(cfg.user)
          if (cfg.pass) setSmtpPass('••••••••')
          if (cfg.fromName) setFromName(cfg.fromName)
          if (cfg.fromEmail) setFromEmail(cfg.fromEmail)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  function buildConfig() {
    return {
      host: smtpHost,
      port: Number(smtpPort),
      secure: smtpSecure,
      user: smtpUser,
      pass: smtpPass.startsWith('•') ? undefined : smtpPass,
      fromName,
      fromEmail,
    }
  }

  async function save() {
    setSaving(true)
    const cfg = buildConfig()
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtp_config: cfg }),
    })
    setSaving(false)
    toast.success('Ustawienia SMTP zapisane')
  }

  async function testConnection() {
    setTesting(true)
    const cfg = buildConfig()
    const r = await fetch('/api/newsletter/smtp-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtpConfig: cfg }),
    })
    const d = await r.json()
    setTesting(false)
    if (d.ok) toast.success('Polaczenie SMTP dziala! Email testowy wyslany na ' + fromEmail)
    else toast.error('Blad polaczenia: ' + (d.error ?? 'Nieznany blad'), { duration: 8000 })
  }

  if (!loaded) return <div className="p-4 text-sm text-muted-foreground">Ladowanie...</div>

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Konfiguracja SMTP</CardTitle>
          <p className="text-xs text-muted-foreground">Wysylka przez skrzynke nazwa.pl — bez zewnetrznych serwisow</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium">Serwer SMTP</label>
              <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="mail.nazwa.pl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Port</label>
              <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="465" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smtp-secure"
              checked={smtpSecure}
              onChange={e => setSmtpSecure(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="smtp-secure" className="text-xs font-medium cursor-pointer">
              Szyfrowanie SSL/TLS (port 465)
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Login (adres email skrzynki)</label>
            <Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="redakcja@zwrotny.pl" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Haslo do skrzynki</label>
            <Input
              type="password"
              value={smtpPass}
              onChange={e => setSmtpPass(e.target.value)}
              onFocus={() => { if (smtpPass.startsWith('•')) setSmtpPass('') }}
              placeholder="Haslo do redakcja@zwrotny.pl"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Nadawca widoczny dla odbiorcy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nazwa nadawcy</label>
            <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Zwrotny.pl" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Adres email nadawcy</label>
            <Input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="redakcja@zwrotny.pl" />
          </div>
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Odbiorca zobaczy: <span className="font-mono text-foreground">{fromName} &lt;{fromEmail}&gt;</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Zapisz
        </Button>
        <Button variant="outline" onClick={testConnection} disabled={testing} className="gap-2">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Testuj polaczenie
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'campaigns',   label: 'Kampanie',      icon: <Mail className="w-4 h-4" /> },
  { id: 'subscribers', label: 'Subskrybenci',  icon: <Users className="w-4 h-4" /> },
  { id: 'settings',    label: 'Ustawienia',    icon: <Settings className="w-4 h-4" /> },
] as const

type TabId = typeof TABS[number]['id']

export default function NewsletterPage() {
  const [tab, setTab] = useState<TabId>('campaigns')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <p className="text-muted-foreground text-sm mt-1">Zarzadzaj kampaniami emailowymi i baza subskrybentow Zwrotny.pl</p>
      </div>
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              tab === t.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab === 'campaigns'   && <CampaignsPanel />}
      {tab === 'subscribers' && <SubscribersPanel />}
      {tab === 'settings'    && <SettingsPanel />}
    </div>
  )
}
