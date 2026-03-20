import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import NavBar from '@/components/shared/NavBar'
import Footer from '@/components/shared/Footer'

const ESTADOS: Record<string, string> = {
  ac:'Acre',al:'Alagoas',ap:'Amapá',am:'Amazonas',ba:'Bahia',ce:'Ceará',
  df:'Distrito Federal',es:'Espírito Santo',go:'Goiás',ma:'Maranhão',
  mt:'Mato Grosso',ms:'Mato Grosso do Sul',mg:'Minas Gerais',pa:'Pará',
  pb:'Paraíba',pr:'Paraná',pe:'Pernambuco',pi:'Piauí',rj:'Rio de Janeiro',
  rn:'Rio Grande do Norte',rs:'Rio Grande do Sul',ro:'Rondônia',rr:'Roraima',
  sc:'Santa Catarina',sp:'São Paulo',se:'Sergipe',to:'Tocantins',
}

function normalizeStr(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// Sempre gerar os 27 estados — sem chamada Supabase no build
export function generateStaticParams() {
  return Object.keys(ESTADOS).map(uf => ({ estado: uf }))
}

export async function generateMetadata({ params }: { params: { estado: string } }): Promise<Metadata> {
  const nome = ESTADOS[params.estado.toLowerCase()]
  if (!nome) return { title: 'Estado não encontrado' }
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://moteis.app.br'
  return {
    title: `Motéis em ${nome} — Todos os municípios | MotéisBrasil`,
    description: `Encontre motéis em todas as cidades de ${nome}. Compare preços, veja fotos e reserve pelo WhatsApp.`,
    alternates: { canonical: `${base}/moteis/${params.estado}` },
  }
}

export const revalidate = 3600
export const dynamicParams = false

export default async function EstadoPage({ params }: { params: { estado: string } }) {
  const nomeEstado = ESTADOS[params.estado.toLowerCase()]
  if (!nomeEstado) notFound()

  let cidades: [string, number][] = []
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await admin
      .from('moteis').select('cidade')
      .eq('status', 'active')
      .ilike('estado', params.estado.toUpperCase())

    const cidadesMap: Record<string, number> = {}
    ;(data || []).forEach(m => {
      cidadesMap[m.cidade] = (cidadesMap[m.cidade] || 0) + 1
    })
    cidades = Object.entries(cidadesMap).sort((a, b) => b[1] - a[1])
  } catch {
    cidades = []
  }

  return (
    <>
      <NavBar />
      <main style={{ minHeight: '100vh', background: '#0f1117' }}>
        <section style={{ padding: '60px 20px 40px', textAlign: 'center' as const, background: 'radial-gradient(ellipse at 50% 0%, rgba(212,0,31,.06) 0%, transparent 60%)' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, marginBottom: 12 }}>
            Motéis em <span style={{ color: '#D4001F' }}>{nomeEstado}</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
            {cidades.length > 0
              ? `${cidades.length} cidade${cidades.length > 1 ? 's' : ''} com motéis em ${nomeEstado}.`
              : `Seja o primeiro motel em ${nomeEstado} no maior portal do Brasil.`}
          </p>
        </section>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>
          {cidades.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {cidades.map(([cidade, count]) => (
                <a key={cidade} href={`/moteis/${params.estado}/${normalizeStr(cidade)}`}
                  style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 10, padding: '16px 20px', textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f0ebe0', marginBottom: 4 }}>{cidade}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{count} motel{count > 1 ? 's' : ''}</div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: '#6b7280' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏨</div>
              <p style={{ marginBottom: 16 }}>Nenhum motel cadastrado em {nomeEstado} ainda.</p>
              <a href="/cadastro" style={{ padding: '12px 24px', background: '#D4001F', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
                Cadastrar meu motel gratuitamente
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
