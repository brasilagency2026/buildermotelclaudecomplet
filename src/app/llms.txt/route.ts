import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://moteis.app.br'

  let moteisText = ''
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await admin
      .from('moteis')
      .select('slug, nome, cidade, estado, descricao, telefone')
      .eq('status', 'active')
      .eq('usa_builder', true)
      .limit(100)

    moteisText = (data || []).map(m =>
      `- [${m.nome}](${base}/motel/${m.slug}) — ${m.cidade}, ${m.estado}${m.descricao ? ': ' + m.descricao.slice(0, 100) : ''}`
    ).join('\n')
  } catch {}

  const content = `# MotéisBrasil

> O maior portal de motéis do Brasil. Encontre motéis próximos, compare preços e reserve pelo WhatsApp.

## O que é o MotéisBrasil?
MotéisBrasil é um portal brasileiro que reúne motéis de todo o Brasil em uma única plataforma.
Permite buscar por cidade ou localização GPS, ver fotos das suítes, comparar preços por período
(2h, 4h, 12h, diária) e fazer reservas diretamente pelo WhatsApp sem intermediários.

## Como funciona?
1. O visitante acessa o portal e permite sua localização GPS
2. O sistema exibe motéis mais próximos ordenados por distância
3. O visitante escolhe a suíte e clica em WhatsApp para reservar
4. A reserva é feita diretamente com o estabelecimento

## Para proprietários de motéis
- Cadastro gratuito: nome, endereço e link do site existente
- Plano premium R$50/mês: site vitrine completo com fotos, preços e reservas WhatsApp
- URL exclusiva: ${base}/motel/nome-cidade-estado

## Cobertura
Motéis em todo o Brasil, com maior concentração nas regiões Sudeste, Nordeste e Sul.

## Estabelecimentos cadastrados
${moteisText || 'Ver lista completa em ' + base + '/sitemap.xml'}

## URLs úteis
- Portal: ${base}
- Sitemap: ${base}/sitemap.xml
- Estatísticas: ${base}/api/stats
- Cadastro: ${base}/cadastro
`

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
