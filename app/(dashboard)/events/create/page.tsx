'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Ticket, Sparkles, LayoutDashboard, Palette, Settings, Loader2, AlignLeft, ArrowLeft, CheckCircle2, AlertTriangle, Eye, FileText, ShieldAlert } from 'lucide-react'

const PanelFallback = () => (
  <div className="flex items-center justify-center h-64 text-white/30">
    <Loader2 className="animate-spin" size={24} />
  </div>
)

const LivePreview     = dynamic(() => import('@/components/hud/LivePreview'),     { ssr: false, loading: PanelFallback })
const GeneralPanel    = dynamic(() => import('@/components/hud/GeneralPanel'),    { ssr: false, loading: PanelFallback })
const TicketPanel     = dynamic(() => import('@/components/hud/TicketPanel'),     { ssr: false, loading: PanelFallback })
const DesignPanel     = dynamic(() => import('@/components/hud/DesignPanel'),     { ssr: false, loading: PanelFallback })
const SettingsPanel   = dynamic(() => import('@/components/hud/SettingsPanel'),   { ssr: false, loading: PanelFallback })
const ExperiencePanel = dynamic(() => import('@/components/hud/ExperiencePanel'), { ssr: false, loading: PanelFallback })
import { useEventStore } from '@/store/useEventStore'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface NavButtonProps {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
}

interface TicketTierDB {
    id: string
    name: string
    price: number
    total_stock: number
    sold_tickets: number
    description: string
    is_active: boolean
    nominative: boolean
    fake_sold: boolean
    sales_start_at: string
    sales_end_at: string
}

function safeUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0; 
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getCoordinates(address: string) {
  try {
    const queryAddress = address.toLowerCase().includes('chile') ? address : `${address}, Chile`;
    const query = encodeURIComponent(queryAddress);
    
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
        headers: { 'User-Agent': 'DyzGO-AdminPanel' }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.warn("No se pudieron obtener coordenadas automáticas:", error);
    return null;
  }
}

function CreateEventContent() {
  const { activeSection, setActiveSection, eventData } = useEventStore()
  const [loading, setLoading] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  
  const [authChecked, setAuthChecked] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false) 
  
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState<'public' | 'draft' | null>(null)
  
  const initialDataRef = useRef<string>('') 
  const isDirtyRef = useRef<boolean>(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('id')

  useEffect(() => {
    if (!eventId) {
      if (!initialDataRef.current) {
        initialDataRef.current = JSON.stringify(eventData);
      }
      setAuthChecked(true)
      return
    }

    if (eventId) {
      const loadEventData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/login'); return }

        const { data: event, error } = await supabase
          .from('events')
          .select('*, ticket_tiers(*)')
          .eq('id', eventId)
          .single()

        if (error || !event) {
          setUnauthorized(true)
          setAuthChecked(true) 
          return
        }

        const loadedState = {
            ...eventData, 
            id: event.id,
            name: event.title || '',
            venue: event.club_name || '',
            address: event.location || '',
            region: event.region || '',
            commune: event.commune || '',
            street: event.street || '',
            number: event.street_number || '',
            date: event.date || '',
            startTime: event.hour || '', 
            endTime: event.end_time || '',
            endDate: event.end_date || '', 
            description: event.description || '',
            coverImage: event.image_url,
            themeColor: event.theme_color || '#8A2BE2',
            category: event.category || '',
            dressCode: event.dress_code || '',
            minAgeMen: event.min_age_men || 0,
            minAgeWomen: event.min_age_women || 0,
            prohibitedItems: event.prohibited_items || [],
            socialLinks: { instagram: event.instagram_url || '' },
            status: event.status || 'draft', 
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tickets: event.ticket_tiers ? (event.ticket_tiers as any[]).map((t: TicketTierDB) => ({
              id: t.id,
              name: t.name,
              price: t.price,
              quantity: t.total_stock,
              sold: t.sold_tickets || 0, 
              description: t.description,
              isActive: t.is_active,
              isNominative: t.nominative,
              isGhostSoldOut: t.fake_sold,
              startDate: t.sales_start_at ? new Date(t.sales_start_at).toISOString().slice(0, 16) : '',
              endDate: t.sales_end_at ? new Date(t.sales_end_at).toISOString().slice(0, 16) : '',
              color: 'purple', 
              dependencyId: '' 
            })) : [],

            settings: {
              isPrivate: event.status === 'draft', 
              absorbFee: false,
              showRemaining: true,
              allowMarketplace: true,
              allowOverprice: false,
              showInstagram: !!event.instagram_url
            }
        };

        useEventStore.setState((state) => ({ ...state, eventData: loadedState }));
        initialDataRef.current = JSON.stringify(loadedState);
        setAuthChecked(true)
      }
      loadEventData()
    }
  }, [eventId])

  useEffect(() => {
      if (initialDataRef.current) {
          const currentString = JSON.stringify(eventData);
          const hasChanges = currentString !== initialDataRef.current;
          setIsDirty(hasChanges);
          isDirtyRef.current = hasChanges;
      }
  }, [eventData]);

  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (isDirty) {
              e.preventDefault();
              e.returnValue = '';
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
        if (isDirtyRef.current) {
            window.history.pushState(null, '', window.location.href);
            setShowUnsavedModal(true);
        } else {
            window.history.back();
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleBackNavigation = () => {
      if (isDirty) {
          setShowUnsavedModal(true);
      } else {
          router.push('/events');
      }
  };

  const handlePublish = async () => {
    if (!eventData.name?.trim()) return toast.error("Error: El nombre del evento es obligatorio.")
    if (!eventData.date || !eventData.startTime) return toast.error("Error: Fecha y hora son obligatorias.")
    if (!eventData.venue?.trim()) return toast.error("Error: El lugar es obligatorio.")
    if (eventData.tickets.length === 0) return toast.error("Error: Crea al menos un ticket.")

    for (const t of eventData.tickets) {
        const soldCount = t.sold || 0;
        if (t.quantity < soldCount) {
            toast.error(`Error: El stock del ticket "${t.name}" (${t.quantity}) no puede ser menor a la cantidad ya vendida (${soldCount}).`);
            return;
        }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Debes estar logueado")
        return
      }

      let finalImageUrl = eventData.coverImage
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileToUpload = (useEventStore.getState() as any).tempFile 

      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop()
        const fileName = `${user.id}/${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('flyers')
          .upload(fileName, fileToUpload)
        
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('flyers').getPublicUrl(fileName)
        finalImageUrl = publicUrl
      }

      let lat = null;
      let lon = null;
      
      if (eventData.address) {
          const coords = await getCoordinates(eventData.address);
          if (coords) {
              lat = coords.lat;
              lon = coords.lon;
          }
      }

      const finalStatus = eventData.settings?.isPrivate ? 'draft' : 'active'

      const eventPayload = {
        organizer_id: user.id, 
        title: eventData.name,
        region: eventData.region,
        commune: eventData.commune,
        street: eventData.street,
        street_number: eventData.number,
        latitude: lat, 
        longitude: lon, 
        club_name: eventData.venue,
        date: eventData.date,
        end_date: eventData.endDate || eventData.date,
        hour: eventData.startTime,
        end_time: eventData.endTime,
        image_url: finalImageUrl,
        description: eventData.description,
        music_genre: eventData.musicGenre,
        dress_code: eventData.dressCode,
        min_age_men: Number(eventData.minAgeMen),
        min_age_women: Number(eventData.minAgeWomen),
        prohibited_items: eventData.prohibitedItems,
        instagram_url: eventData.socialLinks.instagram,
        category: eventData.category,
        theme_color: eventData.themeColor,
        is_active: finalStatus === 'active',
        status: finalStatus 
      }

      let currentEventId = eventId

      if (eventId) {
        const { error } = await supabase
          .from('events')
          .update({
             ...eventPayload,
             organizer_id: undefined 
          })
          .eq('id', eventId)
        
        if (error) throw error
      } else {
        const { data: event, error: eventError } = await supabase.from('events').insert([eventPayload]).select().single()
        if (eventError) throw eventError
        currentEventId = event.id
      }

      if (currentEventId) {
          try {
            const { data: existingTiers } = await supabase
                .from('ticket_tiers')
                .select('id')
                .eq('event_id', currentEventId)

            if (existingTiers) {
                const uiIds = eventData.tickets.map(t => t.id).filter(id => id && id.length > 20) 
                const idsToDelete = existingTiers.map(t => t.id).filter(dbId => !uiIds.includes(dbId))

                if (idsToDelete.length > 0) {
                    await supabase.from('ticket_tiers').delete().in('id', idsToDelete)
                }
            }
          } catch (delErr) { console.warn(delErr) }
      }

      if (eventData.tickets.length > 0) {
        const ticketsToSave = eventData.tickets.map(t => {
            const startHourStr = t.startDate ? new Date(t.startDate).toTimeString().slice(0, 5) : null
            const endHourStr = t.endDate ? new Date(t.endDate).toTimeString().slice(0, 5) : null

            return {
                id: (t.id && t.id.length > 20) ? t.id : safeUUID(),
                event_id: currentEventId,
                name: t.name,
                price: t.price,
                total_stock: t.quantity,
                description: t.description,
                sales_end_at: t.endDate || null,
                is_active: t.isActive,
                nominative: t.isNominative,
                fake_sold: t.isGhostSoldOut,
                sales_start_at: t.startDate || null,
                hour_start: startHourStr,
                end_hour: endHourStr,
                type: t.type === 'courtesy' ? 'courtesy' : 'paid',
            }
        })

        const { error: ticketError } = await supabase.from('ticket_tiers').upsert(ticketsToSave)
        if (ticketError) throw ticketError
      }

      initialDataRef.current = JSON.stringify(eventData);
      setIsDirty(false);
      isDirtyRef.current = false;
      setShowUnsavedModal(false);

      if (!eventId) {
          setNewlyCreatedId(currentEventId);
          setShowStatusModal(true);
      } else {
          setActiveSection('settings')
          setShowSuccessToast(true)
          setTimeout(() => setShowSuccessToast(false), 3000)
      }

    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error("Error al guardar: " + message)
    } finally {
      setLoading(false)
    }
  }

  const renderActivePanel = () => {
    switch (activeSection) {
        case 'info': return <GeneralPanel />
        case 'experience': return <ExperiencePanel />
        case 'tickets': return <TicketPanel />
        case 'design': return <DesignPanel />
        case 'settings': return <SettingsPanel />
        default: return <GeneralPanel />
    }
  }

  const isCurrentlyPublic = !eventData.settings?.isPrivate

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-white overflow-hidden font-sans relative">
      <aside className="w-[450px] border-r border-white/5 flex flex-col z-20 bg-[#09090b] shadow-2xl">
        
        {/* BOTON VOLVER A MIS EVENTOS */}
        <div className="h-12 border-b border-white/5 flex items-center px-6 shrink-0 bg-white/[0.02]">
            <button onClick={handleBackNavigation} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase">
                <ArrowLeft size={14} /> Volver a Mis Eventos
            </button>
        </div>

        <div className="h-16 border-b border-white/5 flex items-center px-6 gap-3 shrink-0">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">
                {eventId ? 'Editando Evento' : 'DyzGO Creator'}
            </span>
        </div>

        <div className="flex flex-1 overflow-hidden">
             {/* BOTONERA LATERAL */}
             <div className={`w-20 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-zinc-950/50 transition-opacity ${(!authChecked || unauthorized) ? 'opacity-50 pointer-events-none' : ''}`}>
                <NavButton active={activeSection === 'info'} onClick={() => setActiveSection('info')} icon={<LayoutDashboard size={24} />} label="Info" />
                <NavButton active={activeSection === 'experience'} onClick={() => setActiveSection('experience')} icon={<AlignLeft size={24} />} label="Experiencia" />
                <NavButton active={activeSection === 'tickets'} onClick={() => setActiveSection('tickets')} icon={<Ticket size={24} />} label="Tickets" />
                <NavButton active={activeSection === 'design'} onClick={() => setActiveSection('design')} icon={<Palette size={24} />} label="Diseño" />
                <div className="h-px w-8 bg-white/10 my-2" />
                <NavButton active={activeSection === 'settings'} onClick={() => setActiveSection('settings')} icon={<Settings size={24} />} label="Ajustes" />
             </div>

             {/* ZONA DE PANELES */}
             <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-[#09090b] relative">
                {!authChecked ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                        <Loader2 className="animate-spin text-purple-600 mb-4" size={32} />
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest animate-pulse">Cargando...</p>
                    </div>
                ) : unauthorized ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                        <ShieldAlert size={48} className="text-red-500 mb-4" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Panel Bloqueado</h3>
                        <p className="text-xs text-white">No tienes permisos para editar este evento.</p>
                    </div>
                ) : (
                    renderActivePanel()
                )}
             </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-zinc-950/30">
            <button 
              onClick={handlePublish}
              disabled={loading || !authChecked || unauthorized}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={16} />}
                {loading ? "Guardando..." : (eventId ? "Guardar Cambios" : "Publicar Evento")}
            </button>
        </div>
      </aside>

      {/* ZONA DE PREVISUALIZACIÓN CENTRAL */}
      <main className="flex-1 relative flex items-center justify-center bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-[#050505] to-black"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        {!authChecked ? (
            <div className="z-10 flex flex-col items-center gap-4 animate-in fade-in duration-500">
                <Loader2 className="animate-spin text-white/20" size={64} />
            </div>
        ) : unauthorized ? (
            <div className="z-10 flex flex-col items-center gap-6 text-center animate-in zoom-in-95 duration-500 px-10">
                <div className="p-6 rounded-full bg-red-500/5 border border-red-500/10 mb-2">
                    <ShieldAlert size={80} className="text-red-500" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Acceso Restringido</h2>
                <p className="text-zinc-400 max-w-md text-sm">
                    El sistema de seguridad ha bloqueado el acceso a este evento porque la URL no te pertenece o no tienes los permisos de organización.
                </p>
            </div>
        ) : (
            <div className="z-10 animate-in zoom-in-95 duration-500"><LivePreview /></div>
        )}
      </main>

      {/* --- MODALES --- */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-[#09090b]/80 backdrop-blur-xl border border-[#00D15B]/30 text-white px-6 py-3 rounded-full shadow-[0_10px_40px_-10px_rgba(0,209,91,0.3)] flex items-center gap-3">
                <div className="bg-[#00D15B] rounded-full p-0.5">
                    <CheckCircle2 size={14} className="text-black" strokeWidth={3} />
                </div>
                <span className="text-xs font-bold tracking-wide">Cambios guardados correctamente</span>
            </div>
        </div>
      )}

      {showUnsavedModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowUnsavedModal(false)} />
            <div className="relative w-full max-w-sm bg-[#09090b] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 text-center">
                <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500 border border-yellow-500/20 mb-6 inline-block shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Cambios sin guardar</h3>
                <p className="text-white/40 text-xs font-medium mb-8 leading-relaxed">
                    Tienes modificaciones pendientes. <br/>Si sales ahora, se perderán permanentemente.
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handlePublish} 
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white font-black text-xs hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle2 size={14}/>} Guardar Cambios
                    </button>
                    <button 
                        onClick={() => { setIsDirty(false); isDirtyRef.current = false; router.push('/events'); }} 
                        className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
                    >
                        Salir y perder cambios
                    </button>
                </div>
            </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm bg-[#09090b] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 text-center">
                <div className={`p-4 rounded-full mb-6 inline-block shadow-[0_0_30px_rgba(0,0,0,0.2)] border ${isCurrentlyPublic ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                    {isCurrentlyPublic ? <Eye size={32} /> : <FileText size={32} />}
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">¡Evento Creado!</h3>
                <p className="text-white/40 text-xs font-medium mb-8 leading-relaxed">
                    {isCurrentlyPublic 
                        ? 'Tu evento ha sido creado y actualmente está configurado como Público. ¿Deseas mantenerlo así o pasarlo a borrador?'
                        : 'Tu evento ha sido creado y actualmente está configurado como Borrador. ¿Deseas publicarlo ahora o dejarlo así?'}
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={async () => {
                            setStatusLoading('public');
                            setShowStatusModal(false);
                            router.push('/events');
                        }}
                        disabled={statusLoading !== null}
                        className={`w-full py-4 rounded-2xl text-white font-black text-xs hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${isCurrentlyPublic ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-900/20' : 'bg-gradient-to-r from-[#8A2BE2] to-[#7c3aed] shadow-purple-900/20'}`}
                    >
                        {statusLoading === 'public' ? <Loader2 className="animate-spin" size={14}/> : (isCurrentlyPublic ? 'Mantener Público' : 'Dejar en Borrador')}
                    </button>
                    <button 
                        onClick={async () => {
                            setStatusLoading('draft');
                            const targetStatus = isCurrentlyPublic ? 'draft' : 'active';
                            if (newlyCreatedId) {
                                await supabase.from('events').update({ status: targetStatus, is_active: targetStatus === 'active' }).eq('id', newlyCreatedId);
                            }
                            setShowStatusModal(false);
                            router.push('/events');
                        }}
                        disabled={statusLoading !== null}
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 font-bold text-xs hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {statusLoading === 'draft' ? <Loader2 className="animate-spin" size={14}/> : (isCurrentlyPublic ? 'Cambiar a Borrador' : 'Hacer Público')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
    return (
        <button onClick={onClick} className={`group flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'scale-105' : 'opacity-50 hover:opacity-100'}`}>
            <div className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-zinc-800 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-zinc-400 group-hover:bg-zinc-900'}`}>{icon}</div>
            <span className={`text-[10px] font-medium transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
        </button>
    )
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#09090b] text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-purple-600" size={40} />
                <p className="text-sm text-zinc-400 animate-pulse">Cargando editor...</p>
            </div>
        </div>
    }>
        <CreateEventContent />
    </Suspense>
  )
}