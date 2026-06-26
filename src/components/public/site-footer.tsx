import Link from 'next/link'
import Image from 'next/image'
import { Youtube, Instagram, Twitter } from 'lucide-react'

const footerLinks = {
  nawigacja: [
    { label: 'Aktualności', href: '/aktualnosci' },
    { label: 'Poradniki', href: '/poradniki' },
    { label: 'Mity vs Fakty', href: '/mity-vs-fakty' },
    { label: 'O nas', href: '/o-nas' },
  ],
  info: [
    { label: 'Jak to działa', href: '/jak-to-dziala' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Dla biznesu', href: '/dla-biznesu' },
    { label: 'Kontakt', href: '/kontakt' },
  ],
  prawne: [
    { label: 'Polityka prywatności', href: '/polityka-prywatnosci' },
    { label: 'Regulamin', href: '/regulamin' },
    { label: 'Reklama', href: '/reklama' },
  ],
}

const socialLinks = [
  { icon: Youtube, href: 'https://youtube.com/@zwrotny', label: 'YouTube' },
  { icon: Instagram, href: 'https://instagram.com/zwrotny', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com/zwrotny', label: 'Twitter' },
]

export function SiteFooter({ logoUrl }: { logoUrl?: string }) {
  return (
    <footer className="relative overflow-hidden z-20">
      {/* Main Footer */}
      <div className="bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
              <Link href="/" className="inline-block mb-6 group">
                <Image
                  src={logoUrl || "/logo-zwrotny.png"}
                  alt="ZWROTNY.pl"
                  width={210}
                  height={140}
                  className="h-14 w-auto transition-transform group-hover:scale-105"
                />
              </Link>
              <p className="text-lg font-medium text-foreground/90 mb-4">
                Portal, który odczarowuje system kaucyjny w Polsce!
              </p>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Jedyny portal o systemie kaucyjnym, który nie usypia. Informujemy prosto i na temat.
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Nawigacja</h4>
              <ul className="space-y-3">
                {footerLinks.nawigacja.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Informacje</h4>
              <ul className="space-y-3">
                {footerLinks.info.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Prawne</h4>
              <ul className="space-y-3">
                {footerLinks.prawne.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>© 2025 ZWROTNY.pl. Wszelkie prawa zastrzeżone.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  Projekt i realizacja:{' '}
                  <a
                    href="https://macieto.pl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground/70 hover:text-primary transition-colors"
                  >
                    macieto.pl
                  </a>
                </span>
                <span className="hidden sm:inline text-border">|</span>
                <span className="flex items-center gap-1.5">
                  Hosting:{' '}
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground/70 hover:text-primary transition-colors"
                  >
                    Vercel
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
