import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

const ESTADOS_CAPITAIS: Record<string, string> = {
  ac:'rio-branco',al:'maceio',ap:'macapa',am:'manaus',ba:'salvador',
  ce:'fortaleza',df:'brasilia',es:'vitoria',go:'goiania',ma:'sao-luis',
  mt:'cuiaba',ms:'campo-grande',mg:'belo-horizonte',pa:'belem',
  pb:'joao-pessoa',pr:'curitiba',pe:'recife',pi:'teresina',
  rj:'rio-de-janeiro',rn:'natal',rs:'porto-alegre',ro:'porto-velho',
  rr:'boa-vista',sc:'florianopolis',sp:'sao-paulo',se:'aracaju',to:'palmas',
}

function normalizeStr(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://moteis.app.br'

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/cadastro`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Pages états
  const estadoPages: MetadataRoute.Sitemap = Object.keys(ESTADOS_CAPITAIS).map(uf => ({
    url: `${base}/moteis/${uf}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Pages capitales
  const capitaisPages: MetadataRoute.Sitemap = Object.entries(ESTADOS_CAPITAIS).map(([uf, capital]) => ({
    url: `${base}/moteis/${uf}/${capital}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Fiches motéis
    const { data: moteis } = await admin
      .from('moteis').select('slug, updated_at, cidade, estado')
      .eq('status', 'active').eq('usa_builder', true)
      .order('updated_at', { ascending: false })

    const motelPages: MetadataRoute.Sitemap = (moteis || []).map(m => ({
      url: `${base}/motel/${m.slug}`,
      lastModified: new Date(m.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))

    // Pages villes avec motéis
    const seen = new Set<string>()
    const cidadePages: MetadataRoute.Sitemap = []
    ;(moteis || []).forEach(m => {
      const key = `${m.estado.toLowerCase()}-${normalizeStr(m.cidade)}`
      if (!seen.has(key)) {
        seen.add(key)
        cidadePages.push({
          url: `${base}/moteis/${m.estado.toLowerCase()}/${normalizeStr(m.cidade)}`,
          lastModified: new Date(m.updated_at),
          changeFrequency: 'weekly' as const,
          priority: 0.85,
        })
      }
    })

    return [...staticPages, ...estadoPages, ...capitaisPages, ...cidadePages, ...motelPages]
  } catch {
    return [...staticPages, ...estadoPages, ...capitaisPages]
  }
}
