import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'glwebagency2@gmail.com'

async function checkAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET — listar todos os moteis com owner
export async function GET(req: NextRequest) {
  const user = await checkAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const db = admin()
  const { data: moteis, error } = await db
    .from('moteis')
    .select(`
      id, slug, nome, cidade, estado, status,
      usa_builder, site_externo, foto_capa,
      paypal_status, paypal_subscription_id, paypal_next_billing,
      created_at, updated_at,
      owner_id,
      owners!inner(email, nome)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Stats
  const total = moteis?.length || 0
  const premium = moteis?.filter(m => m.usa_builder).length || 0
  const gratuito = moteis?.filter(m => !m.usa_builder).length || 0
  const active = moteis?.filter(m => m.status === 'active').length || 0
  const pending = moteis?.filter(m => m.status === 'pending').length || 0
  const inactive = moteis?.filter(m => m.status === 'inactive').length || 0
  const paypalActive = moteis?.filter(m => m.paypal_status === 'active').length || 0

  // MRR estimado
  const mrr = paypalActive * 50

  return NextResponse.json({ moteis, stats: { total, premium, gratuito, active, pending, inactive, paypalActive, mrr } })
}

// PATCH — atualizar status de um motel
export async function PATCH(req: NextRequest) {
  const user = await checkAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id e status obrigatórios' }, { status: 400 })

  const db = admin()
  const { error } = await db.from('moteis').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE — excluir motel
export async function DELETE(req: NextRequest) {
  const user = await checkAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const db = admin()
  // Deletar suítes e tarifas primeiro (cascade deve fazer, mas por segurança)
  await db.from('tarifas').delete().in('suite_id',
    (await db.from('suites').select('id').eq('motel_id', id)).data?.map(s => s.id) || []
  )
  await db.from('suites').delete().eq('motel_id', id)
  const { error } = await db.from('moteis').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
