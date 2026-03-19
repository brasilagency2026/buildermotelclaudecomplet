'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ESTADOS_BR } from '@/types'
import { makeSlug } from '@/lib/utils'
import AddressAutocomplete from '@/components/shared/AddressAutocomplete'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import type { AddressResult } from '@/lib/useGoogleMapsAddress'

type Step = 'auth' | 'motel' | 'success'

export default function CadastroFlow() {
  const router = useRouter()
  const sb = createClient()
  const [step, setStep] = useState<Step>('auth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slug, setSlug] = useState('')

  // Auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')

  // Motel
  const [nomeMotel, setNomeMotel] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cep, setCep] = useState('')
  const [lat, setLat] = useState<number | undefined>()
  const [lng, setLng] = useState<number | undefined>()
  const [whatsapp, setWhatsapp] = useState('')
  const [telefone, setTelefone] = useState('')
  const [siteExterno, setSiteExterno] = useState('')
  const [motelId, setMotelId] = useState('')

  // Callback do autocomplete
  const handleAddressSelect = useCallback((result: AddressResult) => {
    setEndereco(result.endereco)
    setCidade(result.cidade)
    setEstado(result.estado)
    setCep(result.cep)
    setLat(result.lat)
    setLng(result.lng)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { error } = await sb.auth.signUp({
        email, password, options: { data: { nome } }
      })
      if (error?.message?.includes('already registered')) {
        const { error: e2 } = await sb.auth.signInWithPassword({ email, password })
        if (e2) throw new Error('E-mail já cadastrado. Verifique sua senha.')
      } else if (error) throw error
      setStep('motel')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleMotel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lat || !lng) {
      setError('Selecione o endereço nas sugestões do Google Maps para obter as coordenadas.')
      return
    }
    setLoading(true); setError('')
    try {
      const res = await fetchWithAuth('/api/moteis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeMotel, endereco, cidade, estado, cep,
          lat, lng, whatsapp, telefone,
          site_externo: siteExterno || undefined,
          usa_builder: !siteExterno,
          fotos_galeria: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMotelId(data.motel.id)
      setSlug(data.slug)
      if (!siteExterno) {
        router.push(`/dashboard/editar/${data.motel.id}`)
      } else {
        setStep('success')
      }
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const S = {
    wrap: { maxWidth: 640, margin: '0 auto', padding: '0 16px' } as React.CSSProperties,
    badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(0,200,83,.1)', border: '1px solid rgba(0,200,83,.25)', borderRadius: 50, fontSize: 11, fontWeight: 600, color: '#4ade80', marginBottom: 20 } as React.CSSProperties,
    title: { fontFamily: 'var(--font-playfair),serif', fontSize: 36, fontWeight: 900, marginBottom: 6 } as React.CSSProperties,
    sub: { fontSize: 14, color: '#6b7280', lineHeight: 1.65, marginBottom: 36 } as React.CSSProperties,
    section: { background: '#161a24', border: '1px solid #252d3d', borderRadius: 16, padding: 24, marginBottom: 20 } as React.CSSProperties,
    sTitle: { display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-playfair),serif', fontSize: 17, fontWeight: 700, marginBottom: 18 } as React.CSSProperties,
    num: { width: 28, height: 28, background: '#d4a943', color: '#1a1200', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 } as React.CSSProperties,
    label: { display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#6b7280', marginBottom: 6 },
    input: { width: '100%', padding: '11px 14px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, color: '#f0ebe0', fontSize: 13, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
    btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#D4001F,#ff1a35)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 } as React.CSSProperties,
    err: { padding: '10px 14px', background: 'rgba(212,0,31,.1)', border: '1px solid rgba(212,0,31,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13, marginBottom: 12 } as React.CSSProperties,
    coordBox: { display: 'flex', gap: 8, marginTop: 8 } as React.CSSProperties,
    coordBadge: { padding: '4px 10px', background: lat ? 'rgba(74,222,128,.08)' : 'rgba(212,0,31,.06)', border: `1px solid ${lat ? 'rgba(74,222,128,.3)' : 'rgba(212,0,31,.2)'}`, borderRadius: 6, fontSize: 11, color: lat ? '#4ade80' : '#f87171' } as React.CSSProperties,
  }

  if (step === 'success') return (
    <div style={{ ...S.wrap, textAlign: 'center', paddingTop: 40 }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <div style={S.title}>Cadastro <span style={{ color: '#d4a943', fontStyle: 'italic' }}>realizado!</span></div>
      <p style={{ ...S.sub, marginTop: 8 }}>Seu motel já está visível no portal MotéisBrasil.</p>
      <div style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 10, padding: '12px 20px', color: '#d4a943', fontFamily: 'monospace', fontSize: 13, marginBottom: 24 }}>
        🔗 {process.env.NEXT_PUBLIC_SITE_URL || 'https://motelsbrasil.com.br'}/motel/{slug}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/" style={{ padding: '12px 24px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, color: '#f0ebe0', textDecoration: 'none', fontWeight: 600 }}>← Voltar ao portal</a>
        <a href="/dashboard" style={{ padding: '12px 24px', background: '#d4a943', borderRadius: 8, color: '#1a1200', textDecoration: 'none', fontWeight: 700 }}>Meu painel →</a>
      </div>
    </div>
  )

  return (
    <div style={S.wrap}>
      <div style={S.badge}>✅ Cadastro 100% gratuito</div>
      <div style={S.title}>Cadastre seu <span style={{ color: '#d4a943' }}>Motel</span></div>
      <p style={S.sub}>Apareça para milhares de clientes em todo o Brasil.</p>

      {step === 'auth' && (
        <form onSubmit={handleAuth}>
          <div style={S.section}>
            <div style={S.sTitle}><div style={S.num}>1</div> Sua conta</div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Nome completo</label>
              <input style={S.input} value={nome} onChange={e => setNome(e.target.value)} placeholder="João Silva" required />
            </div>
            <div style={S.row}>
              <div><label style={S.label}>E-mail *</label><input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@email.com" required /></div>
              <div><label style={S.label}>Senha *</label><input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required minLength={6} /></div>
            </div>
          </div>
          {error && <div style={S.err}>{error}</div>}
          <button style={S.btn} disabled={loading}>{loading ? '⏳ Aguarde...' : 'Continuar →'}</button>
        </form>
      )}

      {step === 'motel' && (
        <form onSubmit={handleMotel}>
          <div style={S.section}>
            <div style={S.sTitle}><div style={S.num}>2</div> Dados do motel</div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Nome do motel *</label>
              <input style={S.input} value={nomeMotel} onChange={e => setNomeMotel(e.target.value)} placeholder="Ex: Motel Paraíso" required />
              {nomeMotel && estado && cidade && (
                <p style={{ fontSize: 11, color: '#d4a943', marginTop: 4, fontFamily: 'monospace' }}>
                  🔗 /motel/{makeSlug(nomeMotel, estado, cidade)}
                </p>
              )}
            </div>

            {/* Endereço com autocomplete */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Endereço *</label>
              <AddressAutocomplete
                value={endereco}
                onChange={setEndereco}
                onAddressSelect={handleAddressSelect}
                placeholder="Ex: Av. Paulista, 1234 — São Paulo, SP"
                required
              />
              {/* Feedback coordenadas */}
              <div style={S.coordBox}>
                <span style={S.coordBadge}>
                  {lat ? `✓ GPS: ${lat.toFixed(5)}, ${lng?.toFixed(5)}` : '⚠ Selecione nas sugestões para obter GPS'}
                </span>
              </div>
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
              <div><label style={S.label}>WhatsApp reservas *</label><input style={S.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="55 11 9 9999-0000" required /></div>
              <div><label style={S.label}>Telefone</label><input style={S.input} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 3333-4444" /></div>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sTitle}><div style={S.num}>3</div> Site do motel</div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>URL do site (se já tiver)</label>
              <input style={S.input} type="url" value={siteExterno} onChange={e => setSiteExterno(e.target.value)} placeholder="https://www.seumotel.com.br" />
            </div>
            {!siteExterno && (
              <div style={{ background: 'rgba(212,169,67,.06)', border: '1px dashed rgba(212,169,67,.3)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>Não tem site?</p>
                  <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>Criaremos um site vitrine completo com suítes, preços e reservas pelo WhatsApp.<br /><span style={{ color: '#d4a943', fontWeight: 600 }}>R$ 50/mês</span> — cancele quando quiser.</p>
                </div>
                <span style={{ fontSize: 12, color: '#d4a943', fontWeight: 600, whiteSpace: 'nowrap' }}>✨ Criado no próximo passo</span>
              </div>
            )}
          </div>

          {error && <div style={S.err}>{error}</div>}
          <button style={S.btn} disabled={loading}>
            {loading ? '⏳ Cadastrando...' : siteExterno ? 'Cadastrar no portal →' : 'Cadastrar e criar meu site →'}
          </button>
        </form>
      )}
    </div>
  )
}
