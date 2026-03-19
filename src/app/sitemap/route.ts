import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
export const revalidate = 3600
export async function GET() {
  const sb = createServerSupabase()
  const { data } = await sb.from('moteis').select('slug, updated_at').eq('status','active')
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://motelsbrasil.com.br'
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/cadastro</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  ${(data||[]).map(m=>`<url><loc>${base}/motel/${m.slug}</loc><lastmod>${new Date(m.updated_at).toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`).join('\n  ')}
</urlset>`
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } })
}
