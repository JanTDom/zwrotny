import type { Metadata } from 'next'
import { ButelkomatyMap } from '@/components/ButelkomatyMap'

export const metadata: Metadata = {
  title: 'Mapa butelkomatów i punktów zbiórki | ZWROTNY.pl',
  description:
    'Znajdź najbliższy butelkomat lub punkt zbiórki opakowań objętych systemem kaucyjnym w Polsce. Filtruj po lokalizacji, sprawdź odległość i nawiguj.',
}

export default function MapaButelkomatowPage() {
  return (
    <section className="relative py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-balance text-3xl font-bold sm:text-4xl">
            Mapa butelkomatów i punktów zbiórki
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            Znajdź najbliższy punkt, w którym oddasz butelki PET i puszki objęte
            systemem kaucyjnym. Dane pochodzą z OpenStreetMap i są aktualizowane na
            bieżąco.
          </p>
        </div>
        <ButelkomatyMap className="mx-auto max-w-5xl" />
      </div>
    </section>
  )
}
