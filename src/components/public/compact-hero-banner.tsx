interface CompactHeroBannerProps {
  tagline?: string
  taglineHighlight?: string
  taglineSuffix?: string
  ctaPrimaryText?: string
  ctaPrimaryUrl?: string
  ctaSecondaryText?: string
  ctaSecondaryUrl?: string
}

export function CompactHeroBanner({
  tagline = 'Portal, który',
  taglineHighlight = 'odczarowuje',
  taglineSuffix = 'system kaucyjny w Polsce!',
}: CompactHeroBannerProps) {
  return (
    <div className="border-b border-border/60 bg-primary/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-3">
          <p className="text-base sm:text-lg font-semibold text-foreground/80 text-center">
            {tagline}{' '}
            <span className="gradient-text font-bold">{taglineHighlight}</span>
            {taglineSuffix ? ` ${taglineSuffix}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
