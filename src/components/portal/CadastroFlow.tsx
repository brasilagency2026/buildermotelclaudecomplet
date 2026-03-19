'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ESTADOS_BR } from '@/types'
import { makeSlug } from '@/lib/utils'
import AddressAutocomplete from '@/components/shared/AddressAutocomplete'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import type { AddressResult } from '@/lib/useGoogleMapsAddress'

type Step = 'auth' | 'verify' | 'choose' | 'motel' | 'success'

export default function CadastroFlow() {
  const router = useRouter()
  const sb = createClient()
  const [step, setStep] = useState<Step>('auth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slug, setSlug] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [wantsBuilder, setWantsBuilder] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
      const { data: signUpData, error } = await sb.auth.signUp({
        email, password, options: { data: { nome } }
      })
      if (error?.message?.includes('already registered')) {
        // Usuário já existe — fazer login direto
        const { error: e2 } = await sb.auth.signInWithPassword({ email, password })
        if (e2) throw new Error('E-mail já cadastrado. Verifique sua senha.')
        setIsNewUser(false)
        setStep('motel')
      } else if (error) {
        throw error
      } else {
        // Novo usuário — verificar se precisa confirmar email
        const needsConfirmation = !signUpData.session
        if (needsConfirmation) {
          setIsNewUser(true)
          setStep('verify')
        } else {
          setIsNewUser(false)
          setStep('motel')
        }
      }
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleMotel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lat || !lng) {
      setError('Selecione o endereço nas sugestões do Google Maps para obter as coordenadas.')
      return
    }
    if (wantsBuilder === false && !siteExterno) {
      setError('Informe a URL do seu site para cadastro gratuito.')
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
          usa_builder: wantsBuilder !== false && !siteExterno,
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

  if (step === 'verify') return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📧</div>
      <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
        Verifique seu <span style={{ color: '#d4a943' }}>e-mail</span>
      </h2>
      <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
        Enviamos um link de confirmação para<br />
        <strong style={{ color: '#f0ebe0' }}>{email}</strong>
      </p>
      <div style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 14, padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
          <span style={{ color: '#d4a943', fontWeight: 700 }}>1.</span> Abra seu e-mail<br />
          <span style={{ color: '#d4a943', fontWeight: 700 }}>2.</span> Clique no link de confirmação enviado pelo MotéisBrasil<br />
          <span style={{ color: '#d4a943', fontWeight: 700 }}>3.</span> Volte aqui e clique em <strong style={{ color: '#f0ebe0' }}>"Já confirmei meu e-mail"</strong>
        </p>
      </div>
      <button
        onClick={async () => {
          setLoading(true); setError('')
          try {
            const { error } = await sb.auth.signInWithPassword({ email, password })
            if (error) throw new Error('E-mail ainda não confirmado. Verifique sua caixa de entrada.')
            setStep('choose')
          } catch (err: any) { setError(err.message) }
          finally { setLoading(false) }
        }}
        disabled={loading}
        style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#d4a943,#f0c060)', color: '#1a1200', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}
      >
        {loading ? '⏳ Verificando...' : '✓ Já confirmei meu e-mail →'}
      </button>
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(212,0,31,.1)', border: '1px solid rgba(212,0,31,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}
      <button
        onClick={async () => {
          setLoading(true); setError('')
          try {
            await sb.auth.resend({ type: 'signup', email })
            setError('✅ E-mail reenviado! Verifique sua caixa de entrada.')
          } catch { setError('Erro ao reenviar.') }
          finally { setLoading(false) }
        }}
        style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
      >
        Não recebeu? Reenviar e-mail
      </button>
    </div>
  )

  if (step === 'choose') return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏨</div>
        <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
          Como deseja <span style={{ color: '#d4a943' }}>aparecer</span> no portal?
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
          Escolha a opção que melhor se adapta ao seu motel.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Opção 1 — Já tem site */}
        <div
          onClick={() => { setWantsBuilder(false); setStep('motel') }}
          style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 16, padding: '24px 20px', cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#4ade80'; (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,.04)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252d3d'; (e.currentTarget as HTMLElement).style.background = '#161a24' }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌐</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#f0ebe0' }}>Já tenho site</div>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
            Cadastre seu motel <strong style={{ color: '#4ade80' }}>gratuitamente</strong> informando o nome, endereço e o link do seu site.
          </p>
          <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, padding: '5px 10px', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 6, display: 'inline-block' }}>
            ✓ 100% gratuito
          </div>
        </div>

        {/* Opção 2 — Criar site */}
        <div
          onClick={() => { setWantsBuilder(true); setStep('motel') }}
          style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 16, padding: '24px 20px', cursor: 'pointer', transition: 'all .2s', position: 'relative' as const }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4a943'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,169,67,.04)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252d3d'; (e.currentTarget as HTMLElement).style.background = '#161a24' }}
        >
          <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 700, color: '#1a1200', background: '#d4a943', borderRadius: 4, padding: '2px 8px', letterSpacing: '.5px' }}>
            POPULAR
          </div>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#f0ebe0' }}>Criar meu site vitrine</div>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
            Criamos um site completo com suítes, preços e reservas diretas pelo WhatsApp.
          </p>
          <div style={{ fontSize: 11, color: '#d4a943', fontWeight: 600, padding: '5px 10px', background: 'rgba(212,169,67,.1)', border: '1px solid rgba(212,169,67,.2)', borderRadius: 6, display: 'inline-block' }}>
            R$ 50/mês · cancele quando quiser
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginTop: 20 }}>
        Clique na opção desejada para continuar →
      </p>
    </div>
  )

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
              <div>
                <label style={S.label}>Senha *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...S.input, paddingRight: 44 }}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280', padding: 0, lineHeight: 1 }}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
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

          {/* Seção site — adaptada ao tipo de cadastro */}
          {wantsBuilder === false && (
            <div style={S.section}>
              <div style={S.sTitle}><div style={S.num}>3</div> URL do seu site *</div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Link do seu site (obrigatório)</label>
                <input
                  style={S.input}
                  type="url"
                  value={siteExterno}
                  onChange={e => setSiteExterno(e.target.value)}
                  placeholder="https://www.seumotel.com.br"
                  required
                />
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>
                  Os visitantes serão redirecionados para o seu site ao clicar no seu motel.
                </p>
              </div>
              <div style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Cadastro 100% gratuito — sem mensalidade
              </div>
            </div>
          )}

          {wantsBuilder === true && (
            <div style={S.section}>
              <div style={S.sTitle}><div style={S.num}>3</div> Site vitrine</div>
              <div style={{ background: 'rgba(212,169,67,.06)', border: '1px dashed rgba(212,169,67,.3)', borderRadius: 10, padding: '16px 18px' }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#d4a943' }}>✨ Seu site será criado no próximo passo</p>
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                  Incluirá fotos, suítes, preços e botão de reserva pelo WhatsApp.<br />
                  <span style={{ color: '#d4a943', fontWeight: 600 }}>R$ 50/mês</span> — cancele quando quiser.
                </p>
              </div>
            </div>
          )}

          {wantsBuilder === null && (
            <div style={S.section}>
              <div style={S.sTitle}><div style={S.num}>3</div> Site do motel</div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>URL do site (se já tiver)</label>
                <input style={S.input} type="url" value={siteExterno} onChange={e => setSiteExterno(e.target.value)} placeholder="https://www.seumotel.com.br" />
              </div>
            </div>
          )}

          {error && <div style={S.err}>{error}</div>}
          <button style={S.btn} disabled={loading}>
            {loading ? '⏳ Cadastrando...' : wantsBuilder === false ? '✓ Cadastrar gratuitamente →' : wantsBuilder === true ? 'Cadastrar e criar meu site →' : siteExterno ? 'Cadastrar no portal →' : 'Cadastrar e criar meu site →'}
          </button>
        </form>
      )}
    </div>
  )
}
