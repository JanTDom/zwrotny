'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

// The card rendered inside the editor for visual preview
function BonusEmbedView({ node }: { node: { attrs: { bonusId: string; bonusTitle: string; bonusThumbnail?: string } } }) {
  const { bonusId, bonusTitle, bonusThumbnail } = node.attrs
  return (
    <NodeViewWrapper
      contentEditable={false}
      data-drag-handle
      className="my-4 not-prose"
    >
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 select-none">
        {bonusThumbnail && (
          <img
            src={bonusThumbnail}
            alt={bonusTitle}
            className="h-14 w-10 object-cover rounded shadow shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70 mb-0.5">Bonus</p>
          <p className="text-sm font-medium text-foreground truncate">{bonusTitle}</p>
        </div>
        <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          Podgląd w artykule
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const BonusEmbed = Node.create({
  name: 'bonusEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      bonusId: { default: null, parseHTML: el => el.getAttribute('data-bonus-id') },
      bonusTitle: { default: '', parseHTML: el => el.getAttribute('data-bonus-title') ?? '' },
      bonusThumbnail: { default: null, parseHTML: el => el.getAttribute('data-bonus-thumbnail') || null },
    }
  },

  parseHTML() {
    return [{ tag: 'div.bonus-embed[data-bonus-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-bonus-id': HTMLAttributes.bonusId,
          'data-bonus-title': HTMLAttributes.bonusTitle,
          'data-bonus-thumbnail': HTMLAttributes.bonusThumbnail ?? '',
          class: 'bonus-embed',
        },
      ),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(BonusEmbedView)
  },
})
