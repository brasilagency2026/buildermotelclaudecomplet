'use client'
import dynamic from 'next/dynamic'
import type { MotelCard } from '@/types'

// Import dynamique pour éviter SSR (Google Maps est client-only)
const MotelMap = dynamic(() => import('./MotelMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 420, background: '#0d1117', border: '1px solid #252d3d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 13 }}>
      ⏳ Carregando mapa...
    </div>
  ),
})

interface Props { moteis?: MotelCard[] }

export default function MapSection({ moteis = [] }: Props) {
  return (
    <div style={{ background: '#000', borderTop: '1px solid #1e1e1e', borderBottom: '1px solid #1e1e1e', padding: 24 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontFamily: 'var(--font-playfair),serif', fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
          <span style={{ display: 'inline-block', width: 3, height: 16, background: '#D4001F', borderRadius: 2 }} />
          Visualizar no Mapa
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
          Clique em qualquer ponto para ver detalhes do motel.
        </p>
        <MotelMap moteis={moteis} height={420} />
      </div>
    </div>
  )
}
