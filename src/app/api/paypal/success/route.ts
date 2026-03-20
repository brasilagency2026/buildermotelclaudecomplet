import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Appelé quand l'utilisateur revient de PayPal avec sub=success
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await anon.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { motel_id, subscription_id } = await req.json()

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Activer le motel immédiatement au retour de PayPal
    // (le webhook confirmera plus tard, mais on active tout de suite pour l'UX)
    const { data: motel } = await admin
      .from('moteis')
      .update({
        paypal_status: 'active',
        status: 'active',
        ...(subscription_id ? { paypal_subscription_id: subscription_id } : {}),
      })
      .eq('id', motel_id)
      .eq('owner_id', user.id)
      .select('slug')
      .single()

    if (motel?.slug) {
      revalidatePath(`/motel/${motel.slug}`)
      revalidatePath('/')
    }

    return NextResponse.json({ ok: true, slug: motel?.slug })
  } catch (err: any) {
    console.error('[paypal/success]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
