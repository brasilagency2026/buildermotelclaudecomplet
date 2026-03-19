'use client'
import { useState, useCallback } from 'react'
import { useGoogleMapsAddress, type AddressResult } from '@/lib/useGoogleMapsAddress'

interface Props {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (result: AddressResult) => void
  placeholder?: string
  required?: boolean
}

export default function AddressAutocomplete({ value, onChange, onAddressSelect, placeholder, required }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geoError, setGeoError] = useState('')

  const handleResult = useCallback((result: AddressResult) => {
    onChange(result.endereco)
    onAddressSelect(result)
    setShowSuggestions(false)
    setGeoError('')
  }, [onChange, onAddressSelect])

  const { suggestions, loading, mapsReady, error: mapsError, selectSuggestion, useMyLocation, geoLoading } =
    useGoogleMapsAddress(handleResult, value)

  const handleMyLocation = () => {
    setGeoError('')
    // Verificar permissão antes
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada neste navegador.')
      return
    }
    navigator.permissions?.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'denied') {
        setGeoError('Permissão negada. Ative a localização nas configurações do navegador.')
        return
      }
      useMyLocation()
    }).catch(() => {
      // API permissions não disponível, tenta direto
      useMyLocation()
    })
  }

  const statusColor = mapsError ? '#f87171' : mapsReady ? '#4ade80' : '#f59e0b'
  const statusMsg = mapsError
    ? mapsError
    : mapsReady
    ? 'Comece a digitar e selecione o endereço nas sugestões do Google Maps'
    : 'Carregando Google Maps...'

  return (
    <div style={{ position: 'relative' }}>
      {/* Input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{
            flex: 1, padding: '11px 14px',
            background: '#0f1117', border: '1px solid #252d3d',
            borderRadius: 8, color: '#f0ebe0', fontSize: 13,
            outline: 'none', fontFamily: 'inherit',
          }}
          value={value}
          onChange={e => { onChange(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder || 'Digite o endereço...'}
          required={required}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleMyLocation}
          disabled={geoLoading || !mapsReady}
          style={{
            padding: '11px 14px',
            background: geoLoading ? 'rgba(212,169,67,.12)' : '#0f1117',
            border: `1px solid ${geoLoading ? '#d4a943' : '#252d3d'}`,
            borderRadius: 8,
            color: geoLoading ? '#d4a943' : mapsReady ? '#9ca3af' : '#374151',
            cursor: mapsReady && !geoLoading ? 'pointer' : 'not-allowed',
            fontSize: 12, whiteSpace: 'nowrap' as const,
            fontFamily: 'inherit', flexShrink: 0, opacity: mapsReady ? 1 : 0.5,
          }}
        >
          {geoLoading ? '⏳ Obtendo...' : '📍 Minha posição'}
        </button>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0, display: 'inline-block' }} />
        <span style={{ color: mapsError ? '#f87171' : '#6b7280' }}>{statusMsg}</span>
      </div>

      {/* Erro geolocalização */}
      {geoError && (
        <div style={{ marginTop: 6, padding: '8px 12px', background: 'rgba(212,0,31,.08)', border: '1px solid rgba(212,0,31,.25)', borderRadius: 6, fontSize: 12, color: '#f87171' }}>
          ⚠ {geoError}
          {geoError.includes('configurações') && (
            <span style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
              Chrome: clique no 🔒 na barra de endereço → Permissões → Localização → Permitir
            </span>
          )}
        </div>
      )}

      {/* Dropdown sugestões */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#1c2130', border: '1px solid #252d3d',
          borderRadius: 10, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,.7)', overflow: 'hidden',
        }}>
          {loading && !suggestions.length && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⏳ Buscando endereços...
            </div>
          )}
          {suggestions.map((s, i) => (
            <div
              key={s.placeId}
              style={{
                padding: '11px 14px', cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #1a1f2e' : 'none',
              }}
              onMouseDown={() => { selectSuggestion(s); setShowSuggestions(false) }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(212,169,67,.08)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <div style={{ fontSize: 13, color: '#f0ebe0', marginBottom: 2 }}>📍 {s.mainText}</div>
              {s.secondaryText && <div style={{ fontSize: 11, color: '#6b7280' }}>{s.secondaryText}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
