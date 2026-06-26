import { cn } from '@/lib/utils'
import type { Banner } from '@/types'
import Link from 'next/link'

interface AdBannerProps {
  placement: 'top' | 'sidebar' | 'in-feed' | 'in-article' | 'footer'
  banners?: Banner[]
  className?: string
}

const placementConfig = {
  top: {
    height: 'h-24 md:h-28',
    label: 'Baner reklamowy (728x90)',
    bannerPlacement: 'hero',
  },
  sidebar: {
    height: 'h-64',
    label: 'Reklama sidebar (300x250)',
    bannerPlacement: 'sidebar',
  },
  'in-feed': {
    height: 'h-32',
    label: 'Reklama In-Feed (468x60)',
    bannerPlacement: 'inline',
  },
  'in-article': {
    height: 'h-24',
    label: 'Reklama w artykule (468x60)',
    bannerPlacement: 'inline',
  },
  footer: {
    height: 'h-28',
    label: 'Baner footer (728x90)',
    bannerPlacement: 'footer',
  },
}

export function AdBanner({ placement, banners = [], className }: AdBannerProps) {
  const config = placementConfig[placement]
  
  // Find active banner for this placement
  const activeBanner = banners.find(
    b => b.position === config.bannerPlacement && b.isActive
  )

  // If we have an active banner with an image, show it
  if (activeBanner?.imageUrl) {
    const content = (
      <div
        className={cn(
          'w-full rounded-lg overflow-hidden relative',
          config.height,
          className
        )}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${activeBanner.imageUrl})` }}
        />
        <span className="absolute top-1 right-1 text-[10px] text-white/60 bg-black/30 px-1 rounded">
          Reklama
        </span>
      </div>
    )

    if (activeBanner.linkUrl) {
      return (
        <Link href={activeBanner.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
          {content}
        </Link>
      )
    }

    return content
  }

  // Return null when no active banner - don't show placeholder
  return null
}
