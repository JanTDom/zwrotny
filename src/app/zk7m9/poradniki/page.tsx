'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  Wine,
  CheckSquare,
  Cog,
  Briefcase,
  Search,
  GripVertical,
  Download,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdminGuides, adminApi } from '@/hooks/use-admin-data'
import { LoadingState } from '@/components/ui/api-states'
import { toast } from 'sonner'
import type { Guide } from '@/types'

// Sample guides data - using simplified step type
const sampleGuides: Array<{
  title: string
  slug: string
  description: string
  icon: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  steps: Array<{ title: string; description: string }>
}> = [
  {
    title: 'Jak oddać pierwszą butelkę',
    slug: 'jak-oddac-pierwsza-butelke',
    description: 'Kompletny przewodnik dla początkujących - od zakupu do odbioru kaucji',
    icon: 'bottle',
    difficulty: 'beginner',
    estimatedTime: 5,
    steps: [
      { title: 'Kup napój z kaucją', description: 'Przy zakupie płacisz cenę napoju + 50 gr kaucji. Na paragonie zobaczysz osobną pozycję "kaucja".' },
      { title: 'Zachowaj opakowanie', description: 'Po wypiciu nie wyrzucaj butelki ani puszki. Możesz ją zgnieść - automat i tak ją przyjmie.' },
      { title: 'Znajdź punkt zwrotu', description: 'Automaty są w sklepach powyżej 200m², galeriach handlowych i na stacjach benzynowych.' },
      { title: 'Wrzuć opakowanie', description: 'Włóż butelkę do otworu automatu. Poczekaj aż zostanie zeskanowana i zaakceptowana.' },
      { title: 'Odbierz paragon', description: 'Naciśnij "Zakończ" i weź wydrukowany bon. Zrealizuj go przy kasie - gotówką lub odlicz od zakupów.' },
    ],
  },
  {
    title: 'Obsługa recyklomatu',
    slug: 'obsluga-recyklomatu',
    description: 'Krok po kroku przez interfejs automatu do zwrotu opakowań',
    icon: 'machine',
    difficulty: 'beginner',
    estimatedTime: 3,
    steps: [
      { title: 'Podejdź do automatu', description: 'Ekran powitalny pokaże instrukcję. Jeśli automat jest zajęty, poczekaj na swoją kolej.' },
      { title: 'Włóż opakowanie', description: 'Umieść butelkę lub puszkę w otworze etykietą do góry. Automat sam ją wciągnie.' },
      { title: 'Poczekaj na skan', description: 'Automat odczyta kod kreskowy i zważy opakowanie. Trwa to 2-3 sekundy.' },
      { title: 'Powtórz dla kolejnych', description: 'Wrzucaj kolejne opakowania. Na ekranie widzisz sumę narastającą.' },
      { title: 'Zakończ i odbierz bon', description: 'Naciśnij zielony przycisk "Zakończ". Automat wydrukuje paragon z kwotą do wypłaty.' },
    ],
  },
  {
    title: 'Zwrot w małym sklepie',
    slug: 'zwrot-w-malym-sklepie',
    description: 'Jak oddać butelki gdy sklep nie ma automatu',
    icon: 'briefcase',
    difficulty: 'beginner',
    estimatedTime: 3,
    steps: [
      { title: 'Sprawdź czy sklep przyjmuje', description: 'Sklepy do 200m² przyjmują tylko opakowania po produktach które sprzedają.' },
      { title: 'Podejdź do kasy', description: 'Powiedz sprzedawcy że chcesz zwrócić opakowania z kaucją.' },
      { title: 'Pokaż opakowania', description: 'Sprzedawca sprawdzi czy są to opakowania z ich asortymentu.' },
      { title: 'Odbierz zwrot', description: 'Dostaniesz gotówkę lub możesz odliczyć od zakupów. Paragon nie jest potrzebny.' },
    ],
  },
  {
    title: 'Co zrobić z uszkodzoną butelką',
    slug: 'uszkodzona-butelka',
    description: 'Porady gdy opakowanie jest zgniecione, bez etykiety lub uszkodzone',
    icon: 'check-list',
    difficulty: 'intermediate',
    estimatedTime: 4,
    steps: [
      { title: 'Sprawdź kod kreskowy', description: 'Najważniejszy jest czytelny kod kreskowy. Reszta etykiety może być uszkodzona.' },
      { title: 'Zgniecione butelki OK', description: 'Plastikowe butelki można zgnieść - automat je przyjmie jeśli kod jest czytelny.' },
      { title: 'Brak etykiety - problem', description: 'Bez kodu kreskowego automat nie rozpozna opakowania. Wyrzuć do żółtego pojemnika.' },
      { title: 'Mokre opakowania', description: 'Automaty przyjmują mokre butelki. Osusz tylko jeśli woda zalewa kod kreskowy.' },
      { title: 'Obce opakowania', description: 'Butelki z zagranicy bez polskiego kodu nie zostaną przyjęte. Oddaj do żółtego pojemnika.' },
    ],
  },
  {
    title: 'System kaucyjny dla firm',
    slug: 'system-dla-firm',
    description: 'Przewodnik dla przedsiębiorców - obowiązki i korzyści',
    icon: 'briefcase',
    difficulty: 'advanced',
    estimatedTime: 10,
    steps: [
      { title: 'Sprawdź obowiązki', description: 'Sklepy powyżej 200m² muszą przyjmować wszystkie opakowania kaucyjne. Mniejsze - tylko swój asortyment.' },
      { title: 'Wybierz rozwiązanie', description: 'Automat (droższy ale wygodniejszy) lub ręczny odbiór przy kasie (tańszy ale wolniejszy).' },
      { title: 'Zarejestruj się w systemie', description: 'Zgłoś się do operatora systemu kaucyjnego. Otrzymasz dostęp do rozliczeń online.' },
      { title: 'Przeszkol personel', description: 'Pracownicy muszą wiedzieć jak obsługiwać zwroty i rozwiązywać problemy klientów.' },
      { title: 'Rozliczaj prowizje', description: 'Za każde przyjęte opakowanie dostajesz prowizję. Rozliczenie miesięczne z operatorem.' },
    ],
  },
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bottle: Wine,
  'check-list': CheckSquare,
  machine: Cog,
  briefcase: Briefcase,
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
}

const difficultyLabels: Record<string, string> = {
  beginner: 'Łatwy',
  intermediate: 'Średni',
  advanced: 'Zaawansowany',
}

function GuideRow({ guide, index, onDelete }: { guide: Guide; index: number; onDelete: (id: string) => void }) {
  const Icon = iconMap[guide.icon || 'book'] || CheckSquare

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Drag handle */}
          <button className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Order number */}
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {index + 1}
          </div>

          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{guide.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{guide.description || ''}</p>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="secondary" className={difficultyColors[guide.difficulty || 'beginner']}>
              {difficultyLabels[guide.difficulty || 'beginner']}
            </Badge>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {(guide.steps || []).length} kroków
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/poradniki/${guide.slug}`} target="_blank">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/zk7m9/poradniki/${guide.id}`}>
                <Edit2 className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(guide.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const GUIDES_STORAGE_KEY = 'zwrotny_cms_guides'

export default function GuidesAdminPage() {
  const [search, setSearch] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [isUploading, setIsUploading] = useState(false)
  const [localGuides, setLocalGuides] = useState<Guide[]>([])
  const [isLocalLoaded, setIsLocalLoaded] = useState(false)
  const { guides: backendGuides, isLoading, mutate } = useAdminGuides()

  // Load from localStorage as fallback
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GUIDES_STORAGE_KEY)
      if (saved) {
        setLocalGuides(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e)
    }
    setIsLocalLoaded(true)
  }, [])

  // Use backend data if available, otherwise localStorage
  const guides = backendGuides.length > 0 ? backendGuides : localGuides

  const handleDeleteGuide = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten poradnik?')) return
    
    try {
      // Check if it's a local guide (sample-X) or database guide (UUID)
      const isLocalGuide = id.startsWith('sample-')
      
      if (!isLocalGuide) {
        // Delete from database
        await adminApi.deleteGuide(id)
      }
      
      // Always remove from localStorage too
      const updated = localGuides.filter(g => g.id !== id)
      localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(updated))
      setLocalGuides(updated)
      await mutate()
      toast.success('Poradnik usunięty')
    } catch (error) {
      console.error('Failed to delete guide:', error)
      toast.error('Błąd usuwania poradnika')
    }
  }

  const handleLoadSampleGuides = async () => {
    setIsUploading(true)
    try {
      // Save to localStorage first - cast with proper structure
      const guidesWithIds = sampleGuides.map((guide, index) => ({
        ...guide,
        id: `sample-${index + 1}`,
        category: 'poradniki' as const,
        steps: guide.steps.map((s, i) => ({ ...s, order: i + 1, content: s.description })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as Guide[]
      localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(guidesWithIds))
      setLocalGuides(guidesWithIds)
      
      // Try to save to backend too
      for (const guide of sampleGuides) {
        await adminApi.createGuide({
          ...guide,
          steps: guide.steps.map((s, i) => ({ ...s, order: i + 1, content: s.description })),
        })
      }
      await mutate()
      toast.success(`Załadowano ${sampleGuides.length} przykładowych poradników`)
    } catch (error) {
      console.error('Failed to upload to backend:', error)
      toast.success(`Załadowano ${sampleGuides.length} przykładowych poradników (lokalnie)`)
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading && !isLocalLoaded) return <LoadingState message="Ładowanie poradników..." />
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(search.toLowerCase()) ||
                         (guide.description || '').toLowerCase().includes(search.toLowerCase())
    const matchesDifficulty = filterDifficulty === 'all' || guide.difficulty === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Poradniki</h1>
          <p className="text-muted-foreground">Zarządzaj poradnikami krok po kroku</p>
        </div>
        <div className="flex gap-2">
          {guides.length === 0 && (
            <Button variant="outline" className="gap-2" onClick={handleLoadSampleGuides} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isUploading ? 'Ładuję...' : 'Załaduj przykładowe'}
            </Button>
          )}
          <Button className="gap-2" asChild>
            <Link href="/zk7m9/poradniki/nowy">
              <Plus className="h-4 w-4" />
              Nowy poradnik
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-primary">{guides.length}</p>
            <p className="text-sm text-muted-foreground">Wszystkie poradniki</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-green-600">
              {guides.filter(g => g.difficulty === 'beginner').length}
            </p>
            <p className="text-sm text-muted-foreground">Łatwe</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-yellow-600">
              {guides.filter(g => g.difficulty === 'intermediate').length}
            </p>
            <p className="text-sm text-muted-foreground">Średnie</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-red-600">
              {guides.filter(g => g.difficulty === 'advanced').length}
            </p>
            <p className="text-sm text-muted-foreground">Zaawansowane</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj poradników..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Poziom trudności" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie poziomy</SelectItem>
            <SelectItem value="easy">Łatwy</SelectItem>
            <SelectItem value="medium">Średni</SelectItem>
            <SelectItem value="advanced">Zaawansowany</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Guides list */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Przeciągnij aby zmienić kolejność wyświetlania
        </p>
        {filteredGuides.map((guide, index) => (
          <GuideRow key={guide.id} guide={guide} index={index} onDelete={handleDeleteGuide} />
        ))}

        {filteredGuides.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Brak poradników</h3>
              <p className="text-muted-foreground">
                Nie znaleziono poradników spełniających kryteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
