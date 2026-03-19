'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const sb = createClient()

  useEffect(() => {
    // Verificar se temos uma sessão válida via hash da URL
    sb.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else setError('Link inválido ou expirado. Solicite um novo link de recuperação.')
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return }
    setLoading(true); setError('')
    try {
      const { error } = await sb.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const S = {
    wrap: { minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 30%, #1e2235 0%, #0f1117 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } as React.CSSProperties,
    box: { background: '#161a24', border: '1px solid #252d3d', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400 } as React.CSSProperties,
    badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'rgba(212,169,67,.12)', border: '1px solid rgba(212,169,67,.3)', borderRadius: 50, fontSize: 11, fontWeight: 600, color: '#d4a943', letterSpacing: '.5px', marginBottom: 24 } as React.CSSProperties,
    title: { fontFamily: 'var(--font-playfair),serif', fontSize: 28, fontWeight: 700, marginBottom: 6, color: '#f0ebe0' } as React.CSSProperties,
    sub: { fontSize: 13, color: '#6b7280', marginBottom: 28, lineHeight: 1.5 } as React.CSSProperties,
    label: { display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#6b7280', marginBottom: 6 },
    input: { width: '100%', padding: '12px 44px 12px 14px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, color: '#f0ebe0', fontSize: 14, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
    btn: { width: '100%', padding: 14, background: 'linear-gradient(135deg, #d4a943, #f0c060)', color: '#1a1200', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' } as React.CSSProperties,
    err: { padding: '10px 14px', background: 'rgba(212,0,31,.1)', border: '1px solid rgba(212,0,31,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13, marginBottom: 12 } as React.CSSProperties,
  }

  if (success) return (
    <div style={S.wrap}>
      <div style={{ ...S.box, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ ...S.title, textAlign: 'center' }}>Senha redefinida!</div>
        <p style={{ ...S.sub, textAlign: 'center' }}>
          Sua senha foi atualizada com sucesso.<br />
          Redirecionando para o painel...
        </p>
        <div style={{ width: '100%', height: 4, background: '#252d3d', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#d4a943', borderRadius: 2, animation: 'progress 3s linear forwards', width: '0%' }} />
        </div>
        <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.badge}>✦ MOTEL BUILDER</div>
        <div style={S.title}>Nova senha</div>
        <div style={S.sub}>Escolha uma nova senha para sua conta.</div>

        {!ready && !error && (
          <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center' }}>⏳ Verificando link...</p>
        )}

        {error && !ready && (
          <>
            <div style={S.err}>{error}</div>
            <a href="/login" style={{ display: 'block', textAlign: 'center', color: '#d4a943', fontSize: 13, marginTop: 12 }}>
              ← Voltar ao login
            </a>
          </>
        )}

        {ready && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Nova senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={S.input}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280', padding: 0 }}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Confirmar nova senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...S.input, borderColor: confirm && confirm !== password ? 'rgba(212,0,31,.5)' : '#252d3d' }}
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
              {confirm && confirm !== password && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>As senhas não coincidem</p>
              )}
            </div>
            {error && <div style={S.err}>{error}</div>}
            <button style={S.btn} disabled={loading || password !== confirm}>
              {loading ? '⏳ Salvando...' : '🔐 Redefinir senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
