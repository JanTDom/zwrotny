import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/banners/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const banner = {
      id: data.id,
      title: data.title,
      imageUrl: data.image_url,
      linkUrl: data.link_url,
      position: data.position,
      startDate: data.start_date,
      endDate: data.end_date,
      clicks: data.clicks,
      impressions: data.impressions,
      isActive: data.is_active,
      order: data.order,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ data: banner, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/banners/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = createServiceClient()
    const body = await request.json()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl
    if (body.linkUrl !== undefined) updateData.link_url = body.linkUrl
    if (body.position !== undefined) updateData.position = body.position
    if (body.startDate !== undefined) updateData.start_date = body.startDate
    if (body.endDate !== undefined) updateData.end_date = body.endDate
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.order !== undefined) updateData.order = body.order
    if (body.clicks !== undefined) updateData.clicks = body.clicks
    if (body.impressions !== undefined) updateData.impressions = body.impressions

    const { data, error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/banners/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
