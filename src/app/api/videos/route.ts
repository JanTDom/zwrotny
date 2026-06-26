import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/videos
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('videos')
      .select('*')
      .order('order', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const videos = (data || []).map(v => ({
      id: v.id,
      title: v.title,
      youtubeId: v.youtube_id,
      description: v.description,
      category: v.category,
      thumbnailUrl: v.thumbnail_url,
      duration: v.duration,
      order: v.order,
      status: v.status,
      publishedAt: v.published_at,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    }))

    return NextResponse.json({ data: videos, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/videos
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('videos')
      .insert({
        title: body.title,
        youtube_id: body.youtubeId,
        description: body.description,
        category: body.category || 'edukacja',
        thumbnail_url: body.thumbnailUrl,
        duration: body.duration,
        order: body.order || 0,
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
