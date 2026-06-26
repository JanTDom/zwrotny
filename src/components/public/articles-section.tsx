'use client'

import Link from 'next/link'
import { ArrowRight, Clock, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Post } from '@/types'

// Helper to check if image URL exists
function hasImageUrl(url: string | null | undefined): boolean {
  return !!url && url.trim().length > 0
}

const categories = [
  { value: 'wszystkie', label: 'Wszystkie' },
  { value: 'aktualnosci', label: 'Aktualności' },
  { value: 'poradniki', label: 'Poradniki' },
  { value: 'prawo', label: 'Prawo' },
  { value: 'biznes', label: 'Biznes' },
]

interface ArticlesSectionProps {
  posts: Post[]
  displayCount?: number
}

export function ArticlesSection({ posts, displayCount = 6 }: ArticlesSectionProps) {
  const [activeCategory, setActiveCategory] = useState('wszystkie')
  
  const filteredArticles = activeCategory === 'wszystkie' 
    ? posts.slice(0, displayCount)
    : posts.filter(a => a.category === activeCategory).slice(0, displayCount)

  // Pinned article takes priority, otherwise use the newest (first)
  const pinnedArticle = filteredArticles.find(a => a.featured)
  const featuredArticle = pinnedArticle ?? filteredArticles[0]
  const otherArticles = filteredArticles.filter(a => a !== featuredArticle)

  if (posts.length === 0) {
    return null
  }

  return (
    <section className="relative py-12 lg:py-16 overflow-hidden my-8">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', borderRadius: '1rem' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Najnowsze
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground">
              Aktualności
            </h2>
          </div>
          
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                  activeCategory === cat.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Article (largest) */}
        {featuredArticle && (
          <Link
            href={`/artykul/${featuredArticle.slug}`}
            className="group relative block overflow-hidden rounded-2xl bg-background border border-border hover:border-primary/50 transition-all duration-500 mb-8"
          >
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Image */}
              <div className="aspect-[16/10] lg:aspect-auto lg:h-full overflow-hidden">
                {hasImageUrl(featuredArticle.coverImage) ? (
                  <div 
                    className="h-full w-full min-h-[300px] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${featuredArticle.coverImage})` }}
                  />
                ) : (
                  <div className="h-full w-full min-h-[300px] bg-white/80 flex items-center justify-center">
                    <img
                      src="/logo-zwrotny.png"
                      alt="ZWROTNY.pl"
                      className="w-48 h-auto opacity-70 object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    {featuredArticle.category}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="h-4 w-4" />
                    {featuredArticle.readingTime || 5} min
                  </span>
                </div>
                
                <h3 className="font-display font-bold text-2xl lg:text-3xl text-foreground group-hover:text-primary transition-colors mb-4">
                  {featuredArticle.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 line-clamp-3">
                  {featuredArticle.excerpt || featuredArticle.content?.substring(0, 200)}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{featuredArticle.author?.name || 'Redakcja'}</span>
                  </div>
                  <span suppressHydrationWarning>
                    {featuredArticle.publishedAt ? new Date(featuredArticle.publishedAt).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'Europe/Warsaw'
                    }) : ''}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Other Articles Grid (smaller cards) */}
        {otherArticles.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {otherArticles.map((article, index) => (
              <Link
                key={article.id}
                href={`/artykul/${article.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-background border border-border hover:border-primary/50 transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image */}
                <div className="aspect-[16/10] overflow-hidden">
                  {hasImageUrl(article.coverImage) ? (
                    <div 
                      className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${article.coverImage})` }}
                    />
                  ) : (
                    <div className="h-full w-full bg-white/80 flex items-center justify-center">
                      <img
                        src="/logo-zwrotny.png"
                        alt="ZWROTNY.pl"
                        className="w-32 h-auto opacity-70 object-contain"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                </div>

                {/* Content overlaid on image - white text on dark gradient */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-white/80 text-xs">
                      <Clock className="h-3 w-3" />
                      {article.readingTime || 3} min
                    </span>
                  </div>
                  
                  <h3 className="font-display font-bold text-base text-white group-hover:text-primary/90 transition-colors line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {article.title}
                  </h3>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Button 
            asChild
            size="lg"
            variant="outline"
            className="border-border hover:bg-secondary text-foreground font-semibold rounded-full px-8"
          >
            <Link href="/aktualnosci">
              Zobacz wszystkie
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
