import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET - List all posts (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    
    let query = supabase
      .from('posts')
      .select('*')
      // Drafts (published_at IS NULL) first, then newest published first
      .order('published_at', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Transform to match existing Post type
    const posts = (data || []).map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.cover_image,
      category: post.category,
      status: post.status,
      author: { name: post.author_name },
      tags: post.tags || [],
      readingTime: post.reading_time,
      featured: post.featured,
      source: post.source,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    }))
    
    return NextResponse.json({ data: posts })
  } catch (error) {
    console.error('Posts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    // Transform from Post type to database columns
    const postData = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt,
      cover_image: body.coverImage,
      category: body.category || 'aktualnosci',
      status: body.status || 'draft',
      author_name: body.author?.name || 'Redakcja ZWROTNY.pl',
      tags: body.tags || [],
      reading_time: body.readingTime || Math.ceil((body.content?.length || 0) / 1000) || 3,
      featured: body.featured || false,
      source: body.source || 'manual',
      published_at: body.status === 'published' ? new Date().toISOString() : null,
    }
    
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Transform back to Post type
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
    
    return NextResponse.json({ data: post }, { status: 201 })
  } catch (error) {
    console.error('Posts POST error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
