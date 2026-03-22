'use client'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useState, useEffect, useRef } from 'react'

interface Props {
  motelId: string
  alreadyActive: boolean
  onSuccess: () => void
  onSaveFirst?: () => Promise<string | null>
}

export default function PayPalSubscribe({ motelId, alreadyActive, onSuccess, onSaveFirst }: Props) {
  const [loading, setLoading] = useState(false)
  const [sdkLoading, setSdkLoading] = useState(true)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState(motelId)
  const btnRef = useRef<HTMLDivElement>(null)
  const sdkRendered = useRef(false)

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const planId = process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID

  // Salvar dados antes de renderizar botões PayPal
  const preparar = async (): Promise<string | null> => {
    let id = savedId || motelId
    if (!id && onSaveFirst) {
      setLoading(true)
      id = await onSaveFirst() || ''
      setLoading(false)
      if (!id) {
        setError('Preencha as informações do motel antes de assinar.')
        return null
      }
      setSavedId(id)
    }
    return id || null
  }

  // Carregar SDK PayPal e renderizar botões
  useEffect(() => {
    if (alreadyActive || sdkRendered.current) return
    if (!clientId || !planId) { setSdkLoading(false); return }

    const scriptId = 'paypal-sdk'
    if (document.getElementById(scriptId)) {
      renderButtons()
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    // vault=true + intent=subscription obrigatório para assinaturas
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&locale=pt_BR&currency=BRL&components=buttons`
    script.async = true
    script.onload = () => renderButtons()
    script.onerror = () => { setSdkLoading(false); setError('Erro ao carregar PayPal. Tente novamente.') }
    document.body.appendChild(script)
  }, [alreadyActive, clientId, planId])

  const renderButtons = () => {
    setSdkLoading(false)
    const paypal = (window as any).paypal
    if (!paypal || !btnRef.current || sdkRendered.current) return
    sdkRendered.current = true

    // Limpar container
    btnRef.current.innerHTML = ''

    paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',     // empilhé: PayPal + carte bancaire
        label: 'subscribe',
        height: 48,
      },
      createSubscription: async (_data: any, actions: any) => {
        const id = await preparar()
        if (!id) throw new Error('Motel não encontrado')

        // Criar subscription via nossa API (para ter o custom_id correto)
        const res = await fetchWithAuth('/api/paypal', {
          method: 'POST',
          body: JSON.stringify({ motel_id: id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        // Extrair subscription_id da approval_url para usar com o SDK
        // OU usar actions.subscription.create diretamente
        return actions.subscription.create({
          plan_id: planId,
          custom_id: id,
          application_context: {
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            locale: 'pt-BR',
          }
        })
      },
      onApprove: async (data: any) => {
        setLoading(true)
        try {
          // Ativar motel imediatamente
          const id = savedId || motelId
          await fetchWithAuth('/api/paypal/success', {
            method: 'POST',
            body: JSON.stringify({
              motel_id: id,
              subscription_id: data.subscriptionID,
            }),
          })
          onSuccess()
          setError('')
        } catch (err: any) {
          setError('Assinatura aprovada! Aguarde a ativação.')
          onSuccess() // ativar mesmo com erro
        } finally {
          setLoading(false)
        }
      },
      onError: (err: any) => {
        console.error('[PayPal]', err)
        setError('Erro no pagamento. Tente novamente ou use o botão abaixo.')
      },
      onCancel: () => {
        setError('Pagamento cancelado. Seus dados foram salvos — assine quando quiser.')
      },
    }).render(btnRef.current)
  }

  if (alreadyActive) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(0,200,83,.08)', border: '1px solid rgba(0,200,83,.25)', borderRadius: 10, fontSize: 14, color: '#4ade80', fontWeight: 600 }}>
      ✅ Assinatura ativa — R$ 50/mês via PayPal
    </div>
  )

  return (
    <div>
      {/* Preço e benefícios */}
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

      {/* Botões PayPal SDK — inclui PayPal + Cartão */}
      {sdkLoading ? (
        <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
          ⏳ Carregando opções de pagamento...
        </div>
      ) : (
        <div>
          {/* Container dos botões PayPal SDK */}
          <div ref={btnRef} style={{ marginBottom: 12 }} />

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#252d3d' }} />
            <span style={{ fontSize: 11, color: '#374151' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: '#252d3d' }} />
          </div>

          {/* Botão fallback — redirecionamento direto */}
          <button
            onClick={async () => {
              setLoading(true); setError('')
              try {
                const id = await preparar()
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
            style={{ width: '100%', padding: '12px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, color: '#9ca3af', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 16 }}>🅿</span>
            {loading ? '⏳ Aguarde...' : 'Pagar com conta PayPal'}
          </button>
        </div>
      )}

      {/* Info segurança */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>🔒 Pagamento 100% seguro</span>
        <span style={{ fontSize: 11, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>💳 Cartão de crédito ou débito</span>
        <span style={{ fontSize: 11, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>🏦 Conta PayPal</span>
      </div>
    </div>
  )
}
