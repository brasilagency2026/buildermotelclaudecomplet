import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'
import BuilderForm from '@/components/builder/BuilderForm'
import CadastroGratuito from '@/components/builder/CadastroGratuito'

export default async function NovomotelPage({
  searchParams
}: {
  searchParams: { tipo?: string }
}) {
  const sb = createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  // Verificar se já tem um motel — 1 conta = 1 motel
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: moteis } = await admin
    .from('moteis')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)

  if (moteis && moteis.length > 0) {
    // Já tem motel — redirecionar para editar
    redirect(`/dashboard/editar/${moteis[0].id}`)
  }

  if (searchParams.tipo === 'gratuito') {
    return <CadastroGratuito userId={user.id} />
  }

  return <BuilderForm motel={null} userId={user.id} />
}
