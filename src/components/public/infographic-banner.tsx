import { Zap, Target, TrendingUp, Users } from 'lucide-react'

const stats = [
  {
    icon: Zap,
    value: '50 gr',
    label: 'Kaucja za opakowanie',
  },
  {
    icon: Target,
    value: '90%',
    label: 'Cel recyklingu',
  },
  {
    icon: TrendingUp,
    value: '10k+',
    label: 'Punktów zbiórki',
  },
  {
    icon: Users,
    value: '38M',
    label: 'Polaków w systemie',
  },
]

export function InfographicBanner() {
  return (
    <section className="relative py-10 lg:py-12 overflow-hidden my-8">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', borderRadius: '1rem' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
