'use client'

import { useState } from 'react'
import { Download, Eye, Copy, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PdfCanvasThumbnail } from '@/components/pdf-canvas-thumbnail'

interface Bonus {
  id: string
  title: string
  description?: string | null
  pdf_url: string
  thumbnail_url?: string | null
}

export default function BonusLandingClient({ bonus }: { bonus: Bonus }) {
  const [copied, setCopied] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://zwrotny.pl')
  const shareUrl = `${baseUrl}/bonus/${bonus.id}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Wróc na stronę główną
        </Link>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {/* Thumbnail — use saved image or render first page of PDF */}
          <div className="bg-muted flex items-center justify-center p-6 min-h-[260px]">
            {bonus.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bonus.thumbnail_url}
                alt={bonus.title}
                className="max-h-80 w-auto rounded-lg shadow-md object-contain"
              />
            ) : (
              <PdfCanvasThumbnail
                url={bonus.pdf_url}
                className="rounded-lg shadow-md"
                style={{ maxHeight: '320px', width: '100%', maxWidth: '240px' }}
              />
            )}
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                Darmowy materiał
              </p>
              <h1 className="text-xl font-bold text-foreground">{bonus.title}</h1>
              {bonus.description && (
                <p className="mt-2 text-sm text-muted-foreground">{bonus.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`/api/bonuses/download?url=${encodeURIComponent(bonus.pdf_url)}&filename=${encodeURIComponent(bonus.title + '.pdf')}`}
                download={`${bonus.title}.pdf`}
                className="flex-1"
              >
                <Button className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Pobierz PDF
                </Button>
              </a>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setViewerOpen(true)}
              >
                <Eye className="w-4 h-4" />
                Podgląd
              </Button>
            </div>

            {/* Copy link for Facebook sharing */}
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                Skopiuj link i wklej na Facebooka — miniatura pojawi się automatycznie
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs bg-background border rounded-md px-2 py-1.5 text-foreground font-mono truncate focus:outline-none"
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  variant={copied ? 'default' : 'outline'}
                  onClick={handleCopy}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Skopiowano!' : 'Kopiuj'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF viewer */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/80"
          onClick={e => { if (e.target === e.currentTarget) setViewerOpen(false) }}
        >
          <div className="flex items-center justify-between bg-background px-4 py-2 border-b shrink-0">
            <span className="text-sm font-semibold truncate">{bonus.title}</span>
            <button
              onClick={() => setViewerOpen(false)}
              className="p-1 hover:bg-accent rounded-sm transition-colors text-sm"
            >
              Zamknij
            </button>
          </div>
          <iframe
            src={`${bonus.pdf_url}#toolbar=0&view=FitH`}
            className="flex-1 w-full border-0"
            title={bonus.title}
          />
        </div>
      )}
    </main>
  )
}
