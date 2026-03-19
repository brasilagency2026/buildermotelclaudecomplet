import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
export async function POST(req: NextRequest) {
  try {
    const event = await req.json()
    const admin = createAdminSupabase()
    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const sub = event.resource
      const [userId, motelId] = (sub.custom_id || '').split(':')
      await admin.from('moteis').update({ paypal_subscription_id: sub.id, paypal_status: 'active', paypal_next_billing: sub.billing_info?.next_billing_time || null, status: 'active' }).eq('id', motelId).eq('owner_id', userId)
    }
    if (['BILLING.SUBSCRIPTION.CANCELLED','BILLING.SUBSCRIPTION.SUSPENDED'].includes(event.event_type)) {
      const sub = event.resource
      await admin.from('moteis').update({ paypal_status: 'cancelled', status: 'inactive' }).eq('paypal_subscription_id', sub.id)
    }
    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
