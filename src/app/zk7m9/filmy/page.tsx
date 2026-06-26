'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Upload, Video, Trash2, Loader2, Check, X, Pencil, GripVertical, Play } from 'lucide-react'

interface Film {
  id: string
  title: string
  video_url: string
  video_pathname: string
  thumbnail_url: string | null
  is_active: boolean
  order: number
}

// Generate a JPEG thumbnail from a local video File using canvas.
// Works reliably because the file is local — no CORS whatsoever.
async function generateThumbnailBlob(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url

    const cleanup = () => URL.revokeObjectURL(url)

    const capture = () => {
      if (!video.videoWidth || !video.videoHeight) { cleanup(); resolve(null); return }
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { cleanup(); resolve(null); return }
      ctx.drawImage(video, 0, 0)
      canvas.toBlob((blob) => { cleanup(); resolve(blob) }, 'image/jpeg', 0.85)
    }

    video.addEventListener('seeked', capture, { once: true })
    video.addEventListener('loadeddata', () => { video.currentTime = 0.5 }, { once: true })
    video.addEventListener('error', () => { cleanup(); resolve(null) }, { once: true })

    // Fallback timeout in case events don't fire
    setTimeout(() => { capture() }, 3000)
  })
}

export default function FilmyPage() {
  const [filmy, setFilmy] = useState<Film[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [inputKey, setInputKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dragItemId = useRef<string | null>(null)

  useEffect(() => { loadFilmy() }, [])

  async function loadFilmy() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/filmy?all=1')
      const json = await res.json()
      setFilmy(json.data || [])
    } catch {
      setFilmy([])
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileSelect(file: File) {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|mov|webm)$/i)) {
      setUploadError('Wybierz plik wideo (MP4, MOV, WEBM).')
      setInputKey(k => k + 1)
      return
    }
    setSelectedFile(file)
    setUploadError('')
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^.]+$/i, '').replace(/[-_]/g, ' ').trim())
    }
    // Generate thumbnail immediately from local file — no CORS issues
    generateThumbnailBlob(file).then(blob => setThumbnailBlob(blob))
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setUploadError('')

    try {
      const title = newTitle.trim() || selectedFile.name.replace(/\.[^.]+$/i, '')
      const contentType = selectedFile.type.startsWith('video/') ? selectedFile.type : 'video/mp4'

      // Step 1: get signed upload URL (bypasses Vercel 4.5 MB body limit)
      const tokenRes = await fetch(
        `/api/upload-token?bucket=videos&filename=${encodeURIComponent(selectedFile.name)}&contentType=${encodeURIComponent(contentType)}`
      )
      const token = await tokenRes.json()
      if (!tokenRes.ok) throw new Error(token.error || 'Blad pobierania tokenu')

      // Step 2: upload directly from browser to Supabase Storage
      // mode: 'cors' required for cross-origin PUT to Supabase
      const uploadRes = await fetch(token.signedUrl, {
        method: 'PUT',
        mode: 'cors',
        headers: { 'Content-Type': contentType },
        body: selectedFile,
      })
      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => '')
        throw new Error(`Upload nieudany: ${uploadRes.status} ${errText}`.trim())
      }

      // Step 3: upload thumbnail if available
      let thumbnailPublicUrl: string | null = null
      if (thumbnailBlob) {
        const thumbTokenRes = await fetch(
          `/api/upload-token?bucket=images&filename=thumb-${Date.now()}.jpg&contentType=image/jpeg`
        )
        if (thumbTokenRes.ok) {
          const thumbToken = await thumbTokenRes.json()
          const thumbUpload = await fetch(thumbToken.signedUrl, {
            method: 'PUT',
            mode: 'cors',
            headers: { 'Content-Type': 'image/jpeg' },
            body: thumbnailBlob,
          })
          if (thumbUpload.ok) thumbnailPublicUrl = thumbToken.publicUrl
        }
      }

      // Step 4: register in database via JSON (no file, no size limit)
      const regRes = await fetch('/api/filmy/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, pathname: token.pathname, publicUrl: token.publicUrl, thumbnailUrl: thumbnailPublicUrl }),
      })
      const regJson = await regRes.json()
      if (!regRes.ok) throw new Error(regJson.error || 'Blad zapisu w bazie')

      setSelectedFile(null)
      setThumbnailBlob(null)
      setNewTitle('')
      setInputKey(k => k + 1)
      await loadFilmy()
    } catch (e: any) {
      setUploadError(e?.message || 'Blad uploadu. Sprobuj ponownie.')
    } finally {
      setUploading(false)
    }
  }

  async function handleToggleActive(film: Film) {
    await fetch('/api/filmy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: film.id, title: film.title, is_active: !film.is_active, order: film.order }),
    })
    await loadFilmy()
  }

  async function handleDelete(id: string) {
    if (!confirm('Usunąć ten film?')) return
    await fetch(`/api/filmy?id=${id}`, { method: 'DELETE' })
    await loadFilmy()
  }

  async function handleSaveTitle(film: Film) {
    await fetch('/api/filmy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: film.id, title: editingTitle, is_active: film.is_active, order: film.order }),
    })
    setEditingId(null)
    await loadFilmy()
  }

  function handleDragStart(id: string) { dragItemId.current = id }

  function handleDragEnter(id: string) {
    if (dragItemId.current === id) return
    setFilmy(prev => {
      const items = [...prev]
      const fromIdx = items.findIndex(f => f.id === dragItemId.current)
      const toIdx = items.findIndex(f => f.id === id)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [moved] = items.splice(fromIdx, 1)
      items.splice(toIdx, 0, moved)
      return items
    })
  }

  async function handleDragEnd() {
    dragItemId.current = null
    setFilmy(current => {
      Promise.all(
        current.map((f, idx) =>
          fetch('/api/filmy', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: f.id, title: f.title, is_active: f.is_active, order: idx }),
          })
        )
      )
      return current
    })
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Filmy</h1>
        <p className="text-muted-foreground text-sm mt-1">Pliki wideo MP4 (9:16) widoczne na stronie głównej. Przeciągnij karty aby zmienic kolejnosc.</p>
      </div>

      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm font-semibold">Dodaj nowy film</p>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tytuł (widoczny pod miniaturą)</label>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="np. Jak działa system kaucyjny?"
              className="bg-background max-w-md"
              disabled={uploading}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-background rounded border max-w-md">
              <Video className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          )}

          {uploading && (
            <div className="max-w-md space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-muted-foreground">Wgrywanie do Supabase Storage... (duze pliki moga chwile potrwac)</p>
            </div>
          )}

          <div className="flex gap-2">
            {!selectedFile ? (
              <label htmlFor="video-upload-input" className="cursor-pointer">
                <span className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  Wybierz film MP4
                </span>
              </label>
            ) : (
              <>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wgrywanie...</>
                    : <><Upload className="w-4 h-4 mr-2" />Wgraj film</>
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
            id="video-upload-input"
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
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
      ) : filmy.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Brak filmów. Wgraj pierwszy plik MP4 powyżej.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Przeciągnij karty aby zmienic kolejnosc wyswietlania na stronie.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filmy.map((film, idx) => {
              // New Supabase Storage videos: video_url is public CDN URL — use directly
              // Old Blob videos: video_url is private (suspended) — video will show black (expected)
              const videoSrc = film.video_url
              return (
                <div
                  key={film.id}
                  draggable
                  onDragStart={() => handleDragStart(film.id)}
                  onDragEnter={() => handleDragEnter(film.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={`flex flex-col rounded-xl border bg-black shadow-sm overflow-hidden cursor-grab active:cursor-grabbing transition-all select-none ${!film.is_active ? 'opacity-40' : ''}`}
                >
                  <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: '9/16' }}>
                    {film.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={film.thumbnail_url}
                        alt={film.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                        <Video className="w-8 h-8 text-neutral-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FF6B2C]/80">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs font-bold rounded px-1.5 py-0.5 leading-none">
                      {idx + 1}
                    </div>
                    <div className="absolute top-1.5 right-1.5 bg-black/40 text-white rounded p-1">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1.5 bg-white">
                    {editingId === film.id ? (
                      <div className="flex gap-1">
                        <Input
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          className="h-7 text-xs flex-1"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveTitle(film)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleSaveTitle(film)}>
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-xs font-medium text-left hover:text-primary flex items-start gap-1 group w-full"
                        onClick={() => { setEditingId(film.id); setEditingTitle(film.title) }}
                      >
                        <span className="flex-1 line-clamp-2 leading-tight">{film.title}</span>
                        <Pencil className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 mt-0.5" />
                      </button>
                    )}

                    <div className="flex items-center justify-between">
                      <Switch
                        checked={film.is_active}
                        onCheckedChange={() => handleToggleActive(film)}
                        className="scale-75 origin-left"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(film.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
