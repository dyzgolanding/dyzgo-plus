'use client'

import React, { useState, useEffect, Suspense } from 'react'
import LivePreview from '@/components/hud/LivePreview'

// Imports de Paneles
import GeneralPanel from '@/components/hud/GeneralPanel'
import TicketPanel from '@/components/hud/TicketPanel'
import DesignPanel from '@/components/hud/DesignPanel'
import SettingsPanel from '@/components/hud/SettingsPanel'
import ExperiencePanel from '@/components/hud/ExperiencePanel' 

import { Ticket, Sparkles, LayoutDashboard, Palette, Settings, Loader2, AlignLeft } from 'lucide-react'
import { useEventStore } from '@/store/useEventStore'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

// --- INTERFACES PARA EVITAR 'ANY' ---
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

// --- GENERADOR DE ID SEGURO ---
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

// --- FUNCIÓN DE GEOLOCALIZACIÓN (LIMPIA) ---
async function getCoordinates(address: string) {
  try {
    const queryAddress = address.toLowerCase().includes('chile') ? address : `${address}, Chile`;
    const query = encodeURIComponent(queryAddress);
    
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
        headers: {
            'User-Agent': 'DyzGO-AdminPanel' 
        }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };
    }
    return null;
  } catch (error) {
    console.warn("No se pudieron obtener coordenadas automáticas:", error);
    return null;
  }
}

// --- COMPONENTE INTERNO CON LA LÓGICA (CLIENT COMPONENT) ---
function CreateEventContent() {
  const { activeSection, setActiveSection, eventData } = useEventStore()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('id')

  // --- LÓGICA DE CARGA ---
  useEffect(() => {
    if (eventId) {
      const loadEventData = async () => {
        const { data: event, error } = await supabase
          .from('events')
          .select('*, ticket_tiers(*)')
          .eq('id', eventId)
          .single()

        if (event && !error) {
          useEventStore.setState((state) => ({
            ...state,
            eventData: {
              ...state.eventData,
              id: event.id,
              name: event.title || '',
              venue: event.club_name || '',
              address: event.location || '',
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
                isPrivate: false,
                absorbFee: false,
                showRemaining: true,
                allowMarketplace: true,
                allowOverprice: false,
                showInstagram: !!event.instagram_url
              }
            }
          }))
        }
      }
      loadEventData()
    }
  }, [eventId])

  // --- LÓGICA DE PUBLICACIÓN ---
  const handlePublish = async () => {
    if (!eventData.name?.trim()) return alert("Error: El nombre del evento es obligatorio.")
    if (!eventData.date || !eventData.startTime) return alert("Error: Fecha y hora son obligatorias.")
    if (!eventData.venue?.trim()) return alert("Error: El lugar es obligatorio.")
    if (eventData.tickets.length === 0) return alert("Error: Crea al menos un ticket.")
    
    for (const t of eventData.tickets) {
        const soldCount = t.sold || 0;
        if (t.quantity < soldCount) {
            alert(`Error: El stock del ticket "${t.name}" (${t.quantity}) no puede ser menor a la cantidad ya vendida (${soldCount}).`);
            return;
        }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Debes estar logueado")
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

      // 2. Guardar Evento
      const eventPayload = {
        organizer_id: user.id,
        title: eventData.name,
        location: eventData.address,
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
        is_active: true
      }

      let currentEventId = eventId

      if (eventId) {
        const { error } = await supabase.from('events').update(eventPayload).eq('id', eventId)
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
            }
        })

        const { error: ticketError } = await supabase.from('ticket_tiers').upsert(ticketsToSave)
        if (ticketError) throw ticketError
      }

      alert(eventId ? "¡Evento actualizado exitosamente!" : "¡Evento publicado exitosamente!")
      router.push('/events')

    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Error desconocido'
      alert("Error al guardar: " + message)
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

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-white overflow-hidden font-sans">
      <aside className="w-[450px] border-r border-white/5 flex flex-col z-20 bg-[#09090b] shadow-2xl">
        <div className="h-16 border-b border-white/5 flex items-center px-6 gap-3 shrink-0">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">
                {eventId ? 'Editando Evento' : 'DyzGO Creator'}
            </span>
        </div>

        <div className="flex flex-1 overflow-hidden">
             <div className="w-20 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-zinc-950/50">
                <NavButton active={activeSection === 'info'} onClick={() => setActiveSection('info')} icon={<LayoutDashboard size={24} />} label="Info" />
                <NavButton active={activeSection === 'experience'} onClick={() => setActiveSection('experience')} icon={<AlignLeft size={24} />} label="Experiencia" />
                <NavButton active={activeSection === 'tickets'} onClick={() => setActiveSection('tickets')} icon={<Ticket size={24} />} label="Tickets" />
                <NavButton active={activeSection === 'design'} onClick={() => setActiveSection('design')} icon={<Palette size={24} />} label="Diseño" />
                <div className="h-px w-8 bg-white/10 my-2" />
                <NavButton active={activeSection === 'settings'} onClick={() => setActiveSection('settings')} icon={<Settings size={24} />} label="Ajustes" />
             </div>
             <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-[#09090b]">
                {renderActivePanel()}
             </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-zinc-950/30">
            <button 
              onClick={handlePublish}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? "Guardando..." : (eventId ? "Guardar Cambios" : "Publicar Evento")}
            </button>
        </div>
      </aside>

      <main className="flex-1 relative flex items-center justify-center bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-[#050505] to-black"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="z-10 animate-in zoom-in-95 duration-500"><LivePreview /></div>
      </main>
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

// --- EXPORTACIÓN PRINCIPAL ENVUELTA EN SUSPENSE ---
// Esto soluciona el error "useSearchParams() should be wrapped in a suspense boundary"
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