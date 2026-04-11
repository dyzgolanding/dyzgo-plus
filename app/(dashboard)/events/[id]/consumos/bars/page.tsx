'use client'

import React, { use, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  GlassWater, Plus, X, Pencil, Trash2, ToggleLeft, ToggleRight,
  Loader2, Clock, Activity, CheckCircle2, Users, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface Bar {
  id: string
  name: string
  description: string | null
  is_active: boolean
  capacity_per_minute: number
  sort_order: number
}

interface BarWithQueue extends Bar {
  queued: number
  preparing: number
  delivered_today: number
  bartenders: { id: string; name: string; is_active: boolean }[]
}

interface QueueItem {
  id: string
  item_name: string
  status: string
  activated_at: string | null
  preparing_started_at: string | null
  user_name: string
}

export default function BarsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params)

  const [bars, setBars] = useState<BarWithQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBar, setSelectedBar] = useState<string | null>(null)
  const [liveQueue, setLiveQueue] = useState<QueueItem[]>([])
  const [queueLoading, setQueueLoading] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingBar, setEditingBar] = useState<Bar | null>(null)
  const [form, setForm] = useState({ name: '', description: '', capacity_per_minute: '4' })
  const [saving, setSaving] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBars = useCallback(async () => {
    try {
      const { data: barsData } = await supabase
        .from('bars')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order')

      if (!barsData) { setLoading(false); return }

      const today = new Date(); today.setHours(0, 0, 0, 0)

      const enriched = await Promise.all(barsData.map(async bar => {
        const [{ data: qItems }, { data: btStaff }] = await Promise.all([
          supabase.from('consumption_order_items').select('status, delivered_at').eq('bar_id', bar.id),
          supabase.from('event_staff').select('id, name, is_active').eq('bar_id', bar.id).eq('role', 'bartender'),
        ])

        return {
          ...bar,
          queued:          qItems?.filter(i => i.status === 'queued').length ?? 0,
          preparing:       qItems?.filter(i => i.status === 'preparing').length ?? 0,
          delivered_today: qItems?.filter(i => i.status === 'delivered' && i.delivered_at && new Date(i.delivered_at) >= today).length ?? 0,
          bartenders:      btStaff ?? [],
        }
      }))

      setBars(enriched)
    } catch (e) { console.error('[bars fetch]', e) } finally { setLoading(false) }
  }, [eventId])

  const fetchLiveQueue = useCallback(async (barId: string) => {
    setQueueLoading(true)
    try {
      const { data } = await supabase
        .from('consumption_order_items')
        .select(`
          id, item_name, status, activated_at, preparing_started_at,
          consumption_orders!inner(user_id, profiles(full_name, username))
        `)
        .eq('bar_id', barId)
        .in('status', ['queued', 'preparing'])
        .order('activated_at', { ascending: true })

      setLiveQueue((data || []).map((item: any) => ({
        id: item.id,
        item_name: item.item_name,
        status: item.status,
        activated_at: item.activated_at,
        preparing_started_at: item.preparing_started_at,
        user_name: item.consumption_orders?.profiles?.full_name
          || item.consumption_orders?.profiles?.username
          || 'Usuario',
      })))
    } catch (e) { console.error('[live queue]', e) } finally { setQueueLoading(false) }
  }, [])

  useEffect(() => {
    fetchBars()
  }, [fetchBars])

  useEffect(() => {
    if (!selectedBar) return
    fetchLiveQueue(selectedBar)

    const channel = supabase.channel(`bar_queue:${selectedBar}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_order_items', filter: `bar_id=eq.${selectedBar}` }, () => {
        fetchLiveQueue(selectedBar)
        fetchBars()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedBar, fetchLiveQueue, fetchBars])

  // ── Actions ────────────────────────────────────────────────────────────────

  const openNew = () => { setEditingBar(null); setForm({ name: '', description: '', capacity_per_minute: '4' }); setShowForm(true) }
  const openEdit = (bar: Bar) => { setEditingBar(bar); setForm({ name: bar.name, description: bar.description ?? '', capacity_per_minute: bar.capacity_per_minute.toString() }); setShowForm(true) }

  const save = async () => {
    if (!form.name.trim()) return toast.info('El nombre es requerido')
    const cap = parseInt(form.capacity_per_minute)
    if (isNaN(cap) || cap < 1) return toast.info('Capacidad mínima: 1 trago/min')

    setSaving(true)
    try {
      const payload = { name: form.name, description: form.description || null, capacity_per_minute: cap }
      if (editingBar) {
        const { error } = await supabase.from('bars').update(payload).eq('id', editingBar.id)
        if (error) throw error
        toast.success('Barra actualizada')
      } else {
        const { error } = await supabase.from('bars').insert({ ...payload, event_id: eventId, sort_order: bars.length })
        if (error) throw error
        toast.success('Barra creada')
      }
      setShowForm(false)
      fetchBars()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  const deleteBar = async (id: string) => {
    toast.warning('¿Eliminar esta barra? Los bartenders asignados quedarán sin barra.', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          await supabase.from('bars').delete().eq('id', id)
          if (selectedBar === id) setSelectedBar(null)
          fetchBars()
          toast.success('Barra eliminada.')
        }
      },
      cancel: { label: 'Cancelar', onClick: () => {} }
    })
  }

  const toggleBar = async (bar: Bar) => {
    await supabase.from('bars').update({ is_active: !bar.is_active }).eq('id', bar.id)
    fetchBars()
  }

  const elapsedMin = (dateStr: string | null) => {
    if (!dateStr) return 0
    return Math.round((Date.now() - new Date(dateStr).getTime()) / 60000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-violet-400" size={36} /></div>
  )

  return (
    <div className="space-y-8 animate-in fade-in">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <GlassWater className="text-violet-400" size={26} /> Gestión de Barras
          </h2>
          <p className="text-zinc-500 text-xs mt-1">Crea y gestiona las barras del evento. Asigna bartenders desde la sección Staff.</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-900/20">
          <Plus size={14} /> Nueva Barra
        </button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black">{editingBar ? 'Editar Barra' : 'Nueva Barra'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre (ej: Barra Principal)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 font-bold" />
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción (opcional)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500" />
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Capacidad estimada (tragos/min)</label>
                <input type="number" min={1} max={20} value={form.capacity_per_minute} onChange={e => setForm({ ...form, capacity_per_minute: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 font-bold" />
                <p className="text-zinc-600 text-[10px] mt-1 ml-1">Usado para calcular el ETA de la fila virtual</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl text-sm transition-all disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : (editingBar ? 'Guardar' : 'Crear Barra')}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white text-sm font-bold transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* BARS LIST */}
      {bars.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-white/10 rounded-2xl text-center">
          <GlassWater size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm font-bold">No hay barras configuradas</p>
          <p className="text-white/20 text-xs mt-1 max-w-xs mx-auto">Crea al menos una barra para que el sistema de colas funcione.</p>
          <button onClick={openNew} className="mt-4 px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-400 font-bold text-sm rounded-xl hover:bg-violet-600/30 transition-all">
            Crear primera barra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bars.map(bar => (
            <div key={bar.id} className={`rounded-2xl border transition-all cursor-pointer ${selectedBar === bar.id ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/10 bg-white/5 hover:border-white/20'} ${!bar.is_active ? 'opacity-50' : ''}`}
              onClick={() => setSelectedBar(selectedBar === bar.id ? null : bar.id)}>

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${bar.is_active ? 'bg-violet-500/10 border-violet-500/20' : 'bg-white/5 border-white/5'}`}>
                      <GlassWater size={18} className={bar.is_active ? 'text-violet-400' : 'text-white/20'} />
                    </div>
                    <div>
                      <h3 className="text-white font-black">{bar.name}</h3>
                      {bar.description && <p className="text-zinc-500 text-xs mt-0.5">{bar.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(bar)} className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Pencil size={14} /></button>
                    <button onClick={() => toggleBar(bar)} className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      {bar.is_active ? <ToggleRight size={14} className="text-emerald-400" /> : <ToggleLeft size={14} />}
                    </button>
                    <button onClick={() => deleteBar(bar.id)} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 text-center mb-3">
                  {[
                    { value: bar.queued, label: 'En Cola', color: 'text-amber-400' },
                    { value: bar.preparing, label: 'Prep.', color: 'text-orange-400' },
                    { value: bar.delivered_today, label: 'Hoy', color: 'text-emerald-400' },
                    { value: bar.capacity_per_minute, label: 'Tragos/min', color: 'text-blue-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-black/30 rounded-xl p-2">
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Bartenders */}
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Users size={12} />
                  {bar.bartenders.length === 0 ? (
                    <span className="text-amber-500/70">Sin bartenders asignados</span>
                  ) : (
                    <span>{bar.bartenders.filter(b => b.is_active).length}/{bar.bartenders.length} en turno</span>
                  )}
                </div>
              </div>

              {/* LIVE QUEUE (expandible) */}
              {selectedBar === bar.id && (
                <div className="border-t border-white/5 p-4" onClick={e => e.stopPropagation()}>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={12} /> Cola en vivo
                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] bg-[#00D15B]/10 text-[#00D15B] px-2 py-0.5 rounded-full border border-[#00D15B]/20 animate-pulse">● LIVE</span>
                  </p>
                  {queueLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-violet-400" size={20} /></div>
                  ) : liveQueue.length === 0 ? (
                    <p className="text-center text-white/20 text-xs py-6">Cola vacía — sin pedidos activos</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {liveQueue.map((item, idx) => (
                        <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${item.status === 'preparing' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/5 border-white/5'}`}>
                          <span className="text-white/20 font-black text-sm w-6 text-center">#{idx + 1}</span>
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">{item.item_name}</p>
                            <p className="text-zinc-500 text-xs">{item.user_name}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${item.status === 'preparing' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {item.status === 'preparing' ? 'Preparando' : 'En Cola'}
                            </span>
                            <p className="text-zinc-600 text-[10px] mt-1">
                              {item.status === 'preparing'
                                ? `${elapsedMin(item.preparing_started_at)} min prep.`
                                : `${elapsedMin(item.activated_at)} min esperando`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AVISO: bartenders sin barra */}
      {bars.length > 0 && bars.every(b => b.bartenders.length === 0) && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300/80 text-xs">Ninguna barra tiene bartenders asignados. Ve a <strong>Staff → Bartenders</strong> y asigna personal a cada barra.</p>
        </div>
      )}
    </div>
  )
}
