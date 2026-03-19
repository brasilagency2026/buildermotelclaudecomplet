import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
export async function POST(req: NextRequest) {
  try {
    const sb = createServerSupabase()
    const { action, email, password, nome } = await req.json()
    if (action === 'signup') {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { nome } } })
      if (error) throw error
      return NextResponse.json({ user: data.user })
    }
    if (action === 'signin') {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
      return NextResponse.json({ user: data.user })
    }
    if (action === 'signout') {
      await sb.auth.signOut()
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
