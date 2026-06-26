import { NextRequest, NextResponse } from 'next/server'

// Helper function to scrape full content from a URL
async function scrapeArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    
    if (!response.ok) return ''
    
    const html = await response.text()
    
    // Extract text content from HTML
    // Remove script and style tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
    
    // Try to find article or main content
    const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    const contentMatch = text.match(/<div[^>]*class="[^"]*(?:content|article|post|entry)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    
    const contentHtml = articleMatch?.[1] || mainMatch?.[1] || contentMatch?.[1] || text
    
    // Strip remaining HTML tags and decode entities
    const plainText = contentHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
    
    // Limit to reasonable size (first ~5000 chars)
    return plainText.substring(0, 5000)
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Brak klucza API SerpApi' },
        { status: 400 }
      )
    }

    // Search for news about Polish deposit return system
    const searchQuery = 'system kaucyjny'
    const serpApiUrl = `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(searchQuery)}&gl=pl&hl=pl&api_key=${apiKey}`

    const response = await fetch(serpApiUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('SerpApi error:', errorText)
      return NextResponse.json(
        { error: 'Błąd połączenia z SerpApi', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      )
    }

    // Transform SerpApi Google News results to our format
    // Google News API returns news_results with nested stories arrays
    const newsResults = data.news_results || []
    
    // Flatten all stories from news results
    interface NewsStory {
      title?: string
      link?: string
      snippet?: string
      source?: { name?: string }
      date?: string
      thumbnail?: string
      thumbnail_small?: string
    }
    
    const allStories: NewsStory[] = []
    for (const result of newsResults) {
      if (result.stories) {
        allStories.push(...result.stories)
      } else if (result.title && result.link) {
        // Direct news item (not in stories array)
        allStories.push(result)
      }
    }
    

    
    // Scrape full content for each article (in parallel, but limit concurrency)
    const newsWithContent = await Promise.all(
      allStories.slice(0, 10).map(async (item: NewsStory, index: number) => {
        const fullContent = item.link ? await scrapeArticleContent(item.link) : ''
        
        return {
          id: `serpapi-${Date.now()}-${index}`,
          title: item.title || 'Bez tytułu',
          url: item.link || '',
          snippet: item.snippet || fullContent.substring(0, 300) + '...', // Use scraped content as snippet if no snippet
          fullContent: fullContent, // Pełna treść artykułu
          source: item.source?.name || 'Nieznane źródło',
          publishedAt: item.date || new Date().toISOString(),
          thumbnail: item.thumbnail || item.thumbnail_small || null,
          status: 'pending' as const,
          fetchedAt: new Date().toISOString(),
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      news: newsWithContent,
      count: newsWithContent.length,
      query: searchQuery 
    })

  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania newsów' },
      { status: 500 }
    )
  }
}
