'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const sb = createClient()

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const signOut = async () => {
    await sb.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isPortal = pathname === '/'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 52,
      background: scrolled || !isPortal ? '#000' : 'transparent',
      borderBottom: scrolled || !isPortal ? '1px solid #1e1e1e' : 'none',
      transition: 'background .3s, border .3s',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
        <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 20, fontWeight: 900, letterSpacing: 2, color: '#D4001F' }}>M</span>
        <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 20, fontWeight: 900, letterSpacing: 2, color: '#f0ebe0' }}>OTÉIS</span>
        <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 20, fontWeight: 900, letterSpacing: 2, color: '#D4001F' }}>BRASIL</span>
        <span style={{ fontSize: 14, marginLeft: 4 }}>🇧🇷</span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center' }}>
        {[
          { href: '/', label: 'Portal' },
          { href: '/cadastro', label: 'Cadastrar Meu Motel' },
          ...(user ? [{ href: '/dashboard', label: 'Meu Painel' }] : []),
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            padding: '0 14px', height: 52, display: 'flex', alignItems: 'center',
            fontSize: 12, fontWeight: 500, textDecoration: 'none',
            color: pathname === href ? '#f0ebe0' : '#6b7280',
            borderBottom: pathname === href ? '2px solid #D4001F' : '2px solid transparent',
            transition: 'color .2s, border-color .2s',
          }}>{label}</Link>
        ))}
      </nav>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user ? (
          <button onClick={signOut} style={{
            padding: '6px 14px', background: 'transparent', border: '1px solid #252d3d',
            borderRadius: 4, color: '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>Sair</button>
        ) : (
          <Link href="/login" style={{
            padding: '6px 14px', background: 'transparent', border: '1px solid #252d3d',
            borderRadius: 4, color: '#6b7280', fontSize: 11, fontWeight: 600, textDecoration: 'none',
          }}>Entrar</Link>
        )}
        <Link href="/cadastro" style={{
          padding: '7px 16px', background: '#D4001F', border: 'none',
          borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none',
        }}>+ Cadastre Grátis</Link>
      </div>
    </header>
  )
}
