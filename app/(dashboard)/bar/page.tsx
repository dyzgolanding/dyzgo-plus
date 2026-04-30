'use client'
import { supabase } from '@/lib/supabase'
import {
  AlertCircle, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Edit3, Filter, Loader2, MapPin, MessageSquare, Phone, Plus, RefreshCw, Save,
  Search, UtensilsCrossed, Users, X, XCircle,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reservation {
  id: string
  date: string
  arrival_time: string | null
  end_time: string | null
  party_size: number
  guest_name: string
  guest_phone: string
  guest_age: number | null
  reunion_type: string | null
  status: string
  confirmation_code: string
  notes: string | null
  created_at: string
  venue_zones: { id: string; name: string } | null
}

interface Zone {
  id: string
  name: string
  is_vip: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pendiente',      color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30',  icon: <AlertCircle size={13} /> },
  confirmed: { label: 'Confirmada',     color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30',  icon: <CheckCircle2 size={13} /> },
  cancelled: { label: 'Cancelada',      color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30',    icon: <XCircle size={13} /> },
  seated:    { label: 'En local',       color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', icon: <UtensilsCrossed size={13} /> },
  completed: { label: 'Completada',     color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', icon: <Check size={13} /> },
  no_show:   { label: 'No se presentó', color: 'text-zinc-400',   bg: 'bg-zinc-400/10',   border: 'border-zinc-400/30',   icon: <X size={13} /> },
}

const ALL_STATUSES = Object.keys(STATUS_CFG)

const REUNION_LABELS: Record<string, string> = {
  familiar: 'Familiar', cumpleanos: 'Cumpleaños', laboral: 'Laboral', otra: 'Otra',
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function shiftDate(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtDateShort(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-').map(Number)
  const today = todayISO()
  if (d === today) return 'Hoy'
  if (d === shiftDate(today, 1)) return 'Mañana'
  if (d === shiftDate(today, -1)) return 'Ayer'
  return `${DAYS[new Date(y, m-1, day).getDay()]} ${day} ${MONTHS[m-1]}`
}

function fmtDateFull(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-').map(Number)
  return `${DAYS[new Date(y, m-1, day).getDay()]} ${day} de ${MONTHS[m-1]} ${y}`
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-pink-500/40 transition-colors placeholder:text-zinc-600'

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

function ActionBtn({ label, color, onClick, loading }: { label: string; color: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 ${color}`}>
      {loading ? <Loader2 size={11} className="animate-spin inline" /> : label}
    </button>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-zinc-500 text-xs font-semibold shrink-0">{label}</span>
      <span className="text-white text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function AddField({ label, children, span }: { label: string; children: React.ReactNode; span?: string }) {
  return (
    <div className={span ?? ''}>
      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [noVenue, setNoVenue] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState(todayISO())
  const [allDates, setAllDates] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, seated: 0, capacity: 0 })

  // Drawer
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [notesVal, setNotesVal] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // New reservation alert (realtime)
  const [newAlert, setNewAlert] = useState(false)

  // Manual add modal
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    guest_name: '', guest_phone: '', guest_age: '', party_size: '2',
    zone_id: '', date: todayISO(), arrival_time: '21:00', end_time: '00:00',
    reunion_type: 'familiar', notes: '',
  })
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => { bootstrap() }, [])
  useEffect(() => { if (venueId) fetchReservations() }, [venueId, dateFilter, allDates])

  // Realtime
  useEffect(() => {
    if (!venueId) return
    const channel = supabase.channel('bar-reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_reservations', filter: `venue_id=eq.${venueId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setNewAlert(true)
          fetchReservations(true)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [venueId])

  const bootstrap = async () => {
    const { data: venue } = await supabase.from('bar_venues').select('id').eq('name', 'Club Gordos').single()
    if (!venue) { setNoVenue(true); setLoading(false); return }
    setVenueId(venue.id)
    const { data: zoneData } = await supabase
      .from('venue_zones').select('id, name, is_vip')
      .eq('venue_id', venue.id).eq('is_active', true).order('sort_order')
    setZones((zoneData ?? []) as Zone[])
  }

  const fetchReservations = useCallback(async (silent = false) => {
    if (!venueId) return
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      let q = supabase
        .from('table_reservations')
        .select('*, venue_zones(id, name)')
        .eq('venue_id', venueId)
        .order('arrival_time', { ascending: true })
        .order('created_at', { ascending: true })
      if (!allDates) q = q.eq('date', dateFilter)
      const { data } = await q
      const rows = (data ?? []) as Reservation[]
      setReservations(rows)
      setStats({
        total: rows.length,
        pending: rows.filter(r => r.status === 'pending').length,
        confirmed: rows.filter(r => r.status === 'confirmed').length,
        seated: rows.filter(r => r.status === 'seated').length,
        capacity: rows.filter(r => !['cancelled','no_show'].includes(r.status)).reduce((s, r) => s + r.party_size, 0),
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [venueId, dateFilter, allDates])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      await supabase.from('table_reservations').update({ status: newStatus }).eq('id', id)
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
      fetchReservations(true)
    } finally {
      setUpdating(null)
    }
  }

  const saveNotes = async () => {
    if (!selected) return
    setSavingNotes(true)
    await supabase.from('table_reservations').update({ notes: notesVal }).eq('id', selected.id)
    setReservations(prev => prev.map(r => r.id === selected.id ? { ...r, notes: notesVal } : r))
    setSelected(prev => prev ? { ...prev, notes: notesVal } : null)
    setSavingNotes(false)
  }

  const submitManual = async () => {
    if (!venueId) return
    setAddLoading(true)
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      await supabase.from('table_reservations').insert({
        venue_id: venueId,
        zone_id: addForm.zone_id || null,
        date: addForm.date,
        arrival_time: addForm.arrival_time || null,
        end_time: addForm.end_time || null,
        party_size: parseInt(addForm.party_size) || 1,
        guest_name: addForm.guest_name.trim(),
        guest_phone: addForm.guest_phone.trim(),
        guest_age: parseInt(addForm.guest_age) || null,
        reunion_type: addForm.reunion_type || null,
        notes: addForm.notes.trim() || null,
        status: 'confirmed',
        confirmation_code: code,
      })
      setShowAdd(false)
      setAddForm({ guest_name: '', guest_phone: '', guest_age: '', party_size: '2', zone_id: '', date: todayISO(), arrival_time: '21:00', end_time: '00:00', reunion_type: 'familiar', notes: '' })
      fetchReservations(true)
    } finally {
      setAddLoading(false)
    }
  }

  const nextActions = (r: Reservation) => {
    switch (r.status) {
      case 'pending':   return [
        { label: '✓ Confirmar', status: 'confirmed', color: 'bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/30' },
        { label: '✕ Cancelar',  status: 'cancelled', color: 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30' },
      ]
      case 'confirmed': return [
        { label: '↑ En local',  status: 'seated',    color: 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/30' },
        { label: '✕ Cancelar',  status: 'cancelled', color: 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30' },
      ]
      case 'seated':    return [
        { label: '✓ Completada',    status: 'completed', color: 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/30' },
        { label: 'No se presentó', status: 'no_show',   color: 'bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25 border border-zinc-500/30' },
      ]
      default: return []
    }
  }

  const waLink = (r: Reservation) => {
    const phone = r.guest_phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hola ${r.guest_name.split(' ')[0]} 👋, confirmamos tu reserva en Club Gordos:\n\n` +
      `📅 ${fmtDateFull(r.date)}\n` +
      `🕐 ${r.arrival_time ?? ''}${r.end_time ? ` → ${r.end_time}` : ''}\n` +
      `👥 ${r.party_size} personas\n` +
      `📍 ${r.venue_zones?.name ?? 'Club Gordos'}\n` +
      `🔑 Código: ${r.confirmation_code}\n\n` +
      `Recuerda traer carnet físico y avisarnos si cambia el número de personas. ¡Nos vemos! 🔥`
    )
    return `https://wa.me/${phone}?text=${msg}`
  }

  const filtered = reservations.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q || r.guest_name.toLowerCase().includes(q) || r.guest_phone.includes(q) || r.confirmation_code.toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || r.status === statusFilter
    const matchZ = zoneFilter === 'all' || r.venue_zones?.id === zoneFilter
    return matchQ && matchS && matchZ
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  if (noVenue) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-zinc-600">
      <UtensilsCrossed size={40} />
      <p className="text-sm">No se encontró el venue "Club Gordos" en la base de datos.</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-pink-400" />
            </span>
            Club Gordos — Reservas
          </h1>
          <p className="text-zinc-500 text-sm mt-1 ml-12">Bar · Vitacura · Gestión de mesas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {newAlert && (
            <button onClick={() => { setNewAlert(false); fetchReservations(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/15 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm font-bold transition-all animate-pulse">
              <AlertCircle size={14} />Nueva reserva entrante
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500/15 hover:bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-400 text-sm font-bold transition-all">
            <Plus size={14} />Agregar manual
          </button>
          <button onClick={() => fetchReservations(true)} disabled={refreshing}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all">
            <RefreshCw size={14} className={`text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total reservas', val: stats.total,     color: 'text-white',        dim: 'bg-white/[0.03]' },
          { label: 'Pendientes',     val: stats.pending,   color: 'text-amber-400',    dim: 'bg-amber-400/[0.06]' },
          { label: 'Confirmadas',    val: stats.confirmed, color: 'text-green-400',    dim: 'bg-green-400/[0.06]' },
          { label: 'En local',       val: stats.seated,    color: 'text-orange-400',   dim: 'bg-orange-400/[0.06]' },
          { label: 'Personas hoy',   val: stats.capacity,  color: 'text-pink-400',     dim: 'bg-pink-400/[0.06]' },
        ].map(s => (
          <div key={s.label} className={`${s.dim} border border-white/5 rounded-2xl p-4`}>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* ── Date Nav ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {!allDates && (
          <>
            <button onClick={() => setDateFilter(d => shiftDate(d, -1))}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
              <ChevronLeft size={16} className="text-zinc-400" />
            </button>
            <div className="relative">
              <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input type="date" value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-pink-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <button onClick={() => setDateFilter(d => shiftDate(d, 1))}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
              <ChevronRight size={16} className="text-zinc-400" />
            </button>
            {dateFilter !== todayISO() && (
              <button onClick={() => setDateFilter(todayISO())}
                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 text-xs font-bold transition-all">
                Hoy
              </button>
            )}
            <span className="text-zinc-600 text-sm font-medium">{fmtDateShort(dateFilter)}</span>
          </>
        )}
        <button onClick={() => setAllDates(v => !v)}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${allDates ? 'bg-pink-500/15 text-pink-400 border-pink-500/30' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}`}>
          {allDates ? '← Volver a filtro por fecha' : 'Ver todas las fechas'}
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input placeholder="Nombre, teléfono o código..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-pink-500/50 transition-colors placeholder:text-zinc-600"
          />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-pink-500/50 transition-colors appearance-none">
            <option value="all">Todos los estados</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
        {zones.length > 0 && (
          <div className="relative">
            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-pink-500/50 transition-colors appearance-none">
              <option value="all">Todas las zonas</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}{z.is_vip ? ' ★' : ''}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[90px_1fr_140px_130px_70px_150px_160px] gap-4 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          {['Código','Huésped','Zona · Ocasión','Horario','Pax','Estado','Acciones'].map(h => (
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
            <p className="text-sm">Sin reservas para los filtros seleccionados</p>
          </div>
        ) : filtered.map(r => {
          const actions = nextActions(r)
          return (
            <div key={r.id}
              className="grid grid-cols-[90px_1fr_140px_130px_70px_150px_160px] gap-4 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center cursor-pointer"
              onClick={() => { setSelected(r); setNotesVal(r.notes ?? '') }}>

              <span className="text-pink-400 font-black text-sm tracking-widest">{r.confirmation_code}</span>

              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">
                  {r.guest_name}
                  {r.guest_age ? <span className="text-zinc-500 font-normal text-xs ml-1.5">{r.guest_age}a</span> : null}
                </p>
                <a href={`https://wa.me/${r.guest_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-zinc-500 text-xs hover:text-green-400 transition-colors flex items-center gap-1 mt-0.5">
                  <Phone size={10} />{r.guest_phone}
                </a>
              </div>

              <div>
                <p className="text-zinc-300 text-sm font-medium">{r.venue_zones?.name ?? '—'}</p>
                {r.reunion_type && (
                  <p className="text-zinc-500 text-xs">{REUNION_LABELS[r.reunion_type] ?? r.reunion_type}</p>
                )}
              </div>

              <div className="text-zinc-300 text-sm flex items-center gap-1">
                <Clock size={11} className="text-zinc-600 shrink-0" />
                <span>{r.arrival_time ?? '—'}{r.end_time ? <span className="text-zinc-500"> →{r.end_time}</span> : ''}</span>
              </div>

              <div className="flex items-center gap-1 text-zinc-300 text-sm">
                <Users size={11} className="text-zinc-600" />{r.party_size}
              </div>

              <div onClick={e => e.stopPropagation()}>
                <StatusBadge status={r.status} />
              </div>

              <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                {actions.map(a => (
                  <ActionBtn key={a.status} label={a.label} color={a.color}
                    loading={updating === r.id} onClick={() => updateStatus(r.id, a.status)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="ml-auto relative w-full max-w-md h-full bg-[#0c0c0f] border-l border-white/5 flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Reserva</p>
                <p className="text-pink-400 text-2xl font-black tracking-widest">{selected.confirmation_code}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={waLink(selected)} target="_blank" rel="noreferrer" title="Enviar confirmación por WhatsApp"
                  className="w-9 h-9 rounded-full bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 flex items-center justify-center transition-colors">
                  <MessageSquare size={15} className="text-green-400" />
                </a>
                <button onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <X size={16} className="text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

              {/* Status + date */}
              <div className="flex items-center justify-between">
                <StatusBadge status={selected.status} />
                <span className="text-zinc-600 text-xs">{new Date(selected.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>

              {/* Cliente */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cliente</p>
                <DetailRow label="Nombre" value={selected.guest_name} />
                <DetailRow label="Teléfono" value={
                  <a href={`https://wa.me/${selected.guest_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                    className="text-green-400 hover:underline flex items-center gap-1.5">
                    <Phone size={12} />{selected.guest_phone}
                  </a>
                } />
                {selected.guest_age != null && <DetailRow label="Edad" value={`${selected.guest_age} años`} />}
              </div>

              {/* Reserva */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Detalles</p>
                <DetailRow label="Fecha" value={fmtDateFull(selected.date)} />
                <DetailRow label="Llegada" value={selected.arrival_time ?? '—'} />
                {selected.end_time && <DetailRow label="Hasta" value={selected.end_time} />}
                <DetailRow label="Zona" value={selected.venue_zones?.name ?? '—'} />
                <DetailRow label="Personas" value={`${selected.party_size}`} />
                {selected.reunion_type && (
                  <DetailRow label="Ocasión" value={REUNION_LABELS[selected.reunion_type] ?? selected.reunion_type} />
                )}
              </div>

              {/* Notas internas */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Edit3 size={11} />Notas internas
                </p>
                <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)}
                  placeholder="Agregar nota del staff (no visible para el cliente)..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none outline-none focus:border-pink-500/40 placeholder:text-zinc-600 transition-colors"
                />
                {notesVal !== (selected.notes ?? '') && (
                  <button onClick={saveNotes} disabled={savingNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/15 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg text-pink-400 text-xs font-bold transition-all disabled:opacity-40">
                    {savingNotes ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    Guardar nota
                  </button>
                )}
              </div>

              {/* Cambiar estado */}
              {nextActions(selected).length > 0 && (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cambiar estado</p>
                  <div className="flex flex-wrap gap-2">
                    {nextActions(selected).map(a => (
                      <ActionBtn key={a.status} label={a.label}
                        color={`${a.color} px-4 py-2.5 text-sm`}
                        loading={updating === selected.id}
                        onClick={() => updateStatus(selected.id, a.status)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Add Modal ───────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#0c0c0f] border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#0c0c0f] z-10">
              <div>
                <p className="text-white font-black text-lg">Nueva reserva manual</p>
                <p className="text-zinc-500 text-xs mt-0.5">Creada por staff · se confirma directamente</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X size={16} className="text-zinc-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <AddField label="Nombre y apellido" span="col-span-2">
                  <input value={addForm.guest_name} onChange={e => setAddForm(f => ({...f, guest_name: e.target.value}))}
                    placeholder="Juan Pérez" className={inputCls} />
                </AddField>
                <AddField label="Teléfono">
                  <input value={addForm.guest_phone} onChange={e => setAddForm(f => ({...f, guest_phone: e.target.value}))}
                    placeholder="+56 9 XXXX XXXX" className={inputCls} />
                </AddField>
                <AddField label="Edad">
                  <input value={addForm.guest_age} onChange={e => setAddForm(f => ({...f, guest_age: e.target.value}))}
                    placeholder="25" type="number" min="18" className={inputCls} />
                </AddField>
                <AddField label="Fecha">
                  <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({...f, date: e.target.value}))}
                    className={`${inputCls} [color-scheme:dark]`} />
                </AddField>
                <AddField label="Personas">
                  <input value={addForm.party_size} onChange={e => setAddForm(f => ({...f, party_size: e.target.value}))}
                    type="number" min="1" max="30" className={inputCls} />
                </AddField>
                <AddField label="Llegada">
                  <input value={addForm.arrival_time} onChange={e => setAddForm(f => ({...f, arrival_time: e.target.value}))}
                    placeholder="21:00" className={inputCls} />
                </AddField>
                <AddField label="Hasta">
                  <input value={addForm.end_time} onChange={e => setAddForm(f => ({...f, end_time: e.target.value}))}
                    placeholder="00:00" className={inputCls} />
                </AddField>
                <AddField label="Zona" span="col-span-2">
                  <select value={addForm.zone_id} onChange={e => setAddForm(f => ({...f, zone_id: e.target.value}))}
                    className={inputCls}>
                    <option value="">Sin zona específica</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}{z.is_vip ? ' ★ VIP' : ''}</option>)}
                  </select>
                </AddField>
                <AddField label="Tipo de reunión" span="col-span-2">
                  <select value={addForm.reunion_type} onChange={e => setAddForm(f => ({...f, reunion_type: e.target.value}))}
                    className={inputCls}>
                    <option value="familiar">Familiar</option>
                    <option value="cumpleanos">Cumpleaños</option>
                    <option value="laboral">Laboral</option>
                    <option value="otra">Otra</option>
                  </select>
                </AddField>
                <AddField label="Nota interna" span="col-span-2">
                  <textarea value={addForm.notes} onChange={e => setAddForm(f => ({...f, notes: e.target.value}))}
                    placeholder="Ej: Llamó directamente, mesa preferida en terraza..." rows={2}
                    className={`${inputCls} resize-none`} />
                </AddField>
              </div>
              <button onClick={submitManual}
                disabled={addLoading || !addForm.guest_name.trim() || !addForm.guest_phone.trim()}
                className="w-full mt-5 py-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-400 font-black text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {addLoading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Crear reserva confirmada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
