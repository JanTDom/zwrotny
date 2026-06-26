import Link from 'next/link'
import { Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AdBanner } from '@/components/public/ad-banner'
import { getPosts, getBanners } from '@/lib/api'
import type { Post } from '@/types'

export const revalidate = 60 // Revalidate every minute

const categories = [
  { value: 'wszystkie', label: 'Wszystkie' },
  { value: 'aktualnosci', label: 'Aktualności' },
  { value: 'poradniki', label: 'Poradniki' },
  { value: 'prawo', label: 'Prawo' },
  { value: 'biznes', label: 'Biznes' },
]

function ArticleCard({ post }: { post: Post }) {
  const categoryLabel = categories.find(c => c.value === post.category)?.label || post.category
  const publishDate = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : ''

  return (
    <Card className="group overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all">
      <Link href={`/artykul/${post.slug}`} className="block">
        <div className="grid md:grid-cols-[240px_1fr]">
          {/* Image */}
          <div className="aspect-video md:aspect-auto md:h-full bg-muted relative overflow-hidden">
            {post.coverImage ? (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.coverImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Brak obrazka</span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{categoryLabel}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">{publishDate}</span>
            </div>
            
            <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
              {post.title}
            </h2>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {post.excerpt}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{post.author?.name || 'Redakcja'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.readingTime || 3} min</span>
              </div>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  )
}

export default async function ArticlesPage() {
  const [postsRes, bannersRes] = await Promise.allSettled([
    getPosts({ status: 'published' }),
    getBanners(),
  ])

  const posts = postsRes.status === 'fulfilled' ? postsRes.value.data : []
  const banners = bannersRes.status === 'fulfilled' ? bannersRes.value.data : []
  
  const featuredPost = posts.find(p => p.featured)
  const otherPosts = posts.filter(p => !p.featured)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative my-8 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
        <div className="relative container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Aktualności
          </h1>
          <p className="text-muted-foreground">
            Najnowsze wiadomości i artykuły o systemie kaucyjnym w Polsce
          </p>
        </div>
      </div>

      <div className="relative my-8 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: 'min(calc(100% - 1rem), calc(80rem + 3rem))', backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
        <div className="relative container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-border">
              {categories.map((cat, i) => (
                <Button key={cat.value} variant={i === 0 ? "default" : "ghost"} size="sm">
                  {cat.label}
                </Button>
              ))}
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Brak artykułów do wyświetlenia.</p>
              </div>
            ) : (
              <>
                {/* Featured article */}
                {featuredPost && (
                  <Card className="group overflow-hidden border-0 shadow-lg bg-card">
                    <Link href={`/artykul/${featuredPost.slug}`} className="block">
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {featuredPost.coverImage ? (
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${featuredPost.coverImage})` }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <span className="text-muted-foreground">Placeholder</span>
                          </div>
                        )}
                        <Badge className="absolute top-4 left-4 bg-primary">Wyróżniony</Badge>
                      </div>
                      <CardContent className="p-6">
                        <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                          {featuredPost.title}
                        </h2>
                        <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{featuredPost.author?.name || 'Redakcja'}</span>
                          <span>{featuredPost.readingTime || 3} min czytania</span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                )}

                {/* Articles list */}
                <div className="space-y-4">
                  {otherPosts.map((post, index) => (
                    <div key={post.id}>
                      <ArticleCard post={post} />
                      {/* In-feed ad every 3 articles */}
                      {(index + 1) % 3 === 0 && (
                        <div className="my-4">
                          <AdBanner placement="in-feed" banners={banners} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            <div className="flex justify-center gap-2 pt-8">
              <Button variant="outline" disabled>Poprzednia</Button>
              <Button variant="default">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">Nastepna</Button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <AdBanner placement="sidebar" banners={banners} />

              {/* Categories */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Kategorie</h3>
                  <div className="space-y-2">
                    {categories.filter(c => c.value !== 'wszystkie').map((cat) => {
                      const count = posts.filter(p => p.category === cat.value).length
                      return (
                        <Link
                          key={cat.value}
                          href={`/kategoria/${cat.value}`}
                          className="flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"
                        >
                          <span>{cat.label}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Popular tags */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Popularne tagi</h3>
                  <div className="flex flex-wrap gap-2">
                    {['system kaucyjny', 'recykling', 'butelki', 'kaucja', 'ekologia', 'prawo'].map((tag) => (
                      <Link key={tag} href={`/tag/${tag}`}>
                        <Badge variant="secondary" className="hover:bg-primary/10">
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>{/* end grid */}
        </div>{/* end bg-white/90 container */}
      </div>{/* end relative my-8 */}
    </div>
  )
}
