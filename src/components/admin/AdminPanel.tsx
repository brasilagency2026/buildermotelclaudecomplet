'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type Plan = 'all' | 'premium' | 'gratuito'
type Status = 'all' | 'active' | 'pending' | 'inactive'
type SortBy = 'created_at' | 'paypal_next_billing' | 'nome' | 'status'

interface Motel {
  id: string; slug: string; nome: string; cidade: string; estado: string
  status: string; usa_builder: boolean; site_externo?: string; foto_capa?: string
  paypal_status: string; paypal_subscription_id?: string; paypal_next_billing?: string
  created_at: string; updated_at: string; owner_id: string
  owners: { email: string; nome?: string }
}

interface Stats {
  total: number; premium: number; gratuito: number
  active: number; pending: number; inactive: number
  paypalActive: number; mrr: number
}

export default function AdminPanel() {
  const [moteis, setMoteis] = useState<Motel[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [planFilter, setPlanFilter] = useState<Plan>('all')
  const [statusFilter, setStatusFilter] = useState<Status>('all')
  const [sortBy, setSortBy] = useState<SortBy>('created_at')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const sb = createClient()

  const getToken = async () => {
    const { data: { session } } = await sb.auth.getSession()
    return session?.access_token || ''
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = await getToken()
    const res = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setMoteis(data.moteis || [])
    setStats(data.stats || null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id)
    const token = await getToken()
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    })
    await fetchData()
    setActionLoading(null)
  }

  const deleteMotel = async (id: string) => {
    setActionLoading(id)
    const token = await getToken()
    await fetch('/api/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    })
    setConfirmDelete(null)
    await fetchData()
    setActionLoading(null)
  }

  // Filtrar e ordenar
  const filtered = moteis
    .filter(m => {
      if (planFilter === 'premium' && !m.usa_builder) return false
      if (planFilter === 'gratuito' && m.usa_builder) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (search) {
        const s = search.toLowerCase()
        return m.nome.toLowerCase().includes(s) ||
          m.cidade.toLowerCase().includes(s) ||
          m.owners?.email?.toLowerCase().includes(s)
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'paypal_next_billing') {
        if (!a.paypal_next_billing) return 1
        if (!b.paypal_next_billing) return -1
        return new Date(a.paypal_next_billing).getTime() - new Date(b.paypal_next_billing).getTime()
      }
      if (sortBy === 'nome') return a.nome.localeCompare(b.nome)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
  const daysUntil = (d?: string) => {
    if (!d) return null
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
    return diff
  }

  const S = {
    page: { minHeight: '100vh', background: '#0f1117', color: '#f0ebe0' } as React.CSSProperties,
    top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 56, background: '#000', borderBottom: '1px solid #1e1e1e', position: 'sticky' as const, top: 0, zIndex: 50 } as React.CSSProperties,
    body: { maxWidth: 1400, margin: '0 auto', padding: '28px 20px' } as React.CSSProperties,
    card: { background: '#161a24', border: '1px solid #252d3d', borderRadius: 12, padding: '20px 24px' } as React.CSSProperties,
    statNum: { fontFamily: 'var(--font-playfair),serif', fontSize: 32, fontWeight: 900, lineHeight: 1 } as React.CSSProperties,
    statLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '1px', marginTop: 4 } as React.CSSProperties,
    input: { background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, padding: '9px 14px', color: '#f0ebe0', fontSize: 13, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
    select: { background: '#1c2130', border: '1px solid #252d3d', borderRadius: 8, padding: '9px 12px', color: '#f0ebe0', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' } as React.CSSProperties,
    btn: (color: string) => ({ padding: '5px 12px', background: 'transparent', border: `1px solid ${color}`, borderRadius: 5, color, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }),
  }

  return (
    <div style={S.page}>
      {/* Top bar */}
      <div style={S.top}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ color: '#6b7280', fontSize: 12, textDecoration: 'none' }}>← Portal</a>
          <span style={{ color: '#252d3d' }}>|</span>
          <span style={{ fontFamily: 'var(--font-playfair),serif', fontSize: 16, fontWeight: 700, color: '#d4a943' }}>
            ✦ Admin Panel
          </span>
          <span style={{ fontSize: 10, color: '#6b7280', background: '#1c2130', padding: '2px 8px', borderRadius: 4 }}>
            glwebagency2@gmail.com
          </span>
        </div>
        <button onClick={fetchData} style={{ padding: '7px 14px', background: '#1c2130', border: '1px solid #252d3d', borderRadius: 6, color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          ↻ Atualizar
        </button>
      </div>

      <div style={S.body}>

        {/* Stats cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Total motéis', value: stats.total, color: '#f0ebe0' },
              { label: '✨ Premium', value: stats.premium, color: '#d4a943' },
              { label: '🌐 Gratuito', value: stats.gratuito, color: '#4ade80' },
              { label: '✓ Ativos', value: stats.active, color: '#4ade80' },
              { label: '⏳ Pendentes', value: stats.pending, color: '#f59e0b' },
              { label: '✕ Pausados', value: stats.inactive, color: '#f87171' },
              { label: '💳 PayPal ativo', value: stats.paypalActive, color: '#60a5fa' },
              { label: '💰 MRR estimado', value: `R$${stats.mrr}`, color: '#d4a943' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...S.card, borderColor: color === '#f0ebe0' ? '#252d3d' : `${color}30` }}>
                <div style={{ ...S.statNum, color }}>{value}</div>
                <div style={S.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...S.input, flex: 1, minWidth: 200 }}
              placeholder="🔍 Buscar por nome, cidade ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={S.select} value={planFilter} onChange={e => setPlanFilter(e.target.value as Plan)}>
              <option value="all">Todos os planos</option>
              <option value="premium">✨ Premium (R$50/mês)</option>
              <option value="gratuito">🌐 Gratuito</option>
            </select>
            <select style={S.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value as Status)}>
              <option value="all">Todos os status</option>
              <option value="active">✓ Ativos</option>
              <option value="pending">⏳ Pendentes</option>
              <option value="inactive">✕ Pausados</option>
            </select>
            <select style={S.select} value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
              <option value="created_at">Ordenar: Data cadastro</option>
              <option value="paypal_next_billing">Ordenar: Próx. pagamento</option>
              <option value="nome">Ordenar: Nome A-Z</option>
              <option value="status">Ordenar: Status</option>
            </select>
            <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Alertas pagamento próximo */}
        {sortBy === 'paypal_next_billing' && filtered.some(m => {
          const d = daysUntil(m.paypal_next_billing)
          return d !== null && d <= 7 && d >= 0
        }) && (
          <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#f59e0b' }}>
            ⚠ {filtered.filter(m => { const d = daysUntil(m.paypal_next_billing); return d !== null && d <= 7 && d >= 0 }).length} motel(s) com pagamento nos próximos 7 dias
          </div>
        )}

        {/* Tabela */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>⏳ Carregando...</div>
        ) : (
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1c2130', borderBottom: '1px solid #252d3d' }}>
                    {['Motel', 'Proprietário', 'Plano', 'Status PayPal', 'Próx. Cobrança', 'Cadastro', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const days = daysUntil(m.paypal_next_billing)
                    const isExpiring = days !== null && days <= 7 && days >= 0
                    const isOverdue = days !== null && days < 0

                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #1a1f2e', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)' }}>
                        {/* Motel */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 6, background: '#252d3d', overflow: 'hidden', flexShrink: 0, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {m.foto_capa
                                ? <img src={m.foto_capa} alt={`Foto — ${m.nome}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : '🏨'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 2 }}>{m.nome}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{m.cidade}, {m.estado}</div>
                              <div style={{ fontSize: 10, color: '#374151', fontFamily: 'monospace' }}>
                                {m.usa_builder ? `/motel/${m.slug}` : m.site_externo?.replace('https://', '') || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Proprietário */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 12 }}>{m.owners?.nome || '—'}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{m.owners?.email}</div>
                        </td>

                        {/* Plano */}
                        <td style={{ padding: '12px 16px' }}>
                          {m.usa_builder ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#d4a943', background: 'rgba(212,169,67,.1)', border: '1px solid rgba(212,169,67,.25)', borderRadius: 4, padding: '3px 8px' }}>
                              ✨ Premium R$50
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 4, padding: '3px 8px' }}>
                              🌐 Gratuito
                            </span>
                          )}
                          <div style={{ marginTop: 4 }}>
                            {({ active: { color: '#4ade80', label: '● Ativo' }, pending: { color: '#f59e0b', label: '⏳ Pendente' }, inactive: { color: '#f87171', label: '✕ Pausado' } } as any)[m.status]
                              ? <span style={{ fontSize: 10, color: (({ active: '#4ade80', pending: '#f59e0b', inactive: '#f87171' } as any)[m.status]) }}>
                                  {({ active: '● Ativo', pending: '⏳ Pendente', inactive: '✕ Pausado' } as any)[m.status]}
                                </span>
                              : null}
                          </div>
                        </td>

                        {/* PayPal */}
                        <td style={{ padding: '12px 16px' }}>
                          {m.usa_builder ? (
                            <span style={{ fontSize: 11, color: m.paypal_status === 'active' ? '#4ade80' : m.paypal_status === 'cancelled' ? '#f87171' : '#f59e0b' }}>
                              {m.paypal_status === 'active' ? '💳 Ativo' : m.paypal_status === 'cancelled' ? '✕ Cancelado' : '⏳ Inativo'}
                            </span>
                          ) : <span style={{ color: '#374151', fontSize: 11 }}>—</span>}
                        </td>

                        {/* Próx. cobrança */}
                        <td style={{ padding: '12px 16px' }}>
                          {m.paypal_next_billing ? (
                            <div>
                              <div style={{ fontSize: 12, color: isOverdue ? '#f87171' : isExpiring ? '#f59e0b' : '#f0ebe0', fontWeight: isExpiring || isOverdue ? 700 : 400 }}>
                                {fmtDate(m.paypal_next_billing)}
                              </div>
                              {days !== null && (
                                <div style={{ fontSize: 10, color: isOverdue ? '#f87171' : isExpiring ? '#f59e0b' : '#6b7280' }}>
                                  {isOverdue ? `${Math.abs(days)}d atrasado` : days === 0 ? 'Hoje!' : `em ${days}d`}
                                </div>
                              )}
                            </div>
                          ) : <span style={{ color: '#374151', fontSize: 11 }}>—</span>}
                        </td>

                        {/* Cadastro */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 12 }}>{fmtDate(m.created_at)}</div>
                        </td>

                        {/* Ações */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <a href={m.usa_builder ? `/motel/${m.slug}` : m.site_externo || '#'} target="_blank" rel="noopener"
                              style={S.btn('#6b7280')}>👁 Ver</a>

                            {m.status === 'active' ? (
                              <button onClick={() => updateStatus(m.id, 'inactive')} disabled={actionLoading === m.id}
                                style={S.btn('#f59e0b')}>⏸ Pausar</button>
                            ) : (
                              <button onClick={() => updateStatus(m.id, 'active')} disabled={actionLoading === m.id}
                                style={S.btn('#4ade80')}>▶ Ativar</button>
                            )}

                            {m.status !== 'pending' && m.status !== 'active' ? null : null}

                            <button onClick={() => setConfirmDelete(m.id)} disabled={actionLoading === m.id}
                              style={S.btn('#f87171')}>🗑 Excluir</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            Nenhum motel encontrado com esses filtros.
          </div>
        )}
      </div>

      {/* Modal confirmação delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#161a24', border: '1px solid #252d3d', borderRadius: 16, padding: '32px', maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Confirmar exclusão</div>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Esta ação é irreversível. O motel, suas suítes e todas as fotos serão excluídos permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #252d3d', borderRadius: 8, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={() => deleteMotel(confirmDelete!)} disabled={actionLoading === confirmDelete}
                style={{ padding: '10px 20px', background: '#D4001F', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                {actionLoading === confirmDelete ? '⏳ Excluindo...' : '🗑 Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
