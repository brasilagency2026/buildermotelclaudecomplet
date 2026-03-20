import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

export async function GET() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data } = await admin
      .from('moteis')
      .select('estado, cidade, usa_builder, status')
      .eq('status', 'active')

    const total = data?.length || 0
    const premium = data?.filter(m => m.usa_builder).length || 0
    const gratuito = data?.filter(m => !m.usa_builder).length || 0
    const estados = [...new Set(data?.map(m => m.estado) || [])]
    const cidades = [...new Set(data?.map(m => m.cidade) || [])]

    return NextResponse.json({
      total_moteis: total,
      moteis_com_site_vitrine: premium,
      moteis_link_externo: gratuito,
      estados_cobertos: estados.length,
      cidades_cobertas: cidades.length,
      estados: estados.sort(),
      last_updated: new Date().toISOString(),
      source: 'MotéisBrasil',
      url: process.env.NEXT_PUBLIC_SITE_URL,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
        'Access-Control-Allow-Origin': '*', // API pública
      }
    })
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 500 })
  }
}
