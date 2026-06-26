/**
 * Semantic scoring engine for news ticker items.
 * Determines relevance of a news item for zwrotny.pl (deposit return, recycling, ROP, packaging).
 *
 * CONNECT CMS: scoring weights can be made configurable via ticker_settings in future iterations.
 */

export interface ScoringInput {
  title: string
  excerpt?: string | null
  sourceTrustLevel: 'wysokie' | 'srednie' | 'niskie'
  publishedAt?: string | Date | null
  isPinned?: boolean
}

// Core topic keywords — high-confidence relevance signals (each match +12)
const CORE_KEYWORDS = [
  'system kaucyjny', 'kaucja', 'opłata kaucyjna', 'recyklomat', 'rvm', 'automat do zwrotu',
  'zwrot butelek', 'zwrot opakowań', 'butelka pet', 'butelka szklana', 'puszka aluminiowa',
  'opakowanie po napoju', 'opakowania wielokrotnego użytku', 'rop', 'rozszerzona odpowiedzialność producenta',
  'epr', 'ppwr', 'sup', 'dyrektywa sup', 'opakowania jednorazowe', 'plastik jednorazowy',
  'recykling opakowań', 'poziom recyklingu', 'poziom zbioru', 'selektywna zbiórka', 'zbiorka selektywna',
  'goz', 'gospodarka obiegu zamkniętego', 'circular economy', 'bdo', 'ewidencja odpadów',
  'opłata produktowa', 'opłata środowiskowa', 'gospodarka odpadami komunalnymi',
  'operator systemu kaucyjnego', 'polskarecykling', 'rekopol', 'interzero', 'tomra',
  'greenwashing', 'oznakowanie eko', 'ślad środowiskowy', 'espr',
]

// Secondary keywords — good signals but need context (+7 each)
const SECONDARY_KEYWORDS = [
  'recykling', 'opakowania', 'odpady', 'plastik', 'pet', 'aluminium', 'szkło opakowaniowe',
  'producent', 'importor', 'wprowadzający opakowania', 'punkt zbiórki', 'sklep przyjmuje',
  'legislacja', 'rozporządzenie', 'projekt ustawy', 'dyrektywa ue', 'prawo środowiskowe',
  'klimat', 'srodowisko', 'ekologia', 'dekarbonizacja opakowań',
  'zakup opakowań', 'konsument', 'edukacja ekologiczna',
]

// Disqualifying signals — article is NOT about our domain despite having eco keywords (-25 each)
const DISQUALIFIER_KEYWORDS = [
  'energetyka jądrowa', 'atom', 'elektrownia wiatrowa', 'fotowoltaika', 'odnawialne źródła energii',
  'owe', 'magazyn energii', 'sieć energetyczna', 'taryfa energetyczna',
  'polityka personalna', 'restrukturyzacja', 'fuzja spółek', 'wyniki finansowe', 'kurs akcji',
  'pogoda', 'susza', 'powódź', 'pożar lasu', 'trzęsienie ziemi', 'katastrofa naturalna',
  'szczyt klimatyczny bez opakowań', 'konferencja cop', 'emisje co2 bez odpadów',
]

/**
 * Computes a relevance score 0–100 for a news item.
 * Score >= 80: show in ticker always
 * Score 60–79: show only if not enough high-quality items
 * Score < 60: skip
 */
export function computeRelevanceScore(input: ScoringInput): number {
  const text = `${input.title} ${input.excerpt ?? ''}`.toLowerCase()

  let score = 0

  // Core keyword matches
  for (const kw of CORE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score += 12
  }

  // Secondary keyword matches
  for (const kw of SECONDARY_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score += 7
  }

  // Disqualifiers
  for (const kw of DISQUALIFIER_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score -= 25
  }

  // Trust level bonus
  if (input.sourceTrustLevel === 'wysokie') score += 8
  else if (input.sourceTrustLevel === 'srednie') score += 3

  // Freshness bonus
  if (input.publishedAt) {
    const ageHours = (Date.now() - new Date(input.publishedAt).getTime()) / 3600000
    if (ageHours < 12) score += 10
    else if (ageHours < 24) score += 7
    else if (ageHours < 72) score += 4
  }

  // Pinned items always pass
  if (input.isPinned) return 100

  return Math.max(0, Math.min(100, score))
}

/**
 * Returns only items that pass the relevance threshold, sorted by score desc.
 * Pinned items always appear first.
 */
export function filterAndRankItems<T extends { relevanceScore: number; isPinned?: boolean; isHidden?: boolean }>(
  items: T[],
  maxItems: number
): T[] {
  const visible = items.filter(i => !i.isHidden)
  const pinned = visible.filter(i => i.isPinned)
  const rest = visible.filter(i => !i.isPinned)

  // Sort by score descending — take top maxItems
  const sorted = rest
    .filter(i => i.relevanceScore >= 8)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxItems - pinned.length)

  return [...pinned, ...sorted]
}
