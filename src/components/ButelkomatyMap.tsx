'use client'

import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  LayerGroup,
} from 'leaflet'
import {
  Loader2,
  MapPin,
  Search,
  RefreshCw,
  LocateFixed,
  Download,
  AlertCircle,
  Recycle,
  Navigation,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface ButelkomatPoint {
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

interface PointWithDistance extends ButelkomatPoint {
  distanceKm: number | null
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const POLAND_CENTER: [number, number] = [52.0693, 19.4803]
const POLAND_ZOOM = 6
const STORAGE_KEY = 'butelkomaty-map-view'

// Haversine distance in km
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function ButelkomatyMap({ className }: { className?: string }) {
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const clusterRef = useRef<LayerGroup | null>(null)
  const userMarkerRef = useRef<LeafletMarker | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<ButelkomatPoint[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [geoCenter, setGeoCenter] = useState<[number, number] | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Debounce search input (300ms)
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Geocode the query (city/place name) via Nominatim so searching by city works
  // even when point addresses don't contain a city tag.
  useEffect(() => {
    if (query.length < 3) {
      setGeoCenter(null)
      return
    }
    let cancelled = false
    const controller = new AbortController()
    setGeocoding(true)
    const run = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pl&q=${encodeURIComponent(query)}`,
          { signal: controller.signal, headers: { 'Accept-Language': 'pl' } },
        )
        const data = (await res.json()) as Array<{ lat: string; lon: string }>
        if (cancelled) return
        if (data.length > 0) {
          setGeoCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        } else {
          setGeoCenter(null)
        }
      } catch {
        if (!cancelled) setGeoCenter(null)
      } finally {
        if (!cancelled) setGeocoding(false)
      }
    }
    run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [query])

  // Fetch points from our own API
  const fetchPoints = useCallback(async (bustCache = false) => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(
        bustCache ? `/api/butelkomaty?t=${Date.now()}` : '/api/butelkomaty',
        bustCache ? { cache: 'no-store' } : undefined,
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nie udało się pobrać danych')
      }
      setPoints(data.points as ButelkomatPoint[])
      setUpdatedAt(data.updatedAt ?? null)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchPoints()
  }, [fetchPoints])

  // Points with distance (memoized)
  const pointsWithDistance = useMemo<PointWithDistance[]>(() => {
    return points.map((p) => ({
      ...p,
      distanceKm: userPos
        ? distanceKm(userPos[0], userPos[1], p.lat, p.lng)
        : null,
    }))
  }, [points, userPos])

  // Radius (km) used when filtering points around a geocoded city
  const GEO_RADIUS_KM = 25

  // Filtered points based on debounced query (memoized).
  // Combines text match (name/address/operator) with geocoded-city radius match,
  // so typing a city name shows points near that city even without an address tag.
  const filteredPoints = useMemo<PointWithDistance[]>(() => {
    let result = pointsWithDistance
    if (query) {
      result = result.filter((p) => {
        const haystack = `${p.name} ${p.address ?? ''} ${p.operator ?? ''}`.toLowerCase()
        if (haystack.includes(query)) return true
        if (geoCenter) {
          const d = distanceKm(geoCenter[0], geoCenter[1], p.lat, p.lng)
          return d <= GEO_RADIUS_KM
        }
        return false
      })
    }
    if (userPos) {
      result = [...result].sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      )
    }
    return result
  }, [pointsWithDistance, query, geoCenter, userPos])

  // Stats (memoized)
  const stats = useMemo(() => {
    const bottles = filteredPoints.filter((p) => p.acceptsPlasticBottles).length
    const cans = filteredPoints.filter((p) => p.acceptsCans).length
    return { total: filteredPoints.length, bottles, cans }
  }, [filteredPoints])

  // Initialize Leaflet map (client only, dynamic import)
  useEffect(() => {
    let cancelled = false

    async function initMap() {
      if (mapRef.current || !mapElRef.current) return
      const L = (await import('leaflet')).default
      await import('leaflet.markercluster')
      if (cancelled || !mapElRef.current) return
      leafletRef.current = L

      // Restore saved view
      let center: [number, number] = POLAND_CENTER
      let zoom = POLAND_ZOOM
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.lat && parsed.lng && parsed.zoom) {
            center = [parsed.lat, parsed.lng]
            zoom = parsed.zoom
          }
        }
      } catch {
        // ignore parse errors
      }

      const map = L.map(mapElRef.current, {
        center,
        zoom,
        scrollWheelZoom: true,
        preferCanvas: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (L as any).markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        maxClusterRadius: 60,
      })
      map.addLayer(cluster)

      // Persist view on move
      map.on('moveend', () => {
        const c = map.getCenter()
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }),
          )
        } catch {
          // ignore quota errors
        }
      })

      mapRef.current = map
      clusterRef.current = cluster
      setMapReady(true)
    }

    initMap()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        clusterRef.current = null
        setMapReady(false)
      }
    }
  }, [])

  // Build a popup HTML for a point
  const buildPopup = useCallback((p: PointWithDistance): string => {
    const tags: string[] = []
    if (p.acceptsPlasticBottles)
      tags.push(
        '<span style="display:inline-block;background:#dbeafe;color:#1e40af;border-radius:9999px;padding:2px 8px;font-size:11px;margin-right:4px;">Butelki PET</span>',
      )
    if (p.acceptsCans)
      tags.push(
        '<span style="display:inline-block;background:#fef3c7;color:#92400e;border-radius:9999px;padding:2px 8px;font-size:11px;">Puszki</span>',
      )

    const dist =
      p.distanceKm !== null
        ? `<div style="font-size:12px;color:#0891b2;margin-top:4px;font-weight:600;">📍 ${formatDistance(p.distanceKm)} od Ciebie</div>`
        : ''

    const addr = p.address
      ? `<div style="font-size:12px;color:#475569;margin-top:2px;">${p.address}</div>`
      : ''

    const hours = p.openingHours
      ? `<div style="font-size:11px;color:#64748b;margin-top:4px;">🕒 ${p.openingHours}</div>`
      : ''

    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`

    return `
      <div style="min-width:200px;font-family:system-ui,sans-serif;">
        <div style="font-weight:700;font-size:14px;color:#0f172a;">${p.name}</div>
        ${addr}
        ${dist}
        <div style="margin-top:8px;">${tags.join('')}</div>
        ${hours}
        <a href="${navUrl}" target="_blank" rel="noopener noreferrer"
          style="display:inline-flex;align-items:center;gap:4px;margin-top:10px;background:#0891b2;color:#fff;text-decoration:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;">
          Nawiguj &rarr;
        </a>
      </div>
    `
  }, [])

  // Render markers when filtered points or map readiness change
  useEffect(() => {
    const L = leafletRef.current
    const cluster = clusterRef.current
    if (!L || !cluster || !mapReady) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(cluster as any).clearLayers()

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#0891b2;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;border:2px solid #fff;">
        <div style="transform:rotate(45deg);color:#fff;font-size:13px;">♻</div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    })

    const markers: LeafletMarker[] = filteredPoints.map((p) => {
      const m = L.marker([p.lat, p.lng], { icon })
      m.bindPopup(buildPopup(p))
      return m
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(cluster as any).addLayers(markers)
  }, [filteredPoints, mapReady, buildPopup])

  // Pan/zoom the map to the active search results so the search visibly "reacts"
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map || !mapReady) return

    // No active query: nothing to focus
    if (!query) return

    if (filteredPoints.length > 0) {
      const bounds = L.latLngBounds(
        filteredPoints.map((p) => [p.lat, p.lng] as [number, number]),
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true })
    } else if (geoCenter) {
      // Matched a city but no points nearby: at least center on the city
      map.setView(geoCenter, 11, { animate: true })
    }
  }, [query, filteredPoints, geoCenter, mapReady])

  // Geolocation
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Twoja przeglądarka nie wspiera geolokalizacji')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ]
        setUserPos(coords)
        setLocating(false)

        const L = leafletRef.current
        const map = mapRef.current
        if (L && map) {
          if (userMarkerRef.current) {
            userMarkerRef.current.remove()
          }
          const userIcon = L.divIcon({
            className: '',
            html: `<div style="background:#f5a623;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(245,166,35,0.4);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })
          userMarkerRef.current = L.marker(coords, { icon: userIcon })
            .addTo(map)
            .bindPopup('Twoja lokalizacja')
          map.setView(coords, 12)
        }
      },
      () => {
        setError('Nie udało się ustalić Twojej lokalizacji')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  // CSV export of currently visible points
  const handleExportCsv = useCallback(() => {
    const header = ['Nazwa', 'Adres', 'Lat', 'Lng', 'Butelki PET', 'Puszki', 'Odległość (km)']
    const rows = filteredPoints.map((p) => [
      p.name,
      p.address ?? '',
      p.lat.toString(),
      p.lng.toString(),
      p.acceptsPlasticBottles ? 'tak' : 'nie',
      p.acceptsCans ? 'tak' : 'nie',
      p.distanceKm !== null ? p.distanceKm.toFixed(2) : '',
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `butelkomaty-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredPoints])

  return (
    <Card className={cn('overflow-hidden border-border', className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Szukaj po nazwie, adresie lub mieście..."
            className="pl-9 pr-9"
            aria-label="Szukaj punktów zbiórki"
          />
          {geocoding && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLocate}
            disabled={locating}
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Moja lokalizacja</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchPoints(true)}
            disabled={status === 'loading'}
          >
            <RefreshCw
              className={cn('h-4 w-4', status === 'loading' && 'animate-spin')}
            />
            <span className="hidden sm:inline">Odśwież</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredPoints.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        </div>
      </div>

      {/* Stats panel */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2 text-sm">
        <Badge variant="secondary" className="gap-1">
          <MapPin className="h-3 w-3" />
          {stats.total} punktów
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Recycle className="h-3 w-3" />
          {stats.bottles} butelki PET
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Recycle className="h-3 w-3" />
          {stats.cans} puszki
        </Badge>
        {query && stats.total === 0 && status === 'success' && (
          <span className="text-xs font-medium text-destructive">
            Brak punktów dla „{query}” {geoCenter ? '(w promieniu 25 km)' : ''}
          </span>
        )}
        {updatedAt && (
          <span className="ml-auto text-xs text-muted-foreground">
            Zaktualizowano: {new Date(updatedAt).toLocaleTimeString('pl-PL')}
          </span>
        )}
      </div>

      {/* Map / states */}
      <div className="relative">
        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-card/95 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="font-medium text-foreground">Nie udało się załadować mapy</p>
            <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => fetchPoints(true)} size="sm">
              <RefreshCw className="h-4 w-4" />
              Spróbuj ponownie
            </Button>
          </div>
        )}

        {/* Loading overlay */}
        {status === 'loading' && points.length === 0 && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-card/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Ładowanie punktów zbiórki...</p>
          </div>
        )}

        {/* Skeleton before map element mounts */}
        {!mapReady && status !== 'error' && (
          <Skeleton className="absolute inset-0 z-[400]" />
        )}

        <div
          ref={mapElRef}
          className="h-[480px] w-full sm:h-[600px]"
          aria-label="Mapa punktów zbiórki opakowań"
          role="application"
        />
      </div>
    </Card>
  )
}

export default ButelkomatyMap
