import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/banners
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const position = searchParams.get('position')

    let query = supabase
      .from('banners')
      .select('*')
      .order('order', { ascending: true })

    if (active === 'true') {
      query = query.eq('is_active', true)
    }

    if (position) {
      query = query.eq('position', position)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const banners = (data || []).map(b => ({
      id: b.id,
      title: b.title,
      imageUrl: b.image_url,
      linkUrl: b.link_url,
      position: b.position,
      startDate: b.start_date,
      endDate: b.end_date,
      clicks: b.clicks,
      impressions: b.impressions,
      isActive: b.is_active,
      order: b.order,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }))

    return NextResponse.json({ data: banners, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/banners
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('banners')
      .insert({
        title: body.title,
        image_url: body.image_url || body.imageUrl,
        link_url: body.link_url || body.linkUrl,
        position: body.position || 'sidebar',
        start_date: body.start_date || body.startDate,
        end_date: body.end_date || body.endDate,
        is_active: body.is_active ?? body.isActive ?? true,
        order: body.order || 0,
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

// PUT /api/banners - update a banner
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Missing banner ID' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('banners')
      .update({
        title: body.title,
        image_url: body.image_url,
        link_url: body.link_url,
        position: body.position,
        is_active: body.is_active,
        order: body.order,
      })
      .eq('id', body.id)
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

// DELETE /api/banners - delete a banner
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing banner ID' }, { status: 400 })
    }

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
