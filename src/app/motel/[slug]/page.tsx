import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import { motelMeta } from '@/lib/utils'
import NavBar from '@/components/shared/NavBar'
import Footer from '@/components/shared/Footer'
import MotelVitrine from '@/components/vitrine/MotelVitrine'

interface Props { params: { slug: string } }

async function getMotel(slug: string) {
  try {
    const sb = createServerSupabase()
    const { data } = await sb.rpc('get_motel_completo', { p_slug: slug })
    return data
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const motel = await getMotel(params.slug)
  if (!motel) return { title: 'Motel não encontrado' }
  const { title, description } = motelMeta(motel)
  return {
    title,
    description,
    openGraph: {
      title, description, type: 'website', locale: 'pt_BR',
      images: motel.foto_capa ? [{ url: motel.foto_capa, width: 1200, height: 630 }] : [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/motel/${params.slug}`,
    },
  }
}

// Não pré-gerar páginas no build — gerar sob demanda (ISR)
export async function generateStaticParams() {
  try {
    const sb = createServerSupabase()
    const { data } = await sb
      .from('moteis')
      .select('slug')
      .eq('status', 'active')
      .limit(100)
    return (data || []).map(m => ({ slug: m.slug }))
  } catch {
    // Se Supabase não estiver disponível no build, retorna array vazio
    // As páginas serão geradas sob demanda no primeiro acesso (ISR)
    return []
  }
}

export const revalidate = 300
export const dynamicParams = true

export default async function MotelPage({ params }: Props) {
  const motel = await getMotel(params.slug)
  if (!motel) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: motel.nome,
    description: motel.descricao,
    address: {
      '@type': 'PostalAddress',
      streetAddress: motel.endereco,
      addressLocality: motel.cidade,
      addressRegion: motel.estado,
      addressCountry: 'BR',
    },
    telephone: motel.telefone,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/motel/${motel.slug}`,
    ...(motel.lat && motel.lng ? {
      geo: { '@type': 'GeoCoordinates', latitude: motel.lat, longitude: motel.lng }
    } : {}),
    ...(motel.foto_capa ? { image: motel.foto_capa } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NavBar />
      <MotelVitrine motel={motel} />
      <Footer />
    </>
  )
}
