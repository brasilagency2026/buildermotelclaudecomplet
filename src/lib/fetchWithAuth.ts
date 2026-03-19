'use client'
import { createClient } from '@/lib/supabase'

// Pour les requêtes JSON
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const sb = createClient()
  const { data: { session } } = await sb.auth.getSession()
  const token = session?.access_token

  const isFormData = options.body instanceof FormData

  return fetch(url, {
    ...options,
    headers: {
      // Ne pas forcer Content-Type pour FormData — le browser le gère automatiquement
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  })
}
