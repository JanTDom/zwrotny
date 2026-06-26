import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-6xl font-bold text-foreground/20">404</p>
      <h1 className="text-2xl font-semibold text-foreground">Strona nie istnieje</h1>
      <p className="text-muted-foreground max-w-sm">
        Podany adres nie istnieje lub zasob zostal usuniety.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Wróc na strone glowna
      </Link>
    </div>
  )
}
