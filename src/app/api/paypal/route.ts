import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

const PAYPAL_BASE = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) throw new Error('PAYPAL_CLIENT_ID ou PAYPAL_CLIENT_SECRET não configurados.')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const d = await res.json()
  if (!d.access_token) throw new Error(`Token error: ${JSON.stringify(d)}`)
  return d.access_token
}

export async function POST(req: NextRequest) {
  try {
    const sb = createServerSupabase()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const motel_id = body.motel_id

    const planId = process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID
      || process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID
      || process.env.PAYPAL_PLAN_ID

    if (!planId) throw new Error('Plan ID não configurado no Vercel.')

    // Validar que motel_id não está vazio
    if (!motel_id) throw new Error('motel_id está vazio — salve as informações do motel antes de assinar.')

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buildermotelclaudecomplet.vercel.app').replace(/\/$/, '')

    const token = await getToken()

    // custom_id deve ter no máximo 127 caracteres e sem caracteres especiais
    const customId = `${user.id}:${motel_id}`.substring(0, 127)

    const payload = {
      plan_id: planId.trim(),
      custom_id: customId,
      application_context: {
        brand_name: 'MoteisBrasil',
        locale: 'pt-BR',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: `${siteUrl}/dashboard?sub=success&motel_id=${motel_id}`,
        cancel_url: `${siteUrl}/dashboard?sub=cancelled`,
      },
    }

    console.log('[PayPal] PAYPAL_ENV:', process.env.PAYPAL_ENV)
    console.log('[PayPal] PAYPAL_BASE:', PAYPAL_BASE)
    console.log('[PayPal] plan_id:', planId)
    console.log('[PayPal] custom_id:', customId)
    console.log('[PayPal] return_url:', payload.application_context.return_url)

    const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PayPal-Request-Id': `motel-${motel_id}-${Date.now()}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    })

    const sub = await res.json()

    if (!res.ok) {
      console.error('[PayPal] Error response:', JSON.stringify(sub, null, 2))
      const detail = sub.details?.[0]?.description || sub.message || JSON.stringify(sub)
      throw new Error(`PayPal: ${detail}`)
    }

    const approvalUrl = sub.links?.find((l: any) => l.rel === 'approve')?.href
    if (!approvalUrl) throw new Error('PayPal não retornou URL de aprovação.')

    return NextResponse.json({ subscription_id: sub.id, approval_url: approvalUrl })

  } catch (err: any) {
    console.error('[PayPal POST] Final error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
