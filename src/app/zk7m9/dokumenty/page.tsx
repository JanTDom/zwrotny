'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Search, Upload, Trash2, Copy, FileText, File, FileSpreadsheet, Loader2 } from 'lucide-react'

interface Document {
  id: string
  title: string
  description: string | null
  file_url: string
  file_pathname: string
  file_type: string
  file_size_bytes: number | null
  category: string | null
  is_active: boolean
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
  return 'PLIK'
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [pendingFile, setPendingFile] = useState<{ fileUrl: string; filePathname: string; fileType: string; fileSizeBytes: number; originalName: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/documents?${params}`)
      const data = await res.json()
      setDocuments(data.data || [])
    } catch {
      toast.error('Błąd pobierania dokumentów')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPendingFile(data)
      setNewTitle(file.name.replace(/\.[^/.]+$/, ''))
      setShowAddDialog(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Błąd uploadu')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveDocument = async () => {
    if (!pendingFile || !newTitle.trim()) {
      toast.error('Podaj tytuł dokumentu')
      return
    }
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          fileUrl: pendingFile.fileUrl,
          filePathname: pendingFile.filePathname,
          fileType: pendingFile.fileType,
          fileSizeBytes: pendingFile.fileSizeBytes,
          category: newCategory.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Dokument dodany')
      setShowAddDialog(false)
      setPendingFile(null)
      setNewTitle('')
      setNewDescription('')
      setNewCategory('')
      fetchDocuments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Błąd zapisywania')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Dokument usunięty')
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch {
      toast.error('Błąd usuwania dokumentu')
    } finally {
      setDeleteId(null)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Link skopiowany do schowka')
  }

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Biblioteka dokumentów</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pliki do osadzania jako linki w artykułach
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Wgrywanie...</>
              : <><Upload className="h-4 w-4 mr-2" />Dodaj dokument</>
            }
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj dokumentów..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Brak dokumentów. Wgraj pierwszy plik.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(doc => (
            <Card key={doc.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {fileIcon(doc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{doc.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {fileExtLabel(doc.file_type)}
                      </Badge>
                      {doc.category && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {doc.category}
                        </Badge>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">{formatBytes(doc.file_size_bytes)}</span>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Podgląd
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyUrl(doc.file_url)}
                      title="Kopiuj link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(doc.id)}
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

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj dokument do biblioteki</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tytuł *</Label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Nazwa dokumentu..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Opis (opcjonalny)</Label>
              <Input
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Krótki opis dokumentu..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kategoria (opcjonalnie)</Label>
              <Input
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="np. Przepisy, Raporty..."
              />
            </div>
            {pendingFile && (
              <p className="text-xs text-muted-foreground">
                Plik: {pendingFile.originalName} ({formatBytes(pendingFile.fileSizeBytes)})
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anuluj</Button>
            <Button onClick={handleSaveDocument}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć dokument?</AlertDialogTitle>
            <AlertDialogDescription>
              Plik zostanie trwale usunięty z biblioteki i serwera. Tej operacji nie można cofnąć.
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
