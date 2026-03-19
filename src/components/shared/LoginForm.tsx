'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const sb = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (mode === 'signup') {
        const { error } = await sb.auth.signUp({ email, password, options: { data: { nome } } })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message)
    } finally { setLoading(false) }
  }

  const S: Record<string, React.CSSProperties> = {
    box: { background: '#161a24', border: '1px solid #252d3d', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400 },
    badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'rgba(212,169,67,.12)', border: '1px solid rgba(212,169,67,.3)', borderRadius: 50, fontSize: 11, fontWeight: 600, color: '#d4a943', letterSpacing: '.5px', marginBottom: 24 },
    title: { fontFamily: 'var(--font-playfair),serif', fontSize: 32, fontWeight: 700, marginBottom: 4 },
    sub: { fontSize: 13, color: '#6b7280', marginBottom: 28 },
    label: { display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#6b7280', marginBottom: 6 },
    input: { width: '100%', padding: '12px 14px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, color: '#f0ebe0', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
    btn: { width: '100%', padding: 14, background: 'linear-gradient(135deg, #d4a943, #f0c060)', color: '#1a1200', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
    err: { padding: '10px 14px', background: 'rgba(212,0,31,.1)', border: '1px solid rgba(212,0,31,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13, marginBottom: 12 },
    foot: { textAlign: 'center' as const, marginTop: 18, fontSize: 13, color: '#6b7280' },
    link: { color: '#d4a943', cursor: 'pointer', background: 'none', border: 'none', fontSize: 13, fontFamily: 'inherit' },
  }

  return (
    <div style={S.box}>
      <div style={S.badge}>✦ MOTEL BUILDER</div>
      <div style={S.title}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</div>
      <div style={S.sub}>{mode === 'login' ? 'Acesse o painel de gerenciamento' : 'Crie sua conta gratuitamente'}</div>
      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Nome</label>
            <input style={S.input} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" required />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>E-mail</label>
          <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>Senha</label>
          <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
        </div>
        {error && <div style={S.err}>{error}</div>}
        <button style={S.btn} disabled={loading}>{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
      </form>
      <div style={S.foot}>
        {mode === 'login' ? (
          <>Ainda não tem conta? <button style={S.link} onClick={() => { setMode('signup'); setError('') }}>Criar conta</button></>
        ) : (
          <>Já tem conta? <button style={S.link} onClick={() => { setMode('login'); setError('') }}>Entrar</button></>
        )}
      </div>
    </div>
  )
}
