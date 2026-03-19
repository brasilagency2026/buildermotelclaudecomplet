import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import GoogleMapsLoader from '@/components/shared/GoogleMapsLoader'
import './globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'MotéisBrasil — Encontre Motéis Perto de Você', template: '%s | MotéisBrasil' },
  description: 'O maior portal de motéis do Brasil. Encontre motéis perto de você, compare preços e reserve pelo WhatsApp.',
  keywords: ['motel', 'brasil', 'reserva', 'suíte'],
  openGraph: { siteName: 'MotéisBrasil', type: 'website', locale: 'pt_BR' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://motelsbrasil.com.br'),
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        {children}
        {/* Carrega Google Maps pelo lado do cliente — acessa process.env em runtime */}
        <GoogleMapsLoader />
      </body>
    </html>
  )
}
