import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get single post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const post = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.cover_image,
      category: data.category,
      status: data.status,
      author: { name: data.author_name },
      tags: data.tags || [],
      readingTime: data.reading_time,
      featured: data.featured,
      source: data.source,
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
    
    return NextResponse.json({ data: post })
  } catch (error) {
    console.error('Post by slug GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}
