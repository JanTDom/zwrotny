import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/guides - list all guides
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    let query = supabase
      .from('guides')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform snake_case to camelCase
    const guides = (data || []).map(g => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      description: g.description,
      icon: g.icon,
      difficulty: g.difficulty,
      estimatedTime: g.estimated_time,
      category: g.category,
      steps: g.steps,
      status: g.status,
      publishedAt: g.published_at,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    }))

    return NextResponse.json({ data: guides, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/guides - create new guide
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('guides')
      .insert({
        title: body.title,
        slug: body.slug,
        description: body.description,
        icon: body.icon || 'book',
        difficulty: body.difficulty || 'beginner',
        estimated_time: body.estimatedTime || 5,
        category: body.category || 'poradniki',
        steps: body.steps || [],
        status: body.status || 'draft',
        published_at: body.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
