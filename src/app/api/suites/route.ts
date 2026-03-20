import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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

    const { motel_id, suites } = await req.json()
    const db = admin()

    // Verificar ownership
    const { data: motel } = await db
      .from('moteis').select('id, paypal_status')
      .eq('id', motel_id).eq('owner_id', user.id).single()
    if (!motel) return NextResponse.json({ error: 'Motel não encontrado' }, { status: 404 })

    // Apagar suítes antigas
    await db.from('suites').delete().eq('motel_id', motel_id)

    // Inserir novas suítes
    for (let i = 0; i < suites.length; i++) {
      const s = suites[i]
      if (!s.nome) continue

      const { data: suite, error: suiteError } = await db.from('suites').insert({
        motel_id,
        nome: s.nome,
        descricao: s.descricao || null,
        servicos: s.servicos || null,
        fotos: s.fotos || [],
        ordem: i,
      }).select().single()

      if (suiteError) {
        console.error('[suites] insert error:', suiteError.message)
        continue
      }
      if (!suite) continue

      const tarifasValidas = (s.tarifas || [])
        .filter((t: any) => t.periodo && parseFloat(t.preco) > 0)
        .map((t: any, j: number) => ({
          suite_id: suite.id,
          periodo: t.periodo,
          preco: parseFloat(t.preco),
          ordem: j,
        }))

      if (tarifasValidas.length > 0) {
        const { error: tarifaError } = await db.from('tarifas').insert(tarifasValidas)
        if (tarifaError) console.error('[tarifas] insert error:', tarifaError.message)
      }
    }

    // Ativar motel se PayPal ativo
    const newStatus = motel.paypal_status === 'active' ? 'active' : 'pending'
    await db.from('moteis').update({ status: newStatus }).eq('id', motel_id)

    console.log('[suites] saved successfully for motel:', motel_id)

    // Revalidar a página vitrine imediatamente
    try {
      const { revalidatePath } = await import('next/cache')
      const { data: m } = await db.from('moteis').select('slug').eq('id', motel_id).single()
      if (m?.slug) {
        revalidatePath(`/motel/${m.slug}`)
        revalidatePath('/')
      }
    } catch {}

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[POST /api/suites]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
