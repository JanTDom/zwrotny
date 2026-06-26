import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Calendar, Tag, Share2, Facebook, Twitter, Linkedin, BookmarkPlus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdBanner } from '@/components/public/ad-banner'
import { ArticleContent } from '@/components/public/article-content'
import { getPostBySlug as getPostBySlugApi, getPosts, getBanners } from '@/lib/api'
import type { Metadata } from 'next'
import type { Post } from '@/types'

export const revalidate = 60

const categories = [
  { value: 'aktualnosci', label: 'Aktualności' },
  { value: 'poradniki', label: 'Poradniki' },
  { value: 'prawo', label: 'Prawo' },
  { value: 'biznes', label: 'Biznes' },
  { value: 'ekologia', label: 'Ekologia' },
  { value: 'technologia', label: 'Technologia' },
]

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://zwrotny.pl').replace(/\/$/, '')

  // Ensure image URL is always absolute — FB rejects relative paths
  const toAbsolute = (url?: string | null) => {
    if (!url) return `${baseUrl}/og-image.jpg`
    if (url.startsWith('http')) return url
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  try {
    const res = await getPostBySlugApi(slug)
    const post = res.data

    if (!post) {
      return { title: 'Artykuł nie znaleziony' }
    }

    const ogImage = toAbsolute(post.seo?.ogImage || post.coverImage)

    return {
      title: post.seo?.title || post.title,
      description: post.seo?.description || post.excerpt,
      keywords: post.seo?.keywords || post.tags,
      openGraph: {
        title: post.seo?.title || post.title,
        description: post.seo?.description || post.excerpt,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
          }
        ],
        type: 'article',
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authors: [post.author?.name || 'Redakcja'],
        tags: post.tags,
        siteName: 'ZWROTNY.pl',
        locale: 'pl_PL',
        url: `${baseUrl}/artykul/${post.slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.seo?.title || post.title,
        description: post.seo?.description || post.excerpt,
        images: [ogImage],
      },
    }
  } catch {
    return { title: 'Artykuł nie znaleziony' }
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  
  let post: Post | null = null
  let relatedPosts: Post[] = []
  let banners: Awaited<ReturnType<typeof getBanners>>['data'] = []
  
  try {
    const [postRes, postsRes, bannersRes] = await Promise.allSettled([
      getPostBySlugApi(slug),
      getPosts({ status: 'published', limit: 4 }),
      getBanners(),
    ])
    
    if (postRes.status === 'fulfilled') {
      post = postRes.value.data
    }
    
    if (postsRes.status === 'fulfilled' && post) {
      // Get related posts (same category, excluding current)
      relatedPosts = postsRes.value.data
        .filter((p: Post) => p.id !== post!.id && p.category === post!.category)
        .slice(0, 3)
    }
    
    if (bannersRes.status === 'fulfilled') {
      banners = bannersRes.value.data
    }
  } catch {
    notFound()
  }

  if (!post) {
    notFound()
  }

  const categoryLabel = categories.find(c => c.value === post.category)?.label || post.category
  const publishDate = new Date(post.publishedAt || post.updatedAt || Date.now()).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className="min-h-screen">
      {/* Header */}
      <div className="relative my-8 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
        <div className="relative container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary">Strona główna</Link>
            <span>/</span>
            <Link href="/aktualnosci" className="hover:text-primary">Artykuły</Link>
            <span>/</span>
            <Link href={`/kategoria/${post.category}`} className="hover:text-primary">{categoryLabel}</Link>
          </nav>

          <div className="max-w-none">
            {/* Category and tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className="bg-primary hover:bg-primary">{categoryLabel}</Badge>
              {post.aiGenerated && (
                <Badge variant="outline">Wygenerowany przez AI</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
              {post.excerpt}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{post.author?.name || 'Redakcja'}</div>
                  <div className="text-xs">{post.author?.role || 'Autor'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{publishDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime} min czytania</span>
              </div>
            </div>
          </div>
        </div>

      {/* Main content - continuous strip, no gap */}
        <div className="relative container mx-auto px-4 pb-8 md:pb-12 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Article content */}
          <div className="max-w-none">
            {/* Cover image */}
            {post.coverImage ? (
              <div 
                className="aspect-video rounded-xl bg-muted mb-8 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.coverImage})` }}
              />
            ) : (
              <div className="aspect-video rounded-xl bg-muted mb-8 flex items-center justify-center">
                <span className="text-muted-foreground">Brak obrazka</span>
              </div>
            )}

            {/* Article body */}
            <ArticleContent content={post.content || ''} />

            {/* In-article ad */}
            <div className="my-8">
              <AdBanner placement="in-article" banners={banners} />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-8 pt-8 border-t border-border">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {post.tags.map((tag: string) => (
                  <Link key={tag} href={`/tag/${tag}`}>
                    <Badge variant="secondary" className="hover:bg-primary/10">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Sources */}
            {post.sources && post.sources.length > 0 && (
              <div className="mt-8 p-6 rounded-xl bg-muted/50">
                <h3 className="font-semibold text-foreground mb-4">Zrodla</h3>
                <ul className="space-y-2">
                  {post.sources.map((source: { url: string; title?: string; publisher?: string }, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.title}
                        {source.publisher && <span className="text-muted-foreground"> - {source.publisher}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Share buttons */}
            <div className="mt-8 p-6 rounded-xl bg-card border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Udostepnij artykul</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <a href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://zwrotny.pl/artykul/${post.slug}`)}`} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://zwrotny.pl/artykul/${post.slug}`)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`https://zwrotny.pl/artykul/${post.slug}`)}`} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon">
                    <BookmarkPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Sticky container */}
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Sidebar ad */}
              <AdBanner placement="sidebar" banners={banners} />

              {/* Related articles */}
              {relatedPosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Powiazane artykuly</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link 
                        key={relatedPost.id} 
                        href={`/artykul/${relatedPost.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          {relatedPost.coverImage ? (
                            <div 
                              className="w-20 h-14 rounded bg-muted shrink-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${relatedPost.coverImage})` }}
                            />
                          ) : (
                            <div className="w-20 h-14 rounded bg-muted shrink-0" />
                          )}
                          <div>
                            <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {relatedPost.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {relatedPost.readingTime} min
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Newsletter CTA */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">Bądź na bieżąco!</h3>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Zapisz się do newslettera i otrzymuj najnowsze informacje.
                  </p>
                  <Button variant="secondary" className="w-full" asChild>
                    <Link href="/newsletter">Zapisz się</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>{/* end grid */}

        <Separator className="my-8" />
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/aktualnosci">
            <ArrowLeft className="h-4 w-4" />
            Wróć do artykułów
          </Link>
        </Button>

        </div>{/* end container */}
      </div>{/* end strip */}
    </article>
  )
}
