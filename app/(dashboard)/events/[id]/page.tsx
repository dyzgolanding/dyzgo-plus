'use client'

import React, { useEffect, useState, use } from 'react'
import { Ticket, Users, Clock, TrendingUp, Loader2, BarChart3, PieChart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// 1. Definimos interfaces para eliminar los 'any' que rompen el build
interface DashboardTicket {
  id: string
  name: string
  price: number
  quantity: number      // total_stock
  quantity_sold: number // sold_tickets
  color: string
}

interface DashboardData {
  status: string
  tickets: DashboardTicket[]
  [key: string]: unknown // Permite otras propiedades que vengan de la DB sin romper el tipo
}

interface StatCardProps {
  label: string
  value: string | number
  subtext: string
  icon: React.ReactNode
  color: string
  bg: string
  border: string
}

interface TicketProgressProps {
  name: string
  sold: number
  total: number
  color: string
}

export default function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  // Aplicamos la interfaz al estado
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkInCount, setCheckInCount] = useState(0)

  useEffect(() => {
    async function fetchStats() {
      // 1. Traemos evento y tipos de tickets
      const { data: eventRaw } = await supabase
        .from('events')
        .select('*, ticket_tiers(*)')
        .eq('id', eventId)
        .single()
      
      // 2. Traemos tickets VENDIDOS para contar los usados (validadaos)
      const { data: soldTickets } = await supabase
        .from('tickets')
        .select('used')
        .eq('event_id', eventId)

      if (eventRaw) {
        // Cálculo de acreditados
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalUsed = soldTickets?.filter((t: any) => t.used).length || 0
        setCheckInCount(totalUsed)

        const adaptedData: DashboardData = {
            ...eventRaw,
            status: eventRaw.status || 'draft',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tickets: eventRaw.ticket_tiers ? eventRaw.ticket_tiers.map((t: any) => ({
                id: t.id,
                name: t.name,
                price: t.price,
                quantity: t.total_stock,      
                quantity_sold: t.sold_tickets, 
                color: 'purple' 
            })) : []
        }
        setData(adaptedData)
      }
      setLoading(false)
    }
    fetchStats()
  }, [eventId])

  if (loading) return (
    <div className="flex items-center justify-center h-full pt-40">
        <Loader2 className="animate-spin text-[#8A2BE2]" size={40} />
    </div>
  )

  const totalSold = data?.tickets?.reduce((acc, t) => acc + (t.quantity_sold || 0), 0) || 0
  const totalCapacity = data?.tickets?.reduce((acc, t) => acc + (t.quantity || 0), 0) || 0
  const totalRevenue = data?.tickets?.reduce((acc, t) => acc + (t.price * (t.quantity_sold || 0)), 0) || 0

  return (
    // CONTENEDOR LIMPIO (Sin fondo, ya está en el Layout)
    <div className="relative z-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in pt-4">
      
      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
              label="Tickets Vendidos" 
              value={totalSold} 
              subtext={`de ${totalCapacity} capacidad`} 
              icon={<Ticket size={20} />} 
              color="text-[#8A2BE2]" 
              bg="bg-[#8A2BE2]/10" 
              border="border-[#8A2BE2]/20"
          />
          <StatCard 
              label="Recaudación" 
              value={`$${totalRevenue.toLocaleString('es-CL')}`} 
              subtext="Ingreso bruto total" 
              icon={<TrendingUp size={20} />} 
              color="text-[#00D15B]" 
              bg="bg-[#00D15B]/10" 
              border="border-[#00D15B]/20"
          />
          <StatCard 
              label="Acreditados" 
              value={checkInCount} 
              subtext="Check-in en tiempo real" 
              icon={<Users size={20} />} 
              color="text-[#3b82f6]" 
              bg="bg-[#3b82f6]/10" 
              border="border-[#3b82f6]/20"
          />
          <StatCard 
              label="Estado Actual" 
              value={data?.status?.toUpperCase() || 'DRAFT'} 
              subtext="Status del evento" 
              icon={<Clock size={20} />} 
              color="text-[#eab308]" 
              bg="bg-[#eab308]/10" 
              border="border-[#eab308]/20"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* RENDIMIENTO */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl shadow-purple-900/10 flex flex-col h-full min-h-[320px]">
              <div className="flex justify-between items-start mb-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-3 uppercase tracking-widest">
                      <BarChart3 size={16} className="text-[#8A2BE2]"/> Rendimiento
                  </h3>
              </div>
              
              <div className="flex-1 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:20px_20px]" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#8A2BE2]/10 to-transparent opacity-50" />
                  
                  <BarChart3 size={48} className="text-white/10 mb-4 group-hover:scale-110 transition-transform duration-500" />
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider text-center px-6">
                      El gráfico se activará al recibir<br/>las primeras ventas reales
                  </p>
              </div>
          </div>

          {/* VENTAS POR TIPO */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl shadow-purple-900/10 flex flex-col">
              <h3 className="text-sm font-bold text-white flex items-center gap-3 uppercase tracking-widest mb-8">
                  <PieChart size={16} className="text-[#FF007F]"/> Ventas por Tipo
              </h3>
              
              <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  {data?.tickets?.map((t, i) => (
                      <TicketProgress 
                          key={t.id} 
                          name={t.name} 
                          sold={t.quantity_sold || 0} 
                          total={t.quantity} 
                          color={i % 2 === 0 ? 'from-[#8A2BE2] to-[#6366f1]' : 'from-[#FF007F] to-[#ec4899]'} 
                      />
                  ))}
                  {(!data?.tickets || data.tickets.length === 0) && (
                      <div className="text-center py-10 text-white/20 text-xs">
                          No hay tipos de tickets configurados.
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENTES ESTILIZADOS ---

// Ahora usan la interfaz en lugar de 'any'
function StatCard({ label, value, subtext, icon, color, bg, border }: StatCardProps) {
  return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] hover:border-white/20 transition-all hover:scale-[1.02] group shadow-lg">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{label}</p>
                  <h4 className="text-3xl font-black text-white tracking-tight">{value}</h4>
                  <p className="text-white/30 text-[10px] mt-2 font-medium bg-black/20 w-fit px-2 py-1 rounded-lg">{subtext}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${bg} ${border} border ${color} shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                  {icon}
              </div>
          </div>
      </div>
  )
}

function TicketProgress({ name, sold, total, color }: TicketProgressProps) {
  const percent = total > 0 ? Math.min((sold / total) * 100, 100) : 0
  return (
      <div className="group">
          <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wide">
              <span className="text-white group-hover:text-[#FF007F] transition-colors">{name}</span>
              <span className="text-white/40 font-mono">{sold} <span className="text-white/20">/ {total}</span></span>
          </div>
          <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div 
                  className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 shadow-[0_0_10px_currentColor] opacity-90`} 
                  style={{ width: `${percent}%` }} 
              />
          </div>
      </div>
  )
}