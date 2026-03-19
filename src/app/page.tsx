import { createServerSupabase } from '@/lib/supabase-server'
import NavBar from '@/components/shared/NavBar'
import Footer from '@/components/shared/Footer'
import HeroSearch from '@/components/portal/HeroSearch'
import MoteisList from '@/components/portal/MoteisList'
import MapSection from '@/components/portal/MapSection'
import CTASection from '@/components/portal/CTASection'

export const revalidate = 60
export const dynamic = 'force-dynamic'

async function getMoteis() {
  try {
    const sb = createServerSupabase()
    const { data } = await sb.rpc('search_moteis', { p_limit: 24, p_offset: 0 })
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
        <MoteisList initialMoteis={moteis} />
        <MapSection moteis={moteis} />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
