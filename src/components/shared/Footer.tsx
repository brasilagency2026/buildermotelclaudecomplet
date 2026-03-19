import Link from 'next/link'
export default function Footer() {
  return (
    <footer style={{ background: '#000', borderTop: '1px solid #1e1e1e', padding: '32px 24px 20px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', gap: 40, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 22, fontWeight: 900, letterSpacing: 2, marginBottom: 8 }}>
            <span style={{ color: '#D4001F' }}>M</span>OTÉIS<span style={{ color: '#D4001F' }}>BRASIL</span> 🇧🇷
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.65, marginBottom: 12, maxWidth: 280 }}>
            O maior portal de motéis do Brasil. Conforto e qualidade em todos os estados.
          </p>
          <p style={{ fontSize: 11, color: '#333' }}>contato@motelsbrasil.com.br</p>
        </div>
        <div>
          <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#f0ebe0', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #1e1e1e' }}>Para visitantes</h4>
          {['Buscar motéis','Por estado','Mapa interativo'].map(l => (
            <Link key={l} href="/" style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 8, textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
        <div>
          <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#f0ebe0', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #1e1e1e' }}>Para proprietários</h4>
          {['Cadastrar grátis','Criar site — R$ 50/mês','Meu painel'].map(l => (
            <Link key={l} href="/cadastro" style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 8, textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
        <div>
          <div style={{ background: 'rgba(212,0,31,.08)', border: '1px solid rgba(212,0,31,.2)', borderRadius: 8, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f0ebe0', marginBottom: 4 }}>Seu motel não está aqui?</p>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 12 }}>Cadastre gratuitamente. Sem mensalidade se já tiver site.</p>
            <Link href="/cadastro" style={{ display: 'block', textAlign: 'center', padding: '9px', background: '#D4001F', borderRadius: 4, color: '#fff', fontWeight: 700, fontSize: 11, textDecoration: 'none', letterSpacing: '.5px' }}>
              Cadastrar agora →
            </Link>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: '0 auto', paddingTop: 18, borderTop: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: '#333' }}>🇧🇷 © {new Date().getFullYear()} MotéisBrasil — Todos os direitos reservados</p>
        <p style={{ fontSize: 11, color: '#333' }}>A parceria do seu motel começa aqui</p>
      </div>
    </footer>
  )
}
