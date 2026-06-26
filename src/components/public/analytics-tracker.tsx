'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Generates / retrieves an anonymous visitor id (no PII)
function getVisitorId(): string {
  const KEY = 'zw_vid'
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return 'anon'
  }
}

function getSessionId(): string {
  const KEY = 'zw_sid'
  try {
    let id = sessionStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return 'anon'
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    // Avoid double-tracking the same path within a render cycle
    if (lastPath.current === pathname) return
    lastPath.current = pathname

    // Don't track the admin panel
    if (pathname.startsWith('/zk7m9')) return

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
    })

    // Use sendBeacon when available (survives navigation), fallback to fetch
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }))
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // silently ignore — analytics must never break the page
    }
    // searchParams included so client-side navigations with query changes re-fire
  }, [pathname, searchParams])

  return null
}
