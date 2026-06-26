import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get single post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
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
      seo: data.seo || {},
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
    
    return NextResponse.json({ data: post })
  } catch (error) {
    console.error('Post GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PUT - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    const body = await request.json()
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.content !== undefined) updateData.content = body.content
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
    if (body.coverImage !== undefined) updateData.cover_image = body.coverImage
    if (body.category !== undefined) updateData.category = body.category
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'published') {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (body.author?.name !== undefined) updateData.author_name = body.author.name
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.readingTime !== undefined) updateData.reading_time = body.readingTime
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.seo !== undefined) updateData.seo = body.seo
    
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase update error:', error)
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
      seo: data.seo || {},
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
    
    return NextResponse.json({ data: post })
  } catch (error) {
    console.error('Post PUT error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Post DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
