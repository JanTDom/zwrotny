'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Aktualności', href: '/aktualnosci' },
  { name: 'Poradniki', href: '/poradniki' },
  { name: 'Mity vs Fakty', href: '/mity-vs-fakty' },
  { name: 'O nas', href: '/o-nas' },
]

export function SiteHeader({ logoUrl }: { logoUrl?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="relative z-50 bg-background border-b border-border/50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="group flex items-center gap-3"
          >
            <Image
              src={logoUrl || "/logo-zwrotny.png"}
              alt="ZWROTNY.pl"
              width={192}
              height={128}
              className="h-12 w-auto lg:h-14 transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground group"
              >
                {item.name}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:left-4 group-hover:w-[calc(100%-2rem)]" />
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <Button 
              asChild
              className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold rounded-full px-6"
            >
              <Link href="/faq">
                <Sparkles className="mr-2 h-4 w-4" />
                Zacznij tutaj
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden relative z-10 p-2 -mr-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Menu</span>
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'lg:hidden fixed inset-x-0 top-20 bottom-0 bg-background/98 backdrop-blur-xl transition-all duration-300 ease-out',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          )}
        >
          <div className="px-4 py-8">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block py-4 text-2xl font-display font-bold text-foreground border-b border-border/50 transition-colors hover:text-primary"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: isOpen ? 'fade-in-up 0.4s ease-out forwards' : 'none'
                }}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="pt-6">
              <Button 
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-full"
              >
                <Link href="/faq">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Zacznij tutaj
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
