export type MotelStatus = 'pending' | 'active' | 'inactive'
export type PaypalStatus = 'inactive' | 'active' | 'cancelled'

export interface Owner {
  id: string; email: string; nome?: string; created_at: string
}

export interface Tarifa {
  id?: string; suite_id?: string; periodo: string; preco: number; ordem?: number
}

export interface Suite {
  id?: string; motel_id?: string; nome: string; descricao?: string
  servicos?: string; fotos: string[]; ordem?: number; tarifas?: Tarifa[]
}

export interface Motel {
  id: string; slug: string; owner_id: string
  nome: string; slogan?: string; descricao?: string
  endereco: string; cidade: string; estado: string; cep?: string
  lat?: number; lng?: number; telefone?: string; whatsapp?: string
  site_externo?: string; usa_builder: boolean
  foto_capa?: string; fotos_galeria: string[]
  status: MotelStatus
  paypal_subscription_id?: string; paypal_status: PaypalStatus; paypal_next_billing?: string
  created_at: string; updated_at: string
  suites?: Suite[]
}

export interface MotelCard {
  id: string; slug: string; nome: string; cidade: string; estado: string
  endereco: string; whatsapp?: string; telefone?: string
  foto_capa?: string; fotos_galeria: string[]; lat?: number; lng?: number
  preco_inicial?: number; distancia_km?: number
}

export const ESTADOS_BR = [
  {uf:'AC',nome:'Acre'},{uf:'AL',nome:'Alagoas'},{uf:'AP',nome:'Amapá'},
  {uf:'AM',nome:'Amazonas'},{uf:'BA',nome:'Bahia'},{uf:'CE',nome:'Ceará'},
  {uf:'DF',nome:'Distrito Federal'},{uf:'ES',nome:'Espírito Santo'},
  {uf:'GO',nome:'Goiás'},{uf:'MA',nome:'Maranhão'},{uf:'MT',nome:'Mato Grosso'},
  {uf:'MS',nome:'Mato Grosso do Sul'},{uf:'MG',nome:'Minas Gerais'},
  {uf:'PA',nome:'Pará'},{uf:'PB',nome:'Paraíba'},{uf:'PR',nome:'Paraná'},
  {uf:'PE',nome:'Pernambuco'},{uf:'PI',nome:'Piauí'},{uf:'RJ',nome:'Rio de Janeiro'},
  {uf:'RN',nome:'Rio Grande do Norte'},{uf:'RS',nome:'Rio Grande do Sul'},
  {uf:'RO',nome:'Rondônia'},{uf:'RR',nome:'Roraima'},{uf:'SC',nome:'Santa Catarina'},
  {uf:'SP',nome:'São Paulo'},{uf:'SE',nome:'Sergipe'},{uf:'TO',nome:'Tocantins'},
]

export const PERIODOS_PADRAO = ['2h','4h','12h','Diária']
