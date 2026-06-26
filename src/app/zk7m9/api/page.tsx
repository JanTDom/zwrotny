'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Save, Key, Server, RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/hooks/use-admin-data'

type ConnectionStatus = 'connected' | 'disconnected' | 'error'

interface ApiConfig {
  name: string
  description: string
  envKey: string
  value: string
  status: ConnectionStatus
  required: boolean
}

const defaultConfigs: ApiConfig[] = [
  {
    name: 'OpenAI API',
    description: 'Klucz do generowania treści AI (wymagany dla AI Inbox)',
    envKey: 'OPENAI_API_KEY',
    value: '',
    status: 'disconnected',
    required: true,
  },
  {
    name: 'Google News API (SerpApi)',
    description: 'Pobieranie newsów do AI Inbox',
    envKey: 'GOOGLE_NEWS_API_KEY',
    value: '',
    status: 'disconnected',
    required: false,
  },
  {
    name: 'YouTube Data API',
    description: 'Pobieranie filmów z YouTube',
    envKey: 'YOUTUBE_API_KEY',
    value: '',
    status: 'disconnected',
    required: false,
  },
  {
    name: 'SendGrid',
    description: 'Wysyłanie emaili i newsletterów',
    envKey: 'SENDGRID_API_KEY',
    value: '',
    status: 'disconnected',
    required: false,
  },
  {
    name: 'Unsplash Access Key',
    description: 'Darmowe zdjecia stockowe (unsplash.com/developers) — do wyszukiwarki zdjec w artykule',
    envKey: 'UNSPLASH_ACCESS_KEY',
    value: '',
    status: 'disconnected',
    required: false,
  },
  {
    name: 'Pexels API Key',
    description: 'Darmowe zdjecia stockowe (pexels.com/api) — do wyszukiwarki zdjec w artykule',
    envKey: 'PEXELS_API_KEY',
    value: '',
    status: 'disconnected',
    required: false,
  },
]

export default function APIPage() {
  const [configs, setConfigs] = useState<ApiConfig[]>(defaultConfigs)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load saved configs from Supabase
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const response = await adminApi.getSettings()
        const data = response.data as { apiConfigs?: ApiConfig[] } | null
        if (data?.apiConfigs && Array.isArray(data.apiConfigs) && data.apiConfigs.length > 0) {
          const savedConfigs = data.apiConfigs
          const mergedConfigs = defaultConfigs.map(defaultConfig => {
            const savedConfig = savedConfigs.find(c => c.envKey === defaultConfig.envKey)
            if (savedConfig) {
              return { ...defaultConfig, value: savedConfig.value, status: savedConfig.status }
            }
            return defaultConfig
          })
          setConfigs(mergedConfigs)
        }
      } catch (e) {
        console.error('Failed to load API configs from Supabase:', e)
        toast.error('Nie udało się załadować konfiguracji API')
      }
      
      setIsLoaded(true)
    }
    loadConfigs()
  }, [])

  const [webhooks, setWebhooks] = useState({
    onNewPost: true,
    onAiSuggestion: true,
    onError: false,
  })

  const updateConfig = (index: number, value: string) => {
    setConfigs(prev => prev.map((c, i) => 
      i === index ? { ...c, value } : c
    ))
  }

  const testConnection = async (index: number) => {
    // TODO: Faktyczny test połączenia z backendem
    setConfigs(prev => prev.map((c, i) => 
      i === index ? { ...c, status: c.value ? 'connected' : 'disconnected' } : c
    ))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await adminApi.updateSettings({ apiConfigs: configs, webhooks })
      toast.success('Konfiguracja API zapisana w Supabase')
    } catch (e) {
      console.error('Failed to save API configs to Supabase:', e)
      toast.error('Nie udało się zapisać konfiguracji')
    }
    setIsSaving(false)
  }

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'Połączono'
      case 'error':
        return 'Błąd połączenia'
      default:
        return 'Nie skonfigurowano'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Konfiguracja API</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj połączeniami z zewnętrznymi serwisami</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isSaving ? 'Zapisuję...' : 'Zapisz wszystko'}
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{configs.filter(c => c.status === 'connected').length}</p>
                <p className="text-sm text-muted-foreground">Połączonych</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{configs.filter(c => c.status === 'disconnected' && c.required).length}</p>
                <p className="text-sm text-muted-foreground">Wymaganych</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{configs.filter(c => c.status === 'error').length}</p>
                <p className="text-sm text-muted-foreground">Błędów</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Configurations */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Klucze API
          </CardTitle>
          <CardDescription>Skonfiguruj połączenia z zewnętrznymi serwisami</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configs.map((config, index) => (
            <div key={config.envKey} className="p-4 rounded-lg border border-border bg-background">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{config.name}</h3>
                    {config.required && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Wymagane</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.status)}
                  <span className="text-sm text-muted-foreground">{getStatusText(config.status)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">{config.envKey}</label>
                  <Input
                    type="password"
                    value={config.value}
                    onChange={(e) => updateConfig(index, e.target.value)}
                    placeholder={`Wprowadź ${config.name}...`}
                    className="bg-muted/50 font-mono text-sm"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => testConnection(index)}
                  className="self-end"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Webhooks
          </CardTitle>
          <CardDescription>Powiadomienia zwrotne do backendu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-background">
            <div>
              <p className="font-medium">Nowy wpis opublikowany</p>
              <p className="text-sm text-muted-foreground">Webhook przy publikacji nowego artykułu</p>
            </div>
            <Switch
              checked={webhooks.onNewPost}
              onCheckedChange={(checked) => setWebhooks({ ...webhooks, onNewPost: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-background">
            <div>
              <p className="font-medium">Sugestia AI</p>
              <p className="text-sm text-muted-foreground">Webhook gdy AI zasugeruje nowy temat</p>
            </div>
            <Switch
              checked={webhooks.onAiSuggestion}
              onCheckedChange={(checked) => setWebhooks({ ...webhooks, onAiSuggestion: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-background">
            <div>
              <p className="font-medium">Błędy systemu</p>
              <p className="text-sm text-muted-foreground">Webhook przy błędach krytycznych</p>
            </div>
            <Switch
              checked={webhooks.onError}
              onCheckedChange={(checked) => setWebhooks({ ...webhooks, onError: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Supabase Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Baza danych - Supabase</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2">
            <div className="flex items-center gap-2 text-green-500 font-medium">
              <CheckCircle className="w-5 h-5" />
              Backend Supabase jest automatycznie skonfigurowany
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Wszystkie dane (artykuły, poradniki, mity, filmy, ustawienia) są przechowywane w Supabase.
              Zmienne środowiskowe są automatycznie ustawione przez integrację v0.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm space-y-2 mt-4">
            <p className="text-muted-foreground"># Tabele w Supabase:</p>
            <p>posts - artykuły i newsy</p>
            <p>guides - poradniki krok po kroku</p>
            <p>myths - mity vs fakty</p>
            <p>videos - filmy YouTube</p>
            <p>banners - banery reklamowe</p>
            <p>settings - klucze API i prompty (ta strona)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
