'use client'
import { supabase } from '@/lib/supabase'
import {
  AlertCircle, Calendar, Check, CheckCircle2, ChevronDown,
  Clock, Filter, Loader2, Phone, RefreshCw, Search,
  UtensilsCrossed, Users, X, XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reservation {
  id: string
  date: string
  time_slot: string
  party_size: number
  guest_name: string
  guest_phone: string
  status: string
  confirmation_code: string
  notes: string | null
  created_at: string
  venue_zones: { name: string } | null
  venue_tables: { table_number: string; capacity_max: number } | null
}

interface ZoneStat {
  name: string
  total: number
  pending: number
  confirmed: number
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: <AlertCircle size={13} /> },
  confirmed: { label: 'Confirmada', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', icon: <CheckCircle2 size={13} /> },
  cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', icon: <XCircle size={13} /> },
  seated: { label: 'En local', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', icon: <UtensilsCrossed size={13} /> },
  completed: { label: 'Completada', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', icon: <Check size={13} /> },
  no_show: { label: 'No se presentó', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/30', icon: <X size={13} /> },
}

const ALL_STATUSES = Object.keys(STATUS_CFG)

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function fmtDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-').map(Number)
  const obj = new Date(y, m - 1, day)
  return `${DAY_NAMES[obj.getDay()]} ${day} ${MONTH_NAMES[m - 1]}`
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

// ─── Action Buttons ───────────────────────────────────────────────────────────
function ActionBtn({ label, color, onClick, loading }: { label: string; color: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 ${color}`}
    >
      {loading ? <Loader2 size={11} className="animate-spin inline" /> : label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState(todayISO())
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, seated: 0, capacity: 0 })
  const [zoneStats, setZoneStats] = useState<ZoneStat[]>([])

  // Detail drawer
  const [selected, setSelected] = useState<Reservation | null>(null)

  useEffect(() => { bootstrap() }, [])
  useEffect(() => { if (venueId) fetchReservations() }, [venueId, dateFilter])

  const bootstrap = async () => {
    const { data } = await supabase.from('bar_venues').select('id').eq('name', 'Club Gordo').single()
    if (data) setVenueId(data.id)
  }

  const fetchReservations = useCallback(async (silent = false) => {
    if (!venueId) return
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      let query = supabase
        .from('table_reservations')
        .select('*, venue_zones(name), venue_tables(table_number, capacity_max)')
        .eq('venue_id', venueId)
        .order('time_slot', { ascending: true })
        .order('created_at', { ascending: true })

      if (dateFilter) query = query.eq('date', dateFilter)

      const { data } = await query
      const rows = (data ?? []) as Reservation[]
      setReservations(rows)

      // Compute stats
      setStats({
        total: rows.length,
        pending: rows.filter(r => r.status === 'pending').length,
        confirmed: rows.filter(r => r.status === 'confirmed').length,
        seated: rows.filter(r => r.status === 'seated').length,
        capacity: rows.filter(r => !['cancelled', 'no_show'].includes(r.status)).reduce((s, r) => s + r.party_size, 0),
      })

      // Zone stats
      const zm: Record<string, ZoneStat> = {}
      rows.forEach(r => {
        const z = r.venue_zones?.name ?? 'Sin zona'
        if (!zm[z]) zm[z] = { name: z, total: 0, pending: 0, confirmed: 0 }
        zm[z].total++
        if (r.status === 'pending') zm[z].pending++
        if (r.status === 'confirmed') zm[z].confirmed++
      })
      setZoneStats(Object.values(zm))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [venueId, dateFilter])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      await supabase.from('table_reservations').update({ status: newStatus }).eq('id', id)
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
      // Recompute stats inline
      setStats(prev => ({ ...prev }))
      fetchReservations(true)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = reservations.filter(r => {
    const q = searchQuery.toLowerCase()
    const matchQ = !q || r.guest_name.toLowerCase().includes(q) || r.guest_phone.includes(q) || r.confirmation_code.toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || r.status === statusFilter
    return matchQ && matchS
  })

  // ── Actions for a reservation ─────────────────────────────────────────────
  const nextActions = (r: Reservation): { label: string; status: string; color: string }[] => {
    switch (r.status) {
      case 'pending': return [
        { label: '✓ Confirmar', status: 'confirmed', color: 'bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/30' },
        { label: '✕ Cancelar', status: 'cancelled', color: 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30' },
      ]
      case 'confirmed': return [
        { label: '↑ En local', status: 'seated', color: 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/30' },
        { label: '✕ Cancelar', status: 'cancelled', color: 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30' },
      ]
      case 'seated': return [
        { label: '✓ Completada', status: 'completed', color: 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/30' },
        { label: 'No se presentó', status: 'no_show', color: 'bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25 border border-zinc-500/30' },
      ]
      default: return []
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-orange-400" />
            </span>
            BAR — Club Gordos
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Gestión de reservas de mesas · Vitacura   peneenenen</p>
        </div>
        <button
          onClick={() => fetchReservations(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 text-sm font-medium transition-all"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', val: stats.total, color: 'text-white' },
          { label: 'Pendientes', val: stats.pending, color: 'text-amber-400' },
          { label: 'Confirmadas', val: stats.confirmed, color: 'text-green-400' },
          { label: 'En local', val: stats.seated, color: 'text-orange-400' },
          { label: 'Personas hoy', val: stats.capacity, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* ── Zone Summary ────────────────────────────────────────────────────── */}
      {zoneStats.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {zoneStats.map(z => (
            <div key={z.name} className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-sm font-bold text-white">{z.name}</span>
              <span className="text-xs text-zinc-500">{z.total} reservas</span>
              {z.pending > 0 && <span className="text-xs text-amber-400 font-bold">{z.pending} pendientes</span>}
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Date */}
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            placeholder="Buscar nombre, teléfono o código..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-orange-500/50 transition-colors appearance-none"
          >
            <option value="all">Todos los estados</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[80px_1fr_140px_100px_110px_160px_140px] gap-4 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          {['Código', 'Huésped', 'Zona · Mesa', 'Hora', 'Personas', 'Estado', 'Acciones'].map(h => (
            <span key={h} className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-600">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
            <UtensilsCrossed size={32} />
            <p className="text-sm">No hay reservas para los filtros seleccionados</p>
          </div>
        ) : (
          filtered.map(r => {
            const actions = nextActions(r)
            return (
              <div
                key={r.id}
                className="grid grid-cols-[80px_1fr_140px_100px_110px_160px_140px] gap-4 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center cursor-pointer group"
                onClick={() => setSelected(r)}
              >
                {/* Code */}
                <span className="text-orange-400 font-black text-sm tracking-widest">{r.confirmation_code}</span>

                {/* Guest */}
                <div>
                  <p className="text-white text-sm font-bold">{r.guest_name}</p>
                  <a
                    href={`https://wa.me/${r.guest_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-zinc-500 text-xs hover:text-green-400 transition-colors flex items-center gap-1 mt-0.5"
                  >
                    <Phone size={11} />{r.guest_phone}
                  </a>
                </div>

                {/* Zone · Table */}
                <div>
                  <p className="text-zinc-300 text-sm font-medium">{r.venue_zones?.name ?? '—'}</p>
                  <p className="text-zinc-500 text-xs">Mesa {r.venue_tables?.table_number ?? '—'}</p>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1.5 text-zinc-300 text-sm">
                  <Clock size={13} className="text-zinc-600" />
                  {r.time_slot}
                </div>

                {/* Party size */}
                <div className="flex items-center gap-1.5 text-zinc-300 text-sm">
                  <Users size={13} className="text-zinc-600" />
                  {r.party_size}
                </div>

                {/* Status */}
                <div onClick={e => e.stopPropagation()}>
                  <StatusBadge status={r.status} />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                  {actions.map(a => (
                    <ActionBtn
                      key={a.status}
                      label={a.label}
                      color={a.color}
                      loading={updating === r.id}
                      onClick={() => updateStatus(r.id, a.status)}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Detail Drawer ───────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="ml-auto relative w-full max-w-md h-full bg-[#0c0c0f] border-l border-white/5 flex flex-col overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Reserva</p>
                <p className="text-orange-400 text-2xl font-black tracking-widest">{selected.confirmation_code}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X size={16} className="text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 px-6 py-6 space-y-6">
              {/* Status */}
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Estado</p>
                <StatusBadge status={selected.status} />
              </div>

              {/* Guest info */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                <DetailRow label="Nombre" value={selected.guest_name} />
                <DetailRow label="Teléfono" value={
                  <a href={`https://wa.me/${selected.guest_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-400 hover:underline flex items-center gap-1.5">
                    <Phone size={13} />{selected.guest_phone}
                  </a>
                } />
              </div>

              {/* Reservation info */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                <DetailRow label="Fecha" value={fmtDate(selected.date)} />
                <DetailRow label="Hora" value={selected.time_slot} />
                <DetailRow label="Zona" value={selected.venue_zones?.name ?? '—'} />
                <DetailRow label="Mesa" value={`Mesa ${selected.venue_tables?.table_number ?? '—'} (máx. ${selected.venue_tables?.capacity_max ?? '—'})`} />
                <DetailRow label="Personas" value={`${selected.party_size}`} />
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Nota</p>
                  <p className="text-zinc-300 text-sm italic">"{selected.notes}"</p>
                </div>
              )}

              {/* Actions */}
              {nextActions(selected).length > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Cambiar Estado</p>
                  <div className="flex flex-wrap gap-2">
                    {nextActions(selected).map(a => (
                      <ActionBtn
                        key={a.status}
                        label={a.label}
                        color={`${a.color} px-4 py-2.5 text-sm`}
                        loading={updating === selected.id}
                        onClick={() => updateStatus(selected.id, a.status)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-zinc-500 text-xs font-semibold">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}
