'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Upload, FileText, Trash2, Loader2, Eye, Check, X, Pencil, GripVertical } from 'lucide-react'
import { PdfCanvasThumbnail } from '@/components/pdf-canvas-thumbnail'

interface Bonus {
  id: string
  title: string
  pdf_url: string
  pdf_pathname: string
  thumbnail_url?: string | null
  is_active: boolean
  order: number
}

export default function BonusyPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [inputKey, setInputKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragItemId = useRef<string | null>(null)

  useEffect(() => { loadBonuses() }, [])

  async function loadBonuses() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/bonuses?all=1')
      const json = await res.json()
      setBonuses(json.data || [])
    } catch {
      setBonuses([])
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileSelect(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Wybierz plik w formacie PDF.')
      setInputKey(k => k + 1)
      return
    }
    setSelectedFile(file)
    setUploadError('')
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim())
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setUploadError('')

    try {
      const title = newTitle.trim() || selectedFile.name.replace(/\.pdf$/i, '')

      // Step 1: get signed upload URL (bypasses Vercel 4.5 MB body limit)
      const tokenRes = await fetch(
        `/api/upload-token?bucket=bonuses&filename=${encodeURIComponent(selectedFile.name)}&contentType=application/pdf`
      )
      const token = await tokenRes.json()
      if (!tokenRes.ok) throw new Error(token.error || 'Blad pobierania tokenu')

      // Step 2: upload directly from browser to Supabase Storage
      const uploadRes = await fetch(token.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: selectedFile,
      })
      if (!uploadRes.ok) throw new Error(`Upload nieudany: ${uploadRes.status}`)

      // Step 3: register in database via JSON (no file, no size limit)
      const regRes = await fetch('/api/bonuses/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, pathname: token.pathname, publicUrl: token.publicUrl }),
      })
      const regJson = await regRes.json()
      if (!regRes.ok) throw new Error(regJson.error || 'Blad zapisu w bazie')

      setSelectedFile(null)
      setNewTitle('')
      setInputKey(k => k + 1)
      await loadBonuses()
    } catch (e: any) {
      setUploadError(e?.message || 'Blad uploadu. Sprobuj ponownie.')
    } finally {
      setUploading(false)
    }
  }

  async function handleToggleActive(bonus: Bonus) {
    await fetch('/api/bonuses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bonus.id, title: bonus.title, is_active: !bonus.is_active, order: bonus.order }),
    })
    await loadBonuses()
  }

  async function handleDelete(id: string) {
    if (!confirm('Usunac ten bonus?')) return
    await fetch(`/api/bonuses?id=${id}`, { method: 'DELETE' })
    await loadBonuses()
  }

  async function handleSaveTitle(bonus: Bonus) {
    await fetch('/api/bonuses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bonus.id, title: editingTitle, is_active: bonus.is_active, order: bonus.order }),
    })
    setEditingId(null)
    await loadBonuses()
  }

  function handleDragStart(id: string) { dragItemId.current = id }

  function handleDragEnter(id: string) {
    if (dragItemId.current === id) return
    setBonuses(prev => {
      const items = [...prev]
      const fromIdx = items.findIndex(b => b.id === dragItemId.current)
      const toIdx = items.findIndex(b => b.id === id)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [moved] = items.splice(fromIdx, 1)
      items.splice(toIdx, 0, moved)
      return items
    })
  }

  async function handleThumbnailReady(bonusId: string, canvas: HTMLCanvasElement) {
    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        const filename = `thumbnail-${bonusId}.jpg`
        const uploadRes = await fetch(`/api/upload-token?bucket=bonuses&filename=${encodeURIComponent(filename)}&contentType=image/jpeg`)
        if (!uploadRes.ok) return
        const token = await uploadRes.json()
        if (!token.signedUrl) return

        // Supabase signed upload URL expects PUT with file data
        const putRes = await fetch(token.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
          body: blob,
        })
        if (!putRes.ok) return

        // Save thumbnail_url (public URL) to DB
        const saveRes = await fetch('/api/bonuses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bonusId, thumbnail_url: token.publicUrl }),
        })
        if (!saveRes.ok) return

        setBonuses(prev => prev.map(b => b.id === bonusId ? { ...b, thumbnail_url: token.publicUrl } : b))
      } catch {}
    }, 'image/jpeg', 0.85)
  }

  async function handleDragEnd() {
    dragItemId.current = null
    setBonuses(current => {
      Promise.all(
        current.map((b, idx) =>
          fetch('/api/bonuses', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: b.id, title: b.title, is_active: b.is_active, order: idx }),
          })
        )
      )
      return current
    })
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Bonusy PDF</h1>
        <p className="text-muted-foreground text-sm mt-1">Pliki do pobrania widoczne na stronie glownej. Przeciagnij karty aby zmienic kolejnosc.</p>
      </div>

      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm font-semibold">Dodaj nowy plik PDF</p>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tytul (widoczny nad miniatura)</label>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="np. Regulamin systemu kaucyjnego 2025"
              className="bg-background max-w-md"
              disabled={uploading}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-background rounded border max-w-md">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          )}

          {uploading && (
            <div className="max-w-md space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse w-3/5" />
              </div>
              <p className="text-xs text-muted-foreground">Wgrywanie pliku PDF...</p>
            </div>
          )}

          <div className="flex gap-2">
            {!selectedFile ? (
              <label htmlFor="pdf-upload-input" className="cursor-pointer">
                <span className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  Wybierz plik PDF
                </span>
              </label>
            ) : (
              <>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wgrywanie...</>
                    : <><Upload className="w-4 h-4 mr-2" />Wgraj PDF</>
                  }
                </Button>
                <Button variant="outline" disabled={uploading}
                  onClick={() => { setSelectedFile(null); setNewTitle(''); setInputKey(k => k + 1) }}>
                  Anuluj
                </Button>
              </>
            )}
          </div>

          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

          <input
            key={inputKey}
            id="pdf-upload-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            tabIndex={-1}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFileSelect(f)
            }}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : bonuses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Brak bonusow. Wgraj pierwszy plik PDF powyzej.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Przeciagnij karty aby zmienic kolejnosc wyswietlania na stronie.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {bonuses.map((bonus, idx) => {
              const isSupabase = bonus.pdf_url.includes('supabase')
              const pdfUrl = bonus.pdf_url

              return (
                <div
                  key={bonus.id}
                  draggable
                  onDragStart={() => handleDragStart(bonus.id)}
                  onDragEnter={() => handleDragEnter(bonus.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={`flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden cursor-grab active:cursor-grabbing transition-all select-none ${!bonus.is_active ? 'opacity-40' : ''}`}
                >
                  <div className="relative w-full aspect-[3/4] overflow-hidden select-none">
                    {isSupabase ? (
                      <PdfCanvasThumbnail
                        url={pdfUrl}
                        className="w-full h-full"
                        onReady={!bonus.thumbnail_url ? (canvas) => handleThumbnailReady(bonus.id, canvas) : undefined}
                      />
                    ) : (
                      // Old blob file — show placeholder with label
                      <div className="w-full h-full bg-muted/20 flex flex-col items-center justify-center gap-1.5">
                        <FileText className="w-8 h-8 text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/60 text-center px-2">Stary plik — wgraj ponownie</span>
                      </div>
                    )}
                    <div className="absolute inset-0 z-10" style={{ touchAction: 'none', pointerEvents: 'all', cursor: 'grab' }} />
                    <div className="absolute top-1.5 left-1.5 z-20 bg-black/60 text-white text-xs font-bold rounded px-1.5 py-0.5 leading-none">
                      {idx + 1}
                    </div>
                    <div className="absolute top-1.5 right-1.5 z-20 bg-black/40 text-white rounded p-1">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1.5">
                    {editingId === bonus.id ? (
                      <div className="flex gap-1">
                        <Input
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          className="h-7 text-xs flex-1"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveTitle(bonus)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleSaveTitle(bonus)}>
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-xs font-medium text-left hover:text-primary flex items-start gap-1 group w-full"
                        onClick={() => { setEditingId(bonus.id); setEditingTitle(bonus.title) }}
                      >
                        <span className="flex-1 line-clamp-2 leading-tight">{bonus.title}</span>
                        <Pencil className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 mt-0.5" />
                      </button>
                    )}

                    <div className="flex items-center justify-between">
                      <Switch
                        checked={bonus.is_active}
                        onCheckedChange={() => handleToggleActive(bonus)}
                        className="scale-75 origin-left"
                      />
                      <div className="flex gap-0.5">
                        {isSupabase && (
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="h-6 w-6">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </a>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(bonus.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
