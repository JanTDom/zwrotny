'use client'

import { useState } from 'react'
import { Mail, Send, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function KontaktPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
    } catch {
      setError('Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Kontakt</h1>
          <p className="text-lg text-muted-foreground">
            Masz pytanie? Napisz do nas - odpowiemy najszybciej jak to możliwe
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact form */}
          <div className="bg-card rounded-2xl border border-border p-8">
            {isSubmitted ? (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Wiadomość wysłana!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Dziękujemy za kontakt. Odpowiemy najszybciej jak to możliwe.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsSubmitted(false)}
                >
                  Wyślij kolejną wiadomość
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Imię
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Twoje imię"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="twoj@email.pl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Wiadomość
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Napisz swoją wiadomość..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wysyłanie...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Wyślij wiadomość
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Dane kontaktowe
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Email ogólny:</span><br />
                  <a href="mailto:kontakt@zwrotny.pl" className="text-primary hover:underline">
                    kontakt@zwrotny.pl
                  </a>
                </p>
                <p>
                  <span className="font-medium text-foreground">Reklama:</span><br />
                  <a href="mailto:reklama@zwrotny.pl" className="text-primary hover:underline">
                    reklama@zwrotny.pl
                  </a>
                </p>
                <p>
                  <span className="font-medium text-foreground">Współpraca biznesowa:</span><br />
                  <a href="mailto:biznes@zwrotny.pl" className="text-primary hover:underline">
                    biznes@zwrotny.pl
                  </a>
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-border p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Czas odpowiedzi
              </h2>
              <p className="text-muted-foreground">
                Staramy się odpowiadać na wszystkie wiadomości w ciągu 
                <span className="font-semibold text-foreground"> 24-48 godzin</span> 
                {' '}w dni robocze.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
