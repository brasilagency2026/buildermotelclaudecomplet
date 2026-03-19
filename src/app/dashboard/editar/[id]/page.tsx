import { redirect, notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import BuilderForm from '@/components/builder/BuilderForm'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Editar Motel — MotéisBrasil' }
interface Props { params: { id: string } }
export default async function EditarMotelPage({ params }: Props) {
  const sb = createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: motel } = await sb.from('moteis').select('*, suites(*, tarifas(*))').eq('id', params.id).eq('owner_id', user.id).single()
  if (!motel) notFound()
  return <BuilderForm motel={motel} userId={user.id} />
}
