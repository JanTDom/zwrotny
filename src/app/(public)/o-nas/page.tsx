import { Metadata } from 'next'
import { Construction } from 'lucide-react'

export const metadata: Metadata = {
  title: 'O nas | ZWROTNY.pl',
  description: 'Poznaj portal ZWROTNY.pl - portal edukacyjny o systemie kaucyjnym w Polsce.',
}

export default function AboutPage() {
  return (
    <main className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Construction className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            O portalu <span className="text-primary">ZWROTNY.pl</span>
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Ta strona jest w budowie. Wkrótce znajdziesz tu więcej informacji 
            o naszym portalu i zespole.
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/30 text-accent text-sm font-medium">
            Pracujemy nad tym!
          </div>
        </div>
      </div>
    </main>
  )
}
