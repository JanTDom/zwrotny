'use client'

import { useMemo } from 'react'
import { InlineBonus } from '@/components/public/inline-bonus'

interface ArticleContentProps {
  content: string
}

// Splits HTML content around bonus-embed divs so we can render them as React components
export function ArticleContent({ content }: ArticleContentProps) {
  const parts = useMemo(() => {
    if (!content) return []
    // Split on <div ... data-bonus-id="..." ...>...</div>
    const regex = /<div[^>]+class="bonus-embed"[^>]*data-bonus-id="([^"]*)"[^>]*data-bonus-title="([^"]*)"[^>]*data-bonus-thumbnail="([^"]*)"[^>]*><\/div>|<div[^>]+data-bonus-id="([^"]*)"[^>]*data-bonus-title="([^"]*)"[^>]*data-bonus-thumbnail="([^"]*)"[^>]*class="bonus-embed"[^>]*><\/div>/g

    const result: Array<{ type: 'html'; html: string } | { type: 'bonus'; id: string; title: string; thumbnail: string }> = []
    let last = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      if (match.index > last) {
        result.push({ type: 'html', html: content.slice(last, match.index) })
      }
      // Groups 1-3 or 4-6 depending on attribute order
      const id = match[1] || match[4] || ''
      const title = decodeHTMLEntities(match[2] || match[5] || '')
      const thumbnail = match[3] || match[6] || ''
      result.push({ type: 'bonus', id, title, thumbnail })
      last = match.index + match[0].length
    }

    if (last < content.length) {
      result.push({ type: 'html', html: content.slice(last) })
    }

    return result.length > 0 ? result : [{ type: 'html' as const, html: content }]
  }, [content])

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'bonus') {
          return (
            <InlineBonus
              key={i}
              bonusId={part.id}
              bonusTitle={part.title}
              bonusThumbnail={part.thumbnail || undefined}
            />
          )
        }
        return (
          <div
            key={i}
            className="prose-zwrotny"
            dangerouslySetInnerHTML={{
              __html: part.html.replace(/\n/g, '<br/>').replace(/#{1,6}\s/g, ''),
            }}
          />
        )
      })}
    </>
  )
}

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}
