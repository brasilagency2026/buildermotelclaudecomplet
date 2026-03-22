'use client'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useState, useEffect, useRef } from 'react'

interface Props {
  motelId: string
  alreadyActive: boolean
  onSuccess: () => void
  onSaveFirst?: () => Promise<string | null>
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
const PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID || ''
const CONTAINER_ID = 'paypal-button-container-' + (process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID || 'paypal')

export default function PayPalSubscribe({ motelId, alreadyActive, onSuccess, onSaveFirst }: Props) {
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [error, setError] = useState('')
  const [currentId, setCurrentId] = useState(motelId)
  const rendered = useRef(false)

  // Salvar dados antes de ir ao PayPal
  const prepararId = async (): Promise<string | null> => {
    let id = currentId || motelId
    if (!id && onSaveFirst) {
      setLoading(true)
      const saved = await onSaveFirst()
      setLoading(false)
      if (!saved) {
        setError('Preencha as informações do motel antes de assinar.')
        return null
      }
      setCurrentId(saved)
      return saved
    }
    return id || null
  }

  useEffect(() => {
    if (alreadyActive || rendered.current) return

    // Carregar o SDK exatamente como PayPal recomenda
    const scriptId = 'paypal-sdk-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription&locale=pt_BR&currency=BRL`
      script.setAttribute('data-sdk-integration-source', 'button-factory')
      script.async = true
      script.onload = () => setSdkReady(true)
      script.onerror = () => setError('Erro ao carregar PayPal. Tente usar o botão alternativo abaixo.')
      document.body.appendChild(script)
    } else {
      setSdkReady(true)
    }
  }, [alreadyActive])

  useEffect(() => {
    if (!sdkReady || rendered.current || alreadyActive) return
    const paypal = (window as any).paypal
    if (!paypal) return

    const container = document.getElementById(CONTAINER_ID)
    if (!container) return

    rendered.current = true

    paypal.Buttons({
      style: {
        shape: 'pill',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe',
      },
      createSubscription: async function(_data: any, actions: any) {
        // Salvar motel + suítes antes de criar a subscription
        const id = await prepararId()
        if (!id) throw new Error('Dados do motel não salvos.')

        return actions.subscription.create({
          plan_id: PLAN_ID,
          custom_id: id, // nosso motel_id para o webhook
          application_context: {
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            locale: 'pt-BR',
          }
        })
      },
      onApprove: async function(data: any) {
        setLoading(true)
        try {
          const id = currentId || motelId
          // Ativar motel imediatamente
          await fetchWithAuth('/api/paypal/success', {
            method: 'POST',
            body: JSON.stringify({
              motel_id: id,
              subscription_id: data.subscriptionID,
            }),
          })
          setError('')
          onSuccess()
        } catch {
          // Mesmo com erro, a assinatura foi aprovada
          onSuccess()
        } finally {
          setLoading(false)
        }
      },
      onError: function(err: any) {
        console.error('[PayPal SDK]', err)
        setError('Ocorreu um erro no pagamento. Tente novamente ou use o botão alternativo.')
        rendered.current = false
      },
      onCancel: function() {
        setError('Pagamento cancelado. Seus dados foram salvos — você pode assinar quando quiser.')
      },
    }).render('#' + CONTAINER_ID)
  }, [sdkReady])

  if (alreadyActive) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(0,200,83,.08)', border: '1px solid rgba(0,200,83,.25)', borderRadius: 10, fontSize: 14, color: '#4ade80', fontWeight: 600 }}>
      ✅ Assinatura ativa — R$ 50/mês via PayPal
    </div>
  )

  return (
    <div>
      {/* Preço */}
      <div style={{ background: 'rgba(212,169,67,.06)', border: '1px solid rgba(212,169,67,.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 40, fontWeight: 900, color: '#d4a943', lineHeight: 1 }}>R$50</span>
          <span style={{ fontSize: 14, color: '#6b7280' }}>/mês · cancele quando quiser</span>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            'Página SEO otimizada (Google, Bing)',
            'URL exclusiva: /motel/nome-estado-cidade',
            'Suítes com fotos e tabela de preços',
            'Reservas diretas via WhatsApp',
            'Google Maps integrado + Waze',
            'Cobrança automática mensal',
          ].map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6b7280', padding: '8px 0', borderBottom: '1px solid #1a1f2e' }}>
              <span style={{ color: '#4ade80', fontSize: 16 }}>✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Erro */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(212,0,31,.08)', border: '1px solid rgba(212,0,31,.25)', borderRadius: 8, color: '#ff6b6b', fontSize: 13, marginBottom: 14 }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading salvar dados */}
      {loading && (
        <div style={{ padding: '12px', textAlign: 'center', color: '#d4a943', fontSize: 13, marginBottom: 12 }}>
          ⏳ Salvando seus dados...
        </div>
      )}

      {/* Botões PayPal SDK (PayPal + Cartão) */}
      {!sdkReady && !error && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
          ⏳ Carregando opções de pagamento...
        </div>
      )}

      {/* Container oficial PayPal */}
      <div id={CONTAINER_ID} style={{ marginBottom: 16 }} />

      {/* Separador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#252d3d' }} />
        <span style={{ fontSize: 11, color: '#374151' }}>ou pague direto pelo link</span>
        <div style={{ flex: 1, height: 1, background: '#252d3d' }} />
      </div>

      {/* Botão alternativo — redirecionamento direto */}
      <button
        onClick={async () => {
          setLoading(true); setError('')
          try {
            const id = await prepararId()
            if (!id) return
            const res = await fetchWithAuth('/api/paypal', {
              method: 'POST',
              body: JSON.stringify({ motel_id: id }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            if (data.approval_url) window.location.href = data.approval_url
          } catch (err: any) {
            setError(err.message)
          } finally {
            setLoading(false)
          }
        }}
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, color: '#9ca3af', fontSize: 13, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 16 }}>🅿</span>
        {loading ? '⏳ Aguarde...' : 'Assinar via link PayPal'}
      </button>

      {/* Segurança */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#374151' }}>🔒 Pagamento seguro</span>
        <span style={{ fontSize: 11, color: '#374151' }}>💳 Cartão de crédito ou débito</span>
        <span style={{ fontSize: 11, color: '#374151' }}>🏦 Conta PayPal</span>
      </div>
    </div>
  )
}
