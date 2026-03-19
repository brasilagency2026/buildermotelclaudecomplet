import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { makeSlug } from '@/lib/utils'

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
    if (!user) return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 })

    const dados = await req.json()
    const admin = createAdminSupabase()

    // Garantir owner existe
    await admin.from('owners').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id' }
    )

    // Slug único
    let slug = makeSlug(
      dados.nome || 'motel',
      dados.estado || 'br',
      dados.cidade || 'cidade'
    )
    const { data: exist } = await admin.from('moteis').select('id').eq('slug', slug)
    if (exist && exist.length > 0) slug = `${slug}-${Date.now().toString(36)}`

    const { data: motel, error } = await admin.from('moteis').insert({
      nome: dados.nome,
      slogan: dados.slogan || null,
      descricao: dados.descricao || null,
      endereco: dados.endereco,
      cidade: dados.cidade,
      estado: dados.estado,
      cep: dados.cep || null,
      lat: dados.lat || null,
      lng: dados.lng || null,
      telefone: dados.telefone || null,
      whatsapp: dados.whatsapp || null,
      site_externo: dados.site_externo || null,
      usa_builder: dados.usa_builder ?? true,
      foto_capa: dados.foto_capa || null,
      fotos_galeria: dados.fotos_galeria || [],
      slug,
      owner_id: user.id,
      status: (dados.site_externo && !dados.usa_builder) ? 'active' : 'pending',
    }).select().single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ motel, slug })
  } catch (err: any) {
    console.error('[POST /api/moteis]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams: sp } = new URL(req.url)
  const admin = createAdminSupabase()
  const { data, error } = await admin.rpc('search_moteis', {
    p_busca:  sp.get('q')      || null,
    p_estado: sp.get('estado') || null,
    p_cidade: sp.get('cidade') || null,
    p_lat:    sp.get('lat')    ? parseFloat(sp.get('lat')!) : null,
    p_lng:    sp.get('lng')    ? parseFloat(sp.get('lng')!) : null,
    p_limit:  parseInt(sp.get('limit') || '24'),
    p_offset: parseInt(sp.get('offset') || '0'),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ moteis: data || [] })
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    const { id, ...dados } = await req.json()
    const admin = createAdminSupabase()
    const { data, error } = await admin
      .from('moteis').update(dados)
      .eq('id', id).eq('owner_id', user.id)
      .select().single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ motel: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
