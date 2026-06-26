import { Metadata } from 'next'
import { Megaphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reklama | ZWROTNY.pl',
  description: 'Reklamuj się na portalu ZWROTNY.pl - dotrzyj do tysięcy użytkowników zainteresowanych systemem kaucyjnym.',
}

export default function ReklamaPage() {
  return (
    <main className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Megaphone className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Reklama</h1>
          <p className="text-lg text-muted-foreground">
            Dotrzyj do tysięcy czytelników zainteresowanych systemem kaucyjnym
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <span className="text-4xl">📣</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Strona w przygotowaniu
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Przygotowujemy dla Ciebie szczegółową ofertę reklamową. 
              Wkrótce znajdziesz tu informacje o formatach, cennikach 
              i możliwościach współpracy.
            </p>
            <p className="text-sm text-muted-foreground">
              Chcesz się reklamować już teraz? Napisz do nas: <br />
              <a href="mailto:reklama@zwrotny.pl" className="text-primary hover:underline">
                reklama@zwrotny.pl
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
