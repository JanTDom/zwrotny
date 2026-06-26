'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  ShoppingCart,
  Recycle,
  Banknote,
  Building2,
  AlertTriangle,
  Search
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const faqCategories = [
  {
    id: 'podstawy',
    name: 'Podstawy',
    icon: ShoppingCart,
    questions: [
      {
        q: 'Co to jest system kaucyjny?',
        a: 'System kaucyjny to sposób na zbieranie pustych butelek i puszek. Przy zakupie napoju płacisz 50 groszy kaucji, a potem odzyskujesz te pieniądze, gdy oddasz puste opakowanie. Proste - kupujesz, pijesz, oddajesz, dostajesz kasę z powrotem.'
      },
      {
        q: 'Ile wynosi kaucja?',
        a: 'Kaucja wynosi 50 groszy za każde opakowanie - niezależnie od jego wielkości. Czy to mała puszka 330 ml czy duża butelka 2 litry - zawsze 50 groszy.'
      },
      {
        q: 'Jakie opakowania są objęte systemem?',
        a: 'System obejmuje trzy rodzaje opakowań: butelki plastikowe (PET) do 3 litrów, butelki szklane wielorazowe oraz puszki aluminiowe. Na każdym opakowaniu znajdziesz specjalny znaczek z symbolem kaucji.'
      },
      {
        q: 'Od kiedy działa system kaucyjny?',
        a: 'System kaucyjny w Polsce wystartował 1 stycznia 2025 roku. Od tego dnia wszystkie napoje w objętych opakowaniach mają doliczaną kaucję.'
      },
      {
        q: 'Czy system jest obowiązkowy?',
        a: 'Tak, system jest obowiązkowy dla wszystkich producentów napojów i sklepów powyżej 200 m². Mniejsze sklepy mogą, ale nie muszą uczestniczyć w systemie.'
      }
    ]
  },
  {
    id: 'zwroty',
    name: 'Zwrot opakowań',
    icon: Recycle,
    questions: [
      {
        q: 'Gdzie mogę oddać puste opakowania?',
        a: 'Opakowania oddasz w recyklomatach (automatach) lub w punktach zbiórki w sklepach. Recyklomaty znajdziesz głównie w supermarketach i przy dużych sklepach. Każdy sklep powyżej 200 m² musi przyjmować zwroty.'
      },
      {
        q: 'Czy muszę mieć paragon?',
        a: 'Nie! To jeden z najczęstszych mitów. Oddajesz opakowanie bez paragonu. Automat rozpoznaje produkt po kodzie kreskowym na etykiecie - nie interesuje go, gdzie i kiedy kupiłeś napój.'
      },
      {
        q: 'Czy mogę oddać opakowanie w innym sklepie niż kupiłem?',
        a: 'Tak, bez problemu. Możesz kupić napój w jednym sklepie, a opakowanie oddać w zupełnie innym. System jest ogólnopolski - nie ma znaczenia, gdzie dokonałeś zakupu.'
      },
      {
        q: 'Czy opakowanie musi być czyste?',
        a: 'Nie musisz myć opakowania. Wystarczy, że jest puste. Jedyny wymóg - etykieta z kodem kreskowym musi być czytelna, bo automat po niej rozpoznaje produkt.'
      },
      {
        q: 'Czy mogę zgnieść butelkę?',
        a: 'Tak, butelka może być lekko zgnieciona - automat i tak ją przyjmie. Ważne tylko, żeby kod kreskowy na etykiecie był widoczny i możliwy do zeskanowania.'
      },
      {
        q: 'Co jeśli automat nie przyjmuje mojego opakowania?',
        a: 'Sprawdź czy etykieta jest czytelna i czy opakowanie jest objęte systemem (szukaj znaczka kaucji). Jeśli wszystko się zgadza, a automat odmawia - zgłoś problem obsłudze sklepu. Może być pełny lub uszkodzony.'
      }
    ]
  },
  {
    id: 'pieniadze',
    name: 'Pieniądze i bony',
    icon: Banknote,
    questions: [
      {
        q: 'Jak odbieram pieniądze za zwrot?',
        a: 'Po wrzuceniu opakowań do recyklomatu naciskasz przycisk „Zakończ". Automat drukuje bon z kwotą do wypłaty. Ten bon realizujesz przy kasie sklepu - możesz dostać gotówkę lub odjąć od zakupów.'
      },
      {
        q: 'Jak długo ważny jest bon?',
        a: 'Zazwyczaj bon jest ważny przez 30 dni - dokładny termin znajdziesz na wydruku. Niektóre sieci mają dłuższy okres ważności. Nie zwlekaj z realizacją!'
      },
      {
        q: 'Czy mogę dostać przelew zamiast bonu?',
        a: 'Niektóre nowoczesne recyklomaty oferują przelew na konto lub wypłatę przez BLIK. Zależy to od konkretnego automatu i sieci sklepów.'
      },
      {
        q: 'Czy muszę coś kupić, żeby zrealizować bon?',
        a: 'Nie, nie musisz robić zakupów. Możesz po prostu podejść do kasy i poprosić o wypłatę gotówki na podstawie bonu. Sklep ma obowiązek to zrobić.'
      },
      {
        q: 'Co jeśli zgubię bon?',
        a: 'Niestety, bon jest jak gotówka - jeśli go zgubisz, tracisz pieniądze. Dlatego realizuj bony od razu lub przechowuj je w bezpiecznym miejscu.'
      }
    ]
  },
  {
    id: 'sklepy',
    name: 'Dla sklepów',
    icon: Building2,
    questions: [
      {
        q: 'Czy mój sklep musi przyjmować zwroty?',
        a: 'Jeśli Twój sklep ma powyżej 200 m² powierzchni sprzedaży - tak, musisz przyjmować zwroty. Mniejsze sklepy mogą dobrowolnie przystąpić do systemu.'
      },
      {
        q: 'Czy muszę mieć recyklomat?',
        a: 'Nie koniecznie. Możesz przyjmować zwroty ręcznie w punkcie zbiórki. Recyklomat jest wygodniejszy przy dużej liczbie zwrotów, ale nie jest obowiązkowy.'
      },
      {
        q: 'Kto płaci za recyklomat?',
        a: 'Koszt recyklomatu ponosi zazwyczaj operator systemu lub sklep - zależy od umowy. Są też modele wynajmu i leasingu.'
      },
      {
        q: 'Jak rozliczam przyjęte opakowania?',
        a: 'Rozliczenia odbywają się przez operatora systemu kaucyjnego. Szczegóły zależą od umowy - skontaktuj się z operatorem działającym w Twoim regionie.'
      }
    ]
  },
  {
    id: 'problemy',
    name: 'Problemy i wyjątki',
    icon: AlertTriangle,
    questions: [
      {
        q: 'Co z opakowaniami kupionymi przed 2025?',
        a: 'Opakowania kupione przed wejściem systemu (bez znaczka kaucji) nie są objęte systemem. Możesz je wyrzucić do żółtego pojemnika na plastik i metal.'
      },
      {
        q: 'Czy opakowania z zagranicy są objęte systemem?',
        a: 'Nie, polski system kaucyjny obejmuje tylko opakowania wprowadzone na polski rynek. Butelki kupione za granicą oddaj do zwykłej segregacji.'
      },
      {
        q: 'Co jeśli etykieta jest zniszczona?',
        a: 'Jeśli kod kreskowy jest nieczytelny, automat nie przyjmie opakowania. W takiej sytuacji wyrzuć je do odpowiedniego pojemnika na segregację.'
      },
      {
        q: 'Czy mogę oddać opakowania 24/7?',
        a: 'To zależy od lokalizacji recyklomatu. Automaty w sklepach działają w godzinach otwarcia. Niektóre zewnętrzne recyklomaty mogą być dostępne całą dobę.'
      },
      {
        q: 'Co z napojami alkoholowymi?',
        a: 'Butelki po piwie i innych napojach alkoholowych również są objęte systemem, jeśli mają odpowiedni znaczek. Puste butelki po winie w szklanych butelkach wielorazowych - tak, jednorazowe - nie.'
      }
    ]
  }
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-start justify-between gap-4 text-left hover:text-primary transition-colors"
      >
        <span className="font-medium text-foreground">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <p className="text-muted-foreground pr-9">{answer}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  
  // Filter questions based on search
  const filteredCategories = faqCategories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      q => 
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 lg:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Najczęściej zadawane pytania
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Wszystko co chcesz wiedzieć o systemie kaucyjnym - bez lania wody, 
            konkretnie i po ludzku.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Szukaj pytania..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 no-scrollbar">
            <Button
              variant={activeCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="shrink-0 rounded-full"
            >
              Wszystkie
            </Button>
            {faqCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="shrink-0 rounded-full gap-2"
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {(activeCategory 
            ? filteredCategories.filter(c => c.id === activeCategory) 
            : filteredCategories
          ).map((category) => (
            <Card key={category.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                </div>
                <div className="divide-y divide-border">
                  {category.questions.map((item, index) => (
                    <FAQItem key={index} question={item.q} answer={item.a} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nie znaleziono pytań pasujących do "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Nie znalazłeś odpowiedzi?
              </h2>
              <p className="text-muted-foreground mb-6">
                Napisz do nas - odpowiemy na każde pytanie!
              </p>
              <Button asChild>
                <Link href="/kontakt">
                  Zadaj pytanie
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
