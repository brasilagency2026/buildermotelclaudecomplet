import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { motelMeta } from '@/lib/utils'
import MotelVitrine from '@/components/vitrine/MotelVitrine'

interface Props { params: { slug: string } }

async function getMotel(slug: string) {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    // Buscar motel independente do status (active OU pending)
    const { data: motel } = await admin
      .from('moteis')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!motel) return null

    // Buscar suítes com tarifas
    const { data: suites } = await admin
      .from('suites')
      .select('*, tarifas(*)')
      .eq('motel_id', motel.id)
      .order('ordem')

    return { ...motel, suites: suites || [] }
  } catch (err) {
    console.error('[getMotel]', err)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const motel = await getMotel(params.slug)
  if (!motel) return { title: 'Motel não encontrado' }
  const { title, description } = motelMeta(motel)
  return {
    title, description,
    openGraph: {
      title, description, type: 'website', locale: 'pt_BR',
      images: motel.foto_capa ? [{ url: motel.foto_capa, width: 1200, height: 630 }] : [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/motel/${params.slug}`,
    },
  }
}

export async function generateStaticParams() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await admin.from('moteis').select('slug').limit(100)
    return (data || []).map(m => ({ slug: m.slug }))
  } catch {
    return []
  }
}

export const revalidate = 0  // Toujours fraîche — données critiques
export const dynamicParams = true

export default async function MotelPage({ params }: Props) {
  const motel = await getMotel(params.slug)
  if (!motel) notFound()

  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  const allServices = Array.from(new Set(
    (motel.suites || []).flatMap((s: any) => (s.servicos || '').split(',').map((x: string) => x.trim()).filter(Boolean))
  ))
  const allPrices = (motel.suites || []).flatMap((s: any) => (s.tarifas || []).map((t: any) => t.preco))
  const priceMin = allPrices.length ? Math.min(...allPrices) : null
  const priceMax = allPrices.length ? Math.max(...allPrices) : null

  // Schema.org enrichi
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${base}/motel/${motel.slug}`,
    name: motel.nome,
    description: motel.descricao,
    url: `${base}/motel/${motel.slug}`,
    telephone: motel.telefone,
    image: motel.foto_capa,
    priceRange: priceMin ? `R$${priceMin} - R$${priceMax}` : undefined,
    currenciesAccepted: 'BRL',
    openingHours: 'Mo-Su 00:00-24:00',
    address: {
      '@type': 'PostalAddress',
      streetAddress: motel.endereco,
      addressLocality: motel.cidade,
      addressRegion: motel.estado,
      addressCountry: 'BR',
      postalCode: motel.cep,
    },
    ...(motel.lat && motel.lng ? {
      geo: { '@type': 'GeoCoordinates', latitude: motel.lat, longitude: motel.lng }
    } : {}),
    amenityFeature: allServices.map(s => ({
      '@type': 'LocationFeatureSpecification',
      name: s, value: true,
    })),
    hasOfferCatalog: motel.suites?.length ? {
      '@type': 'OfferCatalog',
      name: 'Suítes',
      itemListElement: motel.suites.map((s: any) => ({
        '@type': 'Offer',
        name: s.nome,
        description: s.descricao,
        image: s.fotos?.[0],
        priceSpecification: s.tarifas?.map((t: any) => ({
          '@type': 'UnitPriceSpecification',
          price: t.preco,
          priceCurrency: 'BRL',
          unitText: t.periodo,
        })),
      })),
    } : undefined,
  }

  // FAQ Schema — crucial para LLMs
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Como reservar no ${motel.nome}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Para reservar no ${motel.nome}, clique no botão WhatsApp na página e envie uma mensagem diretamente ao estabelecimento. Localizado em ${motel.endereco}, ${motel.cidade}, ${motel.estado}.`,
        }
      },
      ...(priceMin ? [{
        '@type': 'Question',
        name: `Qual o preço das suítes no ${motel.nome}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Os preços no ${motel.nome} começam a partir de R$${priceMin}. ${motel.suites?.map((s: any) => `A ${s.nome} custa a partir de R$${Math.min(...(s.tarifas?.map((t: any) => t.preco) || [0]))}`).join('. ')}.`,
        }
      }] : []),
      {
        '@type': 'Question',
        name: `Onde fica o ${motel.nome}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `O ${motel.nome} está localizado em ${motel.endereco}, ${motel.cidade}, ${motel.estado}, Brasil.${motel.lat ? ` Coordenadas GPS: ${motel.lat}, ${motel.lng}.` : ''}`,
        }
      },
      ...(allServices.includes('Hidromassagem') ? [{
        '@type': 'Question',
        name: `O ${motel.nome} tem hidromassagem?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sim, o ${motel.nome} oferece suítes com hidromassagem.`,
        }
      }] : []),
    ].filter(Boolean),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <MotelVitrine motel={motel} />
    </>
  )
}
