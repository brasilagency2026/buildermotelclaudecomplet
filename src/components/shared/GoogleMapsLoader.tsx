'use client'
import { useEffect } from 'react'

export default function GoogleMapsLoader() {
  useEffect(() => {
    if ((window as any).google?.maps?.places?.AutocompleteService) return
    if (document.getElementById('google-maps-script')) return

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) {
      console.warn('[GoogleMaps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurada.')
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    // Sem loading=async para garantir AutocompleteService disponível
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=pt-BR&v=weekly`
    script.async = true
    script.defer = true
    script.onerror = () => {
      console.error('[GoogleMaps] Falha ao carregar. Verifique a chave API e o domínio autorizado no Google Cloud Console.')
    }
    document.head.appendChild(script)
  }, [])

  return null
}
