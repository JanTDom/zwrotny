import { Metadata } from 'next'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Recycle, 
  MapPin, 
  Banknote, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Wine,
  Package
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Jak to działa? | ZWROTNY.pl',
  description: 'Dowiedz się jak działa system kaucyjny w Polsce - prosty przewodnik krok po kroku dla każdego.',
}

const steps = [
  {
    number: 1,
    icon: ShoppingCart,
    title: 'Kupujesz napój',
    description: 'W sklepie kupujesz napój w butelce lub puszce. Do ceny doliczana jest kaucja - 50 groszy za opakowanie.',
    details: [
      'Na paragonie zobaczysz osobną pozycję "kaucja"',
      'Kaucja dotyczy butelek plastikowych, szklanych i puszek aluminiowych',
      'Nie musisz nic podpisywać ani się rejestrować'
    ],
    tip: 'Kaucja to nie dodatkowy koszt - to Twoje pieniądze, które odzyskasz po zwrocie opakowania!'
  },
  {
    number: 2,
    icon: Wine,
    title: 'Pijesz i zachowujesz opakowanie',
    description: 'Wypij napój i zachowaj puste opakowanie. To wszystko - nie musisz go myć ani zdejmować etykiety.',
    details: [
      'Opakowanie może być lekko zgniecione - automat i tak je przyjmie',
      'Etykieta musi być czytelna (żeby automat rozpoznał produkt)',
      'Butelka nie może być pocięta ani pomalowana'
    ],
    tip: 'Zbieraj opakowania w jednym miejscu w domu - wygodniej je potem zanieść za jednym razem.'
  },
  {
    number: 3,
    icon: MapPin,
    title: 'Idziesz do punktu zwrotu',
    description: 'Zanieś opakowania do recyklomatu lub punktu zbiórki. Znajdziesz je w większości supermarketów i sklepów.',
    details: [
      'Recyklomaty stają zazwyczaj przy wejściu do sklepu lub w strefie kas',
      'Każdy sklep powyżej 200 m² musi przyjmować zwroty',
      'Mniejsze sklepy mogą (ale nie muszą) mieć punkt zbiórki'
    ],
    tip: 'Skorzystaj z naszej mapy punktów zbiórki, żeby znaleźć najbliższy recyklomat!'
  },
  {
    number: 4,
    icon: Recycle,
    title: 'Wrzucasz opakowania',
    description: 'Wkładasz butelki i puszki do recyklomatu jedna po drugiej. Automat je skanuje i liczy.',
    details: [
      'Wkładaj opakowania pojedynczo - automat musi zeskanować kod kreskowy',
      'Jeśli automat odrzuci opakowanie, sprawdź czy etykieta jest widoczna',
      'Po wrzuceniu wszystkich opakowań naciśnij przycisk „Zakończ"'
    ],
    tip: 'Niektóre recyklomaty mają osobne otwory na butelki i puszki - sprawdź oznaczenia.'
  },
  {
    number: 5,
    icon: Banknote,
    title: 'Odbierasz pieniądze',
    description: 'Automat drukuje bon z kwotą do wypłaty. Zrealizujesz go przy kasie sklepu lub otrzymasz przelew na konto.',
    details: [
      'Bon jest ważny przez określony czas (zazwyczaj 30 dni)',
      'Możesz go zrealizować przy kasie lub odjąć od zakupów',
      'Niektóre automaty oferują przelew na konto lub BLIK'
    ],
    tip: 'Za 10 butelek odzyskujesz 5 zł - to się opłaca!'
  }
]

const faqItems = [
  {
    question: 'Czy muszę mieć paragon, żeby oddać butelkę?',
    answer: 'Nie! Oddajesz opakowanie, a automat rozpoznaje je po kodzie kreskowym. Paragon nie jest potrzebny.'
  },
  {
    question: 'Co jeśli kupiłem napój w innym sklepie?',
    answer: 'Bez problemu. Możesz oddać opakowanie w dowolnym punkcie zbiórki - nie musi to być sklep, w którym kupiłeś napój.'
  },
  {
    question: 'Czy opakowanie musi być czyste?',
    answer: 'Nie musisz go myć. Wystarczy, że jest puste i ma czytelną etykietę z kodem kreskowym.'
  },
  {
    question: 'Ile wynosi kaucja?',
    answer: 'Kaucja wynosi 50 groszy za każde opakowanie - niezależnie czy to mała puszka czy duża butelka.'
  },
  {
    question: 'Jakie opakowania są objęte systemem?',
    answer: 'Butelki plastikowe (PET), butelki szklane wielorazowe i puszki aluminiowe. Na opakowaniu znajdziesz specjalny znaczek.'
  }
]

export default function JakToDzialaPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 lg:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Lightbulb className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Jak działa system kaucyjny?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Prosty przewodnik w 5 krokach. Kupujesz, pijesz, oddajesz, dostajesz kasę. 
            Nic trudnego!
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {steps.map((step, index) => (
            <Card key={step.number} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-[120px_1fr]">
                  {/* Step number */}
                  <div className="bg-primary/10 p-6 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-2">
                      {step.number}
                    </div>
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="p-6 lg:p-8">
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-3">
                      {step.title}
                    </h2>
                    <p className="text-muted-foreground text-lg mb-4">
                      {step.description}
                    </p>

                    {/* Details */}
                    <ul className="space-y-2 mb-4">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Tip */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">
                        <strong>Pro tip:</strong> {step.tip}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
              To naprawdę takie proste!
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-xl bg-background border border-border">
                <div className="text-3xl font-bold text-primary mb-2">50 gr</div>
                <div className="text-muted-foreground">za każde opakowanie</div>
              </div>
              <div className="p-6 rounded-xl bg-background border border-border">
                <div className="text-3xl font-bold text-accent mb-2">30 sek</div>
                <div className="text-muted-foreground">oddanie 10 butelek</div>
              </div>
              <div className="p-6 rounded-xl bg-background border border-border">
                <div className="text-3xl font-bold text-primary mb-2">0 zł</div>
                <div className="text-muted-foreground">żadnych opłat</div>
              </div>
            </div>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/poradniki">
                Zobacz szczegółowe poradniki
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-8">
            Najczęstsze pytania
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    {item.question}
                  </h3>
                  <p className="text-muted-foreground pl-7">
                    {item.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Masz więcej pytań?
              </h2>
              <p className="text-muted-foreground mb-6">
                Sprawdź nasze szczegółowe poradniki lub sekcję Mity vs Fakty, 
                gdzie obalamy popularne nieporozumienia.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="default">
                  <Link href="/poradniki">
                    Poradniki
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/mity-vs-fakty">
                    Mity vs Fakty
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
