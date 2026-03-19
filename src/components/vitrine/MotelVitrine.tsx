'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { Motel, Suite } from '@/types'
import { fmtBRL, wppLink, mapsLink, wazeLink } from '@/lib/utils'

interface Props { motel: Motel & { suites: Suite[] } }

export default function MotelVitrine({ motel }: Props) {
  const wpp = motel.whatsapp ? wppLink(motel.whatsapp, motel.nome) : '#'
  const maps = mapsLink(motel.endereco, motel.lat, motel.lng)
  const waze = wazeLink(motel.endereco, motel.lat, motel.lng)
  const fotos = [motel.foto_capa, ...(motel.fotos_galeria || [])].filter(Boolean) as string[]

  return (
    <main style={{ paddingTop: 0 }}>
      {/* ── HERO ── */}
      <section style={{ position: 'relative', height: '80vh', minHeight: 480, overflow: 'hidden', background: '#1a0d15', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {fotos[0] && (
          <Image src={fotos[0]} alt={motel.nome} fill priority style={{ objectFit: 'cover', opacity: .55 }} sizes="100vw" />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.3) 60%, transparent 100%)' }} />

        {/* Sticky nav overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
          <div style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 18, fontWeight: 700 }}>{motel.nome}</div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>
            <a href="#suites" style={{ color: 'inherit', textDecoration: 'none' }}>Suítes</a>
            <a href="#sobre" style={{ color: 'inherit', textDecoration: 'none' }}>Sobre</a>
            <a href="#contato" style={{ color: 'inherit', textDecoration: 'none' }}>Contato</a>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', padding: '0 48px 48px', zIndex: 5 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(212,169,67,.12)', border: '1px solid rgba(212,169,67,.35)', borderRadius: 50, fontSize: 11, fontWeight: 600, color: '#d4a943', letterSpacing: '.5px', marginBottom: 14 }}>
            ✦ BEM-VINDO(A)
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, lineHeight: 1.02, marginBottom: 10 }}>
            {motel.nome}
          </h1>
          {motel.slogan && (
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', marginBottom: 28 }}>{motel.slogan}</p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#suites" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: 'linear-gradient(135deg,#d4a943,#f0c060)', color: '#1a1200', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              ➡ Ver as suítes
            </a>
            {motel.whatsapp && (
              <a href={wpp} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: 'transparent', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                📞 Fale conosco
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── STICKY ACTION BAR ── */}
      <div style={{ position: 'sticky', top: 52, zIndex: 40, background: 'rgba(15,17,23,.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #252d3d' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            📍 {motel.cidade}, {motel.estado}
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {motel.whatsapp && (
              <a href={wpp} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#075E54', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                💬 Reservar pelo WhatsApp
              </a>
            )}
            <a href={maps} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'transparent', border: '1px solid #252d3d', color: '#f0ebe0', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              📍 Google Maps
            </a>
            <a href={waze} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#33CCFF', color: '#000', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              🚗 Waze
            </a>
          </div>
        </div>
      </div>

      {/* ── SUÍTES ── */}
      <section id="suites" style={{ padding: '56px 24px', maxWidth: 960, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#d4a943', marginBottom: 10 }}>NOSSAS ACOMODAÇÕES</p>
        <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 34, fontWeight: 900, marginBottom: 8 }}>Suítes & Quartos</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 36 }}>Cada espaço foi pensado para o seu conforto e privacidade.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
          {motel.suites?.map(suite => (
            <SuiteCard key={suite.id} suite={suite} wpp={wpp} />
          ))}
        </div>

        {(!motel.suites || motel.suites.length === 0) && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', background: '#161a24', borderRadius: 12, border: '1px solid #252d3d' }}>
            <p style={{ fontSize: 14 }}>Entre em contato para informações sobre nossas suítes.</p>
          </div>
        )}
      </section>

      {/* ── GALERIA ── */}
      {fotos.length > 1 && (
        <section style={{ padding: '0 24px 56px', maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 26, fontWeight: 900, marginBottom: 20 }}>Galeria</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
            {fotos.slice(0, 8).map((f, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', background: '#1c2130' }}>
                <Image src={f} alt={`${motel.nome} foto ${i+1}`} fill style={{ objectFit: 'cover' }} sizes="220px" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SOBRE + CONTATO ── */}
      <section id="sobre" style={{ background: '#161a24', borderTop: '1px solid #252d3d', borderBottom: '1px solid #252d3d', padding: '56px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#d4a943', marginBottom: 10 }}>SOBRE NÓS</p>
            <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 30, fontWeight: 900, marginBottom: 16 }}>Conheça o motel</h2>
            {motel.descricao && (
              <p style={{ fontSize: 14, color: 'rgba(240,235,224,.7)', lineHeight: 1.75 }}>{motel.descricao}</p>
            )}
          </div>

          {/* Contact box */}
          <div id="contato" style={{ background: '#1c2130', border: '1px solid #252d3d', borderRadius: 14, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Entre em contato</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: '#252d3d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📍</div>
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.8px', color: '#6b7280', marginBottom: 2 }}>Endereço</p>
                <p style={{ fontSize: 13, fontWeight: 500 }}>{motel.endereco}</p>
              </div>
            </div>
            {motel.telefone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, background: '#252d3d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📞</div>
                <div>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.8px', color: '#6b7280', marginBottom: 2 }}>Telefone</p>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{motel.telefone}</p>
                </div>
              </div>
            )}
            {motel.telefone && (
              <a href={`tel:${motel.telefone.replace(/\D/g,'')}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, background: '#1a56db', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>
                📞 Ligar agora
              </a>
            )}
            <a href={maps} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, background: 'transparent', border: '1px solid #252d3d', color: '#f0ebe0', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
              🗺 Como chegar — Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* ── MAPA ── */}
      {motel.lat && motel.lng && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div style={{ margin: '0 24px 40px', maxWidth: 960, marginLeft: 'auto', marginRight: 'auto' }}>
          <iframe
            title={`Localização ${motel.nome}`}
            width="100%" height="240"
            style={{ border: 0, borderRadius: 12, display: 'block' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${motel.lat},${motel.lng}&zoom=15`}
          />
        </div>
      )}

      {/* ── CTA RESERVA ── */}
      {motel.whatsapp && (
        <section style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 700, margin: '0 auto 40px' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 36, fontWeight: 900, marginBottom: 10 }}>
            Pronto para <span style={{ color: '#d4a943', fontStyle: 'italic' }}>reservar?</span>
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 28, fontSize: 14, lineHeight: 1.65 }}>
            Fale diretamente com o {motel.nome} pelo WhatsApp.
          </p>
          <a href={wpp} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '15px 36px', background: '#25D366', color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
            💬 Reservar agora pelo WhatsApp
          </a>
        </section>
      )}

      {/* ── VITRINE FOOTER ── */}
      <footer style={{ background: '#161a24', borderTop: '1px solid #252d3d', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>© {new Date().getFullYear()} {motel.nome} · {motel.endereco}</span>
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          Powered by{' '}
          <a href="/" style={{ color: '#d4a943', textDecoration: 'none', fontWeight: 600 }}>MotéisBrasil</a>
        </span>
      </footer>
    </main>
  )
}

function SuiteCard({ suite, wpp }: { suite: Suite; wpp: string }) {
  const [fotoIdx, setFotoIdx] = useState(0)
  const fotos = suite.fotos || []

  return (
    <div style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 16, overflow: 'hidden' }}>
      {/* Foto carousel */}
      <div style={{ position: 'relative', height: 190, background: '#1c2130', overflow: 'hidden' }}>
        {fotos.length > 0 ? (
          <Image src={fotos[fotoIdx]} alt={suite.nome} fill style={{ objectFit: 'cover' }} sizes="320px" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: .2 }}>🛏</div>
        )}
        {fotos.length > 1 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
            <button onClick={() => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)} style={{ width: 28, height: 28, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '50%', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>‹</button>
            <button onClick={() => setFotoIdx(i => (i + 1) % fotos.length)} style={{ width: 28, height: 28, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '50%', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>›</button>
          </div>
        )}
      </div>

      <div style={{ padding: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 19, fontWeight: 700, marginBottom: 4 }}>{suite.nome}</h3>
        {suite.descricao && <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14, lineHeight: 1.5 }}>{suite.descricao}</p>}

        {/* Tarifas */}
        {suite.tarifas && suite.tarifas.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
              {suite.tarifas.slice(0, 3).map((t, i) => (
                <div key={i} style={{ background: '#1c2130', borderRadius: 8, padding: '9px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.8px', color: '#6b7280', marginBottom: 4 }}>{t.periodo}</div>
                  <div style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 17, fontWeight: 700, color: '#d4a943' }}>{fmtBRL(t.preco)}</div>
                </div>
              ))}
            </div>
            {suite.tarifas.slice(3).map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#1c2130', borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{t.periodo}</span>
                <span style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 16, fontWeight: 700, color: '#d4a943' }}>{fmtBRL(t.preco)}</span>
              </div>
            ))}
          </div>
        )}

        <a href={wpp} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, background: '#075E54', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          📱 Reservar esta suíte
        </a>
      </div>
    </div>
  )
}
