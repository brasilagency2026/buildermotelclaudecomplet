'use client'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useState } from 'react'

interface Props {
  motelId: string
  alreadyActive: boolean
  onSuccess: () => void
  onSaveFirst?: () => Promise<string | null>  // callback para salvar motel antes do PayPal
}

export default function PayPalSubscribe({ motelId, alreadyActive, onSuccess, onSaveFirst }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startSubscription = async () => {
    setLoading(true)
    setError('')
    try {
      let id = motelId

      // Se motelId ainda está vazio, salvar o motel primeiro
      if (!id && onSaveFirst) {
        const savedId = await onSaveFirst()
        if (!savedId) throw new Error('Salve as informações do motel antes de assinar.')
        id = savedId
      }

      if (!id) throw new Error('Salve as informações do motel antes de assinar.')

      const res = await fetchWithAuth('/api/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motel_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.approval_url) window.location.href = data.approval_url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (alreadyActive) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 18px',
      background: 'rgba(0,200,83,.08)', border: '1px solid rgba(0,200,83,.25)',
      borderRadius: 10, fontSize: 14, color: '#4ade80', fontWeight: 600,
    }}>
      ✅ Assinatura ativa — R$ 50/mês via PayPal
    </div>
  )

  return (
    <div>
      <div style={{
        background: 'rgba(212,169,67,.06)', border: '1px solid rgba(212,169,67,.2)',
        borderRadius: 12, padding: 20, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 40, fontWeight: 900, color: '#d4a943', lineHeight: 1 }}>R$50</span>
          <span style={{ fontSize: 14, color: '#6b7280' }}>/mês · cancele quando quiser</span>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            'Página SEO otimizada (Google, Bing)',
            'URL exclusiva: /motel/nome-estado-cidade',
            'Suítes com fotos e tabela de preços',
            'Reservas diretas via WhatsApp',
            'Google Maps integrado + Waze',
            'Cobrança automática mensal via PayPal',
          ].map(item => (
            <li key={item} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: '#6b7280',
              padding: '8px 0', borderBottom: '1px solid #1a1f2e',
            }}>
              <span style={{ color: '#4ade80', fontSize: 16 }}>✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', background: 'rgba(212,0,31,.1)',
          border: '1px solid rgba(212,0,31,.3)', borderRadius: 8,
          color: '#ff6b6b', fontSize: 13, marginBottom: 12,
        }}>
          ⚠ {error}
        </div>
      )}

      <button
        onClick={startSubscription}
        disabled={loading}
        style={{
          width: '100%', padding: 15, background: '#FFB900', color: '#000',
          border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'inherit', opacity: loading ? .7 : 1,
        }}
      >
        <span style={{ fontSize: 20 }}>🅿</span>
        {loading ? 'Processando...' : 'Assinar com PayPal — R$ 50/mês'}
      </button>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginTop: 10 }}>
        🔒 Pagamento seguro. Você será redirecionado ao PayPal.
      </p>
    </div>
  )
}
