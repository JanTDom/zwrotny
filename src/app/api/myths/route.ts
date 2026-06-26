import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/myths
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('myths')
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

    const myths = (data || []).map(m => ({
      id: m.id,
      myth: m.myth,
      fact: m.fact,
      explanation: m.explanation,
      source: m.source,
      category: m.category,
      order: m.order,
      status: m.status,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }))

    return NextResponse.json({ data: myths, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/myths
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('myths')
      .insert({
        myth: body.myth,
        fact: body.fact,
        explanation: body.explanation,
        source: body.source,
        category: body.category || 'ogolne',
        order: body.order || 0,
        status: body.status || 'draft',
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
