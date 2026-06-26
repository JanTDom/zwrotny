'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type State = 'idle' | 'loading' | 'success' | 'error'

interface NewsletterSignupProps {
  className?: string
  variant?: 'default' | 'compact'
}

export function NewsletterSignup({ className, variant = 'default' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !consent) return
    setState('loading')
    try {
      const r = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), firstName: firstName.trim() || undefined }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Blad zapisu')
      setState('success')
      setMessage(d.message ?? 'Sprawdz skrzynke — wyslalismy email z potwierdzeniem.')
    } catch (err: unknown) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Cos poszlo nie tak. Sprobuj ponownie.')
    }
  }

  if (state === 'success') {
    return (
      <div className={cn('flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4', className)}>
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-800 text-sm">Prawie gotowe!</p>
          <p className="text-green-700 text-sm mt-0.5">{message}</p>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
        <div className="flex gap-2">
          <Input
            type="email"
            required
            placeholder="Twoj adres email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1"
            disabled={state === 'loading'}
          />
          <Button type="submit" disabled={state === 'loading' || !consent || !email} className="gap-1.5 shrink-0">
            {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Zapisz
          </Button>
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 accent-primary"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            Wyrazam zgode na otrzymywanie newslettera Zwrotny.pl. Moge sie wypisac w kazdej chwili.
          </span>
        </label>
        {state === 'error' && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5" />{message}
          </p>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder="Imie (opcjonalnie)"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          disabled={state === 'loading'}
        />
        <Input
          type="email"
          required
          placeholder="Adres email *"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={state === 'loading'}
        />
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 accent-primary"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
        />
        <span className="text-sm text-muted-foreground leading-relaxed">
          Wyrazam zgode na otrzymywanie newslettera Zwrotny.pl z informacjami o systemie kaucyjnym i recyklingu.
          Moge sie wypisac w kazdej chwili. <a href="/polityka-prywatnosci" className="underline hover:text-foreground">Polityka prywatnosci.</a>
        </span>
      </label>
      {state === 'error' && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />{message}
        </p>
      )}
      <Button type="submit" disabled={state === 'loading' || !consent || !email} className="w-full sm:w-auto gap-2">
        {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {state === 'loading' ? 'Zapisywanie...' : 'Zapisz sie do newslettera'}
      </Button>
    </form>
  )
}
