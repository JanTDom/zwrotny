import { Metadata } from 'next'
import { Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dla biznesu | ZWROTNY.pl',
  description: 'Informacje o systemie kaucyjnym dla przedsiębiorców - sklepy, producenci, operatorzy.',
}

export default function DlaBiznesuPage() {
  return (
    <main className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Dla biznesu</h1>
          <p className="text-lg text-muted-foreground">
            System kaucyjny z perspektywy przedsiębiorcy
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <span className="text-4xl">🏢</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Strona w przygotowaniu
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Przygotowujemy kompleksowy przewodnik dla przedsiębiorców. 
              Wkrótce znajdziesz tu informacje dla sklepów, producentów napojów, 
              operatorów recyklomatów i innych firm.
            </p>
            <p className="text-sm text-muted-foreground">
              Masz pytania biznesowe? Skontaktuj się z nami: <br />
              <a href="mailto:biznes@zwrotny.pl" className="text-primary hover:underline">
                biznes@zwrotny.pl
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
