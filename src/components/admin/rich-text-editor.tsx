// @ts-nocheck
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { BonusEmbed } from '@/components/admin/tiptap-bonus-embed'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Gift,
  X,
  Upload,
  Loader2,
  FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title,
}: { 
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-2 rounded hover:bg-muted transition-colors disabled:opacity-50',
      isActive && 'bg-muted text-primary'
    )}
  >
    {children}
  </button>
)

// Detect if content is already HTML (has real tags, not just Markdown)
const isHtmlContent = (text: string): boolean => {
  if (!text) return false
  return /<(p|h[1-6]|ul|ol|li|blockquote|strong|em|br|div|span)[\s>]/i.test(text)
}

// Full Markdown → HTML converter (no external deps)
const markdownToHtml = (md: string): string => {
  if (!md) return ''

  // Already HTML — return as-is
  if (isHtmlContent(md)) return md

  const lines = md.split('\n')
  const output: string[] = []
  let inUl = false
  let inOl = false

  const closeList = () => {
    if (inUl) { output.push('</ul>'); inUl = false }
    if (inOl) { output.push('</ol>'); inOl = false }
  }

  const inlineFormat = (line: string): string =>
    line
      // **bold** / __bold__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // *italic* / _italic_
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // `code`
      .replace(/`(.+?)`/g, '<code>$1</code>')

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trimEnd()

    // Blank line
    if (!line.trim()) {
      closeList()
      continue
    }

    // ### h3
    if (/^### (.+)/.test(line)) {
      closeList()
      output.push(`<h3>${inlineFormat(line.replace(/^### /, ''))}</h3>`)
      continue
    }
    // ## h2
    if (/^## (.+)/.test(line)) {
      closeList()
      output.push(`<h2>${inlineFormat(line.replace(/^## /, ''))}</h2>`)
      continue
    }
    // # h1 → h2 (h1 reserved for article title)
    if (/^# (.+)/.test(line)) {
      closeList()
      output.push(`<h2>${inlineFormat(line.replace(/^# /, ''))}</h2>`)
      continue
    }
    // > blockquote
    if (/^> (.+)/.test(line)) {
      closeList()
      output.push(`<blockquote><p>${inlineFormat(line.replace(/^> /, ''))}</p></blockquote>`)
      continue
    }
    // --- horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      closeList()
      output.push('<hr>')
      continue
    }
    // - / * unordered list
    if (/^[-*+] (.+)/.test(line)) {
      if (inOl) { output.push('</ol>'); inOl = false }
      if (!inUl) { output.push('<ul>'); inUl = true }
      output.push(`<li>${inlineFormat(line.replace(/^[-*+] /, ''))}</li>`)
      continue
    }
    // 1. ordered list
    if (/^\d+\. (.+)/.test(line)) {
      if (inUl) { output.push('</ul>'); inUl = false }
      if (!inOl) { output.push('<ol>'); inOl = true }
      output.push(`<li>${inlineFormat(line.replace(/^\d+\. /, ''))}</li>`)
      continue
    }
    // Normal paragraph
    closeList()
    output.push(`<p>${inlineFormat(line)}</p>`)
  }

  closeList()
  return output.join('\n')
}

interface Bonus {
  id: string
  title: string
  thumbnail_url?: string | null
}

interface LibraryDocument {
  id: string
  title: string
  file_url: string
  file_type: string
  file_size_bytes: number | null
  description: string | null
}

export function RichTextEditor({ content, onChange, placeholder = 'Zacznij pisać...' }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false)
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false)
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [loadingBonuses, setLoadingBonuses] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docSearch, setDocSearch] = useState('')

  // Track the last content we programmatically pushed into the editor,
  // so we don't loop. Updated only AFTER we actually call setContent().
  const lastSetContent = useRef<string>('')

  // Convert initial content once — do NOT update lastSetContent here,
  // only inside the useEffect after we actually call editor.commands.setContent.
  const initialContent = markdownToHtml(content)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      BonusEmbed,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose-zwrotny min-h-[400px] focus:outline-none p-6',
      },
    },
  })

  // When the parent sets new content (e.g. after AI generation), push it into Tiptap.
  // Compare against what the editor actually contains — not a stale ref.
  useEffect(() => {
    if (!editor) return
    const incoming = markdownToHtml(content)
    if (!incoming) return
    const current = editor.getHTML()
    // Skip if it's the same as what the editor already shows,
    // OR the same as the last thing WE pushed (to avoid echo-loop from onUpdate).
    if (incoming === current) return
    if (incoming === lastSetContent.current) return
    lastSetContent.current = incoming
    editor.commands.setContent(incoming, false)
  }, [content, editor])

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    if (!file.type.startsWith('image/')) {
      toast.error('Wybierz plik obrazu')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Plik jest za duży (max 10MB)')
      return
    }

    setIsUploadingImage(true)
    
    try {
      const supabase = createClient()
      const timestamp = Date.now()
      const ext = file.name.split('.').pop()
      const filename = `content-${timestamp}.${ext}`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
      setImagePopoverOpen(false)
      toast.success('Obraz dodany!')
    } catch (error) {
      toast.error('Błąd wgrywania obrazu')
    } finally {
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }, [editor])

  const openBonusDialog = useCallback(async () => {
    setBonusDialogOpen(true)
    if (bonuses.length > 0) return
    setLoadingBonuses(true)
    try {
      const r = await fetch('/api/bonuses')
      const d = await r.json()
      setBonuses(d.data ?? [])
    } catch { /* ignore */ } finally {
      setLoadingBonuses(false)
    }
  }, [bonuses.length])

  const insertBonus = useCallback((bonus: Bonus) => {
    if (!editor) return
    editor.chain().focus().insertContent({
      type: 'bonusEmbed',
      attrs: {
        bonusId: bonus.id,
        bonusTitle: bonus.title,
        bonusThumbnail: bonus.thumbnail_url ?? null,
      },
    }).run()
    setBonusDialogOpen(false)
  }, [editor])

  const openDocumentDialog = useCallback(async () => {
    setDocumentDialogOpen(true)
    if (libraryDocs.length > 0) return
    setLoadingDocs(true)
    try {
      const r = await fetch('/api/documents')
      const d = await r.json()
      setLibraryDocs(d.data ?? [])
    } catch { /* ignore */ } finally {
      setLoadingDocs(false)
    }
  }, [libraryDocs.length])

  const insertDocument = useCallback((doc: LibraryDocument) => {
    if (!editor) return
    editor.chain().focus().insertContent(
      `<a href="${doc.file_url}" target="_blank" rel="noopener noreferrer">${doc.title}</a>`
    ).run()
    setDocumentDialogOpen(false)
  }, [editor])

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return
    
    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    setLinkUrl('')
    setLinkPopoverOpen(false)
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl('')
    setImagePopoverOpen(false)
  }, [editor, imageUrl])

  if (!editor) return null

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar — sticky so it stays visible while scrolling content */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        {/* Undo/Redo */}
        <MenuButton 
          onClick={() => editor.chain().focus().undo().run()} 
          disabled={!editor.can().undo()}
          title="Cofnij"
        >
          <Undo className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().redo().run()} 
          disabled={!editor.can().redo()}
          title="Ponów"
        >
          <Redo className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text formatting */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          isActive={editor.isActive('bold')}
          title="Pogrubienie (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          isActive={editor.isActive('italic')}
          title="Kursywa (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          isActive={editor.isActive('underline')}
          title="Podkreślenie (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          isActive={editor.isActive('strike')}
          title="Przekreślenie"
        >
          <Strikethrough className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleCode().run()} 
          isActive={editor.isActive('code')}
          title="Kod"
        >
          <Code className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          isActive={editor.isActive('heading', { level: 1 })}
          title="Nagłówek 1"
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor.isActive('heading', { level: 2 })}
          title="Nagłówek 2"
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          isActive={editor.isActive('heading', { level: 3 })}
          title="Nagłówek 3"
        >
          <Heading3 className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          isActive={editor.isActive('bulletList')}
          title="Lista punktowana"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          isActive={editor.isActive('orderedList')}
          title="Lista numerowana"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          isActive={editor.isActive('blockquote')}
          title="Cytat"
        >
          <Quote className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linia pozioma"
        >
          <Minus className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text align */}
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('left').run()} 
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Wyrównaj do lewej"
        >
          <AlignLeft className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('center').run()} 
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Wyśrodkuj"
        >
          <AlignCenter className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('right').run()} 
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Wyrównaj do prawej"
        >
          <AlignRight className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Wyjustuj"
        >
          <AlignJustify className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Highlight */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} 
          isActive={editor.isActive('highlight')}
          title="Zaznaczenie"
        >
          <Highlighter className="h-4 w-4" />
        </MenuButton>

        {/* Link */}
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'p-2 rounded hover:bg-muted transition-colors',
                editor.isActive('link') && 'bg-muted text-primary'
              )}
              title="Dodaj link"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label>URL linku</Label>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLink()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addLink}>Dodaj</Button>
                {editor.isActive('link') && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run()
                      setLinkPopoverOpen(false)
                    }}
                  >
                    Usuń link
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Image */}
        <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="p-2 rounded hover:bg-muted transition-colors"
              title="Dodaj obraz"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Wgraj z komputera</Label>
                <label className={cn(
                  'flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md font-medium text-sm transition-colors cursor-pointer border-2 border-dashed',
                  isUploadingImage 
                    ? 'bg-muted text-muted-foreground pointer-events-none border-muted' 
                    : 'border-border hover:border-primary hover:bg-muted/50'
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wgrywanie...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Wybierz plik
                    </>
                  )}
                </label>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-popover px-2 text-muted-foreground">lub</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL obrazu</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addImage()}
                />
                <Button size="sm" onClick={addImage} disabled={!imageUrl}>
                  Dodaj z URL
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {/* Bonus embed */}
        <Separator orientation="vertical" className="mx-1 h-6" />
        <MenuButton
          onClick={openBonusDialog}
          title="Wstaw bonus"
        >
          <Gift className="h-4 w-4" />
        </MenuButton>
        {/* Document link */}
        <MenuButton
          onClick={openDocumentDialog}
          title="Wstaw link do dokumentu"
        >
          <FileText className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Editor content — scrollable area so toolbar stays sticky */}
      <div className="overflow-y-auto" style={{ maxHeight: '60vh', minHeight: '320px' }}>
        <EditorContent editor={editor} />
      </div>

      {/* Bonus picker dialog */}
      <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              Wybierz bonus do wstawienia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto py-1 pr-1">
            {loadingBonuses && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Wczytywanie...
              </div>
            )}
            {!loadingBonuses && bonuses.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Brak bonusow. Dodaj je w panelu CMS.
              </p>
            )}
            {bonuses.map(bonus => (
              <button
                key={bonus.id}
                type="button"
                onClick={() => insertBonus(bonus)}
                className="w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                {bonus.thumbnail_url && (
                  <img
                    src={`/api/bonuses/thumbnail?pathname=${encodeURIComponent(bonus.thumbnail_url)}`}
                    alt={bonus.title}
                    className="h-12 w-9 object-cover rounded shadow shrink-0"
                  />
                )}
                <span className="text-sm font-medium text-foreground">{bonus.title}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document picker dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Wstaw link do dokumentu
            </DialogTitle>
          </DialogHeader>
          <div className="pb-1">
            <input
              type="text"
              placeholder="Szukaj dokumentów..."
              value={docSearch}
              onChange={e => setDocSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md mb-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto py-1 pr-1">
            {loadingDocs && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Wczytywanie...
              </div>
            )}
            {!loadingDocs && libraryDocs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Brak dokumentów. Dodaj je w Bibliotece dokumentów.
              </p>
            )}
            {libraryDocs
              .filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase()))
              .map(doc => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => insertDocument(doc)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                    )}
                  </div>
                </button>
              ))
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
