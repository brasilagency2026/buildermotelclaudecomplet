import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import DashboardClient from '@/components/builder/DashboardClient'
export const metadata: Metadata = { title: 'Meu Painel — MotéisBrasil' }

export default async function DashboardPage() {
  const sb = createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: moteis } = await sb
    .from('moteis')
    .select('*, suites(*, tarifas(*))')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return <DashboardClient moteis={moteis || []} userEmail={user.email!} />
}
