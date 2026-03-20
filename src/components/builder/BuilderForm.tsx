'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Motel } from '@/types'
import { PERIODOS_PADRAO } from '@/types'
import AddressAutocomplete from '@/components/shared/AddressAutocomplete'
import type { AddressResult } from '@/lib/useGoogleMapsAddress'
import PayPalSubscribe from './PayPalSubscribe'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface Props { motel: Motel | null; userId: string }

interface SuiteForm {
  id?: string
  nome: string
  descricao: string
  servicos: string
  fotos: string[]
  tarifas: { periodo: string; preco: string }[]
}

// ── Styles reutilizáveis ───────────────────────────────────────────────────
const base = {
  section: {
    background: '#1c2130',
    border: '1px solid #252d3d',
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
  } as React.CSSProperties,
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 18, fontWeight: 700, marginBottom: 4,
    fontFamily: 'var(--font-playfair), serif', color: '#f0ebe0',
  } as React.CSSProperties,
  sectionSub: {
    fontSize: 12, color: '#6b7280', marginBottom: 22, marginLeft: 28,
  } as React.CSSProperties,
  row2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14,
  } as React.CSSProperties,
  field: { marginBottom: 14 } as React.CSSProperties,
  label: {
    display: 'block', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: '1px',
    color: '#6b7280', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '11px 14px',
    background: '#0f1117', border: '1px solid #252d3d',
    borderRadius: 8, color: '#f0ebe0', fontSize: 13,
    outline: 'none', fontFamily: 'inherit',
  } as React.CSSProperties,
  textarea: {
    width: '100%', padding: '11px 14px',
    background: '#0f1117', border: '1px solid #252d3d',
    borderRadius: 8, color: '#f0ebe0', fontSize: 13,
    outline: 'none', fontFamily: 'inherit',
    resize: 'vertical' as const, minHeight: 90, lineHeight: 1.6,
  } as React.CSSProperties,
  iconTitle: {
    width: 28, height: 28, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 18, flexShrink: 0,
  } as React.CSSProperties,
}

export default function BuilderForm({ motel, userId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ── Informações do motel ──
  const [nome, setNome] = useState(motel?.nome || '')
  const [slogan, setSlogan] = useState(motel?.slogan || '')
  const [descricao, setDescricao] = useState(motel?.descricao || '')
  const [endereco, setEndereco] = useState(motel?.endereco || '')
  const [cidade, setCidade] = useState(motel?.cidade || '')
  const [estado, setEstado] = useState(motel?.estado || '')
  const [cep, setCep] = useState(motel?.cep || '')
  const [lat, setLat] = useState<number | undefined>(motel?.lat)
  const [lng, setLng] = useState<number | undefined>(motel?.lng)
  const [telefone, setTelefone] = useState(motel?.telefone || '')
  const [whatsapp, setWhatsapp] = useState(motel?.whatsapp || '')
  const [fotoCapa, setFotoCapa] = useState(motel?.foto_capa || '')
  const [uploadingCapa, setUploadingCapa] = useState(false)

  // ── Suítes ──
  const [suites, setSuites] = useState<SuiteForm[]>(
    motel?.suites?.length
      ? motel.suites.map(s => ({
          id: s.id, nome: s.nome, descricao: s.descricao || '',
          servicos: s.servicos || '', fotos: s.fotos || [],
          tarifas: s.tarifas?.map(t => ({ periodo: t.periodo, preco: String(t.preco) })) || [],
        }))
      : [{ nome: '', descricao: '', servicos: '', fotos: [], tarifas: PERIODOS_PADRAO.map(p => ({ periodo: p, preco: '' })) }]
  )
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const [paypalOk, setPaypalOk] = useState(motel?.paypal_status === 'active')
  const [motelId, setMotelId] = useState(motel?.id || '')

  // ── Address autocomplete callback ──
  const handleAddressSelect = useCallback((result: AddressResult) => {
    setEndereco(result.endereco)
    setCidade(result.cidade)
    setEstado(result.estado)
    setCep(result.cep)
    setLat(result.lat)
    setLng(result.lng)
  }, [])

  // ── Upload foto capa ──
  const uploadFotoCapa = async (file: File) => {
    setUploadingCapa(true)
    const fd = new FormData()
    fd.append('file', file)
    if (motelId) fd.append('motel_id', motelId)
    if (nome) fd.append('motel_name', nome)
    fd.append('suite_name', 'capa')
    const res = await fetchWithAuth('/api/upload', { method: 'POST', body: fd })
    const { url } = await res.json()
    setFotoCapa(url)
    setUploadingCapa(false)
  }

  // ── Upload foto suíte ──
  const uploadFotoSuite = async (si: number, file: File) => {
    setUploading(p => ({ ...p, [si]: true }))
    const fd = new FormData()
    fd.append('file', file)
    if (motelId) fd.append('motel_id', motelId)
    if (nome) fd.append('motel_name', nome)
    if (suites[si]?.nome) fd.append('suite_name', suites[si].nome)
    const res = await fetchWithAuth('/api/upload', { method: 'POST', body: fd })
    const { url } = await res.json()
    setSuites(p => p.map((s, j) => j === si ? { ...s, fotos: [...s.fotos, url] } : s))
    setUploading(p => ({ ...p, [si]: false }))
  }

  // ── Suite helpers ──
  const addSuite = () => setSuites(p => [...p, { nome: '', descricao: '', servicos: '', fotos: [], tarifas: PERIODOS_PADRAO.map(p => ({ periodo: p, preco: '' })) }])
  const delSuite = (i: number) => setSuites(p => p.filter((_, j) => j !== i))
  const upSuite = (i: number, k: keyof SuiteForm, v: any) => setSuites(p => p.map((s, j) => j === i ? { ...s, [k]: v } : s))
  const upTarifa = (si: number, ti: number, k: string, v: string) => setSuites(p => p.map((s, j) => j === si ? { ...s, tarifas: s.tarifas.map((t, k2) => k2 === ti ? { ...t, [k]: v } : t) } : s))
  const addTarifa = (si: number) => setSuites(p => p.map((s, j) => j === si ? { ...s, tarifas: [...s.tarifas, { periodo: '', preco: '' }] } : s))
  const delTarifa = (si: number, ti: number) => setSuites(p => p.map((s, j) => j === si ? { ...s, tarifas: s.tarifas.filter((_, k) => k !== ti) } : s))

  // ── Salvar informações do motel (step 1) ──
  const saveMotelInfo = async (): Promise<string | null> => {
    if (motelId) {
      // Atualizar motel existente
      const res = await fetchWithAuth('/api/moteis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: motelId, nome, slogan, descricao, endereco,
          cidade, estado, cep, lat, lng, telefone, whatsapp,
          foto_capa: fotoCapa,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return motelId
    } else {
      // Criar novo motel
      const res = await fetchWithAuth('/api/moteis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, slogan, descricao, endereco, cidade, estado, cep,
          lat, lng, telefone, whatsapp, foto_capa: fotoCapa,
          usa_builder: true, fotos_galeria: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMotelId(data.motel.id)
      return data.motel.id
    }
  }

  // ── Publicar ──
  const handlePublish = async () => {
    if (!nome || !endereco) { setError('Preencha o nome e endereço do motel.'); return }
    if (!paypalOk) { setError('Ative a assinatura PayPal para publicar.'); return }
    setSaving(true); setError('')
    try {
      const id = await saveMotelInfo()
      if (!id) throw new Error('Erro ao salvar informações do motel.')

      const res = await fetchWithAuth('/api/suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motel_id: id,
          suites: suites.map(s => ({
            id: s.id, nome: s.nome, descricao: s.descricao,
            servicos: s.servicos, fotos: s.fotos,
            tarifas: s.tarifas.filter(t => t.periodo && t.preco)
              .map(t => ({ periodo: t.periodo, preco: parseFloat(t.preco) })),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/dashboard?pub=1')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0f1117)' }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 52, background: '#000',
        borderBottom: '1px solid #1e1e1e', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid #252d3d', borderRadius: 6, color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Painel
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#d4a943' }}>
            ✦ {motel ? 'Editar Motel' : 'Novo Motel'}
          </span>
        </div>
        <button
          onClick={handlePublish}
          disabled={saving || !paypalOk}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 22px', background: '#d4a943', color: '#1a1200',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
            cursor: saving || !paypalOk ? 'not-allowed' : 'pointer',
            opacity: !paypalOk ? 0.5 : 1, fontFamily: 'inherit',
          }}
        >
          ✦ Publicar site
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* ══ SEÇÃO 1: INFORMAÇÕES DO MOTEL ══ */}
        <div style={base.section}>
          <div style={base.sectionTitle}>
            <div style={base.iconTitle}>🏨</div>
            Informações do Motel
          </div>
          <div style={base.sectionSub}>Dados principais que aparecerão no site.</div>

          <div style={base.row2}>
            <div style={base.field}>
              <label style={base.label}>Nome do motel *</label>
              <input style={base.input} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Motel Paraíso" required />
            </div>
            <div style={base.field}>
              <label style={base.label}>Slogan (opcional)</label>
              <input style={base.input} value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Ex: O requinte no coração da cidade" />
            </div>
          </div>

          <div style={{ ...base.field, marginBottom: 14 }}>
            <label style={base.label}>Descrição *</label>
            <textarea
              style={base.textarea}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva seu motel..."
            />
          </div>

          {/* Endereço com autocomplete Google Maps */}
          <div style={{ ...base.field, marginBottom: 14 }}>
            <label style={base.label}>Endereço *</label>
            <AddressAutocomplete
              value={endereco}
              onChange={setEndereco}
              onAddressSelect={handleAddressSelect}
              placeholder="Ex: Av. Paulista, 1234 — São Paulo, SP"
              required
            />
            {/* Feedback GPS */}
            {lat && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ color: '#4ade80', fontSize: 10 }}>●</span>
                <span style={{ color: '#4ade80' }}>GPS capturado: {lat.toFixed(5)}, {lng?.toFixed(5)}</span>
              </div>
            )}
          </div>

          <div style={base.row2}>
            <div style={base.field}>
              <label style={base.label}>Telefone *</label>
              <input style={base.input} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div style={base.field}>
              <label style={base.label}>WhatsApp</label>
              <input style={base.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          {/* Foto principal */}
          <div style={base.field}>
            <label style={base.label}>Foto principal</label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              background: '#0f1117', border: '1px solid #d4a943',
              borderRadius: 8, cursor: 'pointer', position: 'relative' as const,
            }}>
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFotoCapa(f); e.target.value = '' }}
              />
              {fotoCapa ? (
                <>
                  <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={fotoCapa} alt={`Foto principal — ${nome || "motel"}`} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#d4a943', fontWeight: 600 }}>
                    {uploadingCapa ? '⏳ Enviando...' : '✓ Foto carregada — clique para trocar'}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 20 }}>📷</span>
                  <span style={{ fontSize: 13, color: '#d4a943', fontWeight: 600 }}>
                    {uploadingCapa ? '⏳ Enviando...' : '✦ ESCOLHER FOTO'}
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* ══ SEÇÃO 2: SUÍTES & QUARTOS ══ */}
        <div style={base.section}>
          <div style={base.sectionTitle}>
            <div style={base.iconTitle}>🛏</div>
            Suítes & Quartos
          </div>
          <div style={base.sectionSub}>Adicione quantas suítes quiser.</div>

          {suites.map((s, si) => (
            <div key={si} style={{
              background: '#161a24', border: '1px solid #252d3d',
              borderRadius: 12, padding: 20, marginBottom: 12,
            }}>
              {/* Cabeçalho da suíte */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#d4a943' }}>
                  ➡ Suíte {si + 1}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {si > 0 && (
                    <button
                      onClick={() => setSuites(p => { const a = [...p]; [a[si-1], a[si]] = [a[si], a[si-1]]; return a })}
                      style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #252d3d', borderRadius: 5, fontSize: 11, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}
                    >▲</button>
                  )}
                  {suites.length > 1 && (
                    <button
                      onClick={() => delSuite(si)}
                      style={{ padding: '4px 10px', background: 'transparent', border: '1px solid rgba(212,0,31,.3)', borderRadius: 5, fontSize: 11, color: '#ff6b6b', cursor: 'pointer', fontFamily: 'inherit' }}
                    >⏸ Remover</button>
                  )}
                </div>
              </div>

              {/* Nome + Descrição */}
              <div style={base.row2}>
                <div>
                  <label style={base.label}>Nome da suíte *</label>
                  <input style={base.input} value={s.nome} onChange={e => upSuite(si, 'nome', e.target.value)} placeholder="Ex: Suíte Luxo" />
                </div>
                <div>
                  <label style={base.label}>Descrição curta</label>
                  <input style={base.input} value={s.descricao} onChange={e => upSuite(si, 'descricao', e.target.value)} placeholder="Ex: Suíte ampla com hidromassagem" />
                </div>
              </div>

              {/* Fotos */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: 14, border: '1.5px dashed #252d3d', borderRadius: 8,
                    cursor: 'pointer', position: 'relative' as const, transition: 'border-color .2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#d4a943')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#252d3d')}
                >
                  <input
                    type="file" accept="image/*" multiple style={{ display: 'none' }}
                    onChange={e => { Array.from(e.target.files || []).forEach(f => uploadFotoSuite(si, f)); e.target.value = '' }}
                  />
                  <span style={{ fontSize: 16 }}>📷</span>
                  <span style={{ fontSize: 13, color: '#d4a943', fontWeight: 600 }}>
                    {uploading[si] ? '⏳ Enviando...' : 'Adicionar fotos'}
                  </span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{s.fotos.length}/6 foto(s) • A primeira é a capa</span>
                </label>
                {s.fotos.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {s.fotos.map((f, fi) => (
                      <div key={fi} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: fi === 0 ? '2px solid #d4a943' : '2px solid #252d3d' }}>
                        <Image src={f} alt={`${s.nome || `Suíte ${si + 1}`} — foto ${fi + 1} — ${nome || "motel"}`} fill style={{ objectFit: 'cover' }} />
                        <button
                          onClick={() => upSuite(si, 'fotos', s.fotos.filter((_, k) => k !== fi))}
                          style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: 'rgba(0,0,0,.75)', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >×</button>
                        {fi === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(212,169,67,.85)', fontSize: 8, fontWeight: 700, textAlign: 'center', color: '#1a1200', padding: '1px 0' }}>CAPA</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Serviços */}
              <div style={{ marginBottom: 14 }}>
                <label style={base.label}>Serviços inclusos</label>
                <textarea
                  style={{ ...base.textarea, minHeight: 72 }}
                  value={s.servicos}
                  onChange={e => upSuite(si, 'servicos', e.target.value)}
                  placeholder="Ex: Wi-Fi, Ar-condicionado, Hidromassagem, TV a cabo, Frigobar..."
                />
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>Separe os serviços por vírgula</div>
              </div>

              {/* Tarifas */}
              <div>
                <label style={{ ...base.label, marginBottom: 10 }}>Tarifas por período</label>
                {s.tarifas.map((t, ti) => (
                  <div key={ti} style={{ display: 'grid', gridTemplateColumns: '1fr 28px 120px 28px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input
                      style={{ ...base.input, textAlign: 'center', fontSize: 12 }}
                      value={t.periodo}
                      onChange={e => upTarifa(si, ti, 'periodo', e.target.value)}
                      placeholder="Ex: 2h"
                    />
                    <span style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>R$</span>
                    <input
                      style={{ ...base.input, textAlign: 'right', color: '#d4a943', fontWeight: 700, fontSize: 15 }}
                      type="number" min="0"
                      value={t.preco}
                      onChange={e => upTarifa(si, ti, 'preco', e.target.value)}
                      placeholder="0,00"
                    />
                    <button
                      onClick={() => delTarifa(si, ti)}
                      style={{ width: 24, height: 24, background: 'transparent', border: '1px solid #252d3d', borderRadius: 4, color: '#6b7280', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >×</button>
                  </div>
                ))}
                <button
                  onClick={() => addTarifa(si)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 9, background: 'transparent', border: '1px dashed #252d3d', borderRadius: 6, color: '#6b7280', fontSize: 12, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' }}
                >
                  + Adicionar período
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addSuite}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 14, background: 'transparent', border: '1.5px dashed #252d3d', borderRadius: 10, color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4a943'; (e.currentTarget as HTMLElement).style.color = '#d4a943' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252d3d'; (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
          >
            + Adicionar suíte / quarto
          </button>
        </div>

        {/* ══ SEÇÃO 3: ASSINATURA PAYPAL ══ */}
        <div style={base.section}>
          <div style={base.sectionTitle}>
            <div style={base.iconTitle}>💳</div>
            Assinatura — R$ 50/mês
          </div>
          <div style={base.sectionSub}>Ative para publicar e aparecer no portal.</div>
          <PayPalSubscribe
            motelId={motelId}
            alreadyActive={paypalOk}
            onSuccess={() => setPaypalOk(true)}
            onSaveFirst={saveMotelInfo}
          />
        </div>

        {/* Erro */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(212,0,31,.1)', border: '1px solid rgba(212,0,31,.3)', borderRadius: 10, color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Botão publicar bottom */}
        <button
          onClick={handlePublish}
          disabled={saving || !paypalOk}
          style={{
            width: '100%', padding: 18,
            background: saving || !paypalOk ? '#252d3d' : 'linear-gradient(135deg, #d4a943, #f0c060)',
            color: saving || !paypalOk ? '#6b7280' : '#1a1200',
            border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16,
            cursor: saving || !paypalOk ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all .2s',
          }}
        >
          {saving ? '⏳ Publicando...' : '✦ Publicar Meu Site'}
        </button>
      </div>
    </div>
  )
}
