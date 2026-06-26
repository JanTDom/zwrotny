import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/settings
export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('settings')
      .select('*')

    if (error) {
      console.error('Supabase GET settings error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert array of settings to object
    const settings: Record<string, unknown> = {}
    for (const item of data || []) {
      settings[item.key] = item.value
    }

    return NextResponse.json({ data: settings, success: true })
  } catch (error) {
    console.error('API GET settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/settings - deep merge into existing record (never wipes keys not present in payload)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    for (const [key, incoming] of Object.entries(body)) {
      // Fetch existing value so we can merge rather than overwrite
      const { data: existing } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single()

      const existingValue =
        existing?.value && typeof existing.value === 'object' && !Array.isArray(existing.value)
          ? (existing.value as Record<string, unknown>)
          : {}

      // Arrays are stored as-is (e.g. apiConfigs), objects are deep-merged with existing
      const merged =
        Array.isArray(incoming)
          ? incoming
          : incoming && typeof incoming === 'object'
            ? { ...existingValue, ...(incoming as Record<string, unknown>) }
            : incoming

      const { error } = await supabase
        .from('settings')
        .upsert(
          { key, value: merged },
          { onConflict: 'key' }
        )

      if (error) {
        console.error(`Error saving setting ${key}:`, error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API POST settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
