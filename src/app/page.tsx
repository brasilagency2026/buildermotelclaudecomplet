import { createClient } from '@supabase/supabase-js'
import NavBar from '@/components/shared/NavBar'
import Footer from '@/components/shared/Footer'
import HeroSearch from '@/components/portal/HeroSearch'
import CTASection from '@/components/portal/CTASection'
import HomeClient from '@/components/portal/HomeClient'

export const revalidate = 60
export const dynamic = 'force-dynamic'

async function getMoteis() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await admin.rpc('search_moteis', { p_limit: 24, p_offset: 0 })
    return data || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const moteis = await getMoteis()
  return (
    <>
      <NavBar />
      <main>
        <HeroSearch />
        <HomeClient initialMoteis={moteis} />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
