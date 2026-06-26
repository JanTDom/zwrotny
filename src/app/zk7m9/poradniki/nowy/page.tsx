'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Loader2,
  GripVertical,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const difficulties = [
  { value: 'beginner', label: 'Łatwy' },
  { value: 'intermediate', label: 'Średni' },
  { value: 'advanced', label: 'Zaawansowany' },
]

const icons = [
  { value: 'bottle', label: 'Butelka' },
  { value: 'machine', label: 'Automat' },
  { value: 'check-list', label: 'Lista' },
  { value: 'briefcase', label: 'Biznes' },
]

interface Step {
  title: string
  description: string
}

export default function NewGuidePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    icon: 'bottle',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedTime: 5,
    steps: [] as Step[],
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[ąĄ]/g, 'a')
      .replace(/[ćĆ]/g, 'c')
      .replace(/[ęĘ]/g, 'e')
      .replace(/[łŁ]/g, 'l')
      .replace(/[ńŃ]/g, 'n')
      .replace(/[óÓ]/g, 'o')
      .replace(/[śŚ]/g, 's')
      .replace(/[źŹżŻ]/g, 'z')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }))
  }

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { title: '', description: '' }],
    }))
  }

  const updateStep = (index: number, field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      ),
    }))
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Podaj tytuł poradnika')
      return
    }
    
    setIsSaving(true)
    
    try {
      await adminApi.createGuide({
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        icon: formData.icon,
        difficulty: formData.difficulty,
        estimatedTime: formData.estimatedTime,
        steps: formData.steps.map((s, i) => ({ ...s, order: i + 1, content: s.description })),
      })
      
      toast.success('Poradnik utworzony')
      router.push('/zk7m9/poradniki')
    } catch (e) {
      console.error('Failed to create guide:', e)
      toast.error('Błąd podczas tworzenia')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/zk7m9/poradniki">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nowy poradnik</h1>
            <p className="text-muted-foreground">
              Utwórz nowy poradnik krok po kroku
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Utwórz poradnik
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main editor */}
        <div className="space-y-6">
          {/* Title & slug */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł poradnika</Label>
                <Input
                  id="title"
                  placeholder="Wpisz tytuł poradnika..."
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/poradniki/</span>
                  <Input
                    id="slug"
                    placeholder="slug-poradnika"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  placeholder="Krótki opis poradnika..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Kroki ({formData.steps.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={addStep} className="gap-2">
                <Plus className="h-4 w-4" />
                Dodaj krok
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.steps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Brak kroków</p>
                  <Button variant="outline" size="sm" onClick={addStep} className="mt-2 gap-2">
                    <Plus className="h-4 w-4" />
                    Dodaj pierwszy krok
                  </Button>
                </div>
              ) : (
                formData.steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <Badge variant="secondary">Krok {index + 1}</Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeStep(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Tytuł kroku</Label>
                      <Input
                        placeholder="Np. Znajdź automat..."
                        value={step.title}
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Opis</Label>
                      <Textarea
                        placeholder="Szczegółowy opis tego kroku..."
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))
              )}
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
                <Label htmlFor="difficulty">Poziom trudności</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setFormData(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz poziom" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(diff => (
                      <SelectItem key={diff.value} value={diff.value}>
                        {diff.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ikona</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz ikonę" />
                  </SelectTrigger>
                  <SelectContent>
                    {icons.map(icon => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Szacowany czas (minuty)</Label>
                <Input
                  id="time"
                  type="number"
                  min={1}
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
