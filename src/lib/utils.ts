import slugify from 'slugify'

export function makeSlug(nome: string, estado: string, cidade: string): string {
  const opts = { lower: true, strict: true, locale: 'pt' }
  return `${slugify(nome, opts)}-${slugify(estado.toLowerCase(), opts)}-${slugify(cidade, opts)}`
}

export function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
}

export function fmtDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : km < 10 ? `${km.toFixed(1)}km` : `${Math.round(km)}km`
}

export function wppLink(numero: string, motelNome: string, suiteNome?: string) {
  let n = numero.replace(/\D/g, '')
  // Adicionar código do país 55 (Brasil) se não tiver
  if (!n.startsWith('55') && n.length <= 11) n = '55' + n
  const msgBase = suiteNome
    ? `Olá! Vi a ${suiteNome} no ${motelNome} pelo MotéisBrasil e gostaria de reservar.`
    : `Olá! Vi o ${motelNome} no MotéisBrasil e gostaria de reservar.`
  const msg = encodeURIComponent(msgBase)
  return `https://wa.me/${n}?text=${msg}`
}

export function mapsLink(endereco: string, lat?: number, lng?: number) {
  if (lat && lng) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
}

export function wazeLink(endereco: string, lat?: number, lng?: number) {
  if (lat && lng) return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  return `https://waze.com/ul?q=${encodeURIComponent(endereco)}&navigate=yes`
}

export function motelMeta(m: { nome: string; cidade: string; estado: string; descricao?: string; slogan?: string }) {
  const title = `${m.nome} — Motel em ${m.cidade}, ${m.estado} | MotéisBrasil`
  const description = m.descricao || m.slogan ||
    `Reserve suítes no ${m.nome} em ${m.cidade}, ${m.estado}. Veja fotos, preços e reserve pelo WhatsApp.`
  return { title, description }
}
