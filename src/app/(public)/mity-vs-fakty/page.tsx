'use client'

import { useState, useEffect } from 'react'
import { X, Check, ExternalLink, ChevronDown, Search, Filter, AlertTriangle, Banknote, Store, Recycle, Leaf, Users, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { MythFact } from '@/types'

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  finanse: Banknote,
  ceny: Banknote,
  wygoda: Recycle,
  ekologia: Leaf,
  biznes: Store,
  spoleczenstwo: Users,
  ogolne: Filter,
}

const categories = [
  { id: 'wszystkie', label: 'Wszystkie', icon: Filter },
  { id: 'finanse', label: 'Pieniądze', icon: Banknote },
  { id: 'wygoda', label: 'Wygoda', icon: Recycle },
  { id: 'ekologia', label: 'Ekologia', icon: Leaf },
  { id: 'biznes', label: 'Biznes', icon: Store },
  { id: 'spoleczenstwo', label: 'Społeczeństwo', icon: Users },
]

export default function MythsFactsPage() {
  const [myths, setMyths] = useState<MythFact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('wszystkie')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Load myths from API
  useEffect(() => {
    const loadMyths = async () => {
      try {
        const response = await fetch('/api/myths?status=published')
        if (response.ok) {
          const data = await response.json()
          setMyths(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load myths:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadMyths()
  }, [])

  const filteredMyths = myths.filter(myth => {
    const matchesSearch = 
      myth.myth.toLowerCase().includes(search.toLowerCase()) ||
      myth.fact.toLowerCase().includes(search.toLowerCase()) ||
      (myth.explanation || '').toLowerCase().includes(search.toLowerCase())
    
    const matchesCategory = activeCategory === 'wszystkie' || myth.category === activeCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-destructive/10 via-background to-background py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-6">
              <AlertTriangle className="h-4 w-4" />
              {myths.length} mitów obalonych
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">
              Mity vs <span className="text-primary">Fakty</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
              System kaucyjny otacza wiele mitów i dezinformacji. Zebraliśmy najczęstsze 
              ataki i obalamy je faktami. Bądź świadomym obywatelem - sprawdź co jest prawdą!
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj mitu lub faktu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{cat.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMyths.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {myths.length === 0 
                  ? 'Brak mitów w bazie danych. Dodaj mity w panelu administracyjnym.'
                  : 'Nie znaleziono mitów pasujących do wyszukiwania.'}
              </p>
            </div>
          ) : (
            filteredMyths.map((item, index) => {
              const Icon = categoryIcons[item.category || 'ogolne'] || Filter
              const isExpanded = expandedId === item.id

              return (
                <Card 
                  key={item.id} 
                  className="overflow-hidden transition-all duration-300 hover:shadow-lg"
                >
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2">
                      {/* Myth */}
                      <div className="p-6 bg-destructive/5 border-b md:border-b-0 md:border-r border-border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                            <X className="h-6 w-6 text-destructive" />
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">Mit #{index + 1}</span>
                            <p className="font-bold text-destructive">FAŁSZ</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-foreground leading-snug">
                          &ldquo;{item.myth}&rdquo;
                        </p>
                      </div>

                      {/* Fact */}
                      <div className="p-6 bg-primary/5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">Odpowiedź</span>
                            <p className="font-bold text-primary">PRAWDA</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-foreground leading-snug">
                          {item.fact}
                        </p>
                      </div>
                    </div>

                    {/* Expand button */}
                    {item.explanation && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="w-full p-4 border-t border-border bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground"
                      >
                        {isExpanded ? 'Zwiń wyjaśnienie' : 'Rozwiń pełne wyjaśnienie'}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {/* Explanation */}
                    {isExpanded && item.explanation && (
                      <div className="p-6 border-t border-border bg-card animate-fade-in">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-accent" />
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {item.explanation}
                          </p>
                        </div>
                        {item.source && (
                          <div className="flex items-center gap-2 text-sm pt-4 border-t border-border">
                            <ExternalLink className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Źródło:</span>
                            <span className="text-primary font-medium">{item.source}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '98%', label: 'odzysk w Niemczech', color: 'text-primary' },
            { value: '30%', label: 'odzysk bez systemu', color: 'text-destructive' },
            { value: '40 lat', label: 'doświadczeń w Europie', color: 'text-accent' },
            { value: '50 gr', label: 'zwracana kaucja', color: 'text-primary' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Usłyszałeś inny mit?
          </h2>
          <p className="text-muted-foreground mb-6">
            Jeśli natknąłeś się na dezinformację o systemie kaucyjnym,
            napisz do nas! Zweryfikujemy i dodamy do naszej listy.
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/kontakt">
              Zgłoś mit do weryfikacji
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
