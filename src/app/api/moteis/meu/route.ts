import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ motel: null })

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await anon.auth.getUser(token)
    if (!user) return NextResponse.json({ motel: null })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: motel } = await admin
      .from('moteis')
      .select('id, slug, nome')
      .eq('owner_id', user.id)
      .limit(1)
      .single()

    return NextResponse.json({ motel: motel || null })
  } catch {
    return NextResponse.json({ motel: null })
  }
}
