'use client'

import Link from 'next/link'
import {
  FileText,
  Eye,
  Inbox,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardStats, useAdminPosts, useAICandidates, useJobs } from '@/hooks/use-admin-data'
import { LoadingState, ErrorState } from '@/components/ui/api-states'

export default function AdminDashboard() {
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { posts, isLoading: postsLoading } = useAdminPosts({ status: 'published' })
  const { candidates, isLoading: candidatesLoading } = useAICandidates('pending')
  const { jobs, isLoading: jobsLoading } = useJobs()

  const recentPosts = posts.slice(0, 5)
  const pendingNews = candidates.slice(0, 5)
  const activeJobs = jobs.filter((j: { status: string }) => j.status === 'processing' || j.status === 'queued')

  // Default stats if not loaded
  const dashboardStats = stats || {
    publishedPosts: posts.length,
    todayViews: 0,
    pendingNews: candidates.length,
    aiProcessing: activeJobs.length,
    totalPosts: posts.length,
    draftPosts: 0,
    totalViews: 0,
  }

  const statCards: Array<{
    title: string
    value: string | number
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
    icon: typeof FileText
    href?: string
  }> = [
    {
      title: 'Opublikowane artykuly',
      value: dashboardStats.publishedPosts,
      change: '+12%',
      changeType: 'positive',
      icon: FileText,
      href: '/zk7m9/artykuly',
    },
    {
      title: 'Wyswietlenia dzis',
      value: dashboardStats.todayViews.toLocaleString(),
      change: '+8%',
      changeType: 'positive',
      icon: Eye,
    },
    {
      title: 'Oczekujace newsy',
      value: dashboardStats.pendingNews,
      change: `${pendingNews.length} nowych`,
      changeType: 'neutral',
      icon: Inbox,
      href: '/zk7m9/inbox',
    },
    {
      title: 'AI w pracy',
      value: dashboardStats.aiProcessing,
      change: 'Przetwarzanie',
      changeType: 'neutral',
      icon: Sparkles,
    },
  ]

  if (statsLoading && postsLoading) {
    return <LoadingState message="Ładowanie dashboardu..." />
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Witaj w panelu administracyjnym ZWROTNY.pl</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/zk7m9/inbox">
              <Inbox className="mr-2 h-4 w-4" />
              Inbox AI ({pendingNews.length})
            </Link>
          </Button>
          <Button asChild>
            <Link href="/zk7m9/artykuly/nowy">
              <FileText className="mr-2 h-4 w-4" />
              Nowy artykuł
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              {stat.href && (
                <Link href={stat.href} className="text-sm text-primary hover:underline mt-4 inline-flex items-center gap-1">
                  Zobacz więcej <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Status AI
            </CardTitle>
            <Badge className="bg-green-100 text-green-700">Online</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobsLoading ? (
              <LoadingState message="Ładowanie zadań..." />
            ) : activeJobs.length > 0 ? (
              activeJobs.map((job: { id: string; status: string; type: string; progress?: number }) => (
                <div key={job.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="shrink-0">
                    {job.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {job.type === 'ai_article' && 'Generowanie artykułu'}
                      {job.type === 'fetch_news' && 'Pobieranie newsów'}
                      {job.type === 'generate_image' && 'Generowanie obrazu'}
                      {job.type === 'seo_optimization' && 'Optymalizacja SEO'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {job.status === 'processing' ? `${job.progress}% ukończone` : 'W kolejce'}
                    </p>
                  </div>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>Wszystkie zadania zakończone</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending News */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
Oczekujące newsy
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/zk7m9/inbox">
                Zobacz wszystkie
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {candidatesLoading ? (
              <LoadingState message="Ładowanie newsów..." />
            ) : pendingNews.length > 0 ? (
              <div className="space-y-3">
                {pendingNews.map((news) => (
                  <div key={news.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="shrink-0 mt-0.5">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{news.originalTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {news.originalSource} - Trafność: {Math.round(news.relevanceScore * 100)}%
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{news.suggestedCategory}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Brak oczekujących newsów</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ostatnie artykuły</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/zk7m9/artykuly">
              Zobacz wszystkie
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <LoadingState message="Ładowanie artykułów..." />
          ) : recentPosts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tytuł</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kategoria</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Źródło</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPosts.map((post) => (
                    <tr key={post.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <Link href={`/zk7m9/artykuly/${post.id}`} className="font-medium hover:text-primary">
                          {post.title.length > 50 ? `${post.title.slice(0, 50)}...` : post.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{post.category}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {post.status === 'published' ? 'Opublikowany' : 'Szkic'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(post.publishedAt || post.updatedAt || Date.now()).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="py-3 px-4">
                        {post.aiGenerated ? (
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Ręcznie</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Brak artykułów</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
