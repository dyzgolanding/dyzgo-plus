'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Users, BarChart3, Share2, Edit3, Loader2, Gift, IdCard, ShieldX } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface EventData {
  title: string
  club_name: string
  date: string
  status: string
  organizer_id: string
}

interface EventTabProps {
  href: string
  active: boolean
  label: string
  icon: React.ReactNode
}

export default function EventLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const pathname = usePathname()
  const router = useRouter()
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  useEffect(() => {
    async function getEventTitle() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('events')
        .select('title, club_name, date, status, organizer_id')
        .eq('id', eventId)
        .single()

      if (error || !data) {
        setUnauthorized(true)
        setLoading(false)
        return
      }

      setEvent(data as EventData)
      setLoading(false)
    }
    getEventTitle()
  }, [eventId, router])

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* --- HEADER FLUIDO --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
            <Link href="/events" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {loading ? <span className="animate-pulse text-zinc-600">Cargando...</span> : unauthorized ? 'Evento Protegido' : event?.title}
                    </h1>
                    {!loading && !unauthorized && (
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20 uppercase">
                            {event?.status === 'active' ? 'En Venta' : event?.status}
                        </span>
                    )}
                </div>
                <p className="text-zinc-400 text-xs mt-0.5 flex items-center gap-2">
                    ID: {eventId.slice(0,8)}... {!loading && !unauthorized && `• ${event?.club_name} • ${event?.date}`}
                </p>
            </div>
        </div>

        <div className="flex gap-2">
            <button disabled={loading || unauthorized} className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-sm rounded-lg hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Share2 size={16} /> Link Evento
            </button>
            <Link href={loading || unauthorized ? '#' : `/events/create?id=${eventId}`}>
                <button disabled={loading || unauthorized} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                    <Edit3 size={16} /> Editar
                </button>
            </Link>
        </div>
      </div>

      {/* --- TABS (Se opacan si no hay acceso) --- */}
      <div className={`flex gap-1 bg-zinc-900/50 p-1 rounded-xl w-fit border border-zinc-800 overflow-x-auto transition-opacity ${loading || unauthorized ? 'opacity-50 pointer-events-none' : ''}`}>
         <EventTab href={`/events/${eventId}`} active={pathname === `/events/${eventId}`} label="Dashboard" icon={<BarChart3 size={14} />} />
         <EventTab href={`/events/${eventId}/attendees`} active={pathname?.includes('/attendees') ?? false} label="Asistentes" icon={<Users size={14} />} />
         <EventTab href={`/events/${eventId}/rrpp`} active={pathname?.includes('/rrpp') ?? false} label="RRPP" icon={<Gift size={14} />} />
         <EventTab href={`/events/${eventId}/staff`} active={pathname?.includes('/staff') ?? false} label="Staff" icon={<IdCard size={14} />} />
         <EventTab href={`/events/${eventId}/settings`} active={pathname?.includes('/settings') ?? false} label="Ajustes" icon={<Settings size={14} />} />
      </div>

      {/* --- ÁREA DE CONTENIDO (Aquí aparece el bloqueo grande) --- */}
      <div className="animate-in fade-in zoom-in-95 duration-300 flex-1 flex flex-col">
         {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#8A2BE2]" size={40} />
            </div>
         ) : unauthorized ? (
            <div className="flex-1 flex flex-col items-center justify-center py-40 gap-6 text-center">
                <ShieldX size={120} className="text-red-500 mb-4" />
                <h2 className="text-white font-black text-6xl tracking-tighter uppercase">Acceso Denegado</h2>
                <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
                    No tienes permisos de administrador, organizador o colaborador para visualizar o editar este evento.
                </p>
            </div>
         ) : (
            children
         )}
      </div>

    </div>
  )
}

function EventTab({ href, active, label, icon }: EventTabProps) {
    return (
        <Link href={href} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${active ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {icon} {label}
        </Link>
    )
}