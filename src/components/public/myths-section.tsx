'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X, Check, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MythFact } from '@/types'

interface MythsSectionProps {
  myths: MythFact[]
}

export function MythsSection({ myths }: MythsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  
  if (myths.length === 0) {
    return null
  }
  
  const currentMythFact = myths[currentIndex]
  
  const goToNext = () => {
    setRevealed(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % myths.length)
    }, 150)
  }
  
  const goToPrev = () => {
    setRevealed(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + myths.length) % myths.length)
    }, 150)
  }

  return (
    <section className="relative py-12 lg:py-16 overflow-hidden my-8">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', borderRadius: '1rem' }} />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Obalamy mity
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Mity vs <span className="text-primary">Fakty</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Kliknij, żeby poznać prawdę
          </p>
        </div>

        {/* Interactive Card */}
        <div className="max-w-4xl mx-auto">
          <div 
            className="relative overflow-hidden rounded-3xl border border-border bg-card cursor-pointer"
            onClick={() => setRevealed(!revealed)}
          >
            <div className="grid md:grid-cols-2 min-h-[400px]">
              {/* Myth Side */}
              <div className={cn(
                'relative p-8 lg:p-12 flex flex-col justify-center transition-all duration-500',
                revealed ? 'opacity-50' : 'opacity-100'
              )}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                    <X className="h-6 w-6 text-destructive" />
                  </div>
                  <span className="font-display font-bold text-xl text-destructive">MIT</span>
                </div>
                <p className="font-display font-bold text-2xl lg:text-3xl text-foreground leading-tight">
                  {currentMythFact.myth}
                </p>
              </div>

              {/* Divider */}
              <div className="absolute left-1/2 top-8 bottom-8 w-px bg-border hidden md:block" />

              {/* Fact Side */}
              <div className={cn(
                'relative p-8 lg:p-12 flex flex-col justify-center transition-all duration-500 border-t md:border-t-0 md:border-l border-border',
                revealed ? 'opacity-100' : 'opacity-50'
              )}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-display font-bold text-xl text-primary">FAKT</span>
                </div>
                <p className="font-display font-bold text-2xl lg:text-3xl text-foreground leading-tight">
                  {currentMythFact.fact}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className={cn(
              'overflow-hidden transition-all duration-500 border-t border-border',
              revealed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            )}>
              <div className="p-8 lg:p-12 bg-secondary/50">
                <p className="text-foreground/80 text-lg mb-4">
                  {currentMythFact.explanation}
                </p>
                {currentMythFact.source && (
                  <p className="text-sm text-muted-foreground">
                    Zrodlo: {currentMythFact.source}
                  </p>
                )}
              </div>
            </div>

            {/* Click hint */}
            <div className={cn(
              'absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium transition-opacity duration-300',
              revealed ? 'opacity-0' : 'opacity-100'
            )}>
              Kliknij, aby odkryc
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrev}
              className="h-12 w-12 rounded-full border-border hover:bg-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Progress dots */}
            <div className="flex gap-2">
              {myths.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setRevealed(false)
                    setCurrentIndex(index)
                  }}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    index === currentIndex
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-border hover:bg-muted-foreground'
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="h-12 w-12 rounded-full border-border hover:bg-secondary"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button 
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8"
          >
            <Link href="/mity-vs-fakty">
              Zobacz wszystkie
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
