'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

export interface AddressResult {
  endereco: string
  cidade: string
  estado: string
  cep: string
  lat: number
  lng: number
}

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
  description: string
}

export function useGoogleMapsAddress(
  onResult: (result: AddressResult) => void,
  inputValue: string
) {
  const [mapsReady, setMapsReady] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [error, setError] = useState('')
  const geocoderRef = useRef<any>(null)
  const serviceRef = useRef<any>(null)   // AutocompleteService legado
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  // Poll até Google Maps estar completamente pronto
  useEffect(() => {
    const init = () => {
      const g = (window as any).google
      if (!g?.maps?.places) return false

      // Usar SEMPRE o serviço legado AutocompleteService — mais estável
      if (g.maps.places.AutocompleteService) {
        serviceRef.current = new g.maps.places.AutocompleteService()
        geocoderRef.current = new g.maps.Geocoder()
        setMapsReady(true)
        clearInterval(pollRef.current)
        return true
      }
      return false
    }

    if (init()) return

    let attempts = 0
    pollRef.current = setInterval(() => {
      attempts++
      if (init() || attempts > 40) {
        clearInterval(pollRef.current)
        if (attempts > 40) {
          setError('Google Maps não carregou. Verifique a chave API e o domínio autorizado.')
        }
      }
    }, 500)

    return () => clearInterval(pollRef.current)
  }, [])

  // Sugestões com debounce
  useEffect(() => {
    if (!mapsReady || !serviceRef.current) return
    if (inputValue.length < 3) { setSuggestions([]); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      serviceRef.current.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: { country: 'br' },
          types: ['geocode', 'establishment'],
          language: 'pt-BR',
        },
        (predictions: any[] | null, status: string) => {
          setLoading(false)
          if (status !== 'OK' || !predictions) {
            setSuggestions([])
            return
          }
          setSuggestions(
            predictions.slice(0, 5).map(p => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || '',
            }))
          )
        }
      )
    }, 350)

    return () => clearTimeout(debounceRef.current)
  }, [inputValue, mapsReady])

  // Geocodificar placeId → coordenadas + componentes
  const selectSuggestion = useCallback((suggestion: Suggestion) => {
    if (!geocoderRef.current) return
    setSuggestions([])

    geocoderRef.current.geocode(
      { placeId: suggestion.placeId },
      (results: any[] | null, status: string) => {
        if (status !== 'OK' || !results?.[0]) {
          setError('Não foi possível obter as coordenadas.')
          return
        }
        const r = results[0]
        const c = r.address_components as any[]
        const get = (type: string, short = false) =>
          c.find((x: any) => x.types.includes(type))?.[short ? 'short_name' : 'long_name'] || ''

        const route = get('route')
        const number = get('street_number')
        const sublocality = get('sublocality_level_1') || get('sublocality')
        const city = get('locality') || get('administrative_area_level_2')
        const state = get('administrative_area_level_1', true)
        const cep = get('postal_code').replace(/\D/g, '')

        let endereco = route
          ? (number ? `${route}, ${number}` : route)
          : suggestion.description
        if (sublocality && route) endereco += ` — ${sublocality}`

        onResult({ endereco, cidade: city, estado: state, cep, lat: r.geometry.location.lat(), lng: r.geometry.location.lng() })
      }
    )
  }, [onResult])

  // Geolocalização GPS
  const useMyLocation = useCallback(() => {
    if (!geocoderRef.current) { setError('Google Maps ainda não carregou.'); return }
    setGeoLoading(true)

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        geocoderRef.current.geocode(
          { location: { lat, lng } },
          (results: any[] | null, status: string) => {
            setGeoLoading(false)
            if (status !== 'OK' || !results?.[0]) return
            const r = results[0]
            const c = r.address_components as any[]
            const get = (type: string, short = false) =>
              c.find((x: any) => x.types.includes(type))?.[short ? 'short_name' : 'long_name'] || ''
            onResult({
              endereco: r.formatted_address,
              cidade: get('locality') || get('administrative_area_level_2'),
              estado: get('administrative_area_level_1', true),
              cep: get('postal_code').replace(/\D/g, ''),
              lat, lng,
            })
          }
        )
      },
      (err) => {
        setGeoLoading(false)
        if (err.code === 1) setError('Permissão de localização negada pelo navegador.')
        else setError('Não foi possível obter sua localização.')
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [onResult])

  return {
    suggestions,
    loading,
    mapsReady,
    error,
    selectSuggestion,
    clearSuggestions: useCallback(() => setSuggestions([]), []),
    useMyLocation,
    geoLoading,
  }
}
