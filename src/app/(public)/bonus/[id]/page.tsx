import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import BonusLandingClient from './bonus-landing-client'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Bonus {
  id: string
  title: string
  pdf_url: string
  thumbnail_url?: string | null
}

// Uses NEXT_PUBLIC_ keys — guaranteed available in all Next.js rendering contexts.
// RLS policy "public_read_active_bonuses" allows anon reads on is_active=true rows.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

async function getBonus(id: string): Promise<Bonus | null> {
  const { data } = await getSupabase()
    .from('bonuses')
    .select('id, title, pdf_url, thumbnail_url')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()
  return data ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://zwrotny.pl').replace(/\/$/, '')
  const bonus = await getBonus(id)

  if (!bonus) return { title: 'Bonus nie znaleziony' }

  const ogImage = `${baseUrl}/api/bonuses/${id}/og-image`

  return {
    title: `${bonus.title} — darmowy materiał ZWROTNY.pl`,
    description: `Pobierz darmowy materiał "${bonus.title}" od ZWROTNY.pl — wszystko o systemie kaucyjnym w Polsce.`,
    openGraph: {
      title: `${bonus.title} — darmowy materiał ZWROTNY.pl`,
      description: `Pobierz darmowy materiał "${bonus.title}" od ZWROTNY.pl`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: bonus.title,
        },
      ],
      type: 'website',
      siteName: 'ZWROTNY.pl',
      locale: 'pl_PL',
      url: `${baseUrl}/bonus/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${bonus.title} — ZWROTNY.pl`,
      description: `Pobierz darmowy materiał "${bonus.title}"`,
      images: [ogImage],
    },
  }
}

export default async function BonusPage({ params }: PageProps) {
  const { id } = await params
  const bonus = await getBonus(id)
  if (!bonus) notFound()
  return <BonusLandingClient bonus={bonus} />
}
