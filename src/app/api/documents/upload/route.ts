import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Niedozwolony typ pliku. Dozwolone: PDF, DOC, DOCX, XLS, XLSX, TXT' }, { status: 400 })
    }

    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Plik za duży. Maksymalny rozmiar: 20MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const pathname = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Ensure bucket exists
    await supabase.storage.createBucket('documents', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(pathname, buffer, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(pathname)

    return NextResponse.json({
      fileUrl: urlData.publicUrl,
      filePathname: pathname,
      fileType: file.type,
      fileSizeBytes: file.size,
      originalName: file.name,
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Błąd uploadu pliku' }, { status: 500 })
  }
}
