'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  Search,
  GripVertical,
  X,
  Check,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAdminMyths, adminApi } from '@/hooks/use-admin-data'
import { LoadingState } from '@/components/ui/api-states'
import { toast } from 'sonner'
import type { MythFact } from '@/types'

// Sample myths data - same as on public page
// Using a simplified type since fact serves as explanation
const sampleMyths: Array<{
  myth: string
  fact: string
  explanation?: string
  category: string
  order: number
  source?: string
}> = [
  {
    myth: 'To kolejny podatek od Polaków!',
    fact: 'Kaucja to depozyt, który odzyskujesz w 100% przy zwrocie opakowania. Jak wózek w sklepie - zostawiasz kaucję, odbierasz ją z powrotem.',
    category: 'finanse',
    order: 1,
    source: 'Ministerstwo Klimatu i Środowiska',
  },
  {
    myth: 'Wszystko przez to podrożeje!',
    fact: 'Ceny napojów nie rosną - kaucja jest doliczana osobno i wraca do Ciebie. W Niemczech po 20 latach system działa bez wpływu na ceny.',
    category: 'finanse',
    order: 2,
    source: 'Raport DPG Deutsche Pfandsystem GmbH 2023',
  },
  {
    myth: 'Będę musiał trzymać górę butelek w domu!',
    fact: 'Plastikowe butelki można zgnieść. Oddajesz przy okazji zakupów. Przeciętna rodzina to 2-3 butelki dziennie - mieszczą się w jednej torbie.',
    category: 'wygoda',
    order: 3,
  },
  {
    myth: 'Małe sklepy przez to padną!',
    fact: 'Sklepy do 200m² mają preferencje - mogą zbierać tylko to co sprzedają. Dodatkowo dostają prowizję za każdą przyjętą butelkę.',
    category: 'biznes',
    order: 4,
    source: 'Ustawa o systemie kaucyjnym',
  },
  {
    myth: 'To tylko ekologiczna propaganda!',
    fact: 'Twarde dane: Niemcy odzyskują 98% butelek, Polska bez systemu - około 30%. To różnica między górą śmieci a czystym środowiskiem.',
    category: 'ekologia',
    order: 5,
    source: 'European Environment Agency 2023',
  },
  {
    myth: 'System jest za skomplikowany dla zwykłego człowieka!',
    fact: '3 proste kroki: kup, wypij, oddaj. Automat sam rozpoznaje butelkę i wydaje paragon. Dzieci w Niemczech robią to od lat.',
    category: 'wygoda',
    order: 6,
  },
  {
    myth: 'Automaty będą ciągle zepsute!',
    fact: 'W krajach z systemem kaucyjnym automaty działają 24/7 z dostępnością ponad 99%. Serwis reaguje w ciągu kilku godzin.',
    category: 'wygoda',
    order: 7,
    source: 'TOMRA Systems ASA - raport roczny',
  },
  {
    myth: 'Nie ma gdzie oddać butelek!',
    fact: 'Każdy sklep powyżej 200m² musi przyjmować butelki. Do tego automaty w galeriach, na stacjach, w parkach. Punktów będzie więcej niż bankomatów.',
    category: 'wygoda',
    order: 8,
    source: 'Ustawa o systemie kaucyjnym',
  },
  {
    myth: 'Ktoś na tym zarabia kosztem zwykłych ludzi!',
    fact: 'System jest non-profit. Nieodebrane kaucje idą na edukację ekologiczną i rozwój infrastruktury, nie do czyjeś kieszeni.',
    category: 'finanse',
    order: 9,
  },
  {
    myth: 'Wystarczy segregować śmieci do żółtego worka!',
    fact: 'Z żółtego worka odzyskujemy 30-40% plastiku. Z systemu kaucyjnego - ponad 90%. To jak porównywać rower z samochodem.',
    category: 'ekologia',
    order: 10,
    source: 'Raport NIK o gospodarce odpadami 2022',
  },
  {
    myth: 'To działa tylko w bogatych krajach!',
    fact: 'System kaucyjny świetnie działa w Litwie, Łotwie, Estonii, Chorwacji - krajach o podobnym poziomie rozwoju co Polska.',
    category: 'spoleczenstwo',
    order: 11,
  },
  {
    myth: 'Ludzie i tak będą wyrzucać butelki gdzie popadnie!',
    fact: 'W Niemczech butelki z kaucją praktycznie nie występują jako śmieci. Nawet jeśli ktoś ją wyrzuci - ktoś inny ją zbierze dla kaucji.',
    category: 'spoleczenstwo',
    order: 12,
  },
  {
    myth: 'Muszę prać butelki przed oddaniem!',
    fact: 'Nie musisz. Automat przyjmuje butelki brudne, zgniecione, bez etykiety. Ważne tylko żeby był czytelny kod kreskowy.',
    category: 'wygoda',
    order: 13,
  },
  {
    myth: 'To ja mam płacić za infrastrukturę producentów?!',
    fact: 'Infrastrukturę (automaty, logistykę) finansują producenci napojów, nie konsumenci. Twoja rola: oddać butelkę i odebrać kaucję.',
    category: 'finanse',
    order: 14,
    source: 'Ustawa o systemie kaucyjnym - art. 12',
  },
  {
    myth: 'Starsi ludzie sobie z tym nie poradzą!',
    fact: 'W Niemczech seniorzy świetnie korzystają z systemu. Automaty mają duże przyciski i proste menu. Można też oddać butelki przy kasie.',
    category: 'spoleczenstwo',
    order: 15,
  },
]

function MythRow({ myth, index, onDelete }: { myth: MythFact; index: number; onDelete: (id: string) => void }) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag handle */}
          <button className="cursor-grab text-muted-foreground hover:text-foreground mt-1">
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Order number */}
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
            {index + 1}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Myth */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <X className="h-3.5 w-3.5 text-destructive" />
              </div>
              <div>
                <Badge variant="outline" className="text-destructive border-destructive/30 mb-1">
                  MIT
                </Badge>
                <p className="text-foreground font-medium">{myth.myth}</p>
              </div>
            </div>

            {/* Fact */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <Badge variant="outline" className="text-primary border-primary/30 mb-1">
                  FAKT
                </Badge>
                <p className="text-muted-foreground">{myth.fact}</p>
              </div>
            </div>

            {/* Source */}
            {myth.source && (
              <p className="text-xs text-muted-foreground pl-8">
                Źródło: {myth.source}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/zk7m9/mity/${myth.id}`}>
                <Edit2 className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(myth.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const MYTHS_STORAGE_KEY = 'zwrotny_cms_myths'

export default function MythsAdminPage() {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [localMyths, setLocalMyths] = useState<MythFact[]>([])
  const [isLocalLoaded, setIsLocalLoaded] = useState(false)
  const [newMyth, setNewMyth] = useState({ myth: '', fact: '', source: '' })
  const { myths: backendMyths, isLoading, mutate } = useAdminMyths()

  // Load from localStorage as fallback
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MYTHS_STORAGE_KEY)
      if (saved) {
        setLocalMyths(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e)
    }
    setIsLocalLoaded(true)
  }, [])

  // Use backend data if available, otherwise localStorage
  const myths = backendMyths.length > 0 ? backendMyths : localMyths

  const handleAddMyth = async () => {
    if (!newMyth.myth.trim() || !newMyth.fact.trim()) {
      toast.error('Wypełnij mit i fakt')
      return
    }
    
    setIsSaving(true)
    try {
      // Try to save to backend
      await adminApi.createMyth({
        myth: newMyth.myth,
        fact: newMyth.fact,
        source: newMyth.source || undefined,
        status: 'published',
      })
      await mutate()
      toast.success('Mit dodany!')
      setNewMyth({ myth: '', fact: '', source: '' })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save myth:', error)
      // Fallback to localStorage
      const newMythData: MythFact = {
        id: `local-${Date.now()}`,
        myth: newMyth.myth,
        fact: newMyth.fact,
        source: newMyth.source || undefined,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const updated = [...localMyths, newMythData]
      localStorage.setItem(MYTHS_STORAGE_KEY, JSON.stringify(updated))
      setLocalMyths(updated)
      toast.success('Mit dodany (lokalnie)')
      setNewMyth({ myth: '', fact: '', source: '' })
      setIsDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMyth = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten mit?')) return
    
    try {
      // Check if it's a local myth (sample-X) or database myth (UUID)
      const isLocalMyth = id.startsWith('sample-')
      
      if (!isLocalMyth) {
        // Delete from database
        await adminApi.deleteMyth(id)
      }
      
      // Always remove from localStorage too
      const updated = localMyths.filter(m => m.id !== id)
      localStorage.setItem(MYTHS_STORAGE_KEY, JSON.stringify(updated))
      setLocalMyths(updated)
      await mutate()
      toast.success('Mit usunięty')
    } catch (error) {
      console.error('Failed to delete myth:', error)
      toast.error('Błąd usuwania mitu')
    }
  }

  const handleLoadSampleMyths = async () => {
    setIsUploading(true)
    try {
      // Save to localStorage first
      const mythsWithIds: MythFact[] = sampleMyths.map((myth, index) => ({
        ...myth,
        id: `sample-${index + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      localStorage.setItem(MYTHS_STORAGE_KEY, JSON.stringify(mythsWithIds))
      setLocalMyths(mythsWithIds)
      
      // Try to save to backend too
      for (const myth of sampleMyths) {
        await adminApi.createMyth(myth)
      }
      await mutate()
      toast.success(`Załadowano ${sampleMyths.length} przykładowych mitów`)
    } catch (error) {
      console.error('Failed to upload to backend:', error)
      toast.success(`Załadowano ${sampleMyths.length} przykładowych mitów (lokalnie)`)
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading && !isLocalLoaded) return <LoadingState message="Ładowanie mitów..." />
  const filteredMyths = myths.filter(myth => {
    return myth.myth.toLowerCase().includes(search.toLowerCase()) ||
           myth.fact.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mity vs Fakty</h1>
          <p className="text-muted-foreground">Zarządzaj sekcją obalania mitów</p>
        </div>
        <div className="flex gap-2">
          {myths.length === 0 && (
            <Button variant="outline" className="gap-2" onClick={handleLoadSampleMyths} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isUploading ? 'Ładuję...' : 'Załaduj przykładowe'}
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Dodaj mit
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Dodaj nowy mit vs fakt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <X className="h-4 w-4 text-destructive" />
                  Mit (fałszywe przekonanie)
                </label>
                <Textarea 
                  placeholder="Np. System kaucyjny to dodatkowy podatek..."
                  rows={3}
                  value={newMyth.myth}
                  onChange={(e) => setNewMyth(prev => ({ ...prev, myth: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Fakt (prawda)
                </label>
                <Textarea 
                  placeholder="Wyjaśnij prawdę i obal mit..."
                  rows={4}
                  value={newMyth.fact}
                  onChange={(e) => setNewMyth(prev => ({ ...prev, fact: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Źródło (opcjonalne)</label>
                <Input 
                  placeholder="Np. Ministerstwo Klimatu i Środowiska"
                  value={newMyth.source}
                  onChange={(e) => setNewMyth(prev => ({ ...prev, source: e.target.value }))}
                />
              </div>
              <Button className="w-full" onClick={handleAddMyth} disabled={isSaving}>
                {isSaving ? 'Zapisuję...' : 'Dodaj mit vs fakt'}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myths.length}</p>
                <p className="text-sm text-muted-foreground">Obalonych mitów</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myths.length}</p>
                <p className="text-sm text-muted-foreground">Mitów do obalenia</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myths.filter(m => m.source).length}</p>
                <p className="text-sm text-muted-foreground">Ze źródłem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj mitów lub faktów..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Myths list */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Przeciągnij aby zmienić kolejność wyświetlania
        </p>
        {filteredMyths.map((myth, index) => (
          <MythRow key={myth.id} myth={myth} index={index} onDelete={handleDeleteMyth} />
        ))}

        {filteredMyths.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Brak mitów</h3>
              <p className="text-muted-foreground">
                Nie znaleziono mitów spełniających kryteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
