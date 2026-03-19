import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import BuilderForm from '@/components/builder/BuilderForm'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Novo Motel — MotéisBrasil' }

export default async function NovoMotelPage() {
  const sb = createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  return <BuilderForm motel={null} userId={user.id} />
}
