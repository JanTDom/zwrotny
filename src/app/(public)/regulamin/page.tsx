import { Metadata } from 'next'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Regulamin | ZWROTNY.pl',
  description: 'Regulamin korzystania z portalu ZWROTNY.pl.',
}

export default function RegulaminPage() {
  return (
    <main className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Regulamin</h1>
          <p className="text-lg text-muted-foreground">
            Zasady korzystania z portalu ZWROTNY.pl
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <span className="text-4xl">📋</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Strona w przygotowaniu
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Regulamin portalu jest aktualnie przygotowywany. Wkrótce znajdziesz tu 
              pełne zasady korzystania z serwisu ZWROTNY.pl.
            </p>
            <p className="text-sm text-muted-foreground">
              W razie pytań skontaktuj się z nami: <br />
              <a href="mailto:kontakt@zwrotny.pl" className="text-primary hover:underline">
                kontakt@zwrotny.pl
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
