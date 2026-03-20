'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import type { Motel } from '@/types'

interface Props { moteis: Motel[]; userEmail: string }

export default function DashboardClient({ moteis, userEmail }: Props) {
  const router = useRouter()
  const sb = createClient()

  const sp = useSearchParams()

  // Gérer le retour de PayPal
  useEffect(() => {
    const subStatus = sp.get('sub')
    const motelId = sp.get('motel_id')
    if (subStatus === 'success' && motelId) {
      // Activer le motel immédiatement
      fetchWithAuth('/api/paypal/success', {
        method: 'POST',
        body: JSON.stringify({ motel_id: motelId }),
      }).then(res => res.json()).then(() => {
        // Recharger la page sans les params PayPal
        router.replace('/dashboard')
      }).catch(() => {
        router.replace('/dashboard')
      })
    }
  }, [sp])

  const signOut = async () => {
    await sb.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const S = {
    top: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', height:52, background:'#000', borderBottom:'1px solid #1e1e1e' } as React.CSSProperties,
    logo: { display:'flex', alignItems:'center', gap:8, fontSize:16, fontWeight:700, color:'#d4a943', fontFamily:'var(--font-playfair),serif' } as React.CSSProperties,
    body: { maxWidth:900, margin:'0 auto', padding:'48px 20px' } as React.CSSProperties,
    header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:40 } as React.CSSProperties,
    title: { fontFamily:'var(--font-playfair),serif', fontSize:32, fontWeight:900, marginBottom:4 } as React.CSSProperties,
    sub: { fontSize:13, color:'#6b7280' } as React.CSSProperties,
    btnNovo: { display:'flex', alignItems:'center', gap:8, padding:'11px 20px', background:'#d4a943', color:'#1a1200', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', textDecoration:'none', fontFamily:'inherit' } as React.CSSProperties,
    empty: { background:'#161a24', border:'2px dashed #252d3d', borderRadius:16, padding:'64px 20px', textAlign:'center' as const } as React.CSSProperties,
    row: { background:'#161a24', border:'1px solid #252d3d', borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'center', gap:16, marginBottom:12, transition:'border-color .2s' } as React.CSSProperties,
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Top */}
      <div style={S.top}>
        <div style={S.logo}>✦ <Link href="/" style={{ color:'#f0ebe0', textDecoration:'none', fontWeight:400, fontSize:14 }}>Motel</Link> Builder</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:'#6b7280' }}>
          <span>{userEmail}</span>
          <button onClick={signOut} style={{ padding:'6px 14px', background:'transparent', border:'1px solid #252d3d', borderRadius:6, color:'#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Sair</button>
        </div>
      </div>

      <div style={S.body}>
        <div style={S.header}>
          <div>
            <div style={S.title}>Meus Motéis</div>
            <div style={S.sub}>Gerencie os sites dos seus estabelecimentos</div>
          </div>
          {moteis.length === 0 && <Link href="/dashboard/novo" style={S.btnNovo}>+ Novo motel</Link>}
        </div>

        {moteis.length === 0 ? (
          <div>
            {/* Título */}
            <div style={{ textAlign:'center' as const, marginBottom:36 }}>
              <div style={{ fontFamily:'var(--font-playfair),serif', fontSize:26, fontWeight:900, marginBottom:8 }}>
                Escolha como aparecer no portal
              </div>
              <p style={{ fontSize:13, color:'#6b7280', maxWidth:480, margin:'0 auto', lineHeight:1.6 }}>
                Milhares de clientes buscam motéis próximos a eles. Escolha a opção ideal para o seu estabelecimento.
              </p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>

              {/* ── GRATUITO ── */}
              <div style={{ background:'#161a24', border:'1px solid #252d3d', borderRadius:16, overflow:'hidden' }}>
                <div style={{ padding:'24px 24px 20px', borderBottom:'1px solid #252d3d' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#4ade80', letterSpacing:'1px', marginBottom:10 }}>CADASTRO GRATUITO</div>
                  <div style={{ fontFamily:'var(--font-playfair),serif', fontSize:28, fontWeight:900, marginBottom:4 }}>R$ 0</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>Sem mensalidade · Sem cartão</div>
                </div>
                <div style={{ padding:'20px 24px' }}>
                  {[
                    ['✓','Aparece no portal MotéisBrasil','#4ade80'],
                    ['✓','Pin no mapa interativo','#4ade80'],
                    ['✓','Nome, endereço e cidade','#4ade80'],
                    ['✓','Link para o seu site','#4ade80'],
                    ['–','Fotos das suítes','#374151'],
                    ['–','Tabela de preços','#374151'],
                    ['–','Botão reserva WhatsApp','#374151'],
                    ['–','Direção via Waze & Google Maps','#374151'],
                    ['–','URL própria /motel/nome','#374151'],
                    ['–','SEO Google (schema.org)','#374151'],
                    ['–','Site vitrine completo','#374151'],
                  ].map(([icon, text, color]) => (
                    <div key={text as string} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #1a1f2e', fontSize:13 }}>
                      <span style={{ color: color as string, fontWeight:700, width:16, textAlign:'center' as const, flexShrink:0 }}>{icon}</span>
                      <span style={{ color: color === '#374151' ? '#374151' : '#d1d5db' }}>{text}</span>
                    </div>
                  ))}
                  <Link href="/dashboard/novo?tipo=gratuito"
                    style={{ display:'block', textAlign:'center' as const, marginTop:20, padding:'12px', background:'transparent', border:'1px solid #252d3d', borderRadius:8, color:'#6b7280', fontSize:13, fontWeight:600, textDecoration:'none' }}>
                    Cadastrar gratuitamente →
                  </Link>
                </div>
              </div>

              {/* ── BUILDER ── */}
              <div style={{ background:'linear-gradient(160deg,#1c1e10 0%,#161a24 100%)', border:'2px solid #d4a943', borderRadius:16, overflow:'hidden', position:'relative' as const }}>
                <div style={{ position:'absolute' as const, top:0, left:0, right:0, background:'#d4a943', padding:'6px', textAlign:'center' as const, fontSize:10, fontWeight:900, color:'#1a1200', letterSpacing:'1.5px' }}>
                  ✦ MAIS COMPLETO · MAIS CLIENTES
                </div>
                <div style={{ padding:'44px 24px 20px', borderBottom:'1px solid rgba(212,169,67,.2)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#d4a943', letterSpacing:'1px', marginBottom:10 }}>SITE VITRINE COMPLETO</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4 }}>
                    <span style={{ fontFamily:'var(--font-playfair),serif', fontSize:40, fontWeight:900, color:'#d4a943', lineHeight:1 }}>R$50</span>
                    <span style={{ fontSize:13, color:'#6b7280' }}>/mês</span>
                  </div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>Cancele quando quiser</div>
                </div>
                <div style={{ padding:'20px 24px' }}>
                  {[
                    ['✓','Aparece no portal MotéisBrasil'],
                    ['✓','Pin vermelho em destaque no mapa'],
                    ['✓','Fotos profissionais das suítes'],
                    ['✓','Tabela de preços por período (2h, 4h...)'],
                    ['✓','Botão reserva direto no WhatsApp'],
                    ['✓','Direção via Waze & Google Maps'],
                    ['✓','URL exclusiva /motel/nome-cidade'],
                    ['✓','SEO otimizado (Google, Bing)'],
                    ['✓','Schema.org para aparecer no Google'],
                    ['✓','Site vitrine completo e profissional'],
                    ['✓','Suporte e atualizações incluídos'],
                  ].map(([icon, text]) => (
                    <div key={text as string} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(212,169,67,.08)', fontSize:13 }}>
                      <span style={{ color:'#d4a943', fontWeight:700, width:16, textAlign:'center' as const, flexShrink:0 }}>{icon}</span>
                      <span style={{ color:'#f0ebe0' }}>{text}</span>
                    </div>
                  ))}
                  <Link href="/dashboard/novo?tipo=builder"
                    style={{ display:'block', textAlign:'center' as const, marginTop:20, padding:'14px', background:'linear-gradient(135deg,#d4a943,#f0c060)', border:'none', borderRadius:8, color:'#1a1200', fontSize:14, fontWeight:800, textDecoration:'none', letterSpacing:'.3px' }}>
                    ✦ Criar meu site vitrine →
                  </Link>
                  <p style={{ textAlign:'center' as const, fontSize:10, color:'#6b7280', marginTop:8 }}>
                    Pronto em minutos · Sem contrato
                  </p>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div>
            {/* Bandeau 1 motel por conta */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'rgba(212,169,67,.06)', border:'1px solid rgba(212,169,67,.15)', borderRadius:8, marginBottom:20, fontSize:12, color:'#6b7280' }}>
              <span style={{ fontSize:16 }}>ℹ️</span>
              <span>Cada conta permite <strong style={{ color:'#d4a943' }}>1 motel</strong>. Para cadastrar outro estabelecimento, crie uma nova conta com e-mail diferente.</span>
            </div>
            {moteis.map(m => <MotelRow key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function MotelRow({ m }: { m: Motel }) {
  const statusStyle: Record<string, React.CSSProperties> = {
    active:  { background:'rgba(34,197,94,.1)', border:'1px solid rgba(34,197,94,.3)', color:'#4ade80' },
    pending: { background:'rgba(234,179,8,.1)',  border:'1px solid rgba(234,179,8,.3)',  color:'#fbbf24' },
    inactive:{ background:'rgba(239,68,68,.1)',  border:'1px solid rgba(239,68,68,.3)',  color:'#f87171' },
  }

  return (
    <div style={{ background:'#161a24', border:'1px solid #252d3d', borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
      <div style={{ width:64, height:64, borderRadius:8, overflow:'hidden', background:'#1c2130', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, position:'relative' }}>
        {m.foto_capa ? <Image src={m.foto_capa} alt={m.nome} fill style={{ objectFit:'cover' }} /> : '🏨'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          <span style={{ fontWeight:700, fontSize:15 }}>{m.nome}</span>
          {m.site_externo && !m.usa_builder && (
            <span style={{ fontSize:9, fontWeight:700, color:'#4ade80', background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.2)', borderRadius:4, padding:'2px 6px', letterSpacing:'.5px' }}>GRATUITO</span>
          )}
        </div>
        {m.site_externo && !m.usa_builder ? (
          <a href={m.site_externo} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:11, color:'#4ade80', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block', textDecoration:'none' }}>
            🌐 {m.site_externo.replace('https://','').replace('http://','')}
          </a>
        ) : (
          <div style={{ fontSize:11, color:'#d4a943', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            motelsbrasil.com.br/motel/{m.slug}
          </div>
        )}
        <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{m.cidade}, {m.estado}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ padding:'3px 10px', borderRadius:50, fontSize:10, fontWeight:700, letterSpacing:'.5px', ...(statusStyle[m.status]||statusStyle.pending) }}>
          {m.status === 'active' ? '✓ Ativo' : m.status === 'pending' ? '⏳ Pendente' : '✕ Inativo'}
        </span>
        {m.usa_builder && (
          <span style={{ fontSize:10, color:'#d4a943', background:'rgba(212,169,67,.08)', border:'1px solid rgba(212,169,67,.2)', padding:'3px 8px', borderRadius:50 }}>
            {m.paypal_status === 'active' ? '💳 Assinatura ativa' : '💳 Pagamento pendente'}
          </span>
        )}
        <Link href={`/dashboard/editar/${m.id}`} style={{ padding:'7px 16px', background:'transparent', border:'1px solid #252d3d', borderRadius:6, color:'#6b7280', fontSize:12, textDecoration:'none', fontWeight:500 }}>
          ✏ Editar
        </Link>
        <Link href={`/motel/${m.slug}`} style={{ padding:'7px 16px', background:'rgba(212,169,67,.08)', border:'1px solid rgba(212,169,67,.25)', borderRadius:6, color:'#d4a943', fontSize:12, textDecoration:'none', fontWeight:600 }}>
          👁 Ver site
        </Link>
      </div>
    </div>
  )
}
