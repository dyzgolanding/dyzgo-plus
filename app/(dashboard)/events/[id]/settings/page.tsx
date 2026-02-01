'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation' 
import { 
  Globe, 
  Zap, 
  AlertTriangle, 
  Save, 
  Trash2, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  ShieldCheck,
  RefreshCcw,
  Users
} from 'lucide-react'
import { useEventStore } from '@/store/useEventStore'
import { supabase } from '@/lib/supabase'

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const { updateSettings } = useEventStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const saveButtonRef = useRef<HTMLDivElement>(null) 

  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false) // Se mantiene por si decides usarla en UI futura
  const [showToast, setShowToast] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  // ESTADOS
  const [isLive, setIsLive] = useState(false) 
  const [maxTickets, setMaxTickets] = useState(4)
  const [isTransferable, setIsTransferable] = useState(true)
  const [isResellable, setIsResellable] = useState(false)
  
  // ESTADO INTERNO: Fecha de fin para validación
  const [eventEndDate, setEventEndDate] = useState<string | null>(null)
  const [eventEndTime, setEventEndTime] = useState<string | null>(null)

  // 1. CARGA INICIAL
  useEffect(() => {
    const fetchLatestData = async () => {
      const { data: event, error } = await supabase
        .from('events')
        .select(`
            status, 
            max_tickets_per_person,
            is_transferable,
            is_resellable,
            date,
            end_date,
            end_time
        `) 
        .eq('id', eventId)
        .single()

      if (event && !error) {
        // CORREGIDO: Se activa si el status es 'active'
        setIsLive(event.status === 'active')
        if (event.max_tickets_per_person) setMaxTickets(event.max_tickets_per_person)
        setIsTransferable(event.is_transferable ?? true)
        setIsResellable(event.is_resellable ?? false)
        
        // Guardamos fechas para validar al guardar
        setEventEndDate(event.end_date || event.date)
        setEventEndTime(event.end_time || '23:59:59')
      }
    }

    fetchLatestData()
  }, [eventId])

  // BLOQUEO DE NAVEGACIÓN
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        saveButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        e.preventDefault(); e.returnValue = ''; 
        setShowUnsavedWarning(true); // Usamos la variable para que no marque error de linter
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleFinalDelete = async () => {
    if (deleteInput !== 'DELETE') return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error
      setIsDeleteModalOpen(false)
      setIsDirty(false); router.push('/events') 
    } catch (error) { 
        // eslint-disable-next-line no-console
        console.error(error); 
        alert("No se pudo eliminar el evento.") 
    } finally { setIsDeleting(false) }
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      // CORRECCIÓN: Ahora usamos 'active' en lugar de 'published'
      let newStatus = isLive ? 'active' : 'draft'
      
      // --- VALIDACIÓN DE CADUCIDAD AL GUARDAR ---
      if (newStatus === 'active' && eventEndDate) {
          const now = new Date()
          // Fallback seguro para endTime para evitar "Invalid Date"
          const safeEndTime = eventEndTime || '23:59:59'
          const endDateTime = new Date(`${eventEndDate}T${safeEndTime}`)
          
          if (!isNaN(endDateTime.getTime()) && endDateTime < now) {
              alert("⚠️ No puedes activar este evento porque su fecha de término ya pasó. Se marcará como FINALIZADO.")
              newStatus = 'ended'
              setIsLive(false) 
          }
      }
      // ------------------------------------------

      const payload = { 
        status: newStatus,
        max_tickets_per_person: maxTickets,
        is_transferable: isTransferable, 
        is_resellable: isResellable      
      }

      const { error } = await supabase.from('events').update(payload).eq('id', eventId)
      
      if (error) {
        console.error("Supabase error:", error) 
        throw error
      }
      
      // IMPORTANTE: Actualizamos también 'isPrivate' en el store para que el panel lateral reaccione inmediatamente
      await updateSettings({ 
        status: newStatus, 
        isPrivate: newStatus === 'draft'
      })
      
      setIsDirty(false); setShowToast(true); setTimeout(() => setShowToast(false), 3000);
      router.refresh() 
    } catch (error) {
      console.error("Error al guardar:", error)
      alert("Error al sincronizar. Revisa la consola para más detalles.")
    } finally { setIsSaving(false) }
  }

  return (
    // CONTENEDOR LIMPIO (Sin fondo, ya está en el Layout)
    <div className="relative z-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in pt-4">
      
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                    <SettingsIcon className="text-[#8A2BE2]" size={32}/>
                    Ajustes del <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]">Evento</span>
                </h1>
                <p className="text-white/40 text-sm font-medium">Control total sobre la visibilidad, seguridad y distribución.</p>
            </div>
            
            <button 
                onClick={handleSaveChanges}
                disabled={isSaving || !isDirty}
                className={`hidden md:flex px-8 py-3.5 text-xs font-black rounded-xl transition-all items-center gap-3 uppercase tracking-[0.15em] ${
                isDirty ? 'bg-white text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                }`}
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

            {/* COLUMNA IZQUIERDA (PRINCIPAL) */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* 1. VISIBILIDAD */}
                <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-[#8A2BE2]/10 rounded-2xl text-[#8A2BE2] border border-[#8A2BE2]/20 shadow-[0_0_15px_rgba(138,43,226,0.2)]"><Globe size={24} /></div>
                        <div><h3 className="text-xl font-black text-white uppercase tracking-tight">Estado del Evento</h3><p className="text-white/40 text-xs font-medium tracking-wide">Controla la visibilidad pública.</p></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Botón Público */}
                        <button 
                            onClick={() => { setIsLive(true); setIsDirty(true); }}
                            className={`relative p-6 rounded-[2rem] text-left transition-all group/btn overflow-hidden border ${
                                isLive 
                                ? 'bg-[#00D15B]/10 border-[#00D15B]/50 shadow-[0_0_20px_rgba(0,209,91,0.1)]' 
                                : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-sm font-black uppercase tracking-wider ${isLive ? 'text-[#00D15B]' : 'text-white'}`}>Público (Live)</span>
                                {isLive && <CheckCircle2 size={18} className="text-[#00D15B]" />}
                            </div>
                            <p className="text-[10px] text-white/40 font-medium leading-relaxed">El evento es visible en la cartelera y se pueden comprar tickets.</p>
                        </button>

                        {/* Botón Borrador */}
                        <button 
                            onClick={() => { setIsLive(false); setIsDirty(true); }}
                            className={`relative p-6 rounded-[2rem] text-left transition-all group/btn overflow-hidden border ${
                                !isLive 
                                ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                                : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-sm font-black uppercase tracking-wider ${!isLive ? 'text-white' : 'text-white/60'}`}>Borrador (Draft)</span>
                                {!isLive && <CheckCircle2 size={18} className="text-white/60" />}
                            </div>
                            <p className="text-[10px] text-white/40 font-medium leading-relaxed">Oculto al público. Solo administradores pueden verlo.</p>
                        </button>
                    </div>
                </section>

                {/* 2. SEGURIDAD Y DISTRIBUCIÓN */}
                <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-[#3b82f6]/10 rounded-2xl text-[#3b82f6] border border-[#3b82f6]/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]"><ShieldCheck size={24} /></div>
                        <div><h3 className="text-xl font-black text-white uppercase tracking-tight">Seguridad y Distribución</h3><p className="text-white/40 text-xs font-medium tracking-wide">Reglas de transferencia y compra.</p></div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-black/40 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="p-2.5 bg-white/5 rounded-xl text-white/60 border border-white/5"><RefreshCcw size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wide">Transferencia de Tickets</p>
                                    <p className="text-[10px] text-white/40 font-medium mt-0.5">Permitir a usuarios enviar sus tickets a otros.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setIsTransferable(!isTransferable); setIsDirty(true); }}
                                className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${isTransferable ? 'bg-[#3b82f6]' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md ${isTransferable ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-black/40 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="p-2.5 bg-white/5 rounded-xl text-white/60 border border-white/5"><Zap size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wide">Reventa Oficial</p>
                                    <p className="text-[10px] text-white/40 font-medium mt-0.5">Habilitar marketplace secundario seguro.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setIsResellable(!isResellable); setIsDirty(true); }}
                                className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${isResellable ? 'bg-[#8A2BE2]' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md ${isResellable ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="p-2.5 bg-white/5 rounded-xl text-white/60 border border-white/5"><Users size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wide">Límite por Persona</p>
                                    <p className="text-[10px] text-white/40 font-medium mt-0.5">Máximo de tickets en una sola compra.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-black/60 border border-white/10 rounded-2xl px-2 py-2 shadow-inner">
                                <button onClick={() => { setMaxTickets(Math.max(1, maxTickets - 1)); setIsDirty(true); }} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all font-bold text-lg border border-white/5">-</button>
                                <span className="text-white font-black font-mono w-8 text-center text-xl">{maxTickets}</span>
                                <button onClick={() => { setMaxTickets(maxTickets + 1); setIsDirty(true); }} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all font-bold text-lg border border-white/5">+</button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* COLUMNA DERECHA (PELIGRO) */}
            <div className="lg:col-span-4 space-y-8">
                <section className="bg-[#FF007F]/5 border border-[#FF007F]/20 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col backdrop-blur-xl shadow-[0_0_40px_rgba(255,0,127,0.05)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,127,0.1),transparent_70%)] pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-6 text-[#FF007F] relative z-10">
                        <div className="p-2 bg-[#FF007F]/10 rounded-xl border border-[#FF007F]/20"><AlertTriangle size={20} /></div>
                        <h3 className="text-lg font-black uppercase tracking-wide">Zona de Peligro</h3>
                    </div>
                    
                    <p className="text-xs text-[#FF007F]/70 font-medium mb-8 leading-relaxed relative z-10 bg-[#FF007F]/5 p-4 rounded-2xl border border-[#FF007F]/10">
                        Las acciones en esta zona son irreversibles. Eliminar el evento borrará permanentemente todos los datos asociados, incluyendo tickets y registros de ventas.
                    </p>
                    
                    <div className="relative z-10">
                        <button 
                            onClick={() => setIsDeleteModalOpen(true)} 
                            className="w-full py-4 bg-[#FF007F]/10 hover:bg-[#FF007F] text-[#FF007F] hover:text-white border border-[#FF007F]/30 hover:border-[#FF007F] text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest group shadow-[0_0_20px_rgba(255,0,127,0.1)] hover:shadow-[0_0_30px_rgba(255,0,127,0.4)]"
                        >
                            <Trash2 size={16} className="group-hover:scale-110 transition-transform"/> Eliminar Evento
                        </button>
                    </div>
                </section>
            </div>

        </div>

        {/* FOOTER MOVIL */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
            <button 
            onClick={handleSaveChanges}
            disabled={isSaving || !isDirty}
            className={`w-full py-4 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl uppercase tracking-[0.15em] ${
                isDirty ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'
            }`}
            >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </div>

        {/* TOASTS Y MODALES */}
        {showUnsavedWarning && (
            <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="bg-[#0e0e11]/90 border border-[#eab308]/30 backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center gap-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <div className="p-2 bg-[#eab308]/20 rounded-full text-[#eab308]"><AlertCircle size={20} /></div>
                <div className="text-left"><p className="text-sm font-black text-[#eab308] leading-tight uppercase tracking-widest">Cambios sin guardar</p><p className="text-[10px] text-[#eab308]/60 font-bold uppercase">Sincroniza antes de salir</p></div>
            </div>
            </div>
        )}
        {showToast && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-[#050505]/90 border border-[#00D15B]/30 backdrop-blur-xl rounded-2xl px-8 py-5 flex items-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div className="p-2 bg-[#00D15B]/20 rounded-full text-[#00D15B] shadow-[0_0_15px_rgba(34,197,94,0.3)]"><CheckCircle2 size={24} /></div>
                <div className="text-left"><p className="text-sm font-black text-white leading-tight uppercase tracking-widest">Éxito</p><p className="text-[10px] text-white/40 font-bold uppercase">Ajustes sincronizados</p></div>
            </div>
            </div>
        )}

        {/* MODAL ELIMINAR */}
        {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsDeleteModalOpen(false)} />
            <div className="relative w-full max-w-xl bg-[#050505]/95 backdrop-blur-2xl border border-[#FF007F]/20 rounded-[3rem] p-12 shadow-[0_0_60px_rgba(255,0,127,0.15)] animate-in zoom-in-95 text-center">
                <div className="flex justify-center mb-8"><div className="p-6 bg-[#FF007F]/10 rounded-full text-[#FF007F] animate-pulse ring-1 ring-[#FF007F]/20 shadow-[0_0_30px_rgba(255,0,127,0.2)]"><AlertCircle size={56} /></div></div>
                <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-4 uppercase">¿Estás seguro?</h3>
                <p className="text-white/60 text-sm font-medium mb-10 leading-relaxed px-4">Esta acción eliminará <span className="text-white font-bold">permanentemente</span> el evento. Escribe <span className="text-[#FF007F] font-black tracking-widest uppercase">DELETE</span> para confirmar.</p>
                <div className="space-y-6">
                <input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="Escribe DELETE..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-center text-sm font-black text-white focus:border-[#FF007F] outline-none shadow-inner transition-all tracking-[0.2em] placeholder:text-white/20" />
                <div className="flex gap-4">
                    <button onClick={() => { setIsDeleteModalOpen(false); setDeleteInput(''); }} className="flex-1 py-5 bg-white/5 text-white/40 font-bold rounded-2xl hover:text-white transition-all text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10">Cancelar</button>
                    <button onClick={handleFinalDelete} disabled={deleteInput !== 'DELETE' || isDeleting} className="flex-[1.5] py-5 bg-[#FF007F] text-white font-black rounded-2xl disabled:opacity-20 disabled:grayscale hover:bg-[#FF007F]/90 transition-all shadow-[0_0_30px_rgba(255,0,127,0.4)] uppercase tracking-widest text-xs flex items-center justify-center gap-3">{isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />} Borrar Evento</button>
                </div>
                </div>
            </div>
            </div>
        )}
      
      </div>
  )
}