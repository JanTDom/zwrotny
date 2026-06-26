import Link from 'next/link'
import { ArrowRight, Wine, CheckSquare, Cog, Briefcase, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Guide } from '@/types'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bottle: Wine,
  'check-list': CheckSquare,
  machine: Cog,
  briefcase: Briefcase,
}

function GuideCard({ guide, index }: { guide: Guide; index: number }) {
  const Icon = iconMap[guide.icon || 'bottle'] || CheckSquare

  return (
    <Link
      href={`/poradniki/${guide.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 p-6 lg:p-8 transition-all duration-500 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Background glow */}
      
      <div className="relative">
        {/* Icon & difficulty */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            guide.difficulty === 'beginner' && 'bg-accent/20 text-accent',
            guide.difficulty === 'intermediate' && 'bg-primary/20 text-primary',
            guide.difficulty === 'advanced' && 'bg-destructive/20 text-destructive'
          )}>
            {guide.difficulty === 'beginner' ? 'Łatwy' : guide.difficulty === 'intermediate' ? 'Średni' : 'Zaawansowany'}
          </span>
        </div>
        
        <h3 className="font-display font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-3">
          {guide.title}
        </h3>
        
        <p className="text-muted-foreground mb-6 line-clamp-2">
          {guide.description || ''}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {(guide.steps || []).length} kroków
          </span>
          <span className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
            Czytaj
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

interface GuidesSectionProps {
  guides: Guide[]
}

export function GuidesSection({ guides }: GuidesSectionProps) {
  if (guides.length === 0) {
    return null
  }

  return (
    <section className="relative py-12 lg:py-16 overflow-hidden my-8">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', borderRadius: '1rem' }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Krok po kroku
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Poradniki
          </h2>
          <p className="text-muted-foreground text-lg">
            Proste instrukcje, które pomagają korzystać z systemu bez problemów
          </p>
        </div>

        {/* Guides grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {guides.slice(0, 4).map((guide, index) => (
            <GuideCard key={guide.id} guide={guide} index={index} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            asChild
            size="lg"
            variant="outline"
            className="border-border hover:bg-card text-foreground font-semibold rounded-full px-8"
          >
            <Link href="/poradniki">
              Wszystkie poradniki
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
