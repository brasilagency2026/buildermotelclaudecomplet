import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    // Auth via Bearer token
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 })

    // Admin client para bypass RLS no storage
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const form = await req.formData()
    const file = form.get('file') as File
    const motelId = (form.get('motel_id') as string) || 'temp'

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    // Nom de fichier descriptif pour SEO (Google Images)
    const suiteName = (form.get('suite_name') as string || '').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
    const motelName = (form.get('motel_name') as string || '').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
    const descriptor = [motelName, suiteName].filter(Boolean).join('-') || 'foto'
    const path = `${user.id}/${motelId}/${descriptor}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await admin.storage
      .from('motel-fotos')
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[upload storage error]', error.message)
      throw new Error(error.message)
    }

    const { data: { publicUrl } } = admin.storage
      .from('motel-fotos')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl, path: data.path })

  } catch (err: any) {
    console.error('[POST /api/upload]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
