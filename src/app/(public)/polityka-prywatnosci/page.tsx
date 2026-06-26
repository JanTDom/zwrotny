import { Metadata } from 'next'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Polityka prywatności | ZWROTNY.pl',
  description: 'Polityka prywatności portalu ZWROTNY.pl - dowiedz się jak przetwarzamy Twoje dane.',
}

export default function PolitykaPrywatnosciPage() {
  return (
    <main className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Polityka prywatności</h1>
          <p className="text-lg text-muted-foreground">
            Dowiedz się, jak dbamy o Twoje dane osobowe
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <span className="text-4xl">🔒</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Strona w przygotowaniu
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Pracujemy nad pełną treścią polityki prywatności. Wkrótce znajdziesz tu wszystkie 
              informacje o tym, jak przetwarzamy Twoje dane zgodnie z RODO.
            </p>
            <p className="text-sm text-muted-foreground">
              W razie pytań dotyczących prywatności, skontaktuj się z nami: <br />
              <a href="mailto:prywatnosc@zwrotny.pl" className="text-primary hover:underline">
                prywatnosc@zwrotny.pl
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
