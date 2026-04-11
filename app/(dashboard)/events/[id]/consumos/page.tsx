'use client'

import React, { use, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Wine, TrendingUp, Clock, GlassWater, CheckCircle2, AlertCircle,
  ShoppingCart, Activity, Users, DollarSign, BarChart3, RefreshCw
} from 'lucide-react'

interface OverviewStats {
  total_revenue: number
  total_orders: number
  total_items_sold: number
  total_items_delivered: number
  total_items_queued: number
  total_items_preparing: number
  total_items_inactive: number
  avg_prep_time_min: number
  top_item_name: string | null
  top_item_count: number
  active_bars: number
  total_bars: number
}

interface QueueSummary {
  bar_id: string
  bar_name: string
  queued: number
  preparing: number
  delivered_today: number
  is_active: boolean
}

export default function ConsumosOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params)

  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [queues, setQueues] = useState<QueueSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchStats = useCallback(async () => {
    try {
      // Órdenes pagadas
      const { data: orders } = await supabase
        .from('consumption_orders')
        .select('id, total_amount')
        .eq('event_id', eventId)
        .eq('status', 'paid')

      const totalRevenue = orders?.reduce((s, o) => s + o.total_amount, 0) ?? 0
      const totalOrders = orders?.length ?? 0

      // Ítems por estado
      const { data: items } = await supabase
        .from('consumption_order_items')
        .select('id, status, item_name, delivering_at:delivered_at, preparing_started_at, activated_at, consumption_orders!inner(event_id)')
        .eq('consumption_orders.event_id', eventId)

      const totalItems = items?.length ?? 0
      const inactive   = items?.filter(i => i.status === 'inactive').length   ?? 0
      const queued     = items?.filter(i => i.status === 'queued').length     ?? 0
      const preparing  = items?.filter(i => i.status === 'preparing').length  ?? 0
      const delivered  = items?.filter(i => i.status === 'delivered').length  ?? 0

      // Ítem más vendido
      const itemCount: Record<string, number> = {}
      items?.forEach(i => { itemCount[i.item_name] = (itemCount[i.item_name] || 0) + 1 })
      const topEntry = Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0]

      // Tiempo promedio de preparación (de preparing_started_at a... no hay "ready", así que estimamos desde activated_at)
      const prepTimes = items
        ?.filter(i => i.status === 'delivered' && i.preparing_started_at && (i as any).delivering_at)
        .map(i => (new Date((i as any).delivering_at).getTime() - new Date(i.preparing_started_at!).getTime()) / 60000)
      const avgPrep = prepTimes && prepTimes.length > 0
        ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
        : 0

      // Barras
      const { data: barsData } = await supabase
        .from('bars')
        .select('id, name, is_active')
        .eq('event_id', eventId)

      setStats({
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_items_sold: totalItems,
        total_items_delivered: delivered,
        total_items_queued: queued,
        total_items_preparing: preparing,
        total_items_inactive: inactive,
        avg_prep_time_min: avgPrep,
        top_item_name: topEntry?.[0] ?? null,
        top_item_count: topEntry?.[1] ?? 0,
        active_bars: barsData?.filter(b => b.is_active).length ?? 0,
        total_bars: barsData?.length ?? 0,
      })

      // Cola por barra
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const queueSummaries: QueueSummary[] = await Promise.all(
        (barsData || []).map(async bar => {
          const { data: barItems } = await supabase
            .from('consumption_order_items')
            .select('status, delivered_at')
            .eq('bar_id', bar.id)

          return {
            bar_id: bar.id,
            bar_name: bar.name,
            queued:          barItems?.filter(i => i.status === 'queued').length ?? 0,
            preparing:       barItems?.filter(i => i.status === 'preparing').length ?? 0,
            delivered_today: barItems?.filter(i => i.status === 'delivered' && i.delivered_at && new Date(i.delivered_at) >= today).length ?? 0,
            is_active:       bar.is_active,
          }
        })
      )
      setQueues(queueSummaries)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('[consumos overview]', e)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchStats()

    const channel = supabase.channel(`consumos_overview:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_order_items' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_orders',      filter: `event_id=eq.${eventId}` }, () => fetchStats())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, fetchStats])

  const fmtCLP = (n: number) => `$${n.toLocaleString('es-CL')}`

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <Wine className="animate-bounce text-violet-400" size={40} />
    </div>
  )

  const topCards = [
    { label: 'Revenue Total', value: fmtCLP(stats?.total_revenue ?? 0), icon: <DollarSign size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Órdenes Pagadas', value: stats?.total_orders ?? 0, icon: <ShoppingCart size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Bebidas Vendidas', value: stats?.total_items_sold ?? 0, icon: <Wine size={20} />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Entregadas', value: stats?.total_items_delivered ?? 0, icon: <CheckCircle2 size={20} />, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'En Cola', value: stats?.total_items_queued ?? 0, icon: <Clock size={20} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Preparando', value: stats?.total_items_preparing ?? 0, icon: <Activity size={20} />, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    { label: 'Sin Activar', value: stats?.total_items_inactive ?? 0, icon: <AlertCircle size={20} />, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
    { label: 'Barras Activas', value: `${stats?.active_bars ?? 0} / ${stats?.total_bars ?? 0}`, icon: <GlassWater size={20} />, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Wine className="text-violet-400" size={28} /> Overview Consumos
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Actualizado: {lastUpdated.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-[#00D15B]/10 text-[#00D15B] px-2 py-0.5 rounded-full border border-[#00D15B]/20 animate-pulse font-black tracking-wider">● LIVE</span>
          </p>
        </div>
        <button onClick={fetchStats} className="p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topCards.map(card => (
          <div key={card.label} className={`p-5 rounded-2xl border ${card.bg} backdrop-blur-sm`}>
            <div className={`${card.color} mb-3`}>{card.icon}</div>
            <p className="text-2xl font-black text-white tracking-tight">{card.value}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Highlight stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Ítem Más Pedido</p>
          {stats?.top_item_name ? (
            <>
              <p className="text-xl font-black text-white">{stats.top_item_name}</p>
              <p className="text-violet-400 text-sm font-bold mt-1">{stats.top_item_count} unidades</p>
            </>
          ) : (
            <p className="text-white/30 text-sm">Sin datos aún</p>
          )}
        </div>
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Tiempo Promedio Prep.</p>
          <p className="text-4xl font-black text-white tracking-tighter">{stats?.avg_prep_time_min ?? 0}<span className="text-lg text-white/40 ml-1">min</span></p>
          <p className="text-zinc-500 text-xs mt-1">Desde preparando hasta entregado</p>
        </div>
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Tasa de Activación</p>
          <p className="text-4xl font-black text-white tracking-tighter">
            {stats && stats.total_items_sold > 0
              ? Math.round(((stats.total_items_sold - stats.total_items_inactive) / stats.total_items_sold) * 100)
              : 0}
            <span className="text-lg text-white/40 ml-1">%</span>
          </p>
          <p className="text-zinc-500 text-xs mt-1">Bebidas compradas que entraron a cola</p>
        </div>
      </div>

      {/* Cola en vivo por barra */}
      <div>
        <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart3 size={14} /> Estado de Barras en Vivo
        </h3>
        {queues.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-2xl">
            <p className="text-white/30 text-sm">No hay barras configuradas. Créalas en la pestaña <strong className="text-white/50">Barras</strong>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queues.map(q => (
              <div key={q.bar_id} className={`p-5 rounded-2xl border ${q.is_active ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${q.is_active ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-white/5 border border-white/5'}`}>
                      <GlassWater size={16} className={q.is_active ? 'text-violet-400' : 'text-white/20'} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{q.bar_name}</p>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${q.is_active ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {q.is_active ? '● Activa' : '○ Inactiva'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-xl font-black text-amber-400">{q.queued}</p>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-1">En Cola</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-xl font-black text-orange-400">{q.preparing}</p>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-1">Preparando</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-xl font-black text-emerald-400">{q.delivered_today}</p>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-1">Entregados</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
