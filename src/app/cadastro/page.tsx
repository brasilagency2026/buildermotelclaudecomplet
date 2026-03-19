import type { Metadata } from 'next'
import NavBar from '@/components/shared/NavBar'
import Footer from '@/components/shared/Footer'
import CadastroFlow from '@/components/portal/CadastroFlow'
export const metadata: Metadata = { title: 'Cadastre Seu Motel Grátis — MotéisBrasil' }
export default function CadastroPage() {
  return (
    <>
      <NavBar />
      <main className="pt-20 pb-16">
        <CadastroFlow />
      </main>
      <Footer />
    </>
  )
}
