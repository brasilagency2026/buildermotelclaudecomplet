'use client'
import { useEffect, useRef, useState } from 'react'
import type { MotelCard } from '@/types'

interface Props {
  moteis: MotelCard[]
  center?: { lat: number; lng: number }
  height?: number
}

export default function MotelMap({ moteis, center, height = 420 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const [mapsReady, setMapsReady] = useState(false)

  // Aguardar Google Maps carregar
  useEffect(() => {
    const check = () => {
      if ((window as any).google?.maps) { setMapsReady(true); return true }
      return false
    }
    if (check()) return
    const interval = setInterval(() => { if (check()) clearInterval(interval) }, 300)
    return () => clearInterval(interval)
  }, [])

  // Inicializar mapa
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return

    const google = (window as any).google
    const defaultCenter = center || { lat: -14.2350, lng: -51.9253 }

    const map = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: center ? 12 : 5,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1c2130' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1c2130' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252d3d' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1117' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#374151' }] },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    })

    mapInstanceRef.current = map
    infoWindowRef.current = new google.maps.InfoWindow()
  }, [mapsReady, center])

  // Atualizar markers quando moteis mudar
  useEffect(() => {
    if (!mapsReady || !mapInstanceRef.current) return
    const google = (window as any).google

    // Limpar markers existentes
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const moteisComCoords = moteis.filter(m => m.lat && m.lng)
    if (moteisComCoords.length === 0) return

    // Ícone customizado vermelho
    const icon = {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: '#D4001F',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 1.5,
      scale: 1.6,
      anchor: new google.maps.Point(12, 22),
    }

    const bounds = new google.maps.LatLngBounds()

    moteisComCoords.forEach(motel => {
      const marker = new google.maps.Marker({
        position: { lat: motel.lat!, lng: motel.lng! },
        map: mapInstanceRef.current,
        title: motel.nome,
        icon,
        animation: google.maps.Animation.DROP,
      })

      bounds.extend({ lat: motel.lat!, lng: motel.lng! })

      const foto = motel.foto_capa || motel.fotos_galeria?.[0]
      const preco = motel.preco_inicial
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(motel.preco_inicial)
        : null

      marker.addListener('click', () => {
        infoWindowRef.current.setContent(`
          <div style="font-family:sans-serif;min-width:200px;max-width:240px;background:#1c2130;border-radius:10px;overflow:hidden">
            ${foto ? `<img src="${foto}" alt="${motel.nome}" style="width:100%;height:110px;object-fit:cover;display:block"/>` : ''}
            <div style="padding:12px">
              <div style="font-weight:700;font-size:14px;color:#f0ebe0;margin-bottom:4px">${motel.nome}</div>
              <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">📍 ${motel.cidade}, ${motel.estado}</div>
              ${preco ? `<div style="font-size:13px;color:#D4001F;font-weight:700;margin-bottom:8px">a partir de ${preco}<span style="color:#6b7280;font-size:10px;font-weight:400">/2h</span></div>` : ''}
              <a href="/motel/${motel.slug}" style="display:block;text-align:center;padding:7px;background:#D4001F;color:white;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">
                Ver motel →
              </a>
            </div>
          </div>
        `)
        infoWindowRef.current.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    })

    // Ajustar zoom para mostrar todos os pins
    if (moteisComCoords.length > 1 && !center) {
      mapInstanceRef.current.fitBounds(bounds, { padding: 60 })
    }
  }, [mapsReady, moteis, center])

  if (!mapsReady) {
    return (
      <div style={{ height, background: '#0d1117', border: '1px solid #252d3d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 13, gap: 8 }}>
        <span>⏳</span> Carregando mapa...
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #252d3d' }}
    />
  )
}
