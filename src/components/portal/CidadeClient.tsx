'use client'
import Image from 'next/image'
import { fmtBRL, wppLink, mapsLink } from '@/lib/utils'

interface Motel {
  id: string; slug: string; nome: string; cidade: string; estado: string
  foto_capa?: string; fotos_galeria?: string[]; endereco: string
  whatsapp?: string; lat?: number; lng?: number
  usa_builder: boolean; site_externo?: string
}

export default function CidadeClient({ moteis, cidadeNome, estado }: { moteis: Motel[]; cidadeNome: string; estado: string }) {
  if (moteis.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏨</div>
        <p style={{ fontSize: 16, marginBottom: 8 }}>Nenhum motel cadastrado em {cidadeNome} ainda.</p>
        <p style={{ fontSize: 14, marginBottom: 24 }}>Seja o primeiro estabelecimento da cidade no maior portal do Brasil.</p>
        <a href="/cadastro" style={{ padding: '12px 24px', background: '#D4001F', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
          Cadastrar meu motel gratuitamente →
        </a>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 3, height: 16, background: '#D4001F', borderRadius: 2 }} />
          {moteis.length} motel{moteis.length > 1 ? 's' : ''} em {cidadeNome}
        </h2>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{estado}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
        {moteis.map(m => {
          const foto = m.foto_capa || m.fotos_galeria?.[0]
          const hasOwnSite = !!m.site_externo && !m.usa_builder
          const href = hasOwnSite ? m.site_externo! : `/motel/${m.slug}`
          const target = hasOwnSite ? '_blank' : '_self'
          return (
            <article key={m.id} style={{ background: '#1c2130', border: '1px solid #252d3d', borderRadius: 6, overflow: 'hidden' }}>
              <a href={href} target={target} rel="noopener noreferrer"
                style={{ display: 'block', position: 'relative', height: 155, background: '#0d0d0d', textDecoration: 'none' }}>
                {foto
                  ? <Image src={foto} alt={`${m.nome} — ${cidadeNome}, ${estado}`} fill style={{ objectFit: 'cover' }} sizes="320px" />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: .2 }}>🏨</div>
                }
              </a>
              <div style={{ padding: '11px 12px' }}>
                <a href={href} target={target} rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: '#f0ebe0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nome}</div>
                </a>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 10 }}>📍 {m.endereco}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <a href={mapsLink(m.endereco, m.lat, m.lng)} target="_blank" rel="noopener"
                    style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #252d3d', borderRadius: 4, color: '#6b7280', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>
                    📍 Maps
                  </a>
                  {!hasOwnSite && m.whatsapp && (
                    <a href={wppLink(m.whatsapp, m.nome)} target="_blank" rel="noopener"
                      style={{ padding: '6px 10px', background: '#075E54', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
