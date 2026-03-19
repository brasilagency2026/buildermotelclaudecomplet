import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { motelMeta } from '@/lib/utils'
import NavBar from '@/components/shared/NavBar'
import Footer from '@/components/shared/Footer'
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
