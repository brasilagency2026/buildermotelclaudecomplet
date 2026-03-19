'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { fmtBRL, fmtDist, wppLink, mapsLink } from '@/lib/utils'
import type { MotelCard } from '@/types'

const MotelMap = dynamic(() => import('./MotelMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 420, background: '#0d1117', border: '1px solid #252d3d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 13 }}>
      ⏳ Carregando mapa...
    </div>
  ),
})

const SERVICOS = ['Hidromassagem', 'Sauna', 'Piscina', 'Lareira', 'Wi-Fi', 'TV Smart']

export default function HomeClient({ initialMoteis }: { initialMoteis: MotelCard[] }) {
  const [moteis, setMoteis] = useState(initialMoteis)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoActive, setGeoActive] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const fetchMoteis = useCallback(async (lat?: number, lng?: number, filters?: string[]) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (lat) params.set('lat', String(lat))
      if (lng) params.set('lng', String(lng))
      const res = await fetch(`/api/moteis?${params}`)
      const data = await res.json()
      let list: MotelCard[] = data.moteis || []
      const f = filters ?? activeFilters
      if (f.length) list = list.filter(m => f.every(s => (m as any).servicos?.includes(s)))
      setMoteis(list)
    } finally {
      setLoading(false)
    }
  }, [activeFilters])

  useEffect(() => {
    if (!navigator?.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserCoords({ lat, lng })
        setGeoActive(true)
        setGeoLoading(false)
        fetchMoteis(lat, lng)
      },
      () => setGeoLoading(false),
      { timeout: 8000, maximumAge: 300000 }
    )
  }, [])

  const requestLocation = () => {
    setGeoLoading(true); setGeoError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserCoords({ lat, lng })
        setGeoActive(true)
        setGeoLoading(false)
        fetchMoteis(lat, lng)
      },
      err => {
        setGeoLoading(false)
        setGeoError(err.code === 1 ? 'Permissão negada.' : 'Localização indisponível.')
      },
      { timeout: 10000 }
    )
  }

  const toggleFilter = (f: string) => {
    const next = activeFilters.includes(f) ? activeFilters.filter(x => x !== f) : [...activeFilters, f]
    setActiveFilters(next)
    fetchMoteis(userCoords?.lat, userCoords?.lng, next)
  }

  return (
    <>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px' }}>
        {geoLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(212,169,67,.06)', border: '1px solid rgba(212,169,67,.2)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#d4a943' }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
            Detectando sua localização...
          </div>
        )}
        {geoActive && !geoLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 8, marginBottom: 12, fontSize: 12, color: '#4ade80' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            Mostrando motéis mais próximos de você — ordenados por distância
          </div>
        )}
      </div>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1e1e1e' }}>
          {!geoActive && !geoLoading && (
            <button onClick={requestLocation} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(212,0,31,.06)', border: '1px solid rgba(212,0,31,.3)', borderRadius: 4, color: '#ff4458', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              📍 Usar minha localização
            </button>
          )}
          {geoError && <span style={{ fontSize: 11, color: '#f87171', alignSelf: 'center' }}>⚠ {geoError}</span>}
          {SERVICOS.map(s => (
            <button key={s} onClick={() => toggleFilter(s)} style={{ padding: '6px 11px', border: `1px solid ${activeFilters.includes(s) ? 'rgba(212,0,31,.5)' : '#252d3d'}`, borderRadius: 4, fontSize: 11, fontWeight: 600, color: activeFilters.includes(s) ? '#ff4458' : '#6b7280', background: activeFilters.includes(s) ? 'rgba(212,0,31,.08)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 3, height: 16, background: '#D4001F', borderRadius: 2 }} />
            {geoActive ? '📍 Motéis Próximos a Você' : 'Motéis Disponíveis'}
          </h2>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            {loading ? 'Buscando...' : `${moteis.length} encontrados`}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 280, background: '#1c2130', borderRadius: 6, border: '1px solid #252d3d', opacity: 0.5 }} />
            ))}
          </div>
        ) : moteis.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p>Nenhum motel encontrado.</p>
            <button
              onClick={() => { setActiveFilters([]); fetchMoteis(userCoords?.lat, userCoords?.lng, []) }}
              style={{ marginTop: 12, color: '#D4001F', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
            {moteis.map(m => (
              <MotelCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      <div style={{ background: '#000', borderTop: '1px solid #1e1e1e', borderBottom: '1px solid #1e1e1e', padding: '24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontFamily: 'var(--font-playfair),serif', fontSize: 18, fontWeight: 900 }}>
            <span style={{ display: 'inline-block', width: 3, height: 16, background: '#D4001F', borderRadius: 2 }} />
            {geoActive ? 'Motéis ao seu Redor' : 'Visualizar no Mapa'}
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
            Clique em qualquer pin para ver detalhes do motel.
          </p>
          <MotelMap moteis={moteis} userCoords={userCoords} height={450} />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

function MotelCard({ m }: { m: MotelCard }) {
  const foto = m.foto_capa || m.fotos_galeria?.[0]
  const hasOwnSite = !!m.site_externo && !m.usa_builder
  const href = hasOwnSite ? m.site_externo! : `/motel/${m.slug}`
  const linkTarget = hasOwnSite ? '_blank' : '_self'

  return (
    <article style={{
      background: '#1c2130',
      border: '1px solid #252d3d',
      borderRadius: 6,
      overflow: 'hidden',
      transition: 'transform .2s',
    }}>
      <a
        href={href}
        target={linkTarget}
        rel="noopener noreferrer"
        style={{ display: 'block', position: 'relative', height: 155, overflow: 'hidden', background: '#0d0d0d', textDecoration: 'none' }}
      >
        {foto ? (
          <Image src={foto} alt={m.nome} fill style={{ objectFit: 'cover' }} sizes="320px" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: .2 }}>🏨</div>
        )}
        {m.distancia_km != null && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#f0ebe0', border: '1px solid rgba(255,255,255,.1)' }}>
            📍 {fmtDist(m.distancia_km)}
          </div>
        )}
      </a>

      <div style={{ padding: '11px 12px' }}>
        <a href={href} target={linkTarget} rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f0ebe0' }}>
            {m.nome}
          </div>
        </a>
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 10 }}>
          📍 {m.cidade}, {m.estado}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #252d3d' }}>
          <div>
            {!hasOwnSite && (
              <div>
                <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>a partir de</div>
                <div style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 22, fontWeight: 900, color: '#D4001F', lineHeight: 1.1 }}>
                  {m.preco_inicial ? fmtBRL(m.preco_inicial) : '—'}
                  <sub style={{ fontSize: 10, color: '#6b7280', fontFamily: 'sans-serif', fontWeight: 400 }}>/2h</sub>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <a
              href={mapsLink(m.endereco, m.lat, m.lng)}
              target="_blank"
              rel="noopener"
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'transparent', border: '1px solid #252d3d', borderRadius: 4, color: '#6b7280', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}
            >
              📍 Maps
            </a>
            {!hasOwnSite && m.whatsapp && (
              <a
                href={wppLink(m.whatsapp, m.nome)}
                target="_blank"
                rel="noopener"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#075E54', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}
              >
                💬 WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
