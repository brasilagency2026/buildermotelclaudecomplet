import Link from 'next/link'
export default function CTASection() {
  return (
    <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px 48px' }}>
      <div style={{ background: 'rgba(212,0,31,.06)', border: '1px solid rgba(212,0,31,.15)', borderRadius: 16, padding: '48px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 34, fontWeight: 900, marginBottom: 12 }}>
          Seu motel não está aqui?
        </h2>
        <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 28, lineHeight: 1.65 }}>
          Cadastre gratuitamente. Se já tiver site, é grátis para sempre.<br />
          Sem site? Crie o seu por apenas <strong style={{ color: '#f0ebe0' }}>R$ 50/mês</strong>.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/cadastro" style={{ padding: '13px 32px', background: '#D4001F', color: '#fff', borderRadius: 6, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Cadastrar Grátis →
          </Link>
          <Link href="/cadastro" style={{ padding: '13px 32px', background: 'transparent', border: '1px solid #252d3d', color: '#6b7280', borderRadius: 6, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            ✨ Criar site por R$ 50/mês
          </Link>
        </div>
      </div>
    </section>
  )
}
