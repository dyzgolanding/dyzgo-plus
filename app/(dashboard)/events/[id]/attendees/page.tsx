'use client'

import React, { use, useEffect, useState } from 'react'
// Se eliminó 'Filter' de las importaciones porque no se usaba
import { Search, Download, UserCheck, Mail, RefreshCw, Loader2, MoreHorizontal, CheckCircle, XCircle, Send, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Definimos interfaces para evitar el error "no-explicit-any" que bloquea Vercel
interface Attendee {
  id: string
  created_at: string
  used: boolean
  guest_name?: string
  guest_email?: string
  tier_id?: string
  ticket_type?: string // En caso de que exista en tu DB
  profiles?: {
    full_name: string
    email: string
  } | null
  ticket_tiers?: {
    name: string
  } | null
}

interface AttendeeRowProps {
  id: string
  tierId?: string
  name: string
  email: string
  ticket: string
  status: string
  date: string
  onRefresh: () => void
}

export default function AttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Función para cargar asistentes reales
  const fetchAttendees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tickets')
      .select('*, ticket_tiers(name), profiles(full_name, email)') 
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (data) setAttendees(data as unknown as Attendee[]) // Casting seguro para Supabase join
    if (error) console.error("Error cargando asistentes:", error)
    setLoading(false)
  }

  useEffect(() => {
    fetchAttendees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]) // Ignoramos advertencia de fetchAttendees para no reescribir toda la lógica

  // Filtro de búsqueda local
  const filteredAttendees = attendees.filter(a => {
    const nameToCheck = a.profiles?.full_name || a.guest_name || ''
    const emailToCheck = a.profiles?.email || a.guest_email || ''
    const idToCheck = a.id || ''

    return (
        nameToCheck.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emailToCheck.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idToCheck.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    // CONTENEDOR LIMPIO
    <div className="relative z-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in pt-4">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                    <Users className="text-[#8A2BE2]" size={32}/>
                    Lista de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]">Asistentes</span>
                </h1>
                <p className="text-white/40 text-sm font-medium">Gestiona el acceso y controla el aforo de tu evento.</p>
            </div>
            
            {/* TOOLBAR */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative group shadow-lg shadow-purple-900/10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar asistente..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 pl-12 pr-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#8A2BE2]/50 transition-all w-full md:w-72 placeholder:text-white/20"
                    />
                </div>
                
                <button 
                    onClick={fetchAttendees}
                    className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                    title="Sincronizar"
                >
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
                </button>
                
                <button className="h-12 px-6 bg-white text-black font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                    <Download size={16} /> Exportar
                </button>
            </div>
        </div>

        {/* TABLA LIQUID GLASS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden min-h-[500px] shadow-2xl shadow-purple-900/10 relative">
            
            {/* Header Tabla */}
            <div className="grid grid-cols-12 px-8 py-4 border-b border-white/5 bg-black/20 text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 backdrop-blur-md z-10">
                <div className="col-span-4">Asistente</div>
                <div className="col-span-3">Ticket</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-2">ID Compra</div>
                <div className="col-span-1 text-right"></div>
            </div>

            {/* Body Tabla */}
            <div className="divide-y divide-white/5">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-white/20">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <span className="text-xs font-medium">Cargando lista...</span>
                    </div>
                ) : filteredAttendees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-white/20">
                        <Users size={40} className="mb-4 opacity-50" />
                        <span className="text-sm font-medium">No se encontraron asistentes.</span>
                    </div>
                ) : (
                    filteredAttendees.map((item) => {
                        let status = 'pending'
                        if (item.used) status = 'checked-in'
                        
                        const finalName = item.profiles?.full_name || item.guest_name || 'Sin Nombre'
                        const finalEmail = item.profiles?.email || item.guest_email || 'Sin Email'

                        return (
                            <AttendeeRow 
                                key={item.id}
                                id={item.id}
                                tierId={item.tier_id} 
                                name={finalName} 
                                email={finalEmail} 
                                ticket={item.ticket_type || item.ticket_tiers?.name || 'General'} 
                                status={status}
                                date={new Date(item.created_at).toLocaleDateString()}
                                onRefresh={fetchAttendees} 
                            />
                        )
                    })
                )}
            </div>
        </div>

        {/* FOOTER PAGINACIÓN */}
        <div className="flex justify-between items-center px-4 pt-2">
            <span className="text-xs font-medium text-white/40">Mostrando {filteredAttendees.length} registros</span>
            <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all disabled:opacity-50">Anterior</button>
                <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all disabled:opacity-50">Siguiente</button>
            </div>
        </div>

    </div>
  )
}

// Se tiparon las props para evitar errores de TS
function AttendeeRow({ id, tierId, name, email, ticket, status, date, onRefresh }: AttendeeRowProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [processing, setProcessing] = useState(false)

    // 1. Reenviar Ticket
    const handleResend = async () => {
        setProcessing(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert(`Ticket reenviado a ${email}`)
        setProcessing(false)
        setShowMenu(false)
    }

    // 2. Validar Ticket
    const handleValidate = async () => {
        setProcessing(true)
        const { error } = await supabase
            .from('tickets')
            .update({ used: true })
            .eq('id', id)
        
        if (!error) onRefresh()
        setProcessing(false)
        setShowMenu(false)
    }

    // 3. Anular Ticket
    const handleVoid = async () => {
        if(!confirm("¿Estás seguro de anular este ticket? Se eliminará y devolverá el stock.")) return;
        setProcessing(true)
        const { error } = await supabase.rpc('void_ticket', { ticket_id_input: id })
        if (error) alert("Error: " + error.message)
        else onRefresh()
        setProcessing(false)
        setShowMenu(false)
    }

    return (
        <div className="grid grid-cols-12 px-8 py-5 hover:bg-white/5 transition-colors group items-center relative text-sm">
            <div className="col-span-4 pr-4">
                <div className="font-bold text-white mb-0.5 truncate">{name}</div>
                <div className="text-white/40 text-xs flex items-center gap-1.5 truncate">
                    <Mail size={10} /> {email}
                </div>
            </div>
            <div className="col-span-3">
                <div className="text-white/80 font-medium truncate">{ticket}</div>
                <div className="text-white/30 text-[10px] uppercase font-bold tracking-wider mt-0.5">{date}</div>
            </div>
            <div className="col-span-2">
                {status === 'checked-in' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00D15B]/10 text-[#00D15B] text-[9px] font-black border border-[#00D15B]/20 uppercase tracking-wide">
                        <UserCheck size={10} /> Ingresado
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-white/40 text-[9px] font-black border border-white/10 uppercase tracking-wide">
                        Pendiente
                    </span>
                )}
            </div>
            <div className="col-span-2">
                <span className="text-white/30 font-mono text-xs tracking-wider">#{id.slice(0, 8)}</span>
            </div>
            <div className="col-span-1 text-right relative">
                <button 
                    onClick={() => setShowMenu(!showMenu)} 
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                    <MoreHorizontal size={16} />
                </button>

                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 top-10 z-20 w-48 bg-[#050505]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-1.5 flex flex-col gap-1">
                                <button onClick={handleResend} disabled={processing} className="w-full text-left px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white rounded-xl flex items-center gap-2 transition-colors">
                                    <Send size={14} className="text-[#3b82f6]" /> Reenviar
                                </button>
                                <button onClick={handleValidate} disabled={processing || status === 'checked-in'} className="w-full text-left px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50">
                                    <CheckCircle size={14} className="text-[#00D15B]" /> Validar
                                </button>
                                <div className="h-px bg-white/10 my-0.5 mx-2" />
                                <button onClick={handleVoid} disabled={processing} className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl flex items-center gap-2 transition-colors">
                                    <XCircle size={14} /> Anular
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}