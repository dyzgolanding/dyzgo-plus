'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  Wallet, Plus, 
  ShoppingCart, ChevronRight, Bell, TicketPercent,
  AlertCircle, Megaphone, ArrowUpRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrg } from '@/components/providers/org-provider'
import { differenceInDays, formatDistanceToNow, subHours } from 'date-fns'
import { es } from 'date-fns/locale'

// ESTILOS PARA SCROLLBAR PERSONALIZADO
const customScrollbar = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

// --- INTERFACES PARA TIPADO ESTRICTO ---
interface GlobalStats {
  balanceAvailable: number
  balancePending: number
  totalSalesMonth: number
  salesTrend: number
  activeEventsCount: number
}

interface NextEventData {
  id: string
  title: string
  date: string
  image_url: string
  sold: number
  stock: number
  percentage: number
}

interface RecentSale {
  id: string
  name: string
  tier: string
  eventTitle: string
  price: number
  timeAgo: string
}

interface EventMatrixItem {
  id: string
  title: string
  image_url: string
  status: string
  sold: number
  revenue: number
}

interface AlertItem {
  type: string
  label: string
  sub: string
  urgent: boolean
  icon: React.ElementType
  color: string
}

export default function GeneralDashboard() {
  const { currentOrgId } = useOrg()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Productor') 
  
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    balanceAvailable: 0,
    balancePending: 0,
    totalSalesMonth: 0,
    salesTrend: 0, 
    activeEventsCount: 0
  })

  const [nextEvent, setNextEvent] = useState<NextEventData | null>(null)
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [activeEventsMatrix, setActiveEventsMatrix] = useState<EventMatrixItem[]>([])
  const [realAlerts, setRealAlerts] = useState<AlertItem[]>([])

  const fetchData = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()
            
            if (profile?.full_name) {
                setUserName(profile.full_name.split(' ')[0])
            }
        }

        const { data: eventsData } = await supabase
            .from('events')
            .select('*, ticket_tiers(total_stock)')
            .eq('experience_id', currentOrgId)
            .neq('status', 'draft') 
            .order('date', { ascending: true })

        if (!eventsData) return

        const eventIds = eventsData.map(e => e.id)
        const { data: ticketsData } = await supabase
            .from('tickets')
            .select(`
                id, paid_price, status, created_at, event_id, guest_name,
                profiles:user_id ( full_name, email ),
                ticket_tiers ( name, price, total_stock ) 
            `)
            .in('event_id', eventIds)
            .neq('status', 'refunded')
            .order('created_at', { ascending: false }) 

        if (ticketsData) {
            const totalRevenue = ticketsData.reduce((sum, t) => {
                let price = Number(t.paid_price)
                if (!price || price === 0) price = Number(t.ticket_tiers?.price) || 0
                return sum + price
            }, 0)
            
            setGlobalStats(prev => ({
                ...prev,
                balanceAvailable: totalRevenue,
                activeEventsCount: eventsData.length,
                salesTrend: 12 
            }))

            const upcoming = eventsData.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
            const next = upcoming.length > 0 ? upcoming[0] : null

            if (next) {
                const nextEvtTickets = ticketsData.filter(t => t.event_id === next.id)
                const sold = nextEvtTickets.length
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const totalStock = next.ticket_tiers?.reduce((acc: number, tier: any) => acc + (tier.total_stock || 0), 0) || 0
                
                setNextEvent({
                    id: next.id,
                    title: next.title,
                    date: next.date,
                    image_url: next.image_url,
                    sold,
                    stock: totalStock,
                    percentage: totalStock > 0 ? Math.min(100, (sold / totalStock) * 100) : 0
                })
            } else {
                setNextEvent(null)
            }

            setRecentSales(ticketsData.slice(0, 5).map(t => {
                const eventName = eventsData.find(e => e.id === t.event_id)?.title || 'Evento'
                let displayPrice = Number(t.paid_price)
                if (!displayPrice || displayPrice === 0) displayPrice = Number(t.ticket_tiers?.price) || 0

                return {
                    id: t.id,
                    name: t.profiles?.full_name || t.guest_name || 'Anónimo',
                    tier: t.ticket_tiers?.name || 'General',
                    eventTitle: eventName, 
                    price: displayPrice,
                    timeAgo: formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: es })
                }
            }))

            const matrix = eventsData.slice(0, 5).map(evt => {
                const evtTickets = ticketsData.filter(t => t.event_id === evt.id)
                const revenue = evtTickets.reduce((sum, t) => {
                    let price = Number(t.paid_price)
                    if (!price || price === 0) price = Number(t.ticket_tiers?.price) || 0
                    return sum + price
                }, 0)

                return {
                    id: evt.id,
                    title: evt.title,
                    image_url: evt.image_url,
                    status: new Date(evt.date) < new Date() ? 'Finalizado' : 'Activo',
                    sold: evtTickets.length,
                    revenue
                }
            })
            setActiveEventsMatrix(matrix)

            const alerts: AlertItem[] = []
            const now = new Date()

            const salesLast24h = ticketsData.filter(t => new Date(t.created_at) > subHours(now, 24)).length
            if (salesLast24h === 0 && eventsData.length > 0) {
                alerts.push({
                    type: 'stalled',
                    label: 'Ventas detenidas',
                    sub: '0 ventas en las últimas 24h.',
                    urgent: true,
                    icon: Megaphone,
                    color: 'text-orange-400'
                })
            }

            eventsData.forEach(evt => {
                const evtTickets = ticketsData.filter(t => t.event_id === evt.id)
                const sold = evtTickets.length
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const stock = evt.ticket_tiers?.reduce((acc: number, tier: any) => acc + (tier.total_stock || 0), 0) || 100
                const daysLeft = differenceInDays(new Date(evt.date), now)
                const occupancy = (sold / stock) * 100

                if (daysLeft >= 0 && daysLeft < 7 && occupancy < 20) {
                    alerts.push({
                        type: 'low_sales',
                        label: `Baja venta: ${evt.title}`,
                        sub: `Solo ${occupancy.toFixed(0)}% vendido.`,
                        urgent: true,
                        icon: AlertCircle,
                        color: 'text-[#FF007F]'
                    })
                }

                if (daysLeft >= 0 && occupancy > 90 && occupancy < 100) {
                    alerts.push({
                        type: 'sold_out_soon',
                        label: `Sold Out cerca: ${evt.title}`,
                        sub: `Quedan ${stock - sold} tickets.`,
                        urgent: false,
                        icon: TicketPercent,
                        color: 'text-[#8A2BE2]'
                    })
                }
            })

            setRealAlerts(alerts)
        }

    } catch (error) {
        console.error("Error cargando dashboard:", error)
    } finally {
        setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    // CONTENEDOR LIMPIO (Sin fondo, ya está en el Layout)
    <div className="relative z-10 max-w-[1600px] mx-auto space-y-6 pt-2">
      <style>{customScrollbar}</style>
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
          <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                  Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]">{userName}.</span>
              </h1>
              <p className="text-white/40 text-sm font-medium mt-2 max-w-lg">
                  Acá podrás ver el resumen de tus eventos. Para ver información más detallada, anda a la sección de analíticas.
              </p>
          </div>
          
          <div className="flex gap-3">
              <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center relative group backdrop-blur-md">
                  <Bell size={20} className="text-white/60 group-hover:text-white transition-colors" />
                  {realAlerts.filter(t => t.urgent).length > 0 && (
                      <span className="absolute top-3 right-3 w-2 h-2 bg-[#FF007F] rounded-full shadow-[0_0_10px_#FF007F]"></span>
                  )}
              </button>
              <Link 
                  href="/events/create" 
                  className="h-12 px-6 rounded-2xl bg-white text-black font-bold text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                  <Plus size={18} /> Nuevo Evento
              </Link>
          </div>
      </div>

      {/* 2. BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* A. BILLETERA */}
          <div className="md:col-span-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group min-h-[240px] shadow-2xl shadow-purple-900/10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#00D15B]/30 to-transparent rounded-full blur-[60px] opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#00D15B]/20 to-transparent border border-white/10 flex items-center justify-center">
                          <Wallet className="text-[#00D15B]" size={24} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-[#00D15B]/10 text-[#00D15B] px-3 py-1.5 rounded-full border border-[#00D15B]/20 backdrop-blur-md">
                          Disponible
                      </span>
                  </div>
                  
                  <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Ingresos Totales</p>
                      <h2 className="text-5xl font-black text-white tracking-tighter">
                          {loading ? '...' : `$${globalStats.balanceAvailable.toLocaleString('es-CL')}`}
                      </h2>
                  </div>
              </div>

              <div className="relative z-10 mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div>
                      <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Eventos Activos</p>
                      <p className="text-white font-mono text-lg">{globalStats.activeEventsCount}</p>
                  </div>
                  <button className="text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-white/5 uppercase tracking-wide backdrop-blur-md">
                      Retirar
                  </button>
              </div>
          </div>

          {/* B. NEXT EVENT */}
          <div className="md:col-span-5 bg-black/40 border border-white/10 rounded-[2rem] relative overflow-hidden flex flex-col justify-between min-h-[240px] group shadow-2xl shadow-purple-900/10">
              {nextEvent?.image_url ? (
                  <>
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-105 opacity-60" style={{ backgroundImage: `url(${nextEvent.image_url})` }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030005] via-[#030005]/80 to-transparent" />
                  </>
              ) : (
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
              )}

              <div className="relative z-20 p-8 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-3">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF007F] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF007F]"></span>
                              </span>
                              <span className="text-[#FF007F] text-[10px] font-bold uppercase tracking-[0.2em]">Próximo</span>
                          </div>
                          <h3 className="text-3xl font-black text-white leading-none max-w-sm line-clamp-2">
                              {loading ? 'Cargando...' : (nextEvent?.title || 'Sin eventos')}
                          </h3>
                      </div>
                      {nextEvent && (
                          <div className="text-right bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                              <span className="block text-2xl font-black text-white">{differenceInDays(new Date(nextEvent.date), new Date())}</span>
                              <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Días</span>
                          </div>
                      )}
                  </div>

                  {nextEvent ? (
                      <div className="space-y-4">
                          <div>
                              <div className="flex justify-between text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                                  <span>Ventas: {nextEvent.sold}</span>
                                  <span className="text-white">{nextEvent.percentage?.toFixed(0)}% Sold</span>
                              </div>
                              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                                  <div className="h-full bg-gradient-to-r from-[#FF007F] to-[#8A2BE2]" style={{ width: `${nextEvent.percentage}%` }} />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                              <Link href={`/events/create?id=${nextEvent.id}&tab=tickets`} className="bg-white text-black text-center py-3 rounded-xl text-xs font-bold hover:scale-[1.02] transition-transform uppercase tracking-wider shadow-lg">
                                  Tickets
                              </Link>
                              <Link href={`/events/${nextEvent.id}`} className="bg-white/10 text-white backdrop-blur-md text-center py-3 rounded-xl text-xs font-bold hover:bg-white/20 transition-colors border border-white/10 uppercase tracking-wider">
                                  Dashboard
                              </Link>
                          </div>
                      </div>
                  ) : (
                      <div className="mt-auto text-white/40 text-sm font-medium">
                          No tienes eventos activos próximos.
                      </div>
                  )}
              </div>
          </div>

          {/* C. ALERTAS */}
          <div className="md:col-span-3 flex flex-col h-[240px]">
              <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden shadow-2xl shadow-purple-900/10">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle size={14} className="text-[#FF007F]"/> Alertas
                      </h3>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                      {realAlerts.length > 0 ? realAlerts.map((task, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group backdrop-blur-sm">
                              <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${task.color} shrink-0`}>
                                  <task.icon size={14} />
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-white group-hover:text-[#FF007F] transition-colors leading-tight mb-1">{task.label}</p>
                                  <p className="text-[10px] text-white/40 leading-tight">{task.sub}</p>
                              </div>
                          </div>
                      )) : (
                          <div className="h-full flex flex-col items-center justify-center text-center text-white/20 gap-3">
                              {/* Icono reemplazado por texto para evitar imports no usados si no se usa CheckCircle2 */}
                              <p className="text-xs font-medium">Todo limpio.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* D. LIVE SALES FEED */}
          <div className="md:col-span-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 flex flex-col h-[280px] shadow-2xl shadow-purple-900/10">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                      <ShoppingCart size={14} className="text-[#8A2BE2]"/> Live Feed
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00D15B]/10 border border-[#00D15B]/20 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 bg-[#00D15B] rounded-full animate-pulse"/>
                      <span className="text-[9px] font-bold text-[#00D15B] uppercase tracking-wider">En Vivo</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {recentSales.length > 0 ? recentSales.map((sale, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group backdrop-blur-sm">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-xs font-bold text-white/50 group-hover:text-white transition-colors shrink-0">
                              {sale.name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{sale.name}</p>
                              <p className="text-[10px] text-white/40 font-medium truncate">{sale.eventTitle}</p>
                          </div>
                          <div className="text-right">
                              <span className="block text-xs font-mono text-[#00D15B] font-bold">+${sale.price.toLocaleString()}</span>
                              <p className="text-[9px] text-white/20">{sale.timeAgo}</p>
                          </div>
                      </div>
                  )) : (
                      <div className="h-full flex items-center justify-center text-white/20 text-xs font-medium">
                          Esperando ventas...
                      </div>
                  )}
              </div>
          </div>

          {/* E. PERFORMANCE MATRIX */}
          <div className="md:col-span-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 h-[280px] flex flex-col shadow-2xl shadow-purple-900/10">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                      <ArrowUpRight size={14} className="text-blue-400"/> Rendimiento
                  </h3>
                  <Link href="/events" className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors">
                      Ver todo <ChevronRight size={12}/>
                  </Link>
              </div>
              
              <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left">
                      <thead className="text-[10px] uppercase font-bold text-white/30 border-b border-white/5 tracking-wider">
                          <tr>
                              <th className="pb-4 pl-2 font-medium">Evento</th>
                              <th className="pb-4 text-center font-medium">Estado</th>
                              <th className="pb-4 text-right font-medium">Ventas</th>
                              <th className="pb-4 text-right font-medium">Ingresos</th>
                              <th className="pb-4 text-right font-medium"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {activeEventsMatrix.map((evt, i) => (
                              <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                  <td className="py-4 pl-2 font-bold text-sm text-white flex items-center gap-4">
                                      <div className="h-8 w-8 rounded-lg bg-zinc-800 overflow-hidden border border-white/10">
                                          {evt.image_url && (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={evt.image_url} alt="" className="h-full w-full object-cover" />
                                          )}
                                      </div>
                                      {evt.title}
                                  </td>
                                  <td className="py-4 text-center">
                                      <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                                          evt.status === 'Activo' 
                                          ? 'bg-[#00D15B]/10 text-[#00D15B] border-[#00D15B]/20' 
                                          : 'bg-white/5 text-white/40 border-white/10'
                                      }`}>
                                          {evt.status}
                                      </span>
                                  </td>
                                  <td className="py-4 text-right text-xs font-bold text-white/60">{evt.sold}</td>
                                  <td className="py-4 text-right font-mono text-white text-xs font-bold tracking-tight">${evt.revenue.toLocaleString()}</td>
                                  <td className="py-4 text-right">
                                      <Link href={`/events/${evt.id}`} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all ml-auto border border-white/5 backdrop-blur-md">
                                          <ChevronRight size={14} />
                                      </Link>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

      </div>
    </div>
  )
}