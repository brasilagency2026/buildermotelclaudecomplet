import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // Régénérer toutes les heures

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://motelsbrasil.com.br'

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${base}/cadastro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Pages dynamiques — motéis actifs avec builder
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: moteis } = await admin
      .from('moteis')
      .select('slug, updated_at, cidade, estado, nome')
      .eq('status', 'active')
      .eq('usa_builder', true) // Apenas motéis com site vitrine próprio
      .order('updated_at', { ascending: false })

    const motelPages: MetadataRoute.Sitemap = (moteis || []).map(m => ({
      url: `${base}/motel/${m.slug}`,
      lastModified: new Date(m.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))

    return [...staticPages, ...motelPages]
  } catch {
    // Se Supabase não responder, retornar apenas páginas estáticas
    return staticPages
  }
}
