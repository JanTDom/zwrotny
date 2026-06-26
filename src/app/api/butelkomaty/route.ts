import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Overpass API endpoints (fallback chain for reliability)
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

// Recycling points in Poland that accept plastic bottles or cans
const OVERPASS_QUERY = `
[out:json][timeout:40];
area["ISO3166-1"="PL"]->.pl;
(
  node["amenity"="recycling"]["recycling:plastic_bottles"="yes"](area.pl);
  node["amenity"="recycling"]["recycling:cans"="yes"](area.pl);
);
out center;
`.trim()

export interface ButelkomatPoint {
  id: number
  lat: number
  lng: number
  name: string
  operator: string | null
  address: string | null
  acceptsPlasticBottles: boolean
  acceptsCans: boolean
  openingHours: string | null
}

interface OverpassElement {
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function buildAddress(tags: Record<string, string>): string | null {
  const street = tags['addr:street']
  const houseNumber = tags['addr:housenumber']
  const city = tags['addr:city']
  const postcode = tags['addr:postcode']

  const parts: string[] = []
  if (street) parts.push(houseNumber ? `${street} ${houseNumber}` : street)
  if (postcode || city) parts.push([postcode, city].filter(Boolean).join(' '))

  return parts.length > 0 ? parts.join(', ') : null
}

function transformElement(el: OverpassElement): ButelkomatPoint | null {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  const tags = el.tags ?? {}

  return {
    id: el.id,
    lat,
    lng,
    name: tags.name || tags.operator || tags.brand || 'Punkt zbiórki opakowań',
    operator: tags.operator || tags.brand || null,
    address: buildAddress(tags),
    acceptsPlasticBottles: tags['recycling:plastic_bottles'] === 'yes',
    acceptsCans: tags['recycling:cans'] === 'yes',
    openingHours: tags.opening_hours || null,
  }
}

async function fetchFromOverpass(): Promise<OverpassElement[]> {
  let lastError: unknown = null

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
        // Cache server-side for 5 minutes
        next: { revalidate: 300 },
      })

      if (!res.ok) {
        lastError = new Error(`Overpass ${endpoint} responded ${res.status}`)
        continue
      }

      const json = (await res.json()) as { elements?: OverpassElement[] }
      return json.elements ?? []
    } catch (err) {
      lastError = err
      continue
    }
  }

  throw lastError ?? new Error('Wszystkie serwery Overpass są niedostępne')
}

export async function GET() {
  try {
    const elements = await fetchFromOverpass()

    const points = elements
      .map(transformElement)
      .filter((p): p is ButelkomatPoint => p !== null)

    // Deduplicate by id
    const unique = Array.from(new Map(points.map((p) => [p.id, p])).values())

    return NextResponse.json(
      {
        success: true,
        count: unique.length,
        updatedAt: new Date().toISOString(),
        points: unique,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    )
  } catch (error) {
    console.error('[v0] Błąd pobierania butelkomatów:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Nie udało się pobrać danych o punktach zbiórki',
        points: [],
        count: 0,
      },
      { status: 502 },
    )
  }
}
