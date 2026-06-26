'use client'

import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Ładowanie...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ 
  message = 'Wystąpił błąd podczas ładowania danych', 
  onRetry,
  className = '' 
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <p className="text-foreground font-medium mb-2">Ups! Coś poszło nie tak</p>
      <p className="text-muted-foreground text-sm mb-4 text-center max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Spróbuj ponownie
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  title = 'Brak danych',
  message = 'Nie znaleziono żadnych elementów',
  icon,
  action,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <p className="text-foreground font-medium mb-2">{title}</p>
      <p className="text-muted-foreground text-sm mb-4 text-center max-w-md">{message}</p>
      {action}
    </div>
  )
}

// Loading skeleton for cards
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-card rounded-2xl overflow-hidden ${className}`}>
      <div className="aspect-video bg-muted" />
      <div className="p-6 space-y-3">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>
  )
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-muted rounded w-full" />
        </td>
      ))}
    </tr>
  )
}
