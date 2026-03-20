'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ESTADOS_BR } from '@/types'
import { useGoogleMapsAddress } from '@/lib/useGoogleMapsAddress'
import type { AddressResult } from '@/lib/useGoogleMapsAddress'

export default function HeroSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const handleResult = useCallback((result: AddressResult) => {
    setQ(result.cidade || result.endereco)
    setEstado(result.estado || '')
    setCoords({ lat: result.lat, lng: result.lng })
    setShowSuggestions(false)
  }, [])

  const { suggestions, loading, mapsReady, selectSuggestion } =
    useGoogleMapsAddress(handleResult, q)

  const handleSelect = (s: any) => {
    selectSuggestion(s)
    setShowSuggestions(false)
  }

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (estado) p.set('estado', estado)
    if (coords) { p.set('lat', String(coords.lat)); p.set('lng', String(coords.lng)) }
    router.push(`/?${p.toString()}`)
  }

  return (
    <section style={{ position: 'relative', minHeight: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(212,0,31,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', background: 'rgba(212,0,31,.08)', border: '1px solid rgba(212,0,31,.2)', borderRadius: 50, fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#D4001F', marginBottom: 20 }}>
        🇧🇷 O maior portal de motéis do Brasil
      </div>

      <h1 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, lineHeight: 1, marginBottom: 14, letterSpacing: 1 }}>
        Encontre o Motel<br />
        <span style={{ color: '#D4001F', fontStyle: 'italic' }}>Perfeito</span> Perto de Você
      </h1>

      <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 480, lineHeight: 1.65, marginBottom: 36 }}>
        Conforto e requinte em todo o Brasil. Compare preços, veja fotos das suítes e reserve pelo WhatsApp.
      </p>

      <form onSubmit={search} style={{ width: '100%', maxWidth: 680, position: 'relative' }}>
        <div style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 12, padding: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Input com autocomplete */}
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setCoords(null); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={mapsReady ? 'Cidade, bairro ou nome do motel...' : 'Carregando...'}
              autoComplete="off"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '10px 14px', color: '#f0ebe0', fontSize: 14, fontFamily: 'inherit' }}
            />
            {/* Indicador GPS capturado */}
            {coords && (
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#4ade80' }}>📍</span>
            )}
          </div>

          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            style={{ background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, padding: '8px 10px', color: estado ? '#f0ebe0' : '#6b7280', fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 140 }}
          >
            <option value="">Todos os estados</option>
            {ESTADOS_BR.map(e => <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>)}
          </select>

          <button
            type="submit"
            style={{ padding: '10px 24px', background: '#D4001F', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: '.5px', fontFamily: 'inherit' }}
          >
            Buscar
          </button>
        </div>

        {/* Dropdown sugestões */}
        {showSuggestions && (suggestions.length > 0 || loading) && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: '#1c2130', border: '1px solid #252d3d',
            borderRadius: 10, zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,.7)', overflow: 'hidden',
            textAlign: 'left',
          }}>
            {loading && (
              <div style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>
                ⏳ Buscando...
              </div>
            )}
            {suggestions.map((s, i) => (
              <div
                key={s.placeId}
                style={{ padding: '11px 16px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #252d3d' : 'none' }}
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(212,0,31,.08)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <div style={{ fontSize: 13, color: '#f0ebe0', marginBottom: 2 }}>📍 {s.mainText}</div>
                {s.secondaryText && <div style={{ fontSize: 11, color: '#6b7280' }}>{s.secondaryText}</div>}
              </div>
            ))}
          </div>
        )}
      </form>

      <div style={{ display: 'flex', gap: 40, marginTop: 48 }}>
        {[['2.400+', 'Motéis cadastrados'], ['27', 'Estados cobertos']].map(([num, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 30, fontWeight: 900, color: '#D4001F' }}>{num}</div>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.8px', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
