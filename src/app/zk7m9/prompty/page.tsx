'use client'

import { useState, useEffect } from 'react'
import { Save, Sparkles, RotateCcw, Loader2, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { adminApi } from '@/hooks/use-admin-data'

const defaultPrompts = {
  globalSystemPrompt: 'Jesteś doświadczonym dziennikarzem piszącym o systemie kaucyjnym w Polsce. Twój styl jest konkretny, żywy i angażujący — bez urzędowego żargonu, bez pustych zwrotów ("warto zaznaczyć", "należy podkreślić", "co jest istotne"). Piszesz tak, żeby czytelnik naprawdę chciał to przeczytać. Używasz aktywnej formy czasownika i konkretnych faktów.',
  articlePrompt: 'Pisz jak doświadczony dziennikarz — konkretnie, żywo, bez urzędowego tonu.\n\nZASADY STYLU:\n- Zacznij od mocnego zdania, które od razu wciąga w temat — bez "W kontekście...", "Warto zaznaczyć..."\n- Unikaj fraz: "warto zauważyć", "należy podkreślić", "co jest istotne", "warto zaznaczyć", "Ministerstwo podkreśla"\n- Używaj aktywnej formy: "Ministerstwo wyjaśniło" zamiast "Zostało wyjaśnione przez Ministerstwo"\n- Cytaty ekspertów wstawiaj naturalnie, bez komentarza że "ekspert podkreśla" czy "specjalista zaznacza"\n- Piszesz do konkretnego czytelnika: przedsiębiorcy lub konsumenta, który chce wiedzieć co to oznacza DLA NIEGO\n- Długość: 400-600 słów\n- Styl: prasowy, nie encyklopedyczny',
  summaryPrompt: 'Streść podany tekst w 2-3 zdaniach. Skup się na tym co jest najważniejsze dla czytelnika — co zmienia, co oznacza w praktyce. Bez fraz "artykuł omawia" czy "tekst dotyczy".',
  seoPrompt: 'Wygeneruj meta title (max 60 znaków) i meta description (max 160 znaków) dla artykułu. Użyj słów kluczowych związanych z systemem kaucyjnym. Meta title: konkretny i chwytliwy. Meta description: zachęca do kliknięcia, zawiera główną korzyść dla czytelnika.',
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState(defaultPrompts)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('global')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load prompts from Supabase
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const response = await adminApi.getSettings()
        const data = response.data as { prompts?: Record<string, string> } | null
        if (data?.prompts && Object.keys(data.prompts).length > 0) {
          setPrompts(prev => ({ ...prev, ...data.prompts }))
        }
      } catch (e) {
        console.error('Failed to load prompts from Supabase:', e)
        toast.error('Nie udało się załadować promptów')
      }
      
      setIsLoaded(true)
    }
    loadPrompts()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await adminApi.updateSettings({ prompts })
      toast.success('Prompty zapisane w Supabase')
    } catch (e) {
      console.error('Failed to save prompts to Supabase:', e)
      toast.error('Nie udało się zapisać promptów')
    }
    setIsSaving(false)
  }

  const resetToDefault = (key: keyof typeof defaultPrompts) => {
    setPrompts(prev => ({
      ...prev,
      [key]: defaultPrompts[key],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prompty AI</h1>
          <p className="text-muted-foreground">
            Konfiguruj prompty używane przez AI do generowania treści
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Zapisz zmiany
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Prompty definiują jak AI generuje treści. Dobrze skonfigurowane prompty 
          zapewniają spójność i jakość generowanych artykułów.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global">Globalny</TabsTrigger>
          <TabsTrigger value="article">Artykuły</TabsTrigger>
          <TabsTrigger value="summary">Podsumowania</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    System Prompt (globalny)
                  </CardTitle>
                  <CardDescription>
                    Główne instrukcje definiujące zachowanie AI we wszystkich zadaniach
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetToDefault('globalSystemPrompt')}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetuj
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompts.globalSystemPrompt}
                onChange={(e) => setPrompts(prev => ({ ...prev, globalSystemPrompt: e.target.value }))}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Ten prompt jest dodawany na początku każdego zapytania do AI.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="article" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prompt generowania artykułów</CardTitle>
                  <CardDescription>
                    Instrukcje dla AI jak tworzyć artykuły na podstawie źródeł
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetToDefault('articlePrompt')}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetuj
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompts.articlePrompt}
                onChange={(e) => setPrompts(prev => ({ ...prev, articlePrompt: e.target.value }))}
                rows={12}
                className="font-mono text-sm"
              />
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Dostępne zmienne:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><code className="bg-background px-1 rounded">{'{{source_title}}'}</code> - Tytuł źródła</li>
                  <li><code className="bg-background px-1 rounded">{'{{source_content}}'}</code> - Treść źródła</li>
                  <li><code className="bg-background px-1 rounded">{'{{source_url}}'}</code> - URL źródła</li>
                  <li><code className="bg-background px-1 rounded">{'{{category}}'}</code> - Kategoria artykułu</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prompt podsumowań</CardTitle>
                  <CardDescription>
                    Instrukcje dla AI jak tworzyć krótkie podsumowania
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetToDefault('summaryPrompt')}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetuj
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompts.summaryPrompt}
                onChange={(e) => setPrompts(prev => ({ ...prev, summaryPrompt: e.target.value }))}
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prompt SEO</CardTitle>
                  <CardDescription>
                    Instrukcje dla AI jak generować meta dane SEO
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetToDefault('seoPrompt')}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetuj
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompts.seoPrompt}
                onChange={(e) => setPrompts(prev => ({ ...prev, seoPrompt: e.target.value }))}
                rows={6}
                className="font-mono text-sm"
              />
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Wytyczne SEO:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Meta title: max 60 znaków</li>
                  <li>Meta description: max 160 znaków</li>
                  <li>Używaj słów kluczowych na początku tytułu</li>
                  <li>Opis powinien zachęcać do kliknięcia</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
