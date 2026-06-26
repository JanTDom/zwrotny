import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Zap, Target, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stats = [
  { icon: Zap,        value: '50 gr', label: 'Kaucja za opakowanie' },
  { icon: Target,     value: '90%',   label: 'Cel recyklingu' },
  { icon: TrendingUp, value: '10k+',  label: 'Punktów zbiórki' },
  { icon: Users,      value: '38M',   label: 'Polaków w systemie' },
]

interface HeroSectionProps {
  tagline?: string
  taglineHighlight?: string
  taglineSuffix?: string
  title?: string
  titleHighlight?: string
  description?: string
  ctaPrimaryText?: string
  ctaPrimaryUrl?: string
  ctaSecondaryText?: string
  ctaSecondaryUrl?: string
}

export function HeroSection({
  tagline = 'Portal, który',
  taglineHighlight = 'odczarowuje',
  taglineSuffix = 'system kaucyjny w Polsce!',
  title = 'Kaucja?',
  titleHighlight = 'To proste.',
  description = 'Jedyny portal o systemie kaucyjnym, który nie usypia.\nWiadomości, poradniki i zero ekologicznego bełkotu.',
  ctaPrimaryText = 'Jak to działa?',
  ctaPrimaryUrl = '/jak-to-dziala',
  ctaSecondaryText = 'Aktualności',
  ctaSecondaryUrl = '/aktualnosci',
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden my-8">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', borderRadius: '1rem' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Main headline */}
        <div className="text-center mb-8 lg:mb-10">
          {/* Logo centered */}
          <div className="flex justify-center mb-4 animate-fade-in-up">
            <Image
              src="/logo-zwrotny.png"
              alt="ZWROTNY.pl"
              width={420}
              height={280}
              className="h-20 sm:h-24 lg:h-28 w-auto"
              priority
            />
          </div>
          
          {/* Tagline */}
          <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-foreground/90 mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {tagline} <span className="gradient-text font-bold">{taglineHighlight}</span>{taglineSuffix ? ` ${taglineSuffix}` : ''}
          </p>
          
          <div className="mb-4" />
          
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight mb-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <span className="text-foreground">{title}</span>
            <br />
            <span className="gradient-text">{titleHighlight}</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-6 animate-fade-in-up whitespace-pre-line" style={{ animationDelay: '300ms' }}>
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <Button 
              asChild
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 h-14 text-lg animate-glow"
            >
              <Link href={ctaPrimaryUrl}>
                {ctaPrimaryText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-accent/50 hover:bg-accent/10 hover:border-accent text-foreground font-semibold rounded-full px-8 h-14 text-lg"
            >
              <Link href={ctaSecondaryUrl}>
                {ctaSecondaryText}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-foreground/10 pt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-3 animate-fade-in-up"
              style={{ animationDelay: `${500 + index * 80}ms` }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-xl sm:text-2xl text-foreground leading-none">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

