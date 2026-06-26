# PROMPT DLA CLAUDE - Backend ZWROTNY.pl

## KONTEKST PROJEKTU

Budujesz backend REST API dla portalu **ZWROTNY.pl** - polskiego portalu edukacyjno-newsowego o systemie kaucyjnym. Frontend jest gotowy (Next.js na Vercel), potrzebujemy backendu na Railway z PostgreSQL.

**Stack technologiczny:**
- Runtime: Node.js 20+
- Framework: Express.js lub Fastify
- Baza danych: PostgreSQL (Railway)
- ORM: Prisma
- Autoryzacja: JWT (prosty system, 1 admin)
- AI: OpenAI API (generowanie artykułów)
- Hosting: Railway

**URL bazowy API:** `https://api.zwrotny.pl` (lub Railway subdomain)
**Frontend:** `https://zwrotny.pl` (Vercel)

---

## MODELE DANYCH (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ AUTORZY ============
model Author {
  id        String   @id @default(cuid())
  name      String
  avatar    String?
  role      String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ============ ARTYKULY / POSTY ============
model Post {
  id          String       @id @default(cuid())
  slug        String       @unique
  title       String
  excerpt     String
  content     String       @db.Text
  coverImage  String?
  category    PostCategory
  tags        String[]
  authorId    String
  author      Author       @relation(fields: [authorId], references: [id])
  publishedAt DateTime?
  updatedAt   DateTime     @updatedAt
  createdAt   DateTime     @default(now())
  readingTime Int          @default(5)
  featured    Boolean      @default(false)
  status      PostStatus   @default(DRAFT)
  aiGenerated Boolean      @default(false)
  sources     Source[]
  seoTitle       String?
  seoDescription String?
  seoOgImage     String?
  seoKeywords    String[]
  
  // Powiazanie z AI Candidate
  aiCandidateId String?      @unique
  aiCandidate   AICandidate? @relation(fields: [aiCandidateId], references: [id])
}

enum PostCategory {
  aktualnosci
  poradniki
  prawo
  ekologia
  biznes
  technologia
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Source {
  id        String  @id @default(cuid())
  title     String
  url       String
  publisher String?
  postId    String
  post      Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
}

// ============ AI NEWS CANDIDATES ============
model AICandidate {
  id               String            @id @default(cuid())
  originalTitle    String
  originalUrl      String            @unique
  originalSource   String
  originalContent  String            @db.Text
  summary          String?
  relevanceScore   Float             @default(0)
  suggestedCategory PostCategory?
  suggestedTags    String[]
  fetchedAt        DateTime          @default(now())
  status           AICandidateStatus @default(PENDING)
  processedAt      DateTime?
  rejectedReason   String?
  
  // Wygenerowany artykul AI
  aiTitle          String?
  aiExcerpt        String?
  aiContent        String?           @db.Text
  
  // Powiazanie z opublikowanym postem
  post             Post?
  
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}

enum AICandidateStatus {
  PENDING        // czeka na decyzje
  AI_PROCESSING  // AI generuje artykul
  AI_DONE        // AI wygenerowalo, czeka na publikacje
  MANUAL         // do recznej edycji
  REJECTED       // odrzucony
  PUBLISHED      // opublikowany jako post
}

// ============ PORADNIKI ============
model Guide {
  id          String       @id @default(cuid())
  slug        String       @unique
  title       String
  description String
  icon        String       @default("bottle")
  category    String
  difficulty  GuideDifficulty @default(EASY)
  steps       GuideStep[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

enum GuideDifficulty {
  EASY
  MEDIUM
  ADVANCED
}

model GuideStep {
  id       String  @id @default(cuid())
  order    Int
  title    String
  content  String  @db.Text
  image    String?
  guideId  String
  guide    Guide   @relation(fields: [guideId], references: [id], onDelete: Cascade)
}

// ============ MITY VS FAKTY ============
model MythFact {
  id          String   @id @default(cuid())
  myth        String
  fact        String
  explanation String   @db.Text
  source      String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============ YOUTUBE ============
model YouTubeVideo {
  id           String   @id @default(cuid())
  videoId      String   @unique // YouTube video ID
  title        String
  description  String?
  thumbnailUrl String?
  publishedAt  DateTime?
  duration     String?
  views        Int      @default(0)
  isFeatured   Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// ============ BANERY ============
model Banner {
  id        String          @id @default(cuid())
  title     String
  imageUrl  String
  linkUrl   String?
  placement BannerPlacement
  active    Boolean         @default(true)
  order     Int             @default(0)
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
}

enum BannerPlacement {
  HERO
  SIDEBAR
  INLINE
  FOOTER
}

// ============ REKLAMY ============
model Ad {
  id          String      @id @default(cuid())
  title       String
  client      String
  imageUrl    String
  targetUrl   String
  position    AdPosition
  format      AdFormat
  impressions Int         @default(0)
  clicks      Int         @default(0)
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum AdPosition {
  HERO_BANNER
  SIDEBAR
  IN_CONTENT
  FOOTER
}

enum AdFormat {
  BANNER
  SQUARE
  SKYSCRAPER
  NATIVE
}

// ============ USTAWIENIA STRONY ============
model SiteSettings {
  id        String   @id @default("main")
  siteName  String   @default("ZWROTNY.pl")
  tagline   String   @default("Portal, ktory odczarowuje system kaucyjny w Polsce!")
  logoUrl   String?
  
  // Kolory
  colorPrimary    String @default("#00A8E8")
  colorSecondary  String @default("#1a1a2e")
  colorAccent     String @default("#F5A623")
  colorBackground String @default("#ffffff")
  
  // SEO
  seoDefaultTitle       String @default("ZWROTNY.pl - Portal o systemie kaucyjnym")
  seoDefaultDescription String @default("Wszystko o systemie kaucyjnym w Polsce.")
  seoDefaultOgImage     String?
  analyticsId           String?
  
  // Prompty AI
  aiGlobalSystemPrompt String @default("Jestes ekspertem ds. systemu kaucyjnego w Polsce. Pisz rzeczowo, przystepnie i po polsku.")
  aiArticlePrompt      String @default("Na podstawie podanego zrodla napisz artykul informacyjny o systemie kaucyjnym.")
  aiSummaryPrompt      String @default("Stresc podany tekst w 2-3 zdaniach.")
  aiSeoPrompt          String @default("Wygeneruj meta title i description dla artykulu.")
  
  // Konfiguracja sekcji (JSON)
  sectionsConfig String @default("{}") @db.Text
  
  // Konfiguracja reklam (JSON)
  adsConfig String @default("{}") @db.Text
  
  // Menu i footer (JSON)
  headerConfig String @default("{}") @db.Text
  footerConfig String @default("{}") @db.Text
  
  updatedAt DateTime @updatedAt
}

// ============ JOBS (kolejka zadan) ============
model Job {
  id          String    @id @default(cuid())
  type        JobType
  status      JobStatus @default(QUEUED)
  progress    Int       @default(0)
  payload     String    @db.Text // JSON
  result      String?   @db.Text // JSON
  error       String?
  createdAt   DateTime  @default(now())
  startedAt   DateTime?
  completedAt DateTime?
}

enum JobType {
  AI_ARTICLE
  FETCH_NEWS
  GENERATE_IMAGE
  SEO_OPTIMIZATION
}

enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

// ============ ADMIN USER ============
model AdminUser {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?
}
```

---

## ENDPOINTY API

### Autentykacja
```
POST   /api/auth/login          - Logowanie admina (username, password) -> JWT token
POST   /api/auth/logout         - Wylogowanie (uniewaznij token)
GET    /api/auth/me             - Dane zalogowanego admina
```

### Posty / Artykuly
```
GET    /api/posts               - Lista postow (pagination, filters: category, status, featured)
GET    /api/posts/:id           - Post po ID
GET    /api/posts/slug/:slug    - Post po slug (dla frontendu)
POST   /api/posts               - Utworz post [AUTH]
PUT    /api/posts/:id           - Edytuj post [AUTH]
DELETE /api/posts/:id           - Usun post [AUTH]
PATCH  /api/posts/:id/publish   - Opublikuj post [AUTH]
PATCH  /api/posts/:id/feature   - Ustaw jako featured [AUTH]
GET    /api/posts/:id/related   - Powiazane posty (po kategorii)
```

### AI News Candidates (Inbox)
```
GET    /api/ai-candidates                  - Lista kandydatow (filters: status)
GET    /api/ai-candidates/:id              - Szczegoly kandydata
POST   /api/ai-candidates/:id/process-ai   - Generuj artykul przez AI [AUTH]
POST   /api/ai-candidates/:id/process-manual - Oznacz do recznej edycji [AUTH]
POST   /api/ai-candidates/:id/reject       - Odrzuc (z powodem) [AUTH]
POST   /api/ai-candidates/:id/publish      - Publikuj jako post [AUTH]
DELETE /api/ai-candidates/:id              - Usun [AUTH]
```

### Poradniki
```
GET    /api/guides              - Lista poradnikow
GET    /api/guides/:id          - Poradnik po ID
GET    /api/guides/slug/:slug   - Poradnik po slug
POST   /api/guides              - Utworz [AUTH]
PUT    /api/guides/:id          - Edytuj [AUTH]
DELETE /api/guides/:id          - Usun [AUTH]
```

### Mity vs Fakty
```
GET    /api/myths-facts         - Lista (sortowane po order)
GET    /api/myths-facts/:id     - Pojedynczy
POST   /api/myths-facts         - Utworz [AUTH]
PUT    /api/myths-facts/:id     - Edytuj [AUTH]
DELETE /api/myths-facts/:id     - Usun [AUTH]
PATCH  /api/myths-facts/reorder - Zmien kolejnosc [AUTH]
```

### YouTube Videos
```
GET    /api/youtube-videos      - Lista filmow
GET    /api/youtube-videos/:id  - Film po ID
POST   /api/youtube-videos      - Dodaj film (podaj videoId YouTube) [AUTH]
PUT    /api/youtube-videos/:id  - Edytuj [AUTH]
DELETE /api/youtube-videos/:id  - Usun [AUTH]
PATCH  /api/youtube-videos/:id/feature - Ustaw jako featured [AUTH]
```

### Banery
```
GET    /api/banners             - Lista (filters: placement, active)
POST   /api/banners             - Utworz [AUTH]
PUT    /api/banners/:id         - Edytuj [AUTH]
DELETE /api/banners/:id         - Usun [AUTH]
PATCH  /api/banners/reorder     - Zmien kolejnosc [AUTH]
```

### Reklamy
```
GET    /api/ads                 - Lista reklam (filters: position, active)
GET    /api/ads/:id             - Reklama po ID
POST   /api/ads                 - Utworz [AUTH]
PUT    /api/ads/:id             - Edytuj [AUTH]
DELETE /api/ads/:id             - Usun [AUTH]
POST   /api/ads/:id/impression  - Rejestruj wyswietlenie
POST   /api/ads/:id/click       - Rejestruj klikniecie
```

### Ustawienia strony
```
GET    /api/settings            - Pobierz wszystkie ustawienia
PUT    /api/settings            - Zapisz ustawienia [AUTH]
GET    /api/settings/seo        - Tylko SEO
PUT    /api/settings/seo        - Zapisz SEO [AUTH]
GET    /api/settings/ai-prompts - Tylko prompty AI
PUT    /api/settings/ai-prompts - Zapisz prompty AI [AUTH]
GET    /api/settings/sections   - Konfiguracja sekcji
PUT    /api/settings/sections   - Zapisz sekcje [AUTH]
GET    /api/settings/ads-config - Konfiguracja miejsc reklamowych
PUT    /api/settings/ads-config - Zapisz [AUTH]
```

### Jobs (kolejka zadan)
```
GET    /api/jobs                - Lista jobow (filters: type, status)
GET    /api/jobs/:id            - Status joba
DELETE /api/jobs/:id            - Anuluj job [AUTH]
```

### Dashboard / Analytics
```
GET    /api/dashboard/stats     - Statystyki dla dashboardu [AUTH]
                                  (totalPosts, publishedPosts, draftPosts, 
                                   pendingNews, aiProcessing, totalViews, todayViews)
```

### Upload plikow (opcjonalnie)
```
POST   /api/upload              - Upload obrazka [AUTH] -> zwraca URL
```

---

## LOGIKA BIZNESOWA

### 1. Generowanie artykulu przez AI
Gdy admin klika "Zrob AI" na kandydacie:
1. Ustaw status kandydata na `AI_PROCESSING`
2. Utworz Job typu `AI_ARTICLE`
3. W tle (worker):
   a. Pobierz tresc oryginalnego artykulu
   b. Wyslij do OpenAI z promptem z ustawien (`aiArticlePrompt`)
   c. Wygeneruj tytul, excerpt, content
   d. Zapisz w kandydacie (aiTitle, aiExcerpt, aiContent)
   e. Ustaw status na `AI_DONE`
   f. Zaktualizuj Job

### 2. Publikacja artykulu
Gdy admin klika "Publikuj" na kandydacie z AI_DONE:
1. Utworz nowy Post z danymi z kandydata
2. Wygeneruj slug z tytulu
3. Ustaw status posta na `PUBLISHED`
4. Ustaw status kandydata na `PUBLISHED`
5. Powiaz kandydata z postem

### 3. Automatyczne pobieranie newsow (opcjonalnie)
Cron job co godzine:
1. Pobierz RSS z wybranych zrodel (PAP, TVN24 Business, itp.)
2. Filtruj po slowach kluczowych (kaucja, recykling, butelki, puszki, etc.)
3. Sprawdz czy URL juz istnieje w bazie
4. Dodaj nowe jako AICandidate ze statusem PENDING
5. Opcjonalnie: oblicz relevanceScore przez AI

### 4. Obliczanie readingTime
Przy zapisie posta:
- readingTime = Math.ceil(wordCount / 200)

### 5. Generowanie slug
- Usun polskie znaki (a->a, e->e, etc.)
- Zamien spacje na myslniki
- Usun znaki specjalne
- Lowercase
- Dodaj suffix jesli slug istnieje

---

## ZMIENNE SRODOWISKOWE

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/zwrotny?schema=public"

# JWT
JWT_SECRET="super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"

# Admin (do seedowania)
ADMIN_USERNAME="JanTDom"
ADMIN_PASSWORD="A132a132!"

# CORS
FRONTEND_URL="https://zwrotny.pl"

# Port
PORT=3001
```

---

## SEED DATABASE

Utworz plik `prisma/seed.ts`:
1. Utworz admina z zaszyfrowanym haslem (bcrypt)
2. Utworz domyslne SiteSettings
3. Utworz przykladowego autora "AI Assistant"
4. Opcjonalnie: dodaj kilka przykladowych postow, poradnikow, mitow

---

## STRUKTURA PROJEKTU

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express/Fastify setup
│   ├── config/
│   │   └── env.ts               # Environment variables
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── cors.ts              # CORS config
│   │   └── errorHandler.ts      # Global error handler
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── posts.routes.ts
│   │   ├── ai-candidates.routes.ts
│   │   ├── guides.routes.ts
│   │   ├── myths-facts.routes.ts
│   │   ├── youtube.routes.ts
│   │   ├── banners.routes.ts
│   │   ├── ads.routes.ts
│   │   ├── settings.routes.ts
│   │   ├── jobs.routes.ts
│   │   └── dashboard.routes.ts
│   ├── controllers/
│   │   └── [odpowiadajace kontrolery]
│   ├── services/
│   │   ├── ai.service.ts        # OpenAI integration
│   │   ├── auth.service.ts      # JWT, password hashing
│   │   └── slug.service.ts      # Slug generation
│   ├── utils/
│   │   ├── prisma.ts            # Prisma client singleton
│   │   └── helpers.ts
│   └── types/
│       └── index.ts             # TypeScript types
├── package.json
├── tsconfig.json
├── .env.example
└── railway.json                 # Railway config
```

---

## WYMAGANIA NIEFUNKCJONALNE

1. **Walidacja** - Uzyj Zod do walidacji body requestow
2. **Pagination** - Kazdy list endpoint: `?page=1&limit=20`
3. **Error handling** - Spojny format bledow: `{ success: false, error: string, code?: string }`
4. **Success response** - Format: `{ success: true, data: T, pagination?: {...} }`
5. **CORS** - Tylko frontend URL + localhost w dev
6. **Rate limiting** - 100 req/min dla publicznych, 500 dla auth
7. **Logging** - Loguj wszystkie requesty i bledy
8. **Health check** - `GET /health` zwraca `{ status: "ok" }`

---

## DEPLOYMENT NA RAILWAY

1. Stworz nowy projekt na Railway
2. Dodaj PostgreSQL database
3. Dodaj Web Service z GitHub repo
4. Ustaw zmienne srodowiskowe
5. Railway automatycznie wykryje Node.js i uruchomi

**railway.json:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

---

## GOTOWE - CO DALEJ

Po wygenerowaniu backendu:
1. Stworz repo na GitHub
2. Deploy na Railway
3. Ustaw NEXT_PUBLIC_API_URL na Vercel do Railway URL
4. Zamien mock-data na prawdziwe wywolania API we frontendzie

---

## ROZSZERZALNOSC I PRZYSZLE FUNKCJE

Backend musi byc zaprojektowany z mysla o rozbudowie. Projekt bedzie rozwijany, wiec architektura powinna byc:

### Zasady rozszerzalnosci:
1. **Modularnosc** - Kazdy modul (posts, guides, ads, etc.) w osobnym katalogu z wlasnym routerem, kontrolerem, serwisem
2. **Interfejsy** - Definiuj interfejsy dla serwisow, zeby mozna bylo latwo podmienic implementacje
3. **Middleware jako pluginy** - Middleware powinno byc latwo dodawalne/usuwalne
4. **Feature flags** - Dodaj tabele `FeatureFlag` do wlaczania/wylaczania funkcji bez deployu
5. **Webhooks** - Przygotuj infrastrukture do wysylania webhookow przy eventach (nowy post, etc.)
6. **API versioning** - Uzyj prefiksu `/api/v1/` dla wszystkich endpointow

### Przygotuj miejsce na przyszle funkcje:

```prisma
// Dodaj do schema.prisma:

// Feature flags
model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique
  enabled     Boolean  @default(false)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Newsletter subscribers (przyszlosc)
model NewsletterSubscriber {
  id            String    @id @default(cuid())
  email         String    @unique
  isConfirmed   Boolean   @default(false)
  confirmedAt   DateTime?
  unsubscribedAt DateTime?
  createdAt     DateTime  @default(now())
}

// Komentarze (przyszlosc)
model Comment {
  id        String   @id @default(cuid())
  content   String
  authorName String
  authorEmail String?
  postId    String
  parentId  String?  // dla nested comments
  approved  Boolean  @default(false)
  createdAt DateTime @default(now())
}

// Statystyki odslon (przyszlosc)
model PageView {
  id        String   @id @default(cuid())
  path      String
  postId    String?
  userAgent String?
  ip        String?
  country   String?
  createdAt DateTime @default(now())
  
  @@index([path])
  @@index([postId])
  @@index([createdAt])
}

// Ankiety/Quizy (przyszlosc)
model Quiz {
  id          String       @id @default(cuid())
  title       String
  description String?
  questions   QuizQuestion[]
  isActive    Boolean      @default(false)
  createdAt   DateTime     @default(now())
}

model QuizQuestion {
  id        String   @id @default(cuid())
  quizId    String
  quiz      Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question  String
  options   String[] // JSON array of options
  correctIndex Int
  order     Int
}

// Mapa punktow zbioru (przyszlosc)
model CollectionPoint {
  id          String   @id @default(cuid())
  name        String
  address     String
  city        String
  postalCode  String
  latitude    Float
  longitude   Float
  type        String   // recyklomat, sklep, punkt zbioru
  operator    String?
  openingHours String?
  acceptsTypes String[] // butelki plastikowe, szklane, puszki
  isVerified  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([city])
  @@index([latitude, longitude])
}

// Kontakt / Zgloszenia
model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  subject   String
  message   String   @db.Text
  isRead    Boolean  @default(false)
  repliedAt DateTime?
  createdAt DateTime @default(now())
}

// Partnerzy / Sponsorzy
model Partner {
  id          String   @id @default(cuid())
  name        String
  logoUrl     String
  websiteUrl  String?
  description String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// Logi aktywnosci admina (audyt)
model AuditLog {
  id          String   @id @default(cuid())
  adminId     String
  action      String   // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityType  String   // Post, Guide, Ad, etc.
  entityId    String?
  oldValue    String?  @db.Text // JSON
  newValue    String?  @db.Text // JSON
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  @@index([adminId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### Dodatkowe endpointy (placeholder - do implementacji pozniej):
```
# Newsletter
POST   /api/v1/newsletter/subscribe     - Zapisz do newslettera
POST   /api/v1/newsletter/confirm/:token - Potwierdz email
POST   /api/v1/newsletter/unsubscribe   - Wypisz

# Komentarze
GET    /api/v1/posts/:id/comments       - Lista komentarzy
POST   /api/v1/posts/:id/comments       - Dodaj komentarz

# Statystyki
POST   /api/v1/analytics/pageview       - Rejestruj odslone
GET    /api/v1/analytics/stats          - Statystyki [AUTH]

# Mapa
GET    /api/v1/collection-points        - Lista punktow (filters: city, type)
GET    /api/v1/collection-points/nearby - Najblizsze punkty (lat, lng, radius)
POST   /api/v1/collection-points        - Dodaj punkt [AUTH]

# Kontakt
POST   /api/v1/contact                  - Wyslij wiadomosc
GET    /api/v1/contact                  - Lista wiadomosci [AUTH]

# Quizy
GET    /api/v1/quizzes                  - Lista quizow
GET    /api/v1/quizzes/:id              - Quiz ze pytaniami
POST   /api/v1/quizzes/:id/submit       - Wyslij odpowiedzi

# Audit
GET    /api/v1/audit-logs               - Logi aktywnosci [AUTH]
```

### Wskazowki dla rozszerzalnosci:
1. **Serwisy jako klasy** - Uzyj klas z dependency injection, nie zwyklych funkcji
2. **Event emitter** - Dodaj centralny event bus do emitowania eventow (PostCreated, UserLoggedIn, etc.)
3. **Repository pattern** - Rozważ dodanie warstwy repository miedzy serwisami a Prisma
4. **Config driven** - Trzymaj konfiguracje w bazie (SiteSettings) nie w kodzie
5. **Graceful degradation** - Jezeli AI nie dziala, pozwol na reczne tworzenie
6. **Backward compatibility** - Nie usuwaj pol, oznaczaj jako deprecated

---

## UWAGI KONCOWE

- **Jezyk**: Wszystkie stringi w kodzie po angielsku, ale dane (tresci) po polsku
- **Timezone**: Uzyj UTC dla dat
- **Hasla**: Nigdy nie zwracaj passwordHash w response
- **Soft delete**: Dodaj `deletedAt` zamiast twardego usuwania dla waznych encji (Post, Guide, etc.)
- **Cache**: Rozważ Redis dla czesto odpytywanych danych (opcjonalnie)
- **Rate limiting**: Uzyj sliding window algorithm
- **Monitoring**: Przygotuj integracje z Sentry lub podobnym
- **Backup**: Konfiguruj automatyczne backupy bazy na Railway
