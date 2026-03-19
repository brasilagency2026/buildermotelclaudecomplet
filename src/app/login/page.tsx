import LoginForm from '@/components/shared/LoginForm'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Entrar — MotéisBrasil' }
export default function LoginPage() {
  return (
    <div style={{ background: 'radial-gradient(ellipse at 50% 30%, #1e2235 0%, #0f1117 70%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <LoginForm />
    </div>
  )
}
