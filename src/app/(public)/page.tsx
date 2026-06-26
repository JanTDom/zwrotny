import { HeroSection } from '@/components/public/hero-section'
import { CompactHeroBanner } from '@/components/public/compact-hero-banner'
import { ArticlesSection } from '@/components/public/articles-section'
import { GuidesSection } from '@/components/public/guides-section'
import { MythsSection } from '@/components/public/myths-section'
import { YouTubeSection } from '@/components/public/youtube-section'
import { InfographicFromBanners } from '@/components/public/infographic-from-banners'
import { AdBanner } from '@/components/public/ad-banner'
import { NewsletterSection } from '@/components/public/newsletter-section'
import { FounderBio } from '@/components/public/founder-bio'
import { BonusesSection } from '@/components/public/bonuses-section'
import { FilmySection } from '@/components/public/filmy-section'
import { getPosts, getGuides, getMythsFacts, getYouTubeVideos, getBanners, getSiteSettings, getBonuses, getFilmy } from '@/lib/api'

export const revalidate = 10

interface SectionConfig {
  id: string
  enabled: boolean
  order: number
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', enabled: true, order: 1 },
  { id: 'founder', enabled: true, order: 2 },
  { id: 'infographic', enabled: true, order: 3 },
  { id: 'bonuses', enabled: true, order: 4 },
  { id: 'filmy', enabled: true, order: 5 },
  { id: 'articles', enabled: true, order: 6 },
  { id: 'youtube', enabled: true, order: 7 },
  { id: 'guides', enabled: true, order: 8 },
  { id: 'myths', enabled: true, order: 9 },
  { id: 'newsletter', enabled: true, order: 10 },
]

export default async function HomePage() {
  const [postsRes, guidesRes, mythsRes, videosRes, bannersRes, settingsRes, bonusesRes, filmyRes] = await Promise.allSettled([
    getPosts({ status: 'published', limit: 10 }),
    getGuides({ status: 'published' }),
    getMythsFacts({ status: 'published' }),
    getYouTubeVideos({ status: 'published' }),
    getBanners(),
    getSiteSettings(),
    getBonuses(),
    getFilmy(),
  ])

  const posts = postsRes.status === 'fulfilled' ? postsRes.value.data : []
  const guides = guidesRes.status === 'fulfilled' ? guidesRes.value.data : []
  const myths = mythsRes.status === 'fulfilled' ? mythsRes.value.data : []
  const videos = videosRes.status === 'fulfilled' ? videosRes.value.data : []
  const banners = bannersRes.status === 'fulfilled' ? bannersRes.value.data : []
  const bonuses = bonusesRes.status === 'fulfilled' ? bonusesRes.value.data : []
  const filmy = filmyRes.status === 'fulfilled' ? filmyRes.value.data : []
  const settings = settingsRes.status === 'fulfilled' ? settingsRes.value.data : null

  const homepageSettings = settings?.homepageSettings as {
    articlesCount?: number
    backgroundVideo?: string
    videoEnabled?: boolean
    backgroundImage?: string
    imageEnabled?: boolean
    heroTagline?: string
    heroTaglineHighlight?: string
    heroTaglineSuffix?: string
    heroTitle?: string
    heroTitleHighlight?: string
    heroDescription?: string
    heroCtaPrimaryText?: string
    heroCtaPrimaryUrl?: string
    heroCtaSecondaryText?: string
    heroCtaSecondaryUrl?: string
    heroMode?: 'full' | 'compact'
    sections?: SectionConfig[]
  } | undefined

  const articlesCount = homepageSettings?.articlesCount || 6
  const hasTopBanner = banners.some(b => b.position === 'header' && b.isActive && b.imageUrl)
  const hasInFeedBanner = banners.some(b => b.position === 'inline' && b.isActive && b.imageUrl)

  // Merge saved sections with defaults — saved order/enabled wins, new sections get defaults
  const savedSections: SectionConfig[] = homepageSettings?.sections || []
  const sections: SectionConfig[] = DEFAULT_SECTIONS.map(def => {
    const saved = savedSections.find(s => s.id === def.id)
    return saved ? { ...def, ...saved } : def
  }).sort((a, b) => a.order - b.order)

  const isEnabled = (id: string) => sections.find(s => s.id === id)?.enabled ?? true
  const heroMode = homepageSettings?.heroMode ?? 'full'
  const isCompact = heroMode === 'compact'

  const sectionComponents: Record<string, React.ReactNode> = {
    hero: (
      <HeroSection
        key="hero"
        tagline={homepageSettings?.heroTagline}
        taglineHighlight={homepageSettings?.heroTaglineHighlight}
        taglineSuffix={homepageSettings?.heroTaglineSuffix}
        title={homepageSettings?.heroTitle}
        titleHighlight={homepageSettings?.heroTitleHighlight}
        description={homepageSettings?.heroDescription}
        ctaPrimaryText={homepageSettings?.heroCtaPrimaryText}
        ctaPrimaryUrl={homepageSettings?.heroCtaPrimaryUrl}
        ctaSecondaryText={homepageSettings?.heroCtaSecondaryText}
        ctaSecondaryUrl={homepageSettings?.heroCtaSecondaryUrl}
      />
    ),
    infographic: <InfographicFromBanners key="infographic" banners={banners} />,
    bonuses: <BonusesSection key="bonuses" bonuses={bonuses} />,
    filmy: <FilmySection key="filmy" filmy={filmy} />,
    articles: (
      <div key="articles-wrapper">
        <ArticlesSection key="articles" posts={posts} displayCount={articlesCount} />
        {hasInFeedBanner && (
          <div key="in-feed-ad" className="container mx-auto px-4 py-4">
            <AdBanner placement="in-feed" banners={banners} />
          </div>
        )}
      </div>
    ),
    youtube: <YouTubeSection key="youtube" videos={videos} />,
    guides: <GuidesSection key="guides" guides={guides} />,
    myths: <MythsSection key="myths" myths={myths} />,
    founder: <FounderBio key="founder" />,
    newsletter: <NewsletterSection key="newsletter" />,
  }

  return (
    <>
      {hasTopBanner && (
        <div className="container mx-auto px-4 pt-4">
          <AdBanner placement="top" banners={banners} />
        </div>
      )}

      {/* Compact hero banner sits right under the site header */}
      {isCompact && (
        <CompactHeroBanner
          tagline={homepageSettings?.heroTagline}
          taglineHighlight={homepageSettings?.heroTaglineHighlight}
          taglineSuffix={homepageSettings?.heroTaglineSuffix}
          ctaPrimaryText={homepageSettings?.heroCtaPrimaryText}
          ctaPrimaryUrl={homepageSettings?.heroCtaPrimaryUrl}
          ctaSecondaryText={homepageSettings?.heroCtaSecondaryText}
          ctaSecondaryUrl={homepageSettings?.heroCtaSecondaryUrl}
        />
      )}

      {sections
        .filter(s => s.id === 'hero' ? (!isCompact && isEnabled('hero')) : isEnabled(s.id))
        .map(s => sectionComponents[s.id] ?? null)
      }
    </>
  )
}
