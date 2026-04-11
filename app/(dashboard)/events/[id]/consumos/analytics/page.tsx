'use client'

import React, { use, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart3, TrendingUp, Clock, DollarSign, Wine, CheckCircle2,
  AlertCircle, Activity, Users, Timer, Award, Loader2, RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  // Revenue
  total_revenue: number
  avg_order_value: number
  revenue_by_item: { name: string; revenue: number; count: number }[]

  // Volume
  total_orders: number
  total_items: number
  total_delivered: number
  total_expired: number
  activation_rate: number // % de items que se activaron

  // Timing
  avg_queue_wait_min: number      // desde activated_at hasta preparing_started_at
  avg_prep_time_min: number       // desde preparing_started_at hasta delivered_at
  avg_total_time_min: number      // desde activated_at hasta delivered_at
  peak_hour: number | null        // hora con más activaciones

  // By bar
  bar_stats: {
    bar_id: string
    bar_name: string
    delivered: number
    avg_prep_min: number
    expired: number
  }[]

  // Rankings
  top_items: { name: string; count: number; revenue: number }[]
  top_categories: { name: string; count: number }[]
}

export default function ConsumosAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      const [
        { data: orders },
        { data: orderItems },
        { data: bars },
        { data: categories },
      ] = await Promise.all([
        supabase.from('consumption_orders').select('id, total_amount, created_at').eq('event_id', eventId).eq('status', 'paid'),
        supabase.from('consumption_order_items').select(`
          id, item_name, status, unit_price, activated_at, preparing_started_at, delivered_at, expired_at, bar_id,
          consumption_orders!inner(event_id),
          consumption_items(category_id, consumption_categories(name))
        `).eq('consumption_orders.event_id', eventId),
        supabase.from('bars').select('id, name').eq('event_id', eventId),
        supabase.from('consumption_categories').select('id, name').eq('event_id', eventId),
      ])

      const totalRevenue = orders?.reduce((s, o) => s + o.total_amount, 0) ?? 0
      const totalOrders = orders?.length ?? 0
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

      const allItems = orderItems || []
      const delivered = allItems.filter(i => i.status === 'delivered')
      const expired = allItems.filter(i => i.status === 'expired')
      const activated = allItems.filter(i => i.activated_at)

      // Activation rate
      const activationRate = allItems.length > 0
        ? Math.round((activated.length / allItems.length) * 100)
        : 0

      // Timing stats
      const queueWaits = delivered
        .filter(i => i.activated_at && i.preparing_started_at)
        .map(i => (new Date(i.preparing_started_at!).getTime() - new Date(i.activated_at!).getTime()) / 60000)
      const avgQueueWait = queueWaits.length > 0
        ? Math.round(queueWaits.reduce((a, b) => a + b, 0) / queueWaits.length)
        : 0

      const prepTimes = delivered
        .filter(i => i.preparing_started_at && i.delivered_at)
        .map(i => (new Date(i.delivered_at!).getTime() - new Date(i.preparing_started_at!).getTime()) / 60000)
      const avgPrepTime = prepTimes.length > 0
        ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
        : 0

      const totalTimes = delivered
        .filter(i => i.activated_at && i.delivered_at)
        .map(i => (new Date(i.delivered_at!).getTime() - new Date(i.activated_at!).getTime()) / 60000)
      const avgTotalTime = totalTimes.length > 0
        ? Math.round(totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length)
        : 0

      // Peak hour
      const hourCounts: Record<number, number> = {}
      activated.forEach(i => {
        if (i.activated_at) {
          const h = new Date(i.activated_at).getHours()
          hourCounts[h] = (hourCounts[h] || 0) + 1
        }
      })
      const peakHour = Object.entries(hourCounts).length > 0
        ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
        : null

      // Top items
      const itemMap: Record<string, { count: number; revenue: number }> = {}
      allItems.forEach(i => {
        if (!itemMap[i.item_name]) itemMap[i.item_name] = { count: 0, revenue: 0 }
        itemMap[i.item_name].count++
        itemMap[i.item_name].revenue += i.unit_price
      })
      const topItems = Object.entries(itemMap)
        .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

      // Revenue by item
      const revenueByItem = [...topItems].sort((a, b) => b.revenue - a.revenue).slice(0, 5)

      // Top categories
      const catMap: Record<string, number> = {}
      allItems.forEach(i => {
        const catName = (i.consumption_items as any)?.consumption_categories?.name ?? 'Sin categoría'
        catMap[catName] = (catMap[catName] || 0) + 1
      })
      const topCategories = Object.entries(catMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      // Bar stats
      const barStats = await Promise.all((bars || []).map(async bar => {
        const barItems = allItems.filter(i => i.bar_id === bar.id)
        const barDelivered = barItems.filter(i => i.status === 'delivered')
        const barExpired = barItems.filter(i => i.status === 'expired')

        const barPrepTimes = barDelivered
          .filter(i => i.preparing_started_at && i.delivered_at)
          .map(i => (new Date(i.delivered_at!).getTime() - new Date(i.preparing_started_at!).getTime()) / 60000)

        return {
          bar_id: bar.id,
          bar_name: bar.name,
          delivered: barDelivered.length,
          avg_prep_min: barPrepTimes.length > 0 ? Math.round(barPrepTimes.reduce((a, b) => a + b, 0) / barPrepTimes.length) : 0,
          expired: barExpired.length,
        }
      }))

      setData({
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        revenue_by_item: revenueByItem,
        total_orders: totalOrders,
        total_items: allItems.length,
        total_delivered: delivered.length,
        total_expired: expired.length,
        activation_rate: activationRate,
        avg_queue_wait_min: avgQueueWait,
        avg_prep_time_min: avgPrepTime,
        avg_total_time_min: avgTotalTime,
        peak_hour: peakHour,
        bar_stats: barStats,
        top_items: topItems,
        top_categories: topCategories,
      })
    } catch (e) { console.error('[analytics]', e) } finally { setLoading(false) }
  }, [eventId])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const fmtCLP = (n: number) => `$${n.toLocaleString('es-CL')}`
  const fmtHour = (h: number | null) => h === null ? '--' : `${h.toString().padStart(2, '0')}:00`

  if (loading) return <div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-violet-400" size={36} /></div>
  if (!data) return null

  return (
    <div className="space-y-8 animate-in fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-violet-400" size={26} /> Analytics de Consumos
          </h2>
          <p className="text-zinc-500 text-xs mt-1">Vista completa del rendimiento del sistema de consumos</p>
        </div>
        <button onClick={fetchAnalytics} className="p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Principal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue Total', value: fmtCLP(data.total_revenue), icon: <DollarSign size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Valor Promedio Orden', value: fmtCLP(data.avg_order_value), icon: <TrendingUp size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Total Órdenes', value: data.total_orders, icon: <Wine size={18} />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Bebidas Totales', value: data.total_items, icon: <Activity size={18} />, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
        ].map(c => (
          <div key={c.label} className={`p-5 rounded-2xl border ${c.bg} backdrop-blur-sm`}>
            <div className={`${c.color} mb-3`}>{c.icon}</div>
            <p className="text-2xl font-black text-white tracking-tight">{c.value}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Métricas de rendimiento */}
      <div>
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2"><Timer size={12} /> Métricas de Tiempo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Espera en Cola', value: `${data.avg_queue_wait_min}`, unit: 'min', desc: 'Desde activación hasta preparación', color: 'text-amber-400' },
            { label: 'Tiempo de Prep.', value: `${data.avg_prep_time_min}`, unit: 'min', desc: 'Desde prep. hasta entrega', color: 'text-orange-400' },
            { label: 'Tiempo Total', value: `${data.avg_total_time_min}`, unit: 'min', desc: 'Desde activación hasta entrega', color: 'text-red-400' },
            { label: 'Hora Pico', value: fmtHour(data.peak_hour), unit: 'hrs', desc: 'Franja con más pedidos activados', color: 'text-violet-400' },
          ].map(m => (
            <div key={m.label} className="p-5 bg-white/5 rounded-2xl border border-white/10">
              <p className={`text-3xl font-black tracking-tighter ${m.color}`}>{m.value}<span className="text-sm text-white/30 ml-1">{m.unit}</span></p>
              <p className="text-white font-bold text-xs mt-1">{m.label}</p>
              <p className="text-zinc-600 text-[10px] mt-0.5 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div>
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={12} /> Funnel de Bebidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Compradas', value: data.total_items, pct: 100, color: 'bg-violet-500' },
            { label: 'Activadas', value: Math.round(data.total_items * data.activation_rate / 100), pct: data.activation_rate, color: 'bg-blue-500' },
            { label: 'Entregadas', value: data.total_delivered, pct: data.total_items > 0 ? Math.round(data.total_delivered / data.total_items * 100) : 0, color: 'bg-emerald-500' },
            { label: 'Expiradas', value: data.total_expired, pct: data.total_items > 0 ? Math.round(data.total_expired / data.total_items * 100) : 0, color: 'bg-red-500' },
          ].map(f => (
            <div key={f.label} className="p-5 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-2xl font-black text-white">{f.value}</p>
              <div className="h-1.5 bg-white/5 rounded-full mt-3 mb-2 overflow-hidden">
                <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.pct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{f.label}</p>
                <p className="text-[10px] font-black text-white/60">{f.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top items + Top categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top ítems */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-black mb-4 flex items-center gap-2"><Award size={16} className="text-violet-400" /> Top Ítems Vendidos</h3>
          {data.top_items.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {data.top_items.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-white/20 font-black text-sm w-5 text-right shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-bold text-sm truncate">{item.name}</p>
                      <p className="text-emerald-400 font-black text-xs shrink-0 ml-2">{fmtCLP(item.revenue)}</p>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.round((item.count / (data.top_items[0]?.count || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-white/40 text-xs font-bold shrink-0 w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats por barra */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-black mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-violet-400" /> Rendimiento por Barra</h3>
          {data.bar_stats.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">Sin barras configuradas</p>
          ) : (
            <div className="space-y-3">
              {data.bar_stats.map(bar => (
                <div key={bar.bar_id} className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold text-sm">{bar.bar_name}</p>
                    <div className="flex gap-2">
                      <span className="text-emerald-400 text-xs font-bold">{bar.delivered} entregados</span>
                      {bar.expired > 0 && <span className="text-red-400 text-xs font-bold">{bar.expired} expirados</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Clock size={10} /> Prep promedio: <strong className="text-white/70">{bar.avg_prep_min} min</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue por ítem */}
      {data.revenue_by_item.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-black mb-4 flex items-center gap-2"><DollarSign size={16} className="text-emerald-400" /> Revenue por Ítem (Top 5)</h3>
          <div className="space-y-3">
            {data.revenue_by_item.map(item => (
              <div key={item.name} className="flex items-center gap-4">
                <p className="text-white font-bold text-sm w-40 shrink-0 truncate">{item.name}</p>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((item.revenue / (data.revenue_by_item[0]?.revenue || 1)) * 100)}%` }} />
                </div>
                <p className="text-emerald-400 font-black text-sm w-24 text-right shrink-0">{fmtCLP(item.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
