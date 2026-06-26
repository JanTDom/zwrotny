'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[public error]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-6xl font-bold text-foreground/20">500</p>
      <h1 className="text-2xl font-semibold text-foreground">Cos poszlo nie tak</h1>
      <p className="text-muted-foreground max-w-sm">
        Wystapil nieoczekiwany blad. Spróbuj odswiezyc strone.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Spróbuj ponownie
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Strona glowna
        </Link>
      </div>
    </div>
  )
}
