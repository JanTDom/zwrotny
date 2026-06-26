'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Save, Palette, Upload, Loader2, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

const DEFAULT_SETTINGS = {
  siteName: 'ZWROTNY.pl',
  tagline: 'Portal, który odczarowuje system kaucyjny w Polsce!',
  logoUrl: '',
  faviconUrl: '',
  colors: {
    primary: '#00A8E8',
    secondary: '#0077B6',
    accent: '#F5A623',
    background: '#ffffff',
  },
  header: {
    showTagline: true,
    ctaText: 'Znajdź automat',
    ctaUrl: '/mapa',
  },
  footer: {
    copyright: '© 2025 ZWROTNY.pl. Wszelkie prawa zastrzeżone.',
    socialLinks: [
      { platform: 'YouTube', url: 'https://youtube.com/@zwrotny' },
      { platform: 'Instagram', url: 'https://instagram.com/zwrotny.pl' },
      { platform: 'Twitter', url: 'https://twitter.com/zwrotnypl' },
    ],
  },
}

type SiteStyle = typeof DEFAULT_SETTINGS

export default function StylePage() {
  const [settings, setSettings] = useState<SiteStyle>(DEFAULT_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<SiteStyle>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  // Load settings from Supabase on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings')
        const json = await res.json()
        const siteStyle = json.data?.site_style as SiteStyle | undefined
        if (siteStyle) {
          const merged = { ...DEFAULT_SETTINGS, ...siteStyle }
          setSettings(merged)
          setSavedSettings(merged)
        }
      } catch (err) {
        console.error('[v0] Failed to load site style:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_style: settings }),
      })
      if (!res.ok) throw new Error('Błąd zapisu')
      setSavedSettings(settings)
      toast.success('Ustawienia stylu zapisane')
    } catch (err) {
      console.error('[v0] Save error:', err)
      toast.error('Nie udało się zapisać ustawień')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpload = async (file: File, type: 'logo' | 'favicon') => {
    const setUploading = type === 'logo' ? setIsUploadingLogo : setIsUploadingFavicon
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      const res = await fetch('/api/upload/branding', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Błąd przesyłania')
      const data = await res.json()
      const url: string = data.url
      // Store URL in settings so it gets saved with the rest
      setSettings(prev => ({
        ...prev,
        ...(type === 'logo' ? { logoUrl: url } : { faviconUrl: url }),
      }))
      toast.success(type === 'logo' ? 'Logo wgrane — kliknij Zapisz zmiany' : 'Favicon wgrany — kliknij Zapisz zmiany')
    } catch (err) {
      toast.error('Błąd przesyłania pliku')
      console.error('[v0] Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const updateColor = (key: keyof SiteStyle['colors'], value: string) => {
    setSettings(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ustawienia stylu</h1>
          <p className="text-muted-foreground">Dostosuj wygląd portalu ZWROTNY.pl</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Podgląd
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="gap-2"
          >
            {isSaving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Save className="h-4 w-4" />}
            Zapisz zmiany
          </Button>
        </div>
      </div>

      {isDirty && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Masz niezapisane zmiany
        </div>
      )}

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="colors">Kolory</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* BRANDING */}
        <TabsContent value="branding" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo i nazwa</CardTitle>
              <CardDescription>Podstawowe elementy identyfikacji wizualnej</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Nazwa strony</Label>
                  <Input
                    id="site-name"
                    value={settings.siteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Hasło (tagline)</Label>
                  <Input
                    id="tagline"
                    value={settings.tagline}
                    onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                  />
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden shrink-0">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-xl">Z</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/svg+xml,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleUpload(file, 'logo')
                          e.target.value = ''
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={isUploadingLogo}
                      onClick={(e) => { e.preventDefault(); logoInputRef.current?.click() }}
                    >
                      {isUploadingLogo
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Upload className="h-4 w-4" />}
                      {isUploadingLogo ? 'Przesyłam...' : 'Prześlij logo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Zalecany format: SVG lub PNG, min. 200×200px
                    </p>
                    {settings.logoUrl && (
                      <button
                        className="text-xs text-destructive hover:underline"
                        onClick={() => setSettings(prev => ({ ...prev, logoUrl: '' }))}
                      >
                        Usuń logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden shrink-0">
                    {settings.faviconUrl ? (
                      <img src={settings.faviconUrl} alt="Favicon" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">Z</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/x-icon,image/png,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleUpload(file, 'favicon')
                          e.target.value = ''
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={isUploadingFavicon}
                      onClick={(e) => { e.preventDefault(); faviconInputRef.current?.click() }}
                    >
                      {isUploadingFavicon
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Upload className="h-4 w-4" />}
                      {isUploadingFavicon ? 'Przesyłam...' : 'Prześlij favicon'}
                    </Button>
                    {settings.faviconUrl && (
                      <button
                        className="block text-xs text-destructive hover:underline"
                        onClick={() => setSettings(prev => ({ ...prev, faviconUrl: '' }))}
                      >
                        Usuń favicon
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COLORS */}
        <TabsContent value="colors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Paleta kolorów
              </CardTitle>
              <CardDescription>Dostosuj kolory używane na portalu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {(
                  [
                    { key: 'primary', label: 'Kolor główny (Primary)' },
                    { key: 'secondary', label: 'Kolor dodatkowy (Secondary)' },
                    { key: 'accent', label: 'Kolor akcentu (Accent)' },
                    { key: 'background', label: 'Kolor tła (Background)' },
                  ] as { key: keyof SiteStyle['colors']; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={settings.colors[key]}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer p-0.5 bg-transparent"
                      />
                      <Input
                        value={settings.colors[key]}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-4">Podgląd kolorów</h4>
                <div className="flex gap-4 flex-wrap">
                  {(['primary', 'secondary', 'accent', 'background'] as const).map(key => (
                    <div key={key} className="text-center">
                      <div
                        className="w-16 h-16 rounded-lg mb-2 border"
                        style={{ backgroundColor: settings.colors[key] }}
                      />
                      <span className="text-xs capitalize">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HEADER */}
        <TabsContent value="header" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia headera</CardTitle>
              <CardDescription>Konfiguruj górną część strony</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pokaż tagline</Label>
                  <p className="text-sm text-muted-foreground">Wyświetlaj hasło pod logo w headerze</p>
                </div>
                <Switch
                  checked={settings.header.showTagline}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, header: { ...prev.header, showTagline: checked } }))
                  }
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cta-text">Tekst CTA</Label>
                  <Input
                    id="cta-text"
                    value={settings.header.ctaText}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, header: { ...prev.header, ctaText: e.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta-url">Link CTA</Label>
                  <Input
                    id="cta-url"
                    value={settings.header.ctaUrl}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, header: { ...prev.header, ctaUrl: e.target.value } }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOOTER */}
        <TabsContent value="footer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia footera</CardTitle>
              <CardDescription>Konfiguruj stopkę strony</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="copyright">Tekst copyright</Label>
                <Input
                  id="copyright"
                  value={settings.footer.copyright}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, footer: { ...prev.footer, copyright: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Linki społecznościowe</Label>
                <div className="space-y-3">
                  {settings.footer.socialLinks.map((social, index) => (
                    <div key={social.platform} className="flex gap-2">
                      <Input value={social.platform} disabled className="w-32" />
                      <Input
                        value={social.url}
                        onChange={(e) => {
                          const newLinks = [...settings.footer.socialLinks]
                          newLinks[index] = { ...social, url: e.target.value }
                          setSettings(prev => ({ ...prev, footer: { ...prev.footer, socialLinks: newLinks } }))
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
