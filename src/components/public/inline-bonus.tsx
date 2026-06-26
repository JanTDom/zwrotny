'use client'

import { useState, useEffect } from 'react'
import { Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Bonus {
  id: string
  title: string
  pdf_url: string
  thumbnail_url?: string | null
}

interface InlineBonusProps {
  bonusId: string
  bonusTitle: string
  bonusThumbnail?: string
}

export function InlineBonus({ bonusId, bonusTitle, bonusThumbnail }: InlineBonusProps) {
  const [bonus, setBonus] = useState<Bonus | null>(null)
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(bonusThumbnail || null)

  useEffect(() => {
    fetch(`/api/bonuses/${bonusId}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setBonus(d.data)
          if (d.data.thumbnail_url && !bonusThumbnail) {
            setThumbnailSrc(`/api/bonuses/thumbnail?pathname=${encodeURIComponent(d.data.thumbnail_url)}`)
          }
        }
      })
      .catch(() => {})
  }, [bonusId, bonusThumbnail])

  return (
    <div className="not-prose my-6 rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden flex flex-col sm:flex-row items-stretch shadow-sm">
      {thumbnailSrc && (
        <div className="sm:w-32 w-full shrink-0">
          <img
            src={thumbnailSrc}
            alt={bonusTitle}
            className="w-full h-40 sm:h-full object-cover object-top"
          />
        </div>
      )}
      <div className="flex flex-col justify-center gap-3 px-5 py-4 flex-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary/60 mb-1">Bezplatny bonus</p>
          <p className="text-base font-semibold text-foreground leading-snug">{bonusTitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={() => {
              if (bonus?.pdf_url) window.open(bonus.pdf_url, '_blank')
            }}
          >
            <Eye className="w-3.5 h-3.5" />
            Podglad
          </Button>
          {bonus?.pdf_url && (
            <Button size="sm" className="gap-1.5 h-8 text-xs" asChild>
              <a
                href={`/api/bonuses/download?url=${encodeURIComponent(bonus.pdf_url)}&filename=${encodeURIComponent(bonusTitle + '.pdf')}`}
                download={`${bonusTitle}.pdf`}
              >
                <Download className="w-3.5 h-3.5" />
                Pobierz PDF
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
