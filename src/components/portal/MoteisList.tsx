'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { fmtBRL, fmtDist, wppLink, mapsLink } from '@/lib/utils'
import type { MotelCard } from '@/types'
import { ESTADOS_BR } from '@/types'

interface Props { initialMoteis: MotelCard[] }

export default function MoteisList({ initialMoteis }: Props) {
  const sp = useSearchParams()
  const [moteis, setMoteis] = useState(initialMoteis)
  const [loading, setLoading] = useState(false)
  const [geoActive, setGeoActive] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [userCoords, setUserCoords] = useState<{lat:number,lng:number}|null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const SERVICOS = ['Hidromassagem','Sauna','Piscina','Lareira','Wi-Fi','TV Smart']

  const fetchMoteis = async (lat?: number, lng?: number) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (sp.get('q')) params.set('q', sp.get('q')!)
    if (sp.get('estado')) params.set('estado', sp.get('estado')!)
    if (lat) params.set('lat', String(lat))
    if (lng) params.set('lng', String(lng))
    const res = await fetch(`/api/moteis?${params}`)
    const data = await res.json()
    let list = data.moteis || []
    if (activeFilters.length) list = list.filter((m: MotelCard) => activeFilters.every(f => (m as any).servicos?.includes(f)))
    setMoteis(list)
    setLoading(false)
  }

  useEffect(() => { fetchMoteis(userCoords?.lat, userCoords?.lng) }, [sp, activeFilters])

  const getLocation = () => {
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      setUserCoords({ lat, lng })
      setGeoActive(true)
      setGeoLoading(false)
      fetchMoteis(lat, lng)
    }, () => setGeoLoading(false))
  }

  const toggleFilter = (f: string) =>
    setActiveFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])

  return (
    <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px 48px' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1e1e1e' }}>
        <button onClick={getLocation} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          background: geoActive ? 'rgba(212,0,31,.1)' : 'transparent',
          border: `1px solid ${geoActive ? 'rgba(212,0,31,.4)' : '#252d3d'}`,
          borderRadius: 4, color: geoActive ? '#ff4458' : '#6b7280',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {geoLoading ? '⏳' : '📍'} {geoActive ? 'Localização ativa' : 'Usar minha localização'}
        </button>
        {SERVICOS.map(s => (
          <button key={s} onClick={() => toggleFilter(s)} style={{
            padding: '6px 11px', border: `1px solid ${activeFilters.includes(s) ? 'rgba(212,0,31,.5)' : '#252d3d'}`,
            borderRadius: 4, fontSize: 11, fontWeight: 600,
            color: activeFilters.includes(s) ? '#ff4458' : '#6b7280',
            background: activeFilters.includes(s) ? 'rgba(212,0,31,.08)' : 'transparent',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{s}</button>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 3, height: 16, background: '#D4001F', borderRadius: 2 }} />
          {geoActive ? 'Motéis Próximos a Você' : 'Motéis Disponíveis'}
        </h2>
        <span style={{ fontSize: 11, color: '#6b7280' }}>{loading ? 'Buscando...' : `${moteis.length} encontrados`}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[...Array(6)].map((_,i) => <div key={i} style={{ height: 280, background: '#1c2130', borderRadius: 6, border: '1px solid #252d3d', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : moteis.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 15 }}>Nenhum motel encontrado com esses filtros.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
          {moteis.map(m => <MotelCard key={m.id} m={m} />)}
        </div>
      )}
    </section>
  )
}

function MotelCard({ m }: { m: MotelCard }) {
  const foto = m.foto_capa || m.fotos_galeria?.[0]
  return (
    <article style={{ background: '#1c2130', border: '1px solid #252d3d', borderRadius: 6, overflow: 'hidden', transition: 'all .2s', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a3040'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252d3d'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>

      {/* Foto */}
      <Link href={`/motel/${m.slug}`} style={{ display: 'block', position: 'relative', height: 155, overflow: 'hidden', background: '#0d0d0d', textDecoration: 'none' }}>
        {foto ? (
          <Image src={foto} alt={m.nome} fill style={{ objectFit: 'cover' }} sizes="320px" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: .2 }}>🏨</div>
        )}
        {m.distancia_km != null && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.82)', padding: '3px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, color: '#f0ebe0' }}>
            📍 {fmtDist(m.distancia_km)}
          </div>
        )}
      </Link>

      {/* Body */}
      <div style={{ padding: '11px 12px' }}>
        <Link href={`/motel/${m.slug}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f0ebe0' }}>{m.nome}</div>
        </Link>
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {m.cidade}, {m.estado}</div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #252d3d' }}>
          <div>
            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>a partir de</div>
            <div style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 22, fontWeight: 900, color: '#D4001F', lineHeight: 1.1 }}>
              {m.preco_inicial ? fmtBRL(m.preco_inicial) : '—'}<sub style={{ fontSize: 10, color: '#6b7280', fontFamily: 'var(--font-inter),sans-serif', fontWeight: 400 }}>/2h</sub>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <a href={mapsLink(m.endereco, m.lat, m.lng)} target="_blank" rel="noopener"
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'transparent', border: '1px solid #252d3d', borderRadius: 4, color: '#6b7280', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>
              📍 Maps
            </a>
            {m.whatsapp && (
              <a href={wppLink(m.whatsapp, m.nome)} target="_blank" rel="noopener"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#075E54', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>
                💬 WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
