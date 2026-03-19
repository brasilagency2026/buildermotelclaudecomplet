'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AddressAutocomplete from '@/components/shared/AddressAutocomplete'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { makeSlug } from '@/lib/utils'
import { ESTADOS_BR } from '@/types'
import type { AddressResult } from '@/lib/useGoogleMapsAddress'

export default function CadastroGratuito({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cep, setCep] = useState('')
  const [lat, setLat] = useState<number | undefined>()
  const [lng, setLng] = useState<number | undefined>()
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [siteExterno, setSiteExterno] = useState('')

  const handleAddressSelect = useCallback((result: AddressResult) => {
    setEndereco(result.endereco)
    setCidade(result.cidade)
    setEstado(result.estado)
    setCep(result.cep)
    setLat(result.lat)
    setLng(result.lng)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteExterno) { setError('Informe a URL do seu site.'); return }
    if (!siteExterno.startsWith('http')) { setError('URL inválida. Ex: https://www.seusite.com.br'); return }
    setLoading(true); setError('')
    try {
      const res = await fetchWithAuth('/api/moteis', {
        method: 'POST',
        body: JSON.stringify({
          nome, endereco, cidade, estado, cep,
          lat: lat || null, lng: lng || null,
          telefone: telefone || null,
          whatsapp: whatsapp || null,
          site_externo: siteExterno,
          usa_builder: false,
          fotos_galeria: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/dashboard?cadastro=gratuito')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const S = {
    wrap: { minHeight: '100vh', background: '#0f1117' } as React.CSSProperties,
    top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52, background: '#000', borderBottom: '1px solid #1e1e1e' } as React.CSSProperties,
    body: { maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' } as React.CSSProperties,
    section: { background: '#1c2130', border: '1px solid #252d3d', borderRadius: 16, padding: 28, marginBottom: 20 } as React.CSSProperties,
    label: { display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#6b7280', marginBottom: 6 },
    input: { width: '100%', padding: '11px 14px', background: '#0f1117', border: '1px solid #252d3d', borderRadius: 8, color: '#f0ebe0', fontSize: 13, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 } as React.CSSProperties,
    field: { marginBottom: 14 } as React.CSSProperties,
    btn: { width: '100%', padding: 16, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
    err: { padding: '10px 14px', background: 'rgba(212,0,31,.1)', border: '1px solid rgba(212,0,31,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13, marginBottom: 12 } as React.CSSProperties,
  }

  return (
    <div style={S.wrap}>
      {/* Top bar */}
      <div style={S.top}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #252d3d', borderRadius: 6, color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Painel
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>🌐 Cadastro Gratuito</span>
        </div>
      </div>

      <div style={S.body}>
        {/* Banner */}
        <div style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>✓</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#4ade80', marginBottom: 2 }}>100% Gratuito — Sem mensalidade</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Seu motel aparecerá no portal com link direto para o seu site.</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Dados do motel */}
          <div style={S.section}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-playfair),serif', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏨 Informações do Motel
            </div>

            <div style={S.field}>
              <label style={S.label}>Nome do motel *</label>
              <input style={S.input} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Motel Paraíso" required />
              {nome && estado && cidade && (
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontFamily: 'monospace' }}>
                  📍 Aparecerá como: {nome} — {cidade}, {estado}
                </p>
              )}
            </div>

            <div style={S.field}>
              <label style={S.label}>Endereço *</label>
              <AddressAutocomplete
                value={endereco}
                onChange={setEndereco}
                onAddressSelect={handleAddressSelect}
                placeholder="Ex: Av. Paulista, 1234 — São Paulo, SP"
                required
              />
              {lat && (
                <p style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>
                  ✓ GPS: {lat.toFixed(5)}, {lng?.toFixed(5)}
                </p>
              )}
            </div>

            <div style={S.row}>
              <div>
                <label style={S.label}>Cidade *</label>
                <input style={S.input} value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo" required />
              </div>
              <div>
                <label style={S.label}>Estado *</label>
                <select style={S.input} value={estado} onChange={e => setEstado(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {ESTADOS_BR.map(e => <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>)}
                </select>
              </div>
            </div>

            <div style={S.row}>
              <div>
                <label style={S.label}>Telefone</label>
                <input style={S.input} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 3333-4444" />
              </div>
              <div>
                <label style={S.label}>WhatsApp</label>
                <input style={S.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="55 11 9 9999-0000" />
              </div>
            </div>
          </div>

          {/* URL do site */}
          <div style={S.section}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-playfair),serif', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔗 URL do seu site *
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
              Os visitantes serão redirecionados para o seu site ao clicar no seu motel no portal.
            </p>
            <div style={S.field}>
              <label style={S.label}>Link completo do site *</label>
              <input
                style={{ ...S.input, borderColor: siteExterno && !siteExterno.startsWith('http') ? 'rgba(212,0,31,.5)' : '#252d3d' }}
                type="url"
                value={siteExterno}
                onChange={e => setSiteExterno(e.target.value)}
                placeholder="https://www.seumotel.com.br"
                required
              />
              {siteExterno && siteExterno.startsWith('http') && (
                <p style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>✓ URL válida</p>
              )}
            </div>
          </div>

          {error && <div style={S.err}>{error}</div>}

          <button style={S.btn} disabled={loading}>
            {loading ? '⏳ Cadastrando...' : '✓ Cadastrar gratuitamente →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginTop: 12 }}>
            Sem mensalidade · Sem cartão de crédito · Cancele quando quiser
          </p>
        </form>
      </div>
    </div>
  )
}
