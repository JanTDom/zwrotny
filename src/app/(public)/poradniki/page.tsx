import Link from 'next/link'
import { ArrowRight, Wine, CheckSquare, Cog, Briefcase, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getGuides } from '@/lib/api'
import { ErrorState } from '@/components/ui/api-states'
import type { Metadata } from 'next'
import type { Guide } from '@/types'

export const metadata: Metadata = {
  title: 'Poradniki',
  description: 'Praktyczne poradniki krok po kroku. Dowiedz się jak korzystać z systemu kaucyjnego, gdzie oddać butelki i jak obsługiwać recyklomat.',
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bottle: Wine,
  'check-list': CheckSquare,
  machine: Cog,
  briefcase: Briefcase,
}

const categoryColors: Record<string, string> = {
  podstawy: 'bg-blue-100 text-blue-700',
  instrukcje: 'bg-green-100 text-green-700',
  biznes: 'bg-purple-100 text-purple-700',
  zwrot: 'bg-orange-100 text-orange-700',
  informacje: 'bg-teal-100 text-teal-700',
}

function GuideCard({ guide }: { guide: Guide }) {
  const Icon = iconMap[guide.icon || 'book'] || BookOpen
  
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

  return (
    <Card className="group h-full border border-border hover:border-primary/50 hover:shadow-lg transition-all">
      <Link href={`/poradniki/${guide.slug}`} className="block h-full">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={categoryColors[guide.category || 'podstawy'] || 'bg-gray-100 text-gray-700'}>
                {guide.category || 'Poradnik'}
              </Badge>
              <Badge variant="outline" className={difficultyColors[guide.difficulty || 'beginner']}>
                {difficultyLabels[guide.difficulty || 'beginner']}
              </Badge>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
            {guide.title}
          </h2>
          
          <p className="text-muted-foreground mb-6 flex-1">
            {guide.description}
          </p>
          
          <div className="flex items-center justify-between text-sm pt-4 border-t border-border">
            <span className="text-muted-foreground">
              {guide.steps?.length || 0} kroków
            </span>
            <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Czytaj poradnik
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

export default async function GuidesPage() {
  let guides: Guide[] = []
  let error: string | null = null

  try {
    const response = await getGuides()
    guides = response.data || []
  } catch (e) {
    error = e instanceof Error ? e.message : 'Nie udało się pobrać poradników'
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <ErrorState message={error} />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Poradniki krok po kroku
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Proste i praktyczne instrukcje, które pomogą Ci w pełni korzystać 
            z systemu kaucyjnego bez zbędnych komplikacji.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {guides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Brak poradników do wyświetlenia.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
