import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { createServiceClient } from '@/lib/supabase/service'
import './globals.css'

async function getSiteStyle(): Promise<{ faviconUrl?: string }> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'site_style')
      .single()
    return (data?.value as { faviconUrl?: string }) ?? {}
  } catch {
    return {}
  }
}

const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
})

export async function generateMetadata(): Promise<Metadata> {
  const style = await getSiteStyle()

  const icons: Metadata['icons'] = style.faviconUrl
    ? { icon: style.faviconUrl, shortcut: style.faviconUrl, apple: style.faviconUrl }
    : { icon: '/favicon.ico' }

  return {
    title: {
      default: 'ZWROTNY.pl - System kaucyjny bez nudy',
      template: '%s | ZWROTNY.pl',
    },
    description: 'Jedyny portal o systemie kaucyjnym, który nie usypia. Wiadomości, poradniki i wszystko co musisz wiedzieć - prosto i na temat.',
    keywords: ['system kaucyjny', 'kaucja', 'recykling', 'butelki', 'puszki', 'recyklomat', 'Polska', 'zwrot butelek'],
    authors: [{ name: 'ZWROTNY.pl' }],
    creator: 'ZWROTNY.pl',
    publisher: 'ZWROTNY.pl',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://zwrotny.pl'),
    icons,
    openGraph: {
      type: 'website',
      locale: 'pl_PL',
      siteName: 'ZWROTNY.pl',
      title: 'ZWROTNY.pl - System kaucyjny bez nudy',
      description: 'Jedyny portal o systemie kaucyjnym, który nie usypia.',
      images: [{
        url: '/opengraph-image?v=2',
        width: 1200,
        height: 630,
        alt: 'ZWROTNY.pl - System kaucyjny bez nudy',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ZWROTNY.pl - System kaucyjny bez nudy',
      description: 'Jedyny portal o systemie kaucyjnym, który nie usypia.',
      images: ['/opengraph-image?v=2'],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl" className={`${inter.variable} ${plusJakarta.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
