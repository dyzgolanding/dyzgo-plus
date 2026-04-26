'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sendCourtesyDrinks, type CourtesyDrinkItem } from '@/app/actions/send-courtesy-drinks'
import { toast } from 'sonner'
import {
  Gift, Search, Minus, Plus, Send, Wine,
  CheckCircle2, Clock, AlertCircle, User, RefreshCw, X, UserX,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string
  name: string
  price: number
  category_name: string | null
}

interface CourtesyOrder {
  id: string
  guest_name: string | null
  guest_email: string | null
  created_at: string
  items: { item_name: string; status: string }[]
}

interface FoundUser {
  id: string
  full_name: string
  email: string
  rut: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function orderStatus(items: { status: string }[]) {
  if (!items.length) return { label: 'Vacío',     color: 'text-zinc-500',   bg: 'bg-zinc-500/10 border-zinc-500/20',   Icon: AlertCircle  }
  const all = items.map(i => i.status)
  if (all.every(s => s === 'delivered')) return { label: 'Entregado', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle2 }
  if (all.every(s => s === 'inactive'))  return { label: 'Pendiente', color: 'text-zinc-400',    bg: 'bg-zinc-500/10 border-zinc-500/20',       Icon: Clock        }
  return { label: 'Activando', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', Icon: Clock }
}

function itemSummary(items: { item_name: string }[]) {
  const counts: Record<string, number> = {}
  items.forEach(i => { counts[i.item_name] = (counts[i.item_name] || 0) + 1 })
  return Object.entries(counts).map(([name, qty]) => `${qty}× ${name}`).join(', ')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CortesiasConsumosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params)

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders]       = useState<CourtesyOrder[]>([])
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)

  // Form state
  const [searchEmail, setSearchEmail] = useState('')
  const [searchRut, setSearchRut]     = useState('')
  const [guestName, setGuestName]     = useState('')
  const [foundUser, setFoundUser]     = useState<FoundUser | null>(null)
  const [notFound, setNotFound]       = useState(false)
  const [searching, setSearching]     = useState(false)
  const [selections, setSelections]   = useState<Record<string, number>>({})

  // Registry filter
  const [search, setSearch] = useState('')

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [{ data: items }, { data: rawOrders }] = await Promise.all([
        supabase
          .from('consumption_items')
          .select('id, name, price, consumption_categories(name)')
          .eq('event_id', eventId)
          .eq('is_available', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('consumption_orders')
          .select('id, guest_name, guest_email, created_at, consumption_order_items(item_name, status)')
          .eq('event_id', eventId)
          .eq('order_type', 'courtesy')
          .order('created_at', { ascending: false }),
      ])

      setMenuItems(
        (items ?? []).map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          category_name: (i.consumption_categories as any)?.name ?? null,
        }))
      )
      setOrders(
        (rawOrders ?? []).map(o => ({
          id: o.id,
          guest_name: o.guest_name,
          guest_email: o.guest_email,
          created_at: o.created_at,
          items: (o.consumption_order_items as any[]) ?? [],
        }))
      )
    } catch (e) {
      console.error('[cortesias consumos]', e)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── User search ────────────────────────────────────────────────────────────

  const resetSearch = () => {
    setFoundUser(null)
    setNotFound(false)
    setGuestName('')
  }

  const handleSearch = async (by: 'email' | 'rut') => {
    const value = by === 'email' ? searchEmail.trim() : searchRut.trim()
    if (!value) return

    setSearching(true)
    setFoundUser(null)
    setNotFound(false)

    try {
      const query = supabase.from('profiles').select('id, full_name, email, rut')
      const { data } = by === 'email'
        ? await query.eq('email', value.toLowerCase()).maybeSingle()
        : await query.eq('rut', value.toUpperCase()).maybeSingle()

      if (data) {
        setFoundUser(data as FoundUser)
        setGuestName(data.full_name ?? '')
        // Auto-fill the other field
        if (by === 'email' && data.rut)   setSearchRut(data.rut)
        if (by === 'rut'   && data.email) setSearchEmail(data.email)
      } else {
        setNotFound(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
    }
  }

  // ── Qty stepper ────────────────────────────────────────────────────────────

  const setQty = (itemId: string, delta: number) => {
    setSelections(prev => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta)
      if (next === 0) { const { [itemId]: _, ...rest } = prev; return rest }
      return { ...prev, [itemId]: next }
    })
  }

  const totalItems = Object.values(selections).reduce((a, b) => a + b, 0)

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!foundUser)         return toast.error('Buscá al destinatario primero.')
    if (!guestName.trim())  return toast.error('El nombre es obligatorio.')
    if (totalItems === 0)   return toast.error('Seleccioná al menos un ítem.')

    const items: CourtesyDrinkItem[] = Object.entries(selections).map(([item_id, quantity]) => ({ item_id, quantity }))

    setSending(true)
    const toastId = toast.loading('Enviando cortesía...')

    try {
      const result = await sendCourtesyDrinks(eventId, foundUser.email, guestName, items)
      if (!result.success) throw new Error(result.error)

      toast.success(
        `${result.total_items} bebida${result.total_items !== 1 ? 's' : ''} enviada${result.total_items !== 1 ? 's' : ''} a ${guestName} · Notificación enviada en DyzGO`,
        { id: toastId }
      )

      // Reset form
      setSearchEmail('')
      setSearchRut('')
      setGuestName('')
      setFoundUser(null)
      setNotFound(false)
      setSelections({})
      await fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido', { id: toastId })
    } finally {
      setSending(false)
    }
  }

  // ── Filtered registry ──────────────────────────────────────────────────────

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase()
    return !q || o.guest_name?.toLowerCase().includes(q) || o.guest_email?.toLowerCase().includes(q) || o.items.some(i => i.item_name.toLowerCase().includes(q))
  })

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <Wine className="animate-bounce text-pink-400" size={40} />
    </div>
  )

  const canSend = !!foundUser && totalItems > 0 && !!guestName.trim()

  return (
    <div className="space-y-10 animate-in fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Gift className="text-pink-400" size={28} /> Cortesías de Consumo
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Enviá bebidas gratuitas a asistentes con cuenta en DyzGO. El receptor las activa desde el app.
          </p>
        </div>
        <button onClick={fetchData} className="p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── FORM ─────────────────────────────────────────────────────────── */}
      {menuItems.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-2xl space-y-3">
          <Wine size={36} className="mx-auto text-white/20" />
          <p className="text-white/40 font-bold">No hay ítems disponibles en la carta</p>
          <p className="text-zinc-600 text-sm">Crea bebidas en la pestaña <span className="text-white/50 font-bold">Carta</span> antes de enviar cortesías.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT: Recipient */}
          <div className="space-y-5">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Destinatario</p>

            {/* Email search */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400">Buscar por email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={searchEmail}
                  onChange={e => { setSearchEmail(e.target.value); resetSearch() }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch('email')}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-pink-500/50 transition-colors"
                />
                <button
                  onClick={() => handleSearch('email')}
                  disabled={searching || !searchEmail.trim()}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all disabled:opacity-40"
                >
                  {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>

            {/* RUT search */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400">Buscar por RUT</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="12345678-9"
                  value={searchRut}
                  onChange={e => {
                    const clean = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9)
                    setSearchRut(clean.length > 1 ? clean.slice(0, -1) + '-' + clean.slice(-1) : clean)
                    resetSearch()
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch('rut')}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-pink-500/50 transition-colors"
                />
                <button
                  onClick={() => handleSearch('rut')}
                  disabled={searching || !searchRut.trim()}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all disabled:opacity-40"
                >
                  {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>

            {/* User status */}
            {foundUser && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                <User size={13} />
                <span className="flex-1">{foundUser.full_name} · {foundUser.email}{foundUser.rut ? ` · ${foundUser.rut}` : ''}</span>
              </div>
            )}

            {notFound && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border bg-red-500/10 border-red-500/20 text-red-400">
                <UserX size={13} />
                Usuario no encontrado. Solo se puede enviar cortesías a personas con cuenta en DyzGO.
              </div>
            )}

            {/* Name (editable, pre-filled) */}
            {foundUser && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Nombre del destinatario <span className="text-pink-500">*</span></label>
                <input
                  type="text"
                  placeholder="Nombre y apellido"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
            )}

            {/* Summary + Send */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-bold">Total seleccionado</span>
                <span className="text-white font-black">
                  {totalItems === 0 ? '—' : `${totalItems} ítem${totalItems !== 1 ? 's' : ''} · $0`}
                </span>
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !canSend}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 hover:text-pink-300"
              >
                {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                Enviar cortesía
              </button>
              {!foundUser && (
                <p className="text-center text-[11px] text-zinc-600">Buscá al destinatario por email o RUT para habilitar el envío</p>
              )}
            </div>
          </div>

          {/* RIGHT: Item selector */}
          <div className="space-y-5">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Seleccionar bebidas</p>
            <div className="rounded-2xl border border-white/8 overflow-hidden divide-y divide-white/5">
              {menuItems.map(item => {
                const qty = selections[item.id] ?? 0
                return (
                  <div key={item.id} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.name}</p>
                      {item.category_name && (
                        <p className="text-[11px] text-zinc-600 font-medium">{item.category_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setQty(item.id, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-white font-black text-sm">{qty}</span>
                      <button
                        onClick={() => setQty(item.id, +1)}
                        className="w-8 h-8 rounded-lg border border-pink-500/30 bg-pink-500/10 flex items-center justify-center text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/50 transition-all"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTRY ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Gift size={12} /> Registro · {orders.length} cortesía{orders.length !== 1 ? 's' : ''} enviada{orders.length !== 1 ? 's' : ''}
          </p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 outline-none focus:border-pink-500/30 w-48 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-white/8 rounded-2xl">
            <Gift size={32} className="mx-auto text-white/10 mb-3" />
            <p className="text-white/30 text-sm font-bold">
              {orders.length === 0 ? 'Aún no enviaste ninguna cortesía' : 'Sin resultados para tu búsqueda'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-4 px-5 py-3 bg-white/[0.03] border-b border-white/8">
              {['Destinatario', 'Email', 'Bebidas', 'Estado'].map(h => (
                <p key={h} className="text-[10px] font-black text-white/30 uppercase tracking-widest">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-white/5">
              {filteredOrders.map(order => {
                const st = orderStatus(order.items)
                const date = new Date(order.created_at).toLocaleDateString('es-CL', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })
                return (
                  <div key={order.id} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white truncate">{order.guest_name ?? '—'}</p>
                      <p className="text-[11px] text-zinc-600">{date}</p>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{order.guest_email ?? '—'}</p>
                    <p className="text-xs text-zinc-400 truncate">{order.items.length === 0 ? '—' : itemSummary(order.items)}</p>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider shrink-0 ${st.bg} ${st.color}`}>
                      <st.Icon size={10} />
                      {st.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
