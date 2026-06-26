import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Wine, CheckSquare, Cog, Briefcase, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getGuideBySlug, getGuides } from '@/lib/api'
import type { Metadata } from 'next'
import type { Guide } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bottle: Wine,
  'check-list': CheckSquare,
  machine: Cog,
  briefcase: Briefcase,
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zwrotny.pl'
  
  try {
    const response = await getGuideBySlug(slug)
    const guide = response.data
    
    if (!guide) {
      return { title: 'Poradnik nie znaleziony' }
    }

    const ogImage = (() => {
      const raw = guide.coverImage
      if (!raw) return `${baseUrl}/og-image.jpg`
      if (raw.startsWith('http')) return raw
      return `${baseUrl}${raw.startsWith('/') ? '' : '/'}${raw}`
    })()

    return {
      title: `${guide.title} - Poradnik`,
      description: guide.description,
      openGraph: {
        title: `${guide.title} - Poradnik | ZWROTNY.pl`,
        description: guide.description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: guide.title }],
        type: 'article',
        siteName: 'ZWROTNY.pl',
        locale: 'pl_PL',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${guide.title} - Poradnik`,
        description: guide.description,
        images: [ogImage],
      },
    }
  } catch {
    return { title: 'Poradnik nie znaleziony' }
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  
  let guide: Guide | null = null
  let allGuides: Guide[] = []

  try {
    const [guideResponse, guidesResponse] = await Promise.all([
      getGuideBySlug(slug),
      getGuides()
    ])
    guide = guideResponse.data || null
    allGuides = guidesResponse.data || []
  } catch {
    notFound()
  }

  if (!guide) {
    notFound()
  }

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

  // Find prev/next guides
  const currentIndex = allGuides.findIndex(g => g.slug === slug)
  const prevGuide = currentIndex > 0 ? allGuides[currentIndex - 1] : null
  const nextGuide = currentIndex < allGuides.length - 1 ? allGuides[currentIndex + 1] : null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary">Strona główna</Link>
            <span>/</span>
            <Link href="/poradniki" className="hover:text-primary">Poradniki</Link>
            <span>/</span>
            <span className="text-foreground">{guide.title}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{guide.category}</Badge>
                <Badge className={difficultyColors[guide.difficulty || 'beginner']}>
                  {difficultyLabels[guide.difficulty || 'beginner']}
                </Badge>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {guide.title}
            </h1>
            
            <p className="text-lg text-muted-foreground">
              {guide.description}
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress indicator */}
          {guide.steps && guide.steps.length > 0 && (
            <div className="flex items-center justify-between mb-12 px-4">
              {(guide.steps || []).map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  {index < (guide.steps || []).length - 1 && (
                    <div className="w-full h-1 bg-primary/20 mx-2 hidden sm:block" style={{ minWidth: '40px' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Steps content */}
          <div className="space-y-8">
            {guide.steps?.map((step, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-[auto_1fr]">
                    {/* Step number */}
                    <div className="bg-primary/5 p-6 flex items-start justify-center md:w-24">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                        {step.order}
                      </div>
                    </div>
                    
                    {/* Step content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-3">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.content}
                      </p>
                      {step.image && (
                        <div className="mt-4 aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Placeholder: {step.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Completion */}
          <div className="mt-12 p-8 rounded-2xl bg-primary/10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Gotowe!</h2>
            <p className="text-muted-foreground">
              Teraz wiesz już wszystko na ten temat. Powodzenia!
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-between">
            {prevGuide ? (
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/poradniki/${prevGuide.slug}`}>
                  <ArrowLeft className="h-4 w-4" />
                  {prevGuide.title}
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {nextGuide && (
              <Button asChild className="gap-2">
                <Link href={`/poradniki/${nextGuide.slug}`}>
                  {nextGuide.title}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
