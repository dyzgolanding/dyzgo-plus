'use client'
import React, { useState } from 'react'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Shirt, 
  ArrowLeft, 
  Info, 
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
  Ban,
  Share2,
  User,
  Instagram,
  Ticket as TicketIcon
} from 'lucide-react'
import { useEventStore } from '@/store/useEventStore'

const COLORS = {
  neonPink: '#FF00FF',
  neonPurple: '#8A2BE2',
  glassBg: 'rgba(255, 255, 255, 0.05)',
  textZinc: '#a1a1aa'
}

// --- INTERFACES PARA TIPADO STRICT ---
interface Ticket {
  id: string
  price: number
  name: string
  isActive?: boolean
  quantity: number
  sold?: number
  isGhostSoldOut?: boolean
  description?: string
}

interface EventData {
  themeColor: string
  themeColorEnd?: string
  accentColor?: string
  borderRadius?: string
  fontStyle?: string
  cardBackgroundColor?: string
  borderColor?: string
  coverImage?: string
  name?: string
  venue?: string
  date?: string
  startTime?: string
  endTime?: string
  category?: string
  description?: string
  minAgeWomen?: number
  minAgeMen?: number
  dressCode?: string
  address?: string
  prohibitedItems?: string[]
  socialLinks?: { instagram?: string; [key: string]: string | undefined }
  settings?: { showInstagram?: boolean; [key: string]: unknown }
  tickets: Ticket[]
  [key: string]: unknown
}

interface StoreState {
  eventData: EventData
  activeSection: string
}

interface TicketPreviewProps {
  eventData: EventData
  accent: string
  radius: string
  font: string
  cardBg: string
  borderCol: string
}

export default function LivePreview() {
  // Casting seguro para evitar @ts-ignore
  const { eventData, activeSection } = useEventStore() as unknown as StoreState

  // Valores con fallback seguros
  const accent = eventData.accentColor || '#d946ef' 
  const radius = eventData.borderRadius || 'rounded-[2rem]' 
  const font = eventData.fontStyle || 'font-sans'
  
  // COLORES DINÁMICOS
  const cardBg = eventData.cardBackgroundColor || '#1a0b2e'
  const borderCol = eventData.borderColor || '#8A2BE2'

  if (activeSection === 'tickets') {
    return <TicketSelectionPreview eventData={eventData} accent={accent} radius={radius} font={font} cardBg={cardBg} borderCol={borderCol} />
  }

  const getDay = (dateStr?: string) => {
    if (!dateStr) return '28'
    const date = new Date(dateStr)
    // Usamos getUTCDate para evitar problemas de zona horaria en visualización simple
    const day = date.getUTCDate()
    return day
  }

  const getMonth = (dateStr?: string) => {
    if (!dateStr) return 'FEB'
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
    return months[new Date(dateStr).getUTCMonth()]
  }

  const minPrice = eventData.tickets.length > 0 
    ? Math.min(...eventData.tickets.map(t => t.price)) 
    : 0 

  const GOOGLE_API_KEY = "AIzaSyDOZ9gVgcmAr19Ol35AzFGiuYR_8v8Mx-4"
  const mapQuery = encodeURIComponent(eventData.address || 'Santiago, Chile')
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_API_KEY}&q=${mapQuery}&maptype=satellite&zoom=15&language=es`

  return (
    <div className={`w-[390px] h-[820px] bg-[#0a0014] rounded-[55px] border-[6px] border-black shadow-[0_0_0_4px_#27272a,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col select-none ring-1 ring-white/10 ${font}`}>
      
      {/* FONDO GRADIENTE LINEAL */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out z-0"
        style={{
            background: `linear-gradient(180deg, ${eventData.themeColor || '#2a004d'} 0%, ${eventData.themeColorEnd || '#05000a'} 100%)`,
            opacity: 0.8
        }}
      />

      {/* BARRA ESTADO */}
      <div className="h-14 w-full flex justify-between items-start px-7 pt-4 absolute top-0 z-50 pointer-events-none">
          <span className="text-white text-[15px] font-semibold tracking-wide w-12 text-center">18:06</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[120px] h-[35px] bg-black rounded-full flex items-center justify-center z-50">
                <div className="w-20 h-full flex items-center justify-end pr-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a1a1a] shadow-inner" />
                </div>
          </div>
          <div className="flex items-center gap-1.5 w-12 justify-end text-white">
             <Signal size={16} strokeWidth={2.5} />
             <Wifi size={16} strokeWidth={2.5} />
             <div className="flex items-center justify-center bg-white/20 px-1 rounded-sm">
                <span className="text-[10px] font-bold mr-0.5">69</span>
             </div>
          </div>
      </div>

      {/* HEADER FLOTANTE RE-ESTILIZADO */}
      <div className="absolute top-14 left-0 w-full px-5 flex justify-between items-center z-50">
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-transparent hover:bg-white/10 transition-colors">
             <ArrowLeft size={20} color="white" />
          </button>
          <div className="flex items-center gap-3">
             <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-transparent hover:bg-white/10 transition-colors">
                 <Share2 size={18} color="white" />
             </button>
             <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-transparent hover:bg-white/10 transition-colors">
                 <Bookmark size={18} color="white" />
             </button>
          </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:!hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-28 pb-32 relative z-10">
          
          <div className="px-4 mb-6">
              <div className="aspect-square w-full rounded-3xl overflow-hidden relative bg-[#111] shadow-2xl">
                 {eventData.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={eventData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#111] text-zinc-700 font-medium"></div>
                 )}
              </div>
          </div>

          {/* TITULO Y FECHA */}
          <div className="px-5 mb-5 flex justify-between items-start">
              <div className="flex-1 pr-4">
                  <h1 className="text-3xl leading-[1.1] font-black text-white italic uppercase tracking-tight mb-2">
                      {eventData.name || 'NOMBRE DEL EVENTO'}
                  </h1>
                  <div className="flex items-center gap-1 text-zinc-300 text-[13px] font-bold tracking-wide uppercase mb-2">
                      <span>{eventData.venue || 'UBICACIÓN'}</span>
                      <ChevronRight size={14} className="text-zinc-500"/>
                  </div>
                  <div className="flex items-center gap-2 text-white font-black text-[15px] mb-2">
                      <Clock size={16} color={accent} />
                      <span>{eventData.startTime || '22:30'} HRS</span>
                  </div>
                  {/* INSTAGRAM BUTTON */}
                  {eventData.settings?.showInstagram && (
                      <div className="mb-2">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: accent }}>
                              <Instagram size={14} color="white" strokeWidth={2.5} />
                              <span className="text-white text-[12px] font-bold tracking-wide">Instagram</span>
                          </div>
                      </div>
                  )}
                  <div className="text-zinc-400 text-xs font-medium">
                      Tipo: <span className="text-zinc-300 capitalize">{eventData.category || 'General'}</span>
                  </div>
              </div>
              
              {/* FECHA BADGE */}
              <div className="rounded-2xl border border-white/10 bg-white/5 w-[65px] h-[75px] flex flex-col items-center justify-center mt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>{getMonth(eventData.date)}</span>
                  <span className="text-[26px] font-black text-white leading-none mt-0.5">{getDay(eventData.date)}</span>
              </div>
          </div>

          {/* PRODUCE SECTION */}
          <div className="px-5 py-4 border-t border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Produce</p>
                  <p className="text-sm font-bold text-white tracking-wide">DYZO</p>
              </div>
              <ChevronRight size={16} className="text-zinc-500"/>
          </div>

          {/* ESTADO DEL ACCESO */}
          <div className="px-5 mt-6 mb-8">
              <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-zinc-400" />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">SIN DATOS</span>
                  </div>
                  <p className="text-zinc-500 text-xs font-medium">Acceso tranquilo por ahora.</p>
              </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="px-5 mb-8">
              <h3 className="text-xl font-black text-white mb-4 tracking-tight">Descripción</h3>
              <div 
                className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap [&_b]:text-white [&_b]:font-black [&_strong]:text-white [&_strong]:font-black [&_i]:italic [&_u]:underline"
                dangerouslySetInnerHTML={{ 
                    __html: eventData.description || 'Sin descripción disponible.' 
                }}
              />
          </div>

          {/* ADMISIÓN & REGLAS */}
          <div className="px-5 mb-8">
              <h3 className="text-xl font-black text-white mb-4 tracking-tight">Admisión & Reglas</h3>
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                      <User size={18} color={accent} />
                      <span className="text-zinc-400 text-sm font-medium">Edad Mínima:</span>
                      <span className="text-white text-sm font-bold">+{eventData.minAgeWomen} M <span className="text-zinc-600 mx-1">|</span> +{eventData.minAgeMen} H</span>
                  </div>
                  <div className="w-full h-px bg-white/5" />
                  <div className="flex items-center gap-3">
                      <Shirt size={18} color={accent} />
                      <span className="text-zinc-400 text-sm font-medium">Dress Code:</span>
                      <span className="text-white text-sm font-bold capitalize">{eventData.dressCode || 'Casual'}</span>
                  </div>
              </div>
          </div>

          {/* ARTÍCULOS PROHIBIDOS */}
          {eventData.prohibitedItems && eventData.prohibitedItems.length > 0 && (
              <div className="px-5 mb-8">
                  <h3 className="text-xl font-black text-white mb-4 tracking-tight">Artículos Prohibidos</h3>
                  <div className="flex flex-wrap gap-2.5">
                      {eventData.prohibitedItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 px-3.5 py-2 bg-red-950/40 border border-red-500/30 rounded-full">
                              <Ban size={12} className="text-red-500" />
                              <span className="text-[11px] font-bold text-red-500 tracking-wide">{item}</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* UBICACIÓN */}
          <div className="px-5 mb-8">
               <div className="flex justify-between items-end mb-4">
                   <h3 className="text-xl font-black text-white tracking-tight">Ubicación</h3>
                   <div className="flex items-center gap-1.5 cursor-pointer" style={{ color: accent }}>
                        <span className="text-[11px] font-bold tracking-widest uppercase">Google Maps</span>
                        <ExternalLink size={12} strokeWidth={2.5}/>
                   </div>
               </div>
               
               <div className="w-full h-[200px] bg-zinc-900 rounded-3xl overflow-hidden relative shadow-lg">
                    <iframe
                        style={{ border: 0, filter: 'brightness(0.7) contrast(1.2)' }} 
                        loading="lazy"
                        allowFullScreen
                        src={mapUrl}
                        className="absolute w-[calc(100%+100px)] h-[calc(100%+120px)] -top-[70px] -left-[50px] pointer-events-none max-w-none"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-6 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <div className="relative">
                            {/* PIN IDENTICO A LA FOTO */}
                            <MapPin size={46} color="white" fill="#FF00FF" strokeWidth={1.5} className="drop-shadow-2xl" />
                            <div className="absolute top-[13px] left-[15px] w-4 h-4 bg-white rounded-full shadow-inner" />
                        </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 bg-black/95 backdrop-blur-xl rounded-2xl py-3.5 px-4 shadow-2xl z-20 pointer-events-none">
                        <p className="text-[13px] text-white font-bold truncate leading-tight mb-1">
                            {eventData.address || 'Av. Apoquindo 4900, Las Condes'}
                        </p>
                        <p className="text-[10px] font-bold" style={{ color: accent }}>Toca para abrir en Google Maps</p>
                    </div>
               </div>

               {/* BOTÓN UBER */}
               <div className="mt-4 bg-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors border border-white/5">
                   <div className="flex items-center gap-3.5">
                        <div className="bg-black px-2.5 py-1.5 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-[11px] tracking-wide">Uber</span>
                        </div>
                        <span className="text-white font-bold text-sm">Llegar en Uber</span>
                   </div>
                   <ChevronRight size={18} className="text-zinc-500" />
               </div>
          </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-0 w-full z-50">
           <div className="w-full bg-[#05000a]/90 backdrop-blur-2xl border-t border-white/5 p-5 pb-8 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Desde</span>
                    <div className="text-3xl font-black text-white tracking-tighter">
                        ${minPrice.toLocaleString('es-CL')}
                    </div>
                </div>
                <button 
                    className="h-[52px] px-6 text-white rounded-2xl font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-w-[170px]"
                    style={{ backgroundColor: accent, boxShadow: `0 0 20px ${accent}4D` }}
                >
                    Obtener Tickets <ArrowRight size={18} strokeWidth={2.5}/>
                </button>
           </div>
           
           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full pointer-events-none" />
      </div>

    </div>
  )
}

// COMPONENTE SECUNDARIO TIPADO
function TicketSelectionPreview({ eventData, accent, font }: TicketPreviewProps) {
    const visibleTickets = eventData.tickets.filter(t => t.isActive !== false);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const handleAdd = (id: string) => setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    const handleSub = (id: string) => setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));

    const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
    const subtotal = visibleTickets.reduce((sum, t) => sum + (t.price * (quantities[t.id] || 0)), 0);
    const serviceFee = subtotal * 0.1; // 10% fee de ejemplo
    const total = subtotal + serviceFee;

    return (
        <div className={`w-[390px] h-[820px] bg-black rounded-[55px] border-[6px] border-black shadow-[0_0_0_4px_#27272a,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col select-none ring-1 ring-white/10 ${font}`}>
            
            {/* FONDO GRADIENTE LINEAL */}
            <div 
                className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out z-0"
                style={{
                    background: `linear-gradient(180deg, ${eventData.themeColor || '#2a004d'} 0%, ${eventData.themeColorEnd || '#05000a'} 100%)`,
                    opacity: 0.8
                }}
            />
            
            {/* BARRA ESTADO */}
            <div className="h-14 w-full flex justify-between items-start px-7 pt-4 absolute top-0 z-50 pointer-events-none">
                <span className="text-white text-[15px] font-semibold tracking-wide w-12 text-center">18:06</span>
                <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[120px] h-[35px] bg-black rounded-full flex items-center justify-center z-50">
                        <div className="w-20 h-full flex items-center justify-end pr-2">
                            <div className="w-2 h-2 rounded-full bg-[#1a1a1a] shadow-inner" />
                        </div>
                </div>
                <div className="flex items-center gap-1.5 w-12 justify-end text-white">
                    <Signal size={16} strokeWidth={2.5} />
                    <Wifi size={16} strokeWidth={2.5} />
                    <div className="flex items-center justify-center bg-white/20 px-1 rounded-sm">
                        <span className="text-[10px] font-bold mr-0.5">69</span>
                    </div>
                </div>
            </div>
            
            {/* Header Flotante Tickets */}
            <div className="relative z-10 px-5 pt-16 pb-4 flex items-center justify-between">
                <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-transparent">
                    <ArrowLeft size={18} color="white" />
                </button>
                <h2 className="text-white font-black text-[13px] tracking-widest uppercase">SELECCIONAR ENTRADAS</h2>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:!hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10 pb-40">
                
                {/* INFO DEL EVENTO */}
                <div className="mb-8 mt-2 px-5">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tight mb-4">
                        {eventData.name || 'NOMBRE DEL EVENTO'}
                    </h1>
                    <div className="flex items-start gap-2.5 mb-2 text-zinc-300">
                        <Calendar style={{ color: accent }} size={16} className="mt-0.5 shrink-0" />
                        <span className="text-sm font-medium">
                            {eventData.date || '2026-02-28'}
                        </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-zinc-300">
                        <MapPin style={{ color: accent }} size={16} className="mt-0.5 shrink-0" />
                        <span className="text-sm font-medium leading-snug">{eventData.address || 'Avenida Apoquindo 4900, Las Condes, Metropolitana de Santiago'}</span>
                    </div>
                </div>

                <div className="px-5 mb-3">
                    <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: accent }}>Tipos de entrada</h3>
                </div>

                {/* LISTA DE TICKETS */}
                 <div className="px-5 space-y-3">
                    {visibleTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50 bg-white/5 border border-white/10 rounded-2xl">
                            <Info className="text-zinc-500 mb-2" size={32} />
                            <p className="text-zinc-500 text-sm font-medium">No hay entradas configuradas.</p>
                        </div>
                    ) : (
                        visibleTickets.map((tier) => {
                            const qty = quantities[tier.id] || 0;
                            const isSelected = qty > 0;
                            return (
                                <div key={tier.id} className={`flex items-center justify-between bg-white/5 border rounded-2xl p-4 transition-all ${isSelected ? '' : 'border-white/10'}`} style={isSelected ? { borderColor: accent } : {}}>
                                    <div className="flex-1 pr-4">
                                        <h4 className="font-black text-lg mb-0.5 uppercase" style={isSelected ? { color: accent } : { color: 'white' }}>{tier.name}</h4>
                                        {tier.description && <p className="text-zinc-400 text-xs mb-1 font-medium">{tier.description}</p>}
                                        <p className="text-white font-bold text-sm">${tier.price?.toLocaleString('es-CL')}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 border border-white/5">
                                        <button onClick={() => handleSub(tier.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                                            <span className="text-white text-lg font-medium leading-none mb-0.5">-</span>
                                        </button>
                                        <span className="text-white font-bold w-4 text-center">{qty}</span>
                                        <button onClick={() => handleAdd(tier.id)} className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-colors" style={{ backgroundColor: accent }}>
                                            <span className="text-white text-lg font-medium leading-none mb-0.5">+</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* RESUMEN DE COMPRA */}
                {totalItems > 0 && (
                    <div className="px-5 mt-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                            <h4 className="text-white font-black mb-4">Resumen</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-medium text-zinc-300">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toLocaleString('es-CL')}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium text-zinc-300">
                                    <span>Cargo por servicio</span>
                                    <span>${serviceFee.toLocaleString('es-CL')}</span>
                                </div>
                                <div className="w-full h-px bg-white/10 my-3" />
                                <div className="flex justify-between text-lg font-black text-white">
                                    <span>Total</span>
                                    <span style={{ color: accent }}>${total.toLocaleString('es-CL')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* FOOTER TICKETS */}
            <div className="absolute bottom-0 w-full z-50">
                <div className="w-full bg-[#05000a]/95 backdrop-blur-2xl border-t border-white/5 p-5 pb-8 flex items-center justify-center">
                    {totalItems > 0 ? (
                        <button 
                            className="w-full h-[56px] text-white rounded-2xl font-black text-[15px] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                            style={{ backgroundColor: accent, boxShadow: `0 0 25px ${accent}40` }}
                        >
                            PAGAR ${total.toLocaleString('es-CL')} <TicketIcon size={18} fill="currentColor" className="text-white" />
                        </button>
                    ) : (
                        <div className="w-full h-[56px] rounded-2xl flex items-center justify-center opacity-50" style={{ backgroundColor: accent }}>
                            <span className="text-white font-black text-[15px] tracking-wide uppercase">SELECCIONA ENTRADAS</span>
                        </div>
                    )}
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full pointer-events-none" />
            </div>
        </div>
    )
}
