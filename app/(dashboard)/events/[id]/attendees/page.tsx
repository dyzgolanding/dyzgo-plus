'use client'

import React, { use, useEffect, useState } from 'react'
import { Search, Download, UserCheck, Mail, RefreshCw, Loader2, MoreHorizontal, CheckCircle, XCircle, Send, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { resendTicketEmail } from '@/app/actions/resend-ticket-email'

// Definimos interfaces para evitar el error "no-explicit-any" que bloquea Vercel
interface Attendee {
  id: string
  created_at: string
  used: boolean
  // Campos necesarios para el reenvío de email (mismos que usa send-ticket-email)
  user_id?: string
  qr_hash?: string
  status?: string
  // Campos opcionales para invitados
  guest_name?: string
  guest_email?: string
  tier_id?: string
  ticket_type?: string
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
  ticketStatus?: string   // status real del ticket en DB (para validar si puede reenviarse)
  onRefresh: () => void
}

const PAGE_SIZE = 50

export default function AttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Carga real con paginación server-side
  const fetchAttendees = async (currentPage = 0) => {
    setLoading(true)
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error, count } = await supabase
      .from('tickets')
      .select('*, ticket_tiers(name), profiles(full_name, email)', { count: 'exact' })
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (data) setAttendees(data as unknown as Attendee[])
    if (error) console.error("Error cargando asistentes:", error)
    setTotalCount(count ?? 0)
    setLoading(false)
  }

  useEffect(() => {
    fetchAttendees(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, page])

  // Exportar CSV real
  const handleExport = () => {
    if (attendees.length === 0) return toast.info('No hay asistentes para exportar.')
    const headers = 'Nombre,Email,Tipo de Ticket,Estado,Fecha'
    const rows = attendees.map(a => {
      const name = a.profiles?.full_name || a.guest_name || 'Sin Nombre'
      const email = a.profiles?.email || a.guest_email || 'Sin Email'
      const ticket = a.ticket_tiers?.name || 'General'
      const status = a.used ? 'Ingresado' : 'Pendiente'
      const date = new Date(a.created_at).toLocaleDateString('es-CL')
      return `"${name}","${email}","${ticket}","${status}","${date}"`
    })
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asistentes_${eventId}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filtro de búsqueda local (sobre la página actual)
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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    // CONTENEDOR LIMPIO
    <div className="relative z-10 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in pt-4">
        
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
                    onClick={() => fetchAttendees(page)}
                    className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                    title="Sincronizar"
                >
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
                </button>
                
                <button 
                    onClick={handleExport}
                    className="h-12 px-6 bg-white text-black font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                    <Download size={16} /> Exportar ({totalCount})
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
                                ticketStatus={item.status}  
                                date={new Date(item.created_at).toLocaleDateString()}
                                onRefresh={fetchAttendees} 
                            />
                        )
                    })
                )}
            </div>
        </div>

        {/* FOOTER PAGINACIÓN */}
        {totalCount > PAGE_SIZE && (
            <div className="flex justify-between items-center px-4 pt-2">
                <span className="text-xs font-medium text-white/40">
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount} asistentes
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="px-3 py-2 text-xs text-white/40 font-medium">
                        {page + 1} / {totalPages}
                    </span>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page + 1 >= totalPages || loading}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        )}

    </div>
  )
}

// Se tiparon las props para evitar errores de TS
function AttendeeRow({ id, tierId, name, email, ticket, status, date, ticketStatus, onRefresh }: AttendeeRowProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [processing, setProcessing] = useState(false)

    // 1. Reenviar Ticket — llama a la misma Edge Function que usa webpay al confirmar el pago
    const handleResend = async () => {
        if (ticketStatus !== 'valid') {
            toast.warning('Solo se puede reenviar el correo de tickets confirmados.')
            setShowMenu(false)
            return
        }
        setProcessing(true)
        setShowMenu(false)
        const toastId = toast.loading(`Reenviando ticket a ${email}...`)
        const result = await resendTicketEmail(id)
        if (result.success) {
            toast.success(`Ticket reenviado a ${email}`, { id: toastId })
        } else {
            toast.error(result.error || 'Error al reenviar el ticket', { id: toastId })
        }
        setProcessing(false)
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
        toast.warning('¿Anular este ticket? Se eliminará y devolverá el stock.', {
            action: {
                label: 'Anular',
                onClick: async () => {
                    setProcessing(true)
                    const { error } = await supabase.rpc('void_ticket', { ticket_id_input: id })
                    if (error) toast.error("Error: " + error.message)
                    else { toast.success('Ticket anulado.'); onRefresh() }
                    setProcessing(false)
                    setShowMenu(false)
                }
            },
            cancel: { label: 'Cancelar', onClick: () => {} }
        })
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