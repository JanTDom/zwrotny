'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Upload, Trash2, Pencil, FileText, File, FileSpreadsheet, Download, Loader2 } from 'lucide-react'

interface DownloadItem {
  id: string
  title: string
  description: string | null
  file_url: string
  file_pathname: string
  file_type: string
  file_size_bytes: number | null
  category: string | null
  is_active: boolean
  download_count: number
  order: number
  created_at: string
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string) {
  if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
  if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />
  return <File className="h-5 w-5 text-blue-500" />
}

function fileExtLabel(type: string): string {
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('wordprocessing') || type.includes('msword')) return 'DOC'
  if (type.includes('sheet') || type.includes('excel')) return 'XLS'
  if (type.includes('plain')) return 'TXT'
  if (type.includes('zip')) return 'ZIP'
  return 'PLIK'
}

const emptyForm = {
  title: '',
  description: '',
  category: '',
  isActive: true,
}

export default function DownloadsPage() {
  const [items, setItems] = useState<DownloadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editItem, setEditItem] = useState<DownloadItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingFile, setPendingFile] = useState<{ fileUrl: string; filePathname: string; fileType: string; fileSizeBytes: number; originalName: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/downloads')
      const data = await res.json()
      setItems(data.data || [])
    } catch {
      toast.error('Błąd pobierania plików')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/downloads/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPendingFile(data)
      setForm({ ...emptyForm, title: file.name.replace(/\.[^/.]+$/, '') })
      setEditItem(null)
      setShowDialog(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Błąd uploadu')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const openEdit = (item: DownloadItem) => {
    setEditItem(item)
    setPendingFile(null)
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      isActive: item.is_active,
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Podaj tytuł'); return }
    setIsSaving(true)
    try {
      if (editItem) {
        // Edit existing
        const res = await fetch(`/api/downloads/${editItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            category: form.category.trim() || null,
            isActive: form.isActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Zaktualizowano')
      } else {
        // New upload
        if (!pendingFile) return
        const res = await fetch('/api/downloads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            fileUrl: pendingFile.fileUrl,
            filePathname: pendingFile.filePathname,
            fileType: pendingFile.fileType,
            fileSizeBytes: pendingFile.fileSizeBytes,
            category: form.category.trim() || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Plik dodany')
      }
      setShowDialog(false)
      setPendingFile(null)
      setEditItem(null)
      setForm(emptyForm)
      fetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Błąd zapisywania')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/downloads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Plik usunięty')
      setItems(prev => prev.filter(d => d.id !== id))
    } catch {
      toast.error('Błąd usuwania')
    } finally {
      setDeleteId(null)
    }
  }

  const toggleActive = async (item: DownloadItem) => {
    try {
      await fetch(`/api/downloads/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.is_active }),
      })
      setItems(prev => prev.map(d => d.id === item.id ? { ...d, is_active: !d.is_active } : d))
    } catch {
      toast.error('Błąd aktualizacji')
    }
  }

  const filtered = items.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pliki do pobrania</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publicznie dostępne raporty, przepisy i inne dokumenty
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Wgrywanie...</>
              : <><Upload className="h-4 w-4 mr-2" />Dodaj plik</>
            }
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj plików..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Download className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Brak plików. Dodaj pierwszy dokument do pobrania.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(item => (
            <Card key={item.id} className={`border-border ${!item.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">{fileIcon(item.file_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{item.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {fileExtLabel(item.file_type)}
                      </Badge>
                      {item.category && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.category}
                        </Badge>
                      )}
                      {!item.is_active && (
                        <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                          ukryty
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">{formatBytes(item.file_size_bytes)}</span>
                      <span className="text-xs text-muted-foreground">{item.download_count} pobrań</span>
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Podgląd
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => toggleActive(item)}
                      title={item.is_active ? 'Widoczny' : 'Ukryty'}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edytuj plik' : 'Nowy plik do pobrania'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tytuł *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Nazwa pliku..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Opis (opcjonalny)</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Krótki opis dokumentu..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kategoria (opcjonalnie)</Label>
              <Input
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="np. Raporty, Przepisy, Poradniki..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))}
              />
              <Label>Widoczny publicznie</Label>
            </div>
            {pendingFile && (
              <p className="text-xs text-muted-foreground">
                Plik: {pendingFile.originalName} ({formatBytes(pendingFile.fileSizeBytes)})
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Zapisuję...</> : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć plik?</AlertDialogTitle>
            <AlertDialogDescription>
              Plik zostanie trwale usunięty z serwera. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
