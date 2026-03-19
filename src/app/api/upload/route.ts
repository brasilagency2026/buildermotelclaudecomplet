import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminSupabase } from '@/lib/supabase-server'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await sb.auth.getUser(token)
  return user || null
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File
    const motelId = (form.get('motel_id') as string) || 'temp'

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${motelId}/${Date.now()}.${ext}`

    // Usar admin para upload (bypass RLS no storage)
    const admin = createAdminSupabase()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await admin.storage
      .from('motel-fotos')
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw new Error(error.message)

    const { data: { publicUrl } } = admin.storage
      .from('motel-fotos')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl, path: data.path })
  } catch (err: any) {
    console.error('[POST /api/upload]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
