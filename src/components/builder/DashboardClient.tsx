'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Motel } from '@/types'

interface Props { moteis: Motel[]; userEmail: string }

export default function DashboardClient({ moteis, userEmail }: Props) {
  const router = useRouter()
  const sb = createClient()

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
          <Link href="/dashboard/novo" style={S.btnNovo}>+ Novo motel</Link>
        </div>

        {moteis.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize:52, marginBottom:16 }}>🏨</div>
            <div style={{ fontFamily:'var(--font-playfair),serif', fontSize:22, fontWeight:700, marginBottom:8 }}>Nenhum motel ainda</div>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:24 }}>Crie o primeiro site do seu motel em poucos minutos.</p>
            <Link href="/dashboard/novo" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', background:'#d4a943', color:'#1a1200', borderRadius:8, fontWeight:700, fontSize:14, textDecoration:'none' }}>
              + Criar meu primeiro motel
            </Link>
          </div>
        ) : (
          moteis.map(m => <MotelRow key={m.id} m={m} />)
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
        <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>{m.nome}</div>
        <div style={{ fontSize:11, color:'#d4a943', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          motelsbrasil.com.br/motel/{m.slug}
        </div>
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
