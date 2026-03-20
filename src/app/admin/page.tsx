import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'

const ADMIN_EMAIL = 'glwebagency2@gmail.com'

export default async function AdminPage() {
  const sb = createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  return <AdminPanel />
}
