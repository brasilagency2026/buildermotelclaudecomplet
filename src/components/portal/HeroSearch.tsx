'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ESTADOS_BR } from '@/types'

export default function HeroSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (estado) p.set('estado', estado)
    router.push(`/?${p.toString()}`)
  }

  return (
    <section style={{ position: 'relative', minHeight: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', overflow: 'hidden' }}>
      {/* BG gradient */}
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

      <form onSubmit={search} style={{ width: '100%', maxWidth: 680, background: '#161a24', border: '1px solid #252d3d', borderRadius: 12, padding: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Cidade ou nome do motel..."
          style={{ flex: 1, minWidth: 180, background: 'transparent', border: 'none', outline: 'none', padding: '10px 14px', color: '#f0ebe0', fontSize: 14, fontFamily: 'inherit' }}
        />
        <select value={estado} onChange={e => setEstado(e.target.value)}
          style={{ background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, padding: '8px 10px', color: estado ? '#f0ebe0' : '#6b7280', fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 140 }}>
          <option value="">Todos os estados</option>
          {ESTADOS_BR.map(e => <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>)}
        </select>
        <button type="submit" style={{ padding: '10px 24px', background: '#D4001F', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: '.5px', fontFamily: 'inherit' }}>
          Buscar
        </button>
      </form>

      <div style={{ display: 'flex', gap: 40, marginTop: 48 }}>
        {[['2.400+','Motéis cadastrados'],['27','Estados cobertos']].map(([num, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 30, fontWeight: 900, color: '#D4001F' }}>{num}</div>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.8px', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
