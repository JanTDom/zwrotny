'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    await new Promise(resolve => setTimeout(resolve, 1000))
    setStatus('success')
    setEmail('')
  }

  return (
    <section className="relative py-12 lg:py-16 overflow-hidden my-8">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', borderRadius: '1rem' }} />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Newsletter
          </div>
          
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Bądź na bieżąco
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8">
            Dołącz do tysięcy osób, które są na bieżąco z systemem kaucyjnym. Zero spamu.
          </p>

          {status === 'success' ? (
            <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-primary/10 border border-primary/20">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span className="text-foreground font-medium">Dziękujemy za zapisanie się!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Input
                type="email"
                placeholder="Twój email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-full px-6 flex-1"
              />
              <Button 
                type="submit" 
                size="lg"
                className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </>
                ) : (
                  <>
                    Zapisz się
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-6">
            Możesz zrezygnować w każdej chwili. Nie wysyłamy spamu.
          </p>
        </div>
      </div>
    </section>
  )
}
