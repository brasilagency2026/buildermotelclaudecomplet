import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, color: '#f0ebe0', fontFamily: 'sans-serif' }}>
      <div>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏨</div>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 40, fontWeight: 900, marginBottom: 8 }}>Página não encontrada</h1>
        <p style={{ color: '#6b7280', marginBottom: 28, fontSize: 15 }}>O motel ou página que você procura não existe ou foi removido.</p>
        <Link href="/" style={{ padding: '12px 28px', background: '#D4001F', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          ← Voltar ao portal
        </Link>
      </div>
    </div>
  )
}
