import { Suspense } from 'react'
import Script from 'next/script'
import { SiteHeader } from '@/components/public/site-header'
import { SiteFooter } from '@/components/public/site-footer'
import { VideoBackground } from '@/components/public/video-background'
import { NewsTicker } from '@/components/public/news-ticker'
import { AnalyticsTracker } from '@/components/public/analytics-tracker'
import { getSiteSettings } from '@/lib/api'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settingsRes = await getSiteSettings()
  const settings = settingsRes.data

  // SEO / analytics IDs stored under key 'seo_settings'
  const seoSettings = settings?.seo_settings as {
    googleAnalyticsId?: string
    googleTagManagerId?: string
    facebookPixelId?: string
  } | undefined

  const gaId = seoSettings?.googleAnalyticsId?.trim() || null
  const gtmId = seoSettings?.googleTagManagerId?.trim() || null

  const homepageSettings = settings?.homepageSettings as {
    backgroundVideo?: string
    videoEnabled?: boolean
    backgroundImage?: string
    imageEnabled?: boolean
  } | undefined

  const backgroundVideo = homepageSettings?.backgroundVideo || null
  const videoEnabled = homepageSettings?.videoEnabled ?? false
  const backgroundImage = homepageSettings?.backgroundImage || null
  const imageEnabled = homepageSettings?.imageEnabled ?? false

  return (
    <>
      {/* Google Tag Manager */}
      {gtmId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        </>
      )}

      {/* Google Analytics 4 (only if no GTM) */}
      {gaId && !gtmId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`,
            }}
          />
        </>
      )}

      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>

      {/* Background photo - fixed, behind everything */}
      <VideoBackground
        videoUrl={backgroundVideo}
        videoEnabled={videoEnabled}
        imageUrl={backgroundImage}
        imageEnabled={imageEnabled}
      />

      {/* Vertical frosted strip removed - each section has its own bg */}      <div className="flex min-h-screen flex-col relative" style={{ zIndex: 1 }}>
        <NewsTicker />
        <SiteHeader />
        <main className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
