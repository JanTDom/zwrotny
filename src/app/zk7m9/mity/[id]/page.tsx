'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { adminApi } from '@/hooks/use-admin-data'
import type { MythFact } from '@/types'

const categories = [
  { value: 'finanse', label: 'Finanse' },
  { value: 'wygoda', label: 'Wygoda' },
  { value: 'ekologia', label: 'Ekologia' },
  { value: 'biznes', label: 'Biznes' },
  { value: 'spoleczenstwo', label: 'Społeczeństwo' },
]

export default function EditMythPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [formData, setFormData] = useState({
    myth: '',
    fact: '',
    category: 'finanse',
    source: '',
    order: 1,
  })
  
  // Helper to update form and mark as dirty
  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  // Load myth from Supabase API
  useEffect(() => {
    const loadMyth = async () => {
      try {
        const response = await fetch(`/api/myths/${id}`)
        if (response.ok) {
          const data = await response.json()
          const myth = data.data
          if (myth) {
            setFormData({
              myth: myth.myth || '',
              fact: myth.fact || '',
              category: myth.category || 'finanse',
              source: myth.source || '',
              order: myth.order || 1,
            })
          }
        }
      } catch (e) {
        console.error('Failed to load myth:', e)
        toast.error('Nie udało się załadować mitu')
      }
      setIsLoading(false)
    }
    loadMyth()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      await adminApi.updateMyth(id, {
        myth: formData.myth,
        fact: formData.fact,
        category: formData.category,
        source: formData.source,
        order: formData.order,
      })
      
      setIsDirty(false)
      toast.success('Mit zapisany')
      router.push('/zk7m9/mity')
    } catch (e) {
      console.error('Failed to save myth:', e)
      toast.error('Błąd podczas zapisywania')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć ten mit?')) return
    
    try {
      await adminApi.deleteMyth(id)
      toast.success('Mit usunięty')
      router.push('/zk7m9/mity')
    } catch (e) {
      console.error('Failed to delete myth:', e)
      toast.error('Błąd podczas usuwania')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/zk7m9/mity">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edytuj mit</h1>
            <p className="text-muted-foreground">
              Modyfikuj mit i fakt
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Zapisz
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main editor */}
        <div className="space-y-6">
          {/* Myth */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-destructive">Mit (fałszywe przekonanie)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Np. To kolejny podatek od Polaków!"
                value={formData.myth}
                onChange={(e) => updateForm({ myth: e.target.value })}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Fact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-primary">Fakt (prawda)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Wyjaśnienie dlaczego to nieprawda i jak jest naprawdę..."
                value={formData.fact}
                onChange={(e) => updateForm({ fact: e.target.value })}
                rows={5}
              />
            </CardContent>
          </Card>

          {/* Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Źródło (opcjonalne)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Np. Ministerstwo Klimatu i Środowiska, raport XYZ 2024..."
                value={formData.source}
                onChange={(e) => updateForm({ source: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Dodaj źródło aby zwiększyć wiarygodność faktu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ustawienia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateForm({ category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Kolejność</Label>
                <Input
                  id="order"
                  type="number"
                  min={1}
                  value={formData.order}
                  onChange={(e) => updateForm({ order: parseInt(e.target.value) || 1 })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delete */}
          <Card className="border-destructive/50">
            <CardContent className="p-4">
              <Button 
                variant="destructive" 
                className="w-full gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Usuń mit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
