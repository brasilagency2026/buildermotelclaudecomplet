'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'reset' | 'reset-sent'

export default function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const sb = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (mode === 'signup') {
        const { error } = await sb.auth.signUp({ email, password, options: { data: { nome } } })
        if (error) throw error
        router.push('/dashboard')
      } else if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      } else if (mode === 'reset') {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMode('reset-sent')
      }
      router.refresh()
    } catch (err: any) {
      const msg = err.message
      if (msg === 'Invalid login credentials') setError('E-mail ou senha incorretos.')
      else if (msg.includes('Email not confirmed')) setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')
      else setError(msg)
    } finally { setLoading(false) }
  }

  const S: Record<string, React.CSSProperties> = {
    box: { background: '#161a24', border: '1px solid #252d3d', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400 },
    badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'rgba(212,169,67,.12)', border: '1px solid rgba(212,169,67,.3)', borderRadius: 50, fontSize: 11, fontWeight: 600, color: '#d4a943', letterSpacing: '.5px', marginBottom: 24 },
    title: { fontFamily: 'var(--font-playfair),serif', fontSize: 32, fontWeight: 700, marginBottom: 4 },
    sub: { fontSize: 13, color: '#6b7280', marginBottom: 28, lineHeight: 1.5 },
    label: { display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#6b7280', marginBottom: 6 },
    input: { width: '100%', padding: '12px 14px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, color: '#f0ebe0', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
    btn: { width: '100%', padding: 14, background: 'linear-gradient(135deg, #d4a943, #f0c060)', color: '#1a1200', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
    err: { padding: '10px 14px', background: 'rgba(212,0,31,.1)', border: '1px solid rgba(212,0,31,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13, marginBottom: 12 },
    success: { padding: '10px 14px', background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 8, color: '#4ade80', fontSize: 13, marginBottom: 12 },
    foot: { textAlign: 'center' as const, marginTop: 18, fontSize: 13, color: '#6b7280' },
    link: { color: '#d4a943', cursor: 'pointer', background: 'none', border: 'none', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' },
    linkGray: { color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' },
  }

  // ── Tela: e-mail enviado ──────────────────────────────────────────────────
  if (mode === 'reset-sent') return (
    <div style={S.box}>
      <div style={S.badge}>✦ MOTEL BUILDER</div>
      <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>📧</div>
      <div style={{ ...S.title, fontSize: 26, textAlign: 'center' as const }}>
        E-mail enviado!
      </div>
      <p style={{ ...S.sub, textAlign: 'center' as const, marginTop: 8 }}>
        Enviamos um link para <strong style={{ color: '#f0ebe0' }}>{email}</strong>.<br />
        Clique no link para redefinir sua senha.
      </p>
      <div style={{ background: '#1c2130', border: '1px solid #252d3d', borderRadius: 10, padding: '16px 18px', marginBottom: 20, fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
        <span style={{ color: '#d4a943', fontWeight: 700 }}>1.</span> Abra seu e-mail<br />
        <span style={{ color: '#d4a943', fontWeight: 700 }}>2.</span> Clique em "Redefinir senha"<br />
        <span style={{ color: '#d4a943', fontWeight: 700 }}>3.</span> Escolha uma nova senha<br />
        <span style={{ color: '#d4a943', fontWeight: 700 }}>4.</span> Volte aqui para entrar
      </div>
      <button
        style={S.btn}
        onClick={() => { setMode('login'); setError('') }}
      >
        ← Voltar ao login
      </button>
      <div style={S.foot}>
        <button style={S.linkGray} onClick={async () => {
          await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
          setError('✅ E-mail reenviado!')
        }}>
          Não recebeu? Reenviar e-mail
        </button>
      </div>
    </div>
  )

  // ── Tela: recuperar senha ─────────────────────────────────────────────────
  if (mode === 'reset') return (
    <div style={S.box}>
      <div style={S.badge}>✦ MOTEL BUILDER</div>
      <div style={S.title}>Recuperar senha</div>
      <div style={S.sub}>Digite seu e-mail e enviaremos um link para redefinir sua senha.</div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>E-mail</label>
          <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
        </div>
        {error && <div style={error.startsWith('✅') ? S.success : S.err}>{error}</div>}
        <button style={S.btn} disabled={loading}>
          {loading ? '⏳ Enviando...' : '📧 Enviar link de recuperação'}
        </button>
      </form>
      <div style={S.foot}>
        <button style={S.linkGray} onClick={() => { setMode('login'); setError('') }}>
          ← Voltar ao login
        </button>
      </div>
    </div>
  )

  // ── Tela: login / signup ──────────────────────────────────────────────────
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
        <div style={{ marginBottom: mode === 'login' ? 8 : 20 }}>
          <label style={S.label}>Senha</label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...S.input, paddingRight: 44 }}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
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

        {/* Link "Esqueceu a senha" — apenas no modo login */}
        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <button
              type="button"
              style={S.link}
              onClick={() => { setMode('reset'); setError('') }}
            >
              Esqueceu sua senha?
            </button>
          </div>
        )}

        {error && <div style={S.err}>{error}</div>}
        <button style={S.btn} disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
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
