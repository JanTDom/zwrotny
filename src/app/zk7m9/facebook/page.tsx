'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Facebook, Link2, Unlink, CheckCircle2, AlertCircle,
  RefreshCw, ExternalLink, Clock, Image as ImageIcon,
  ChevronDown, Send, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface FbStatus {
  connected: boolean
  pageName: string | null
  pageId: string | null
  connectedAt: string | null
  expiresAt: string | null
  logs: FbLog[]
}

interface FbLog {
  id: string
  post_title: string
  post_url: string | null
  fb_post_id: string | null
  message: string
  image_url: string | null
  status: 'published' | 'failed' | 'pending'
  error_message: string | null
  published_at: string | null
  created_at: string
}

interface AvailablePage {
  id: string
  name: string
  token: string
}

function FacebookPageContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<FbStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [availablePages, setAvailablePages] = useState<AvailablePage[]>([])
  const [selectingPage, setSelectingPage] = useState(false)

  // Test post form
  const [testMessage, setTestMessage] = useState('')
  const [testImageUrl, setTestImageUrl] = useState('')
  const [testPostUrl, setTestPostUrl] = useState('')
  const [publishing, setPublishing] = useState(false)

  const loadStatus = useCallback(async () => {
    const r = await fetch('/api/fb/publish')
    setStatus(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStatus()
    // Handle OAuth callback params
    const error = searchParams.get('error')
    const connected = searchParams.get('connected')
    const pagesParam = searchParams.get('pages')

    if (error) {
      const msg: Record<string, string> = {
        no_pages: 'Brak stron na tym koncie Facebook. Upewnij sie ze jestes administratorem strony.',
        access_denied: 'Odmowiono dostepu. Musisz zaakceptowac uprawnienia.',
      }
      toast.error(msg[error] ?? `Blad polaczenia: ${error}`)
    }
    if (connected) {
      toast.success('Polaczono z Facebookiem.')
      if (pagesParam) {
        try {
          setAvailablePages(JSON.parse(decodeURIComponent(pagesParam)))
        } catch { /* ignore */ }
      }
    }
  }, [loadStatus, searchParams])

  async function handleSelectPage(page: AvailablePage) {
    setSelectingPage(true)
    try {
      await fetch('/api/fb/select-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: page.id, pageName: page.name, pageToken: page.token }),
      })
      toast.success(`Wybrano strone: ${page.name}`)
      setAvailablePages([])
      await loadStatus()
    } finally {
      setSelectingPage(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Odlaczone zostanie konto Facebook. Kontynuowac?')) return
    setDisconnecting(true)
    await fetch('/api/fb/disconnect', { method: 'POST' })
    toast.success('Odlaczono konto Facebook.')
    await loadStatus()
    setDisconnecting(false)
  }

  async function handleTestPublish() {
    if (!testMessage.trim()) return
    setPublishing(true)
    try {
      const r = await fetch('/api/fb/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          imageUrl: testImageUrl || undefined,
          postUrl: testPostUrl || undefined,
          postTitle: 'Test z CMS',
        }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success('Opublikowano na Facebooku!')
      setTestMessage('')
      setTestImageUrl('')
      setTestPostUrl('')
      await loadStatus()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Blad publikacji')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Ladowanie...
      </div>
    )
  }

  const isConnected = status?.connected && !!status.pageName
  const expiresAt = status?.expiresAt ? new Date(status.expiresAt) : null
  const daysLeft = expiresAt ? Math.round((expiresAt.getTime() - Date.now()) / 86400000) : null

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Facebook className="w-6 h-6 text-[#1877F2]" />
          Facebook
        </h1>
        <p className="text-muted-foreground mt-1">
          Polacz strone Facebook i publikuj artykuly bezposrednio z CMS.
        </p>
      </div>

      {/* Connection card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Polaczenie z Facebook</CardTitle>
          <CardDescription>
            Wymagana aplikacja Facebook z uprawnieniami{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">pages_manage_posts</code>.{' '}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Stworz aplikacje na developers.facebook.com
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#1877F2]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{status.pageName}</p>
                  <p className="text-xs text-muted-foreground">
                    ID strony: {status.pageId}
                    {daysLeft !== null && (
                      <span className={cn(
                        'ml-2',
                        daysLeft < 7 ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        · token wygasa za {daysLeft} dni
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/api/fb/connect'}
                  className="gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Odswierz token
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Odlacz
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Nie polaczono z zadna strona Facebook.
              </div>
              <Button
                onClick={() => window.location.href = '/api/fb/connect'}
                className="gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white"
              >
                <Facebook className="w-4 h-4" />
                Polacz z Facebookiem
              </Button>
            </div>
          )}

          {/* Page selector after OAuth */}
          {availablePages.length > 1 && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-sm font-medium">Wybierz strone do publikacji:</p>
              <div className="space-y-1.5">
                {availablePages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => handleSelectPage(page)}
                    disabled={selectingPage}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm',
                      'hover:border-primary hover:bg-primary/5 transition-colors',
                      status?.pageId === page.id && 'border-primary bg-primary/5 font-medium'
                    )}
                  >
                    <span>{page.name}</span>
                    {status?.pageId === page.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    {status?.pageId !== page.id && <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test publish form */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4" />
              Testowy post
            </CardTitle>
            <CardDescription>
              Opublikuj testowy wpis na stronie <strong>{status.pageName}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tresc wpisu</Label>
              <Textarea
                placeholder="Napisz cos o systemie kaucyjnym..."
                rows={4}
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{testMessage.length} / 63206</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Link do artykulu (opcjonalnie)
                </Label>
                <Input
                  placeholder="https://zwrotny.pl/artykul/..."
                  value={testPostUrl}
                  onChange={e => setTestPostUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  URL zdjecia (opcjonalnie)
                </Label>
                <Input
                  placeholder="https://..."
                  value={testImageUrl}
                  onChange={e => setTestImageUrl(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleTestPublish}
              disabled={!testMessage.trim() || publishing}
              className="gap-2"
            >
              {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {publishing ? 'Publikowanie...' : 'Opublikuj na Facebooku'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Publish history */}
      {(status?.logs?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historia publikacji
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {status!.logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={cn(
                    'mt-0.5 w-2 h-2 rounded-full shrink-0',
                    log.status === 'published' ? 'bg-green-500' :
                    log.status === 'failed' ? 'bg-destructive' : 'bg-amber-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.post_title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{log.message}</p>
                    {log.error_message && (
                      <p className="text-xs text-destructive mt-0.5">{log.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        log.status === 'published' ? 'border-green-300 text-green-700' :
                        log.status === 'failed' ? 'border-destructive text-destructive' :
                        'border-amber-300 text-amber-700'
                      )}
                    >
                      {log.status === 'published' ? 'Opublikowany' : log.status === 'failed' ? 'Blad' : 'Oczekuje'}
                    </Badge>
                    {log.fb_post_id && (
                      <a
                        href={`https://www.facebook.com/${log.fb_post_id.replace('_', '/posts/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup instructions */}
      {!isConnected && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Jak skonfigurowac integracje?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="space-y-2 list-decimal list-inside">
              <li>
                Wejdz na{' '}
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  developers.facebook.com/apps
                </a>{' '}
                i kliknij <strong>Utwórz aplikacje</strong> (typ: Biznes).
              </li>
              <li>
                W ustawieniach aplikacji &rarr; <strong>Podstawowe</strong>, skopiuj{' '}
                <code className="bg-muted px-1 rounded">App ID</code> i{' '}
                <code className="bg-muted px-1 rounded">App Secret</code>.
              </li>
              <li>
                Dodaj produkty: <strong>Facebook Login</strong> i{' '}
                <strong>Pages API</strong>.
              </li>
              <li>
                W Facebook Login &rarr; Ustawienia, dodaj do <em>Dozwolone URI przekierowania OAuth</em>:
                <code className="block bg-muted px-2 py-1 rounded mt-1 text-xs break-all">
                  {process.env.NEXT_PUBLIC_SITE_URL ?? 'https://twoja-domena.pl'}/api/fb/callback
                </code>
              </li>
              <li>
                W ustawieniach projektu (ikona kola zebatego w prawym gornym rogu) &rarr;{' '}
                <strong>Vars</strong>, dodaj zmienne srodowiskowe:
                <ul className="mt-1 ml-4 space-y-1">
                  <li><code className="bg-muted px-1 rounded text-xs">FB_APP_ID</code> — Twoj App ID</li>
                  <li><code className="bg-muted px-1 rounded text-xs">FB_APP_SECRET</code> — Twoj App Secret</li>
                </ul>
              </li>
              <li>
                Kliknij przycisk <strong>Polacz z Facebookiem</strong> powyzej i zaloguj sie na konto
                z prawami administratora strony.
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function FacebookPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Ladowanie...</div>}>
      <FacebookPageContent />
    </Suspense>
  )
}
