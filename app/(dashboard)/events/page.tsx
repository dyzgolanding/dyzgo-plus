'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, Calendar, MapPin, Users, Loader2, ChevronLeft, ChevronRight, Music2, Ticket, Sparkles, Mic2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEventStore } from '@/store/useEventStore'
import { useOrg } from '@/components/providers/org-provider'
import type { EventListItem, EventCardProps } from '@/types/events'

const PAGE_SIZE = 12

export default function EventsPage() {
  const router = useRouter()
  const { resetEvent } = useEventStore()
  const { currentOrgId, currentRole } = useOrg()

  const [events, setEvents] = useState<EventListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('Todos')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const canCreate = currentRole === 'owner' || currentRole === 'admin'

  useEffect(() => {
    setPage(0)
  }, [currentOrgId, activeTab, searchTerm])

  useEffect(() => {
    async function fetchEvents() {
      if (!currentOrgId) return

      setLoading(true)

      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('events')
        .select('*, ticket_tiers(total_stock, sold_tickets)', { count: 'exact' })
        .eq('experience_id', currentOrgId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (data) {
        const now = new Date()

        const adaptedEvents: EventListItem[] = data.map((e) => {
            // La expiración real se maneja con la función SQL expire_events().
            // Aquí solo calculamos el status para mostrar en la UI de forma inmediata
            // sin necesidad de escribir a la DB desde el frontend.
            let currentStatus = e.status || 'draft'
            if (currentStatus !== 'ended' && currentStatus !== 'draft') {
                const targetDateStr = e.end_date || e.date
                if (targetDateStr) {
                    const eventEnd = new Date(`${targetDateStr}T${e.end_time || '23:59:59'}`)
                    if (!isNaN(eventEnd.getTime()) && eventEnd < now) {
                        currentStatus = 'ended'
                    }
                }
            }

            return {
                id: e.id,
                created_at: e.created_at,
                name: e.title,
                venue: e.club_name,
                date: e.date,
                end_time: e.end_time,
                cover_image: e.image_url,
                status: currentStatus,
                tickets: (e.ticket_tiers as { total_stock: number; sold_tickets: number }[] ?? [])
                    .map((t) => ({ quantity: t.total_stock, quantity_sold: t.sold_tickets })),
            }
        })
        setEvents(adaptedEvents)
        setTotalCount(count ?? 0)
      }
      if (error) console.error('[events] fetchEvents failed:', error)

      setLoading(false)
    }
    fetchEvents()
  }, [currentOrgId, page])

  const handleCreateEvent = () => {
    resetEvent() 
    router.push('/events/create')
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name?.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    
    if (activeTab === 'Todos') return true
    if (activeTab === 'Finalizados') return event.status === 'ended'
    if (activeTab === 'Activos') return event.status === 'active'
    if (activeTab === 'Borradores') return event.status === 'draft'

    return true
  })

  if (loading) return (
    <div className="flex items-center justify-center h-full pt-40">
        <Loader2 className="animate-spin text-[#8A2BE2]" size={40} />
    </div>
  )

  return (
    // CONTENEDOR LIMPIO (Sin fondo, ya está en el Layout)
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in pt-0">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-1">
                    Mis <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]">Eventos</span>
                </h1>
                <p className="text-white/40 text-sm font-medium">Gestiona, edita y monitorea tus fiestas.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none z-20" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar evento..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="h-12 pl-12 pr-6 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#8A2BE2]/50 transition-all w-64 shadow-lg shadow-purple-900/5 placeholder:text-white/20 relative z-10" 
                    />
                </div>
                {canCreate && (
                    <button 
                        onClick={handleCreateEvent} 
                        className="h-12 px-6 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] uppercase text-xs tracking-wider"
                    >
                        <Plus size={18} /> Crear
                    </button>
                )}
            </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-md border border-white/10 w-fit rounded-2xl">
            {['Todos', 'Activos', 'Borradores', 'Finalizados'].map((tab) => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)} 
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                        activeTab === tab 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* GRID o EMPTY STATE */}
        {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredEvents.map((event) => (
                    <EventCard
                        key={event.id}
                        id={event.id}
                        title={event.name}
                        date={event.date || 'Fecha por definir'}
                        location={event.venue || 'Ubicación por definir'}
                        image={event.cover_image || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1000&auto=format&fit=crop"}
                        status={event.status}
                        sold={event.tickets?.reduce((acc, t) => acc + (t.quantity_sold || 0), 0) || 0}
                        total={event.tickets?.reduce((acc, t) => acc + (t.quantity || 0), 0) || 0}
                        canEdit={canCreate}
                    />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center select-none">
                {/* Iconos flotantes estilo glassmorphism */}
                <div className="relative w-52 h-44 mb-8">
                    {/* Orbe central — Micrófono */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                    w-20 h-20 rounded-2xl
                                    bg-gradient-to-br from-[#8A2BE2]/30 to-[#FF007F]/20
                                    border border-[#8A2BE2]/40
                                    flex items-center justify-center
                                    shadow-[0_0_30px_rgba(138,43,226,0.25)]
                                    animate-pulse"
                         style={{ animationDuration: '3s' }}>
                        <Mic2 size={32} className="text-[#8A2BE2]" />
                    </div>
                    {/* Orbe superior-izquierdo — Música */}
                    <div className="absolute top-0 left-0
                                    w-14 h-14 rounded-xl
                                    bg-white/5 border border-white/10
                                    flex items-center justify-center
                                    animate-bounce"
                         style={{ animationDelay: '200ms', animationDuration: '3s' }}>
                        <Music2 size={22} className="text-white/50" />
                    </div>
                    {/* Orbe superior-derecho — Destellos */}
                    <div className="absolute top-2 right-0
                                    w-12 h-12 rounded-xl
                                    bg-[#FF007F]/10 border border-[#FF007F]/20
                                    flex items-center justify-center
                                    animate-bounce"
                         style={{ animationDelay: '600ms', animationDuration: '2.6s' }}>
                        <Sparkles size={18} className="text-[#FF007F]/60" />
                    </div>
                    {/* Orbe inferior-izquierdo — Calendario */}
                    <div className="absolute bottom-0 left-4
                                    w-12 h-12 rounded-xl
                                    bg-white/5 border border-white/10
                                    flex items-center justify-center
                                    animate-bounce"
                         style={{ animationDelay: '900ms', animationDuration: '3.4s' }}>
                        <Calendar size={18} className="text-white/40" />
                    </div>
                    {/* Orbe inferior-derecho — Ticket */}
                    <div className="absolute bottom-2 right-2
                                    w-14 h-14 rounded-xl
                                    bg-[#8A2BE2]/10 border border-[#8A2BE2]/20
                                    flex items-center justify-center
                                    animate-bounce"
                         style={{ animationDelay: '400ms', animationDuration: '2.8s' }}>
                        <Ticket size={22} className="text-[#8A2BE2]/60" />
                    </div>
                </div>

                {/* Título */}
                <h2 className="text-3xl font-black text-white tracking-tighter mb-3">
                    Aún no hay{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]">
                        ningún evento
                    </span>
                </h2>
                <p className="text-white/40 text-base max-w-sm mb-8 leading-relaxed">
                    {activeTab === 'Todos'
                        ? 'Tu próxima fiesta épica empieza aquí. Crea tu primer evento y ponle precio a la noche.'
                        : activeTab === 'Activos'
                        ? 'No tienes eventos activos en este momento.'
                        : activeTab === 'Borradores'
                        ? 'No hay borradores guardados.'
                        : 'No hay eventos finalizados aún.'}
                </p>

                {/* CTA — solo si puede crear */}
                {canCreate && activeTab === 'Todos' && (
                    <button
                        onClick={handleCreateEvent}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white
                                   bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]
                                   shadow-[0_0_24px_rgba(138,43,226,0.4)]
                                   hover:shadow-[0_0_36px_rgba(138,43,226,0.6)]
                                   hover:scale-105 transition-all duration-200"
                    >
                        <Plus size={16} />
                        Crear mi primer evento
                    </button>
                )}
            </div>
        )}

        {/* PAGINACIÓN */}
        {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-white/40 text-sm">
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount} eventos
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * PAGE_SIZE >= totalCount}
                        className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>
  )
}

function EventCard({ id, title, date, location, image, status, sold, total, canEdit }: EventCardProps) {
    const percentage = total > 0 ? Math.round((sold / total) * 100) : 0
    const formattedDate = date && date !== 'Fecha por definir' ? date.split('-').reverse().join('-') : date

    const statusConfig: Record<string, { style: string; dot: string; text: string }> = { 
        active: { style: 'bg-black/80 border-[#00D15B] text-[#00D15B] shadow-[0_0_20px_rgba(0,209,91,0.3)]', dot: 'bg-[#00D15B]', text: 'A LA VENTA' }, 
        draft: { style: 'bg-black/80 border-white/30 text-white/60', dot: 'bg-white/40', text: 'BORRADOR' }, 
        ended: { style: 'bg-black/80 border-[#8A2BE2] text-[#8A2BE2]', dot: 'bg-[#8A2BE2]', text: 'FINALIZADO' } 
    }
    
    const currentStatus = statusConfig[status] || statusConfig['draft']

    return (
        <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all hover:scale-[1.01] shadow-xl shadow-purple-900/5 flex flex-col h-full">
            <div className="h-40 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#030005] via-transparent to-transparent z-10 opacity-90" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={title} />
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 backdrop-blur-md z-20 transition-all ${currentStatus.style}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
                    {currentStatus.text}
                </div>
            </div>
            <div className="p-6 flex flex-col flex-1 relative z-20">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                        <h3 className="text-xl font-black text-white mb-2 leading-none group-hover:text-[#FF007F] transition-colors line-clamp-1">{title}</h3>
                        <div className="flex flex-col gap-1.5 text-xs text-white/50 font-medium mt-2">
                            <span className="flex items-center gap-2"><Calendar size={12} className="text-[#8A2BE2]" /> {formattedDate}</span>
                            <span className="flex items-center gap-2"><MapPin size={12} className="text-[#8A2BE2]" /> {location}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-2">
                        <span className="text-white/40 flex items-center gap-1.5"><Users size={12} /> Vendidos</span>
                        <span className="text-white">{sold} <span className="text-white/30">/ {total}</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#8A2BE2] to-[#FF007F] rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                    </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3">
                    <Link href={`/events/${id}`} className="w-full">
                        <button className="w-full py-3 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]">Dashboard</button>
                    </Link>
                    {canEdit ? (
                        <Link href={`/events/create?id=${id}`} className="w-full">
                            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white uppercase tracking-wider transition-colors hover:border-white/30">Editar</button>
                        </Link>
                    ) : (
                        <button disabled className="w-full py-3 rounded-xl border border-white/5 text-xs font-bold text-white/20 uppercase tracking-wider cursor-not-allowed">Solo Lectura</button>
                    )}
                </div>
            </div>
        </div>
    )
}