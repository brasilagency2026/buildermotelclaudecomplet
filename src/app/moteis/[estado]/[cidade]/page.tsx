import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import NavBar from '@/components/shared/NavBar'
import Footer from '@/components/shared/Footer'
import CidadeClient from '@/components/portal/CidadeClient'

const ESTADOS: Record<string, { nome: string; capital: string; capitalSlug: string }> = {
  ac: { nome: 'Acre', capital: 'Rio Branco', capitalSlug: 'rio-branco' },
  al: { nome: 'Alagoas', capital: 'Maceió', capitalSlug: 'maceio' },
  ap: { nome: 'Amapá', capital: 'Macapá', capitalSlug: 'macapa' },
  am: { nome: 'Amazonas', capital: 'Manaus', capitalSlug: 'manaus' },
  ba: { nome: 'Bahia', capital: 'Salvador', capitalSlug: 'salvador' },
  ce: { nome: 'Ceará', capital: 'Fortaleza', capitalSlug: 'fortaleza' },
  df: { nome: 'Distrito Federal', capital: 'Brasília', capitalSlug: 'brasilia' },
  es: { nome: 'Espírito Santo', capital: 'Vitória', capitalSlug: 'vitoria' },
  go: { nome: 'Goiás', capital: 'Goiânia', capitalSlug: 'goiania' },
  ma: { nome: 'Maranhão', capital: 'São Luís', capitalSlug: 'sao-luis' },
  mt: { nome: 'Mato Grosso', capital: 'Cuiabá', capitalSlug: 'cuiaba' },
  ms: { nome: 'Mato Grosso do Sul', capital: 'Campo Grande', capitalSlug: 'campo-grande' },
  mg: { nome: 'Minas Gerais', capital: 'Belo Horizonte', capitalSlug: 'belo-horizonte' },
  pa: { nome: 'Pará', capital: 'Belém', capitalSlug: 'belem' },
  pb: { nome: 'Paraíba', capital: 'João Pessoa', capitalSlug: 'joao-pessoa' },
  pr: { nome: 'Paraná', capital: 'Curitiba', capitalSlug: 'curitiba' },
  pe: { nome: 'Pernambuco', capital: 'Recife', capitalSlug: 'recife' },
  pi: { nome: 'Piauí', capital: 'Teresina', capitalSlug: 'teresina' },
  rj: { nome: 'Rio de Janeiro', capital: 'Rio de Janeiro', capitalSlug: 'rio-de-janeiro' },
  rn: { nome: 'Rio Grande do Norte', capital: 'Natal', capitalSlug: 'natal' },
  rs: { nome: 'Rio Grande do Sul', capital: 'Porto Alegre', capitalSlug: 'porto-alegre' },
  ro: { nome: 'Rondônia', capital: 'Porto Velho', capitalSlug: 'porto-velho' },
  rr: { nome: 'Roraima', capital: 'Boa Vista', capitalSlug: 'boa-vista' },
  sc: { nome: 'Santa Catarina', capital: 'Florianópolis', capitalSlug: 'florianopolis' },
  sp: { nome: 'São Paulo', capital: 'São Paulo', capitalSlug: 'sao-paulo' },
  se: { nome: 'Sergipe', capital: 'Aracaju', capitalSlug: 'aracaju' },
  to: { nome: 'Tocantins', capital: 'Palmas', capitalSlug: 'palmas' },
}

function slugToNome(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    .replace('Sao ', 'São ').replace('Joao ', 'João ').replace('Belem', 'Belém')
    .replace('Macapa', 'Macapá').replace('Florianopolis', 'Florianópolis')
    .replace('Goiania', 'Goiânia').replace('Cuiaba', 'Cuiabá').replace('Vitoria', 'Vitória')
    .replace('Brasilia', 'Brasília').replace('Maceio', 'Maceió').replace('Teresina', 'Teresina')
    .replace('Aracaju', 'Aracaju').replace('Palmas', 'Palmas')
}

function normalizeStr(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getMoteisCidade(estado: string, cidadeSlug: string) {
  try {
    const { data } = await adminClient()
      .from('moteis')
      .select('id, slug, nome, cidade, estado, foto_capa, fotos_galeria, endereco, whatsapp, lat, lng, usa_builder, site_externo')
      .eq('status', 'active')
      .ilike('estado', estado)
      .order('nome')
    return (data || []).filter(m => normalizeStr(m.cidade) === cidadeSlug)
  } catch { return [] }
}

async function getOutrasCidades(estado: string, cidadeAtual: string) {
  try {
    const { data } = await adminClient()
      .from('moteis').select('cidade')
      .eq('status', 'active').ilike('estado', estado)
    return Array.from(new Set((data || []).map(m => normalizeStr(m.cidade)))).filter(c => c !== cidadeAtual)
  } catch { return [] }
}

export async function generateStaticParams() {
  try {
    const { data } = await adminClient()
      .from('moteis').select('estado, cidade').eq('status', 'active')
    const seen = new Set<string>()
    const result: { estado: string; cidade: string }[] = []
    ;(data || []).forEach(m => {
      const key = `${m.estado.toLowerCase()}-${normalizeStr(m.cidade)}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push({ estado: m.estado.toLowerCase(), cidade: normalizeStr(m.cidade) })
      }
    })
    // Ajouter les 27 capitales
    Object.entries(ESTADOS).forEach(([uf, info]) => {
      const key = `${uf}-${info.capitalSlug}`
      if (!seen.has(key)) { seen.add(key); result.push({ estado: uf, cidade: info.capitalSlug }) }
    })
    return result
  } catch {
    return Object.entries(ESTADOS).map(([uf, info]) => ({ estado: uf, cidade: info.capitalSlug }))
  }
}

export async function generateMetadata({ params }: { params: { estado: string; cidade: string } }): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://moteis.app.br'
  const estadoInfo = ESTADOS[params.estado.toLowerCase()]
  const cidadeNome = slugToNome(params.cidade)
  const ufUpper = params.estado.toUpperCase()
  const title = `Motéis em ${cidadeNome}, ${ufUpper} — Reserve pelo WhatsApp | MotéisBrasil`
  const description = `Encontre os melhores motéis em ${cidadeNome}, ${estadoInfo?.nome || ufUpper}. Compare preços de suítes, veja fotos e reserve diretamente pelo WhatsApp.`
  return {
    title, description,
    keywords: [`motel ${cidadeNome}`, `motel em ${cidadeNome}`, `motéis ${cidadeNome}`, `motel ${ufUpper}`],
    openGraph: { title, description, type: 'website', locale: 'pt_BR', url: `${base}/moteis/${params.estado}/${params.cidade}` },
    alternates: { canonical: `${base}/moteis/${params.estado}/${params.cidade}` },
  }
}

export const revalidate = 3600
export const dynamicParams = true

export default async function CidadePage({ params }: { params: { estado: string; cidade: string } }) {
  const estadoInfo = ESTADOS[params.estado.toLowerCase()]
  if (!estadoInfo) notFound()

  const cidadeNome = slugToNome(params.cidade)
  const ufUpper = params.estado.toUpperCase()
  const moteis = await getMoteisCidade(ufUpper, params.cidade)
  const outrasCidades = await getOutrasCidades(ufUpper, params.cidade)
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://moteis.app.br'

  const itemListLd = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: `Motéis em ${cidadeNome}, ${ufUpper}`,
    numberOfItems: moteis.length,
    itemListElement: moteis.slice(0, 10).map((m, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: {
        '@type': 'LodgingBusiness', name: m.nome,
        url: m.usa_builder ? `${base}/motel/${m.slug}` : m.site_externo,
        address: { '@type': 'PostalAddress', addressLocality: m.cidade, addressRegion: m.estado, addressCountry: 'BR' },
        ...(m.lat ? { geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lng } } : {}),
      }
    }))
  }

  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `Quantos motéis têm em ${cidadeNome}?`,
        acceptedAnswer: { '@type': 'Answer', text: moteis.length > 0
          ? `${cidadeNome} tem ${moteis.length} motel${moteis.length > 1 ? 's' : ''} no MotéisBrasil: ${moteis.slice(0, 3).map(m => m.nome).join(', ')}.`
          : `No momento não há motéis cadastrados em ${cidadeNome}. Cadastre seu motel gratuitamente em ${base}/cadastro.` }
      },
      { '@type': 'Question', name: `Como reservar um motel em ${cidadeNome}?`,
        acceptedAnswer: { '@type': 'Answer', text: `Para reservar um motel em ${cidadeNome}, escolha o estabelecimento no MotéisBrasil, veja fotos e preços das suítes e clique no botão WhatsApp para reservar diretamente, sem intermediários.` }
      },
      { '@type': 'Question', name: `Qual o preço médio de motel em ${cidadeNome}?`,
        acceptedAnswer: { '@type': 'Answer', text: `Os preços de motéis em ${cidadeNome} variam conforme o tipo de suíte e período. Confira os preços detalhados de cada estabelecimento no MotéisBrasil e compare antes de reservar.` }
      },
    ]
  }

  return (
    <>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <main style={{ minHeight: '100vh', background: '#0f1117' }}>
        {/* Hero */}
        <section style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,0,31,.08) 0%, transparent 70%)', padding: '60px 20px 40px', textAlign: 'center' as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(212,0,31,.08)', border: '1px solid rgba(212,0,31,.2)', borderRadius: 50, fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4001F', marginBottom: 16, textTransform: 'uppercase' as const }}>
            🇧🇷 {estadoInfo.nome} · {ufUpper}
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, marginBottom: 12, lineHeight: 1.1 }}>
            Motéis em <span style={{ color: '#D4001F' }}>{cidadeNome}</span>
          </h1>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, margin: '0 auto 24px', lineHeight: 1.65 }}>
            {moteis.length > 0
              ? `${moteis.length} motel${moteis.length > 1 ? 's' : ''} em ${cidadeNome}, ${estadoInfo.nome}. Compare preços e reserve pelo WhatsApp.`
              : `Seja o primeiro motel em ${cidadeNome} no maior portal do Brasil.`}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <a href="/" style={{ padding: '10px 22px', background: '#D4001F', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>📍 Buscar perto de mim</a>
            <a href={`/moteis/${params.estado}`} style={{ padding: '10px 22px', background: 'transparent', border: '1px solid #252d3d', color: '#f0ebe0', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Ver todo o {estadoInfo.nome}</a>
          </div>
        </section>

        {/* Lista */}
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px' }}>
          <CidadeClient moteis={moteis} cidadeNome={cidadeNome} estado={ufUpper} />
        </div>

        {/* FAQ */}
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px 48px' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Perguntas frequentes</h2>
          {[
            { q: `Quantos motéis têm em ${cidadeNome}?`, a: moteis.length > 0 ? `${moteis.length} motel${moteis.length > 1 ? 's' : ''} cadastrado${moteis.length > 1 ? 's' : ''} no MotéisBrasil.` : `Nenhum cadastrado ainda. Cadastre o seu gratuitamente!` },
            { q: `Como reservar um motel em ${cidadeNome}?`, a: 'Escolha o motel, veja as suítes e clique em WhatsApp para reservar diretamente.' },
            { q: `Tem motéis com hidromassagem em ${cidadeNome}?`, a: `Confira os filtros de serviços no portal para encontrar motéis com hidromassagem em ${cidadeNome}.` },
          ].map(({ q, a }) => (
            <details key={q} style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
              <summary style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14, listStyle: 'none' }}>{q}</summary>
              <p style={{ padding: '0 20px 14px', color: '#9ca3af', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{a}</p>
            </details>
          ))}
        </section>

        {/* Outras cidades */}
        {outrasCidades.length > 0 && (
          <section style={{ background: '#161a24', borderTop: '1px solid #1e1e1e', padding: '28px 20px' }}>
            <div style={{ maxWidth: 1180, margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Outras cidades em {estadoInfo.nome}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                {outrasCidades.slice(0, 24).map(c => (
                  <a key={c} href={`/moteis/${params.estado}/${c}`} style={{ padding: '6px 14px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 6, fontSize: 13, color: '#d4a943', textDecoration: 'none' }}>
                    {slugToNome(c)}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
