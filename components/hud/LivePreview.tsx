'use client'
import React from 'react'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Instagram, 
  Shirt, 
  Ban, 
  User, 
  Ticket, 
  ArrowLeft, 
  Info, 
  Minus, 
  Plus, 
  Bookmark, 
  Signal, 
  Wifi, 
  Battery, 
  Music, 
  ArrowRight, 
  Layers, 
  ChevronRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react'
import { useEventStore } from '@/store/useEventStore'

const COLORS = {
  neonPink: '#FF00FF',
  neonPurple: '#8A2BE2',
  glassBg: 'rgba(255, 255, 255, 0.05)',
  textZinc: '#a1a1aa'
}

export default function LivePreview() {
  // @ts-ignore
  const { eventData, activeSection } = useEventStore()

  // @ts-ignore
  const accent = eventData.accentColor || '#d946ef' 
  // @ts-ignore
  const radius = eventData.borderRadius || 'rounded-[2rem]' 
  // @ts-ignore
  const font = eventData.fontStyle || 'font-sans'
  
  // COLORES DINÁMICOS
  const cardBg = (eventData as any).cardBackgroundColor || '#1a0b2e'
  const borderCol = (eventData as any).borderColor || '#8A2BE2'

  if (activeSection === 'tickets') {
    return <TicketSelectionPreview eventData={eventData} accent={accent} radius={radius} font={font} cardBg={cardBg} borderCol={borderCol} />
  }

  const getDay = (dateStr: string) => {
    if (!dateStr) return '31'
    const date = new Date(dateStr)
    const day = date.getUTCDate()
    return day
  }

  const getMonth = (dateStr: string) => {
    if (!dateStr) return 'ENE'
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
    return months[new Date(dateStr).getUTCMonth()]
  }

  const minPrice = eventData.tickets.length > 0 
    ? Math.min(...eventData.tickets.map(t => t.price)) 
    : 5000 

  const GOOGLE_API_KEY = "AIzaSyDOZ9gVgcmAr19Ol35AzFGiuYR_8v8Mx-4"
  const mapQuery = encodeURIComponent(eventData.address || 'Santiago, Chile')
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_API_KEY}&q=${mapQuery}&maptype=satellite&zoom=15&language=es`

  return (
    <div className={`w-[390px] h-[820px] bg-black rounded-[55px] border-[6px] border-black shadow-[0_0_0_4px_#27272a,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col select-none ring-1 ring-white/10 ${font}`}>
      
      {/* FONDO GRADIENTE LINEAL */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out z-0"
        style={{
            // @ts-ignore
            background: `linear-gradient(180deg, ${eventData.themeColor} 0%, ${eventData.themeColorEnd || '#090014'} 100%)`,
        }}
      />

      {/* BARRA ESTADO */}
      <div className="h-14 w-full flex justify-between items-start px-7 pt-4 absolute top-0 z-50 pointer-events-none">
          <span className="text-white text-[15px] font-semibold tracking-wide w-12 text-center">01:49</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[120px] h-[35px] bg-black rounded-full flex items-center justify-center z-50">
                <div className="w-20 h-full flex items-center justify-end pr-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a1a1a] shadow-inner" />
                </div>
          </div>
          <div className="flex items-center gap-1.5 w-12 justify-end text-white">
             <Signal size={16} strokeWidth={2.5} />
             <Wifi size={16} strokeWidth={2.5} />
             <div className="flex items-center justify-center bg-white/20 px-1 rounded-sm">
                <span className="text-[10px] font-bold mr-0.5">38</span>
             </div>
          </div>
      </div>

      {/* HEADER FLOTANTE (Usando cardBg y borderCol para el botón, pero Icono BLANCO) */}
      <div className="absolute top-14 left-0 w-full px-5 flex justify-between items-center z-50 pointer-events-none">
          <div 
            className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border"
            style={{ backgroundColor: `${cardBg}CC`, borderColor: `${borderCol}80` }}
          >
             <ArrowLeft size={20} color="white" />
          </div>
          <div 
            className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border"
            style={{ backgroundColor: `${cardBg}CC`, borderColor: `${borderCol}80` }}
          >
             <Bookmark size={20} color="white" />
          </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-28 pb-32 relative z-10">
          
          <div className="px-5 mb-6">
              <div className="aspect-square w-full rounded-[2.5rem] overflow-hidden relative bg-zinc-900 border border-white/10 shadow-2xl">
                 {eventData.coverImage ? (
                    <img src={eventData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 font-medium">Sin Imagen</div>
                 )}
              </div>
          </div>

          <div className="px-6 mb-8">
              <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                      <h1 className="text-[28px] leading-8 font-black text-white italic uppercase tracking-tight mb-2">
                          {eventData.name || 'NOMBRE DEL EVENTO'}
                      </h1>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                          <MapPin size={14} color={borderCol} />
                          <span className="text-xs font-medium truncate">{eventData.venue || 'Ubicación'}</span>
                      </div>
                  </div>
                  
                  {/* FECHA BADGE - TEXTO BLANCO */}
                  <div 
                    className="rounded-2xl w-[70px] h-[70px] flex flex-col items-center justify-center backdrop-blur-sm border"
                    style={{ backgroundColor: `${cardBg}90`, borderColor: `${borderCol}60` }}
                  >
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">{getMonth(eventData.date)}</span>
                      <span className="text-2xl font-black text-white">{getDay(eventData.date)}</span>
                  </div>
              </div>

              {/* TAGS PILLS - TEXTO BLANCO */}
              <div className="flex flex-nowrap gap-2 mt-5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                  <div 
                    className="shrink-0 px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                    style={{ backgroundColor: `${cardBg}90`, borderColor: `${borderCol}60` }}
                  >
                      <Clock size={10} color="white" />
                      <span className="text-[9px] font-bold text-white">
                          {eventData.startTime || '22:30'} - {eventData.endTime || '04:00'}
                      </span>
                  </div>
                  <div 
                    className="shrink-0 px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                      <Music size={10} color="white" />
                      <span className="text-[9px] font-bold text-white uppercase">{eventData.category || 'GENERAL'}</span>
                  </div>
              </div>
          </div>

          <div className="w-full h-px bg-white/5 my-6" />

          {/* ESTADO & BRAND */}
          <div className="px-6 space-y-4 mb-8">
              <div 
                className="w-full border rounded-[1.5rem] p-5 relative overflow-hidden"
                style={{ backgroundColor: `${cardBg}90`, borderColor: `${borderCol}60` }}
              >
                  <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                          <Clock size={14} className="text-zinc-400" />
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">SIN DATOS</span>
                      </div>
                      <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold text-zinc-500">OFF</div>
                  </div>
                  <p className="text-zinc-300 text-sm font-medium mt-1">Acceso tranquilo por ahora.</p>
                  
                  <div 
                    className="mt-4 border rounded-xl p-3 flex items-center gap-2"
                    style={{ backgroundColor: `${cardBg}`, borderColor: `${borderCol}40` }}
                  >
                      <Info size={14} className="text-zinc-400" />
                      <span className="text-xs text-zinc-300 font-medium">Llega cuando quieras, está despejado.</span>
                  </div>

                  <div className="mt-4 flex justify-center items-center gap-1">
                      <span className="text-[10px] font-bold text-white">Toca para ver opciones de viaje</span>
                      <ChevronRight size={12} color="white" />
                  </div>
              </div>

              <div 
                className="w-full border rounded-[1.5rem] p-4 flex items-center justify-between"
                style={{ backgroundColor: `${cardBg}60`, borderColor: `${borderCol}60` }}
              >
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${borderCol}20` }}>
                          <Layers size={16} color={borderCol} />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">EXPERIENCIA</span>
                          <span className="text-sm font-bold text-white">Más de {eventData.name?.split(' ')[0] || 'Evento'}</span>
                      </div>
                  </div>
                  <ChevronRight size={16} color={borderCol} />
              </div>
          </div>

          <div className="px-6 mb-8">
              <h3 className="text-lg font-bold text-white mb-2">Descripción</h3>
              <div 
                className="text-zinc-300/80 text-sm leading-relaxed whitespace-pre-wrap [&_b]:text-white [&_b]:font-bold [&_strong]:text-white [&_strong]:font-bold [&_i]:italic [&_u]:underline"
                dangerouslySetInnerHTML={{ 
                    __html: eventData.description || 'Aquí aparecerá la descripción detallada de tu evento...' 
                }}
              />
          </div>

          {/* ADMISIÓN - TEXTOS BLANCOS */}
          <div className="px-6 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Admisión & Reglas</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="border rounded-[1.5rem] p-5 flex flex-col items-center justify-center"
                    style={{ backgroundColor: `${cardBg}90`, borderColor: `${borderCol}60` }}
                  >
                      <span className="text-[9px] font-bold text-white uppercase mb-2 tracking-widest">EDAD MÍNIMA</span>
                      <div className="flex items-center gap-4">
                          <div className="text-center">
                              <span className="text-xl font-black text-white">+{eventData.minAgeWomen}</span>
                              <span className="text-[9px] text-zinc-500 block font-bold">Mujeres</span>
                          </div>
                          <div className="w-px h-6 bg-white/10" />
                          <div className="text-center">
                              <span className="text-xl font-black text-white">+{eventData.minAgeMen}</span>
                              <span className="text-[9px] text-zinc-500 block font-bold">Hombres</span>
                          </div>
                      </div>
                  </div>

                  <div 
                    className="border rounded-[1.5rem] p-5 flex flex-col items-center justify-center"
                    style={{ backgroundColor: `${cardBg}90`, borderColor: `${borderCol}60` }}
                  >
                      <span className="text-[9px] font-bold text-white uppercase mb-2 tracking-widest">DRESS CODE</span>
                      <Shirt size={24} className="text-[#FFD700] mb-1" />
                      <span className="text-sm font-bold text-white">{eventData.dressCode || 'Casual'}</span>
                  </div>
              </div>
          </div>

          {/* UBICACIÓN - LINK BLANCO */}
          <div className="px-6 mb-8">
               <div className="flex justify-between items-end mb-4">
                   <h3 className="text-lg font-bold text-white">Ubicación</h3>
                   <div className="flex items-center gap-1 text-white">
                        <span className="text-[10px] font-bold">Google Maps</span>
                        <ExternalLink size={10} />
                   </div>
               </div>
               
               <div className={`w-full h-48 bg-zinc-900 ${radius} overflow-hidden relative border border-white/10 shadow-2xl`}>
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: 'brightness(0.8) contrast(1.1)' }} 
                        loading="lazy"
                        allowFullScreen
                        src={mapUrl}
                        className="w-full h-full opacity-90"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <div className="relative">
                            <MapPin size={40} color="white" fill={COLORS.neonPink} className="drop-shadow-xl" />
                            <div className="absolute top-[11px] left-[13px] w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                        </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 bg-black/90 backdrop-blur-md rounded-2xl py-3 px-4 border border-zinc-800 shadow-xl z-20 pointer-events-none">
                        <p className="text-[13px] text-white font-bold truncate leading-tight mb-0.5">
                            {eventData.address || 'Av. Apoquindo 4900, Las Condes'}
                        </p>
                        <p className="text-[10px] font-bold text-white">Toca para abrir en Google Maps</p>
                    </div>
               </div>
          </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-0 w-full z-50">
           <div className="w-full bg-black/60 backdrop-blur-xl border-t border-white/10 p-5 pb-8 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Desde</span>
                    <div className="text-3xl font-black text-white tracking-tighter">
                        ${minPrice.toLocaleString('es-CL')}
                    </div>
                </div>
                <button 
                    style={{ backgroundColor: accent }}
                    className={`h-12 px-6 text-white ${radius} font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 min-w-[160px]`}
                >
                    Obtener Tickets <ArrowRight size={18} />
                </button>
           </div>
           
           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full pointer-events-none" />
      </div>

    </div>
  )
}

function TicketSelectionPreview({ eventData, accent, radius, font, cardBg, borderCol }: { eventData: any, accent: string, radius: string, font: string, cardBg: string, borderCol: string }) {
    const visibleTickets = eventData.tickets.filter((t: any) => t.isActive !== false);

    return (
        <div className={`w-[390px] h-[820px] bg-black rounded-[55px] border-[6px] border-black shadow-[0_0_0_4px_#27272a,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col select-none ring-1 ring-white/10 ${font}`}>
            <div 
                className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out z-0"
                style={{
                    background: `linear-gradient(180deg, ${eventData.themeColor} 0%, ${eventData.themeColorEnd || '#090014'} 100%)`,
                }}
            />
            <div className="h-14 w-full flex justify-between items-start px-7 pt-4 absolute top-0 z-50">
                <span className="text-white text-[15px] font-semibold tracking-wide w-12 text-center">9:41</span>
                <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[120px] h-[35px] bg-black rounded-full flex items-center justify-center z-50">
                        <div className="w-20 h-full flex items-center justify-end pr-2">
                            <div className="w-2 h-2 rounded-full bg-[#1a1a1a] shadow-inner" />
                        </div>
                </div>
                <div className="flex items-center gap-1.5 w-12 justify-end text-white">
                    <Signal size={16} strokeWidth={2.5} />
                    <Wifi size={16} strokeWidth={2.5} />
                    <Battery size={20} strokeWidth={2.5} />
                </div>
            </div>
            
            {/* Header Flotante Tickets (Botón Blanco) */}
            <div className="relative z-10 px-6 pt-16 pb-4 flex justify-between items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border" style={{ backgroundColor: `${cardBg}CC`, borderColor: `${borderCol}80` }}>
                    <ArrowLeft className="text-white" size={20} color="white" />
                </div>
                <h2 className="text-white font-black text-sm tracking-widest">SELECCIONAR</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-6 relative z-10 pb-32 bg-black/60 backdrop-blur-2xl">
                <div className="mb-8 mt-2">
                    <h1 className="text-3xl font-black text-white leading-tight mb-3 uppercase">
                        {eventData.name || 'NOMBRE DEL EVENTO'}
                    </h1>
                    <div className="flex items-center gap-2 mb-2 text-zinc-400">
                        <Calendar style={{ color: accent }} size={16} />
                        <span className="text-sm font-medium">
                            {eventData.date ? new Date(eventData.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Fecha del evento'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin style={{ color: accent }} size={16} />
                        <span className="text-sm font-medium">{eventData.venue || 'Ubicación'}</span>
                    </div>
                </div>
                 <div className="space-y-3">
                    {visibleTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <Info className="text-zinc-500 mb-2" size={32} />
                            <p className="text-zinc-500 text-sm">No hay entradas visibles configuradas.</p>
                        </div>
                    ) : (
                        visibleTickets.map((tier: any) => {
                            const remaining = Math.max(0, tier.quantity - (tier.sold || 0));
                            const isSoldOut = remaining <= 0 || tier.isGhostSoldOut;
                            return (
                                <div key={tier.id} className={`flex items-center justify-between bg-white/5 border border-white/10 ${radius} p-4 ${isSoldOut ? 'opacity-50' : ''}`}>
                                    <div className="flex-1 pr-4">
                                        <h4 className="text-white font-bold text-lg mb-1">{tier.name}</h4>
                                        <p className="text-zinc-300 font-medium">${tier.price?.toLocaleString('es-CL')}</p>
                                    </div>
                                    {!isSoldOut && (
                                        <div className={`flex items-center gap-3 bg-black/30 p-1.5 border border-white/5 ${radius}`}>
                                            <div className={`w-8 h-8 ${radius} flex items-center justify-center shadow-lg`} style={{ backgroundColor: accent }}><Plus className="text-white" size={14} /></div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-0 w-full z-50">
                <div className="w-full bg-black/60 backdrop-blur-xl border-t border-white/10 p-5 pb-8 flex items-center justify-between gap-4">
                    <div className={`w-full h-14 ${radius} overflow-hidden opacity-50 grayscale`}>
                        <div className="w-full h-full flex items-center justify-center gap-2" style={{ backgroundColor: accent }}>
                            <span className="text-white font-black text-lg tracking-widest">SELECCIONA ENTRADAS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}