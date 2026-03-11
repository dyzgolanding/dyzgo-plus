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
  ArrowRight, 
  Layers, 
  ChevronRight,
  ExternalLink,
  Ban,
  Share2,
  User,
  Instagram,
  Ticket as TicketIcon,
  Navigation,
  Copy
} from 'lucide-react'
import { useEventStore } from '@/store/useEventStore'

const COLORS = {
  neonPink: '#FF00FF',
  neonPurple: '#8A2BE2',
  glassBg: 'rgba(255, 255, 255, 0.05)',
  textZinc: '#a1a1aa',
  darkCard: '#130524' 
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
  musicGenre?: string
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
  const accent = eventData.accentColor || '#FF00FF' 
  const radius = eventData.borderRadius || 'rounded-[2rem]' 
  const font = eventData.fontStyle || 'font-sans'
  
  // COLORES DINÁMICOS
  const cardBg = eventData.cardBackgroundColor || '#1a0b2e'
  const borderCol = eventData.borderColor || '#8A2BE2'

  if (activeSection === 'tickets') {
    return <TicketSelectionPreview eventData={eventData} accent={accent} radius={radius} font={font} cardBg={cardBg} borderCol={borderCol} />
  }

  const getDay = (dateStr?: string) => {
    if (!dateStr) return '2'
    const date = new Date(dateStr)
    const day = date.getUTCDate()
    return day
  }

  const getMonth = (dateStr?: string) => {
    if (!dateStr) return 'MAR'
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
    return months[new Date(dateStr).getUTCMonth()]
  }

  const minPrice = eventData.tickets.length > 0 
    ? Math.min(...eventData.tickets.map(t => t.price)) 
    : 222 

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const mapQuery = encodeURIComponent(eventData.address || 'Santiago, Chile')
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_API_KEY}&q=${mapQuery}&maptype=satellite&zoom=15&language=es`

  // Estilo base para las tarjetas "Liquid Glass" semi-transparentes
  const liquidGlassClass = "bg-[#110223]/50 backdrop-blur-xl border border-purple-500/20 shadow-lg"

  return (
    <div className={`w-[390px] h-[820px] bg-[#0a0014] rounded-[55px] border-[6px] border-black shadow-[0_0_0_4px_#27272a,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col select-none ring-1 ring-white/10 ${font}`}>
      
      {/* FONDO GLOBAL TIPO APP */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out z-0"
        style={{
            background: `linear-gradient(180deg, ${eventData.themeColor || '#21053a'} 0%, ${eventData.themeColorEnd || '#0a0014'} 100%)`,
        }}
      />

      {/* BARRA ESTADO */}
      <div className="h-14 w-full flex justify-between items-start px-7 pt-4 absolute top-0 z-50 pointer-events-none">
          <span className="text-white text-[13px] font-semibold tracking-wide w-12 text-center">18:04</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[110px] h-[32px] bg-black rounded-full flex items-center justify-center z-50">
                <div className="w-16 h-full flex items-center justify-end pr-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shadow-inner" />
                </div>
          </div>
          <div className="flex items-center gap-1.5 w-12 justify-end text-white">
             <Signal size={14} strokeWidth={2.5} />
             <Wifi size={14} strokeWidth={2.5} />
             <div className="flex items-center justify-center bg-white/20 px-1 rounded-sm">
                <span className="text-[9px] font-bold mr-0.5">52</span>
             </div>
          </div>
      </div>

      {/* HEADER FLOTANTE */}
      <div className="absolute top-14 left-0 w-full px-5 flex justify-between items-center z-50">
          <button className="w-9 h-9 rounded-full bg-[#1a0533]/80 backdrop-blur-md flex items-center justify-center border border-purple-500/20">
             <ArrowLeft size={18} color={COLORS.neonPurple} />
          </button>
          <div className="flex items-center gap-2.5">
             <button className="w-9 h-9 rounded-full bg-[#1a0533]/80 backdrop-blur-md flex items-center justify-center border border-purple-500/20">
                 <Share2 size={16} color={COLORS.neonPurple} />
             </button>
             <button className="w-9 h-9 rounded-full bg-[#1a0533]/80 backdrop-blur-md flex items-center justify-center border border-purple-500/20">
                 <Bookmark size={16} color={COLORS.neonPurple} />
             </button>
          </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:!hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-24 pb-32 relative z-10">
          
          {/* IMAGEN DEL EVENTO */}
          <div className="px-5 mb-4">
              <div className="aspect-square w-full rounded-[1.25rem] overflow-hidden relative bg-[#111] shadow-lg">
                 {eventData.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={eventData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <span className="text-zinc-600 font-bold text-sm">Sin Imagen</span>
                    </div>
                 )}
              </div>
          </div>

          {/* CATEGORÍA Y TÍTULO */}
          <div className="px-5 mb-5 flex justify-between items-start">
              <div className="flex-1 pr-3 pt-1">
                  <div className="inline-block bg-white/10 border border-white/10 rounded-full px-2.5 py-1 mb-2">
                      <span className="text-[9px] font-bold text-white uppercase tracking-widest">{eventData.category || 'ROOFTOP'}</span>
                  </div>
                  <h1 className="text-[28px] leading-[1.1] font-black text-white italic tracking-tight">
                      {eventData.name || 'CERCC'}
                  </h1>
              </div>
              {/* DATE BADGE */}
              <div className={`rounded-[1rem] ${liquidGlassClass} w-[54px] h-[60px] flex flex-col items-center justify-center shrink-0 mt-1`}>
                  <span className="text-[9px] font-black uppercase text-[#d946ef] mb-0.5 tracking-wider">{getMonth(eventData.date)}</span>
                  <span className="text-[22px] font-black text-white leading-none">{getDay(eventData.date)}</span>
              </div>
          </div>

          {/* PRODUCTORA & INSTAGRAM */}
          <div className="px-5 mb-5 flex items-center justify-start gap-2.5">
              <div className={`flex-1 flex items-center justify-between ${liquidGlassClass} rounded-[1rem] p-1.5 pr-3 cursor-pointer`}>
                  <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-black/50 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                          <User size={14} className="text-zinc-500" />
                      </div>
                      <div className="flex flex-col justify-center min-w-[80px]">
                          <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Produce</span>
                          <span className="text-[12px] text-white font-black truncate max-w-[120px]">DyzGO.</span>
                      </div>
                  </div>
                  <ChevronRight size={14} className="text-zinc-500"/>
              </div>
              {eventData.settings?.showInstagram && (
                  <div className={`w-[46px] h-[46px] rounded-[1rem] ${liquidGlassClass} flex items-center justify-center shrink-0`}>
                      <Instagram size={18} color="white" />
                  </div>
              )}
          </div>

          {/* TARJETAS: CLUB Y HORA */}
          <div className="px-5 mb-5 grid grid-cols-2 gap-2.5">
              <div className={`${liquidGlassClass} rounded-[1.25rem] py-3.5 px-3 flex flex-col items-center justify-center text-center gap-1.5 min-h-[90px]`}>
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-0.5 border border-white/5 shrink-0">
                      <MapPin size={16} className="text-zinc-400" />
                  </div>
                  <span className="text-[12px] text-white font-black uppercase tracking-wide truncate w-full">{eventData.venue || 'BOSQUE LUZ'}</span>
                  <span className="text-[9px] text-zinc-400 font-medium">Ver más del club {'>'}</span>
              </div>
              <div className={`${liquidGlassClass} rounded-[1.25rem] py-3.5 px-3 flex flex-col items-center justify-center text-center gap-1.5 min-h-[90px]`}>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center mb-0.5 border border-purple-500/20 shrink-0">
                      <Clock size={16} className="text-[#FF00FF]" />
                  </div>
                  <span className="text-[12px] text-white font-black uppercase tracking-wide">{eventData.startTime || '22:00'} HRS</span>
                  <span className="text-[9px] text-zinc-400 font-medium">Hora de inicio</span>
              </div>
          </div>

          {/* ESTADO DEL ACCESO */}
          <div className="px-5 mb-5">
              <div className={`w-full ${liquidGlassClass} rounded-2xl p-3.5 flex flex-col justify-center`}>
                  <div className="flex items-center gap-1.5 mb-1">
                      <Clock size={12} className="text-zinc-400" />
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">SIN DATOS</span>
                  </div>
                  <p className="text-zinc-300 text-[12px] font-medium">Acceso tranquilo por ahora.</p>
              </div>
          </div>

          {/* TAGS (MÚSICA) */}
          <div className="px-5 mb-5">
              <h3 className="text-[15px] font-black text-white mb-2.5 tracking-tight">Tags</h3>
              <div className="flex flex-wrap gap-2">
                  {(eventData.musicGenre ? eventData.musicGenre.split(',') : ['Techno', 'House', 'EDM']).map((tag, idx) => (
                      <div key={idx} className={`px-3 py-1.5 ${liquidGlassClass} rounded-lg`}>
                          <span className="text-[11px] font-bold text-white tracking-wide">{tag.trim()}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="px-5 mb-5">
              <h3 className="text-[15px] font-black text-white mb-2 tracking-tight">Acerca del evento</h3>
              <div 
                className="text-zinc-300 text-[12px] leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                    __html: eventData.description || 'Acá va la descripción' 
                }}
              />
          </div>

          {/* INFORMACIÓN IMPORTANTE */}
          <div className="px-5 mb-5">
              <h3 className="text-[15px] font-black text-white mb-2.5 tracking-tight">Información Importante</h3>
              <div className={`${liquidGlassClass} rounded-[1.25rem] py-4 px-2 flex flex-col`}>
                  <div className="flex flex-row justify-between items-center mb-4">
                      {/* EDAD MINIMA */}
                      <div className="flex-1 flex flex-col items-center border-r border-white/5">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                              <User size={15} className="text-purple-500" />
                          </div>
                          <span className="text-[8px] text-white font-bold uppercase tracking-widest mb-1">Edad Mínima</span>
                          <span className="text-[13px] text-white font-black">+{eventData.minAgeWomen || 18} M <span className="mx-1 text-zinc-600">|</span> +{eventData.minAgeMen || 21} H</span>
                      </div>
                      {/* DRESS CODE */}
                      <div className="flex-1 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                              <Shirt size={15} className="text-purple-500" />
                          </div>
                          <span className="text-[8px] text-white font-bold uppercase tracking-widest mb-1">Dress Code</span>
                          <span className="text-[13px] text-white font-black capitalize">{eventData.dressCode || 'Casual'}</span>
                      </div>
                  </div>

                  {/* ARTÍCULOS PROHIBIDOS */}
                  <div className="flex flex-col items-center w-full mt-1">
                      <span className="text-[10px] font-bold text-white mb-2.5">Artículos Prohibidos:</span>
                      <div className="flex flex-wrap justify-center gap-1.5 px-2">
                          {(eventData.prohibitedItems && eventData.prohibitedItems.length > 0 ? eventData.prohibitedItems : ['PALA', 'PICO', 'PELOTA']).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1 px-2.5 py-1 bg-red-950/40 border border-red-500/30 rounded-full">
                                  <Ban size={9} className="text-red-500" />
                                  <span className="text-[8px] font-bold text-red-500 tracking-widest uppercase">{item}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* UBICACIÓN Y LLEGADA */}
          <div className="px-5 mb-8">
               <h3 className="text-[15px] font-black text-white mb-2.5 tracking-tight">Ubicación y Llegada</h3>
               
               <div className={`w-full ${liquidGlassClass} rounded-[1.25rem] p-3`}>
                    {/* MAPA */}
                    <div className="w-full h-[120px] rounded-xl overflow-hidden relative mb-3">
                        <iframe
                            style={{ border: 0, filter: 'brightness(0.7) contrast(1.2)' }} 
                            loading="lazy"
                            allowFullScreen
                            src={mapUrl}
                            className="absolute w-[calc(100%+100px)] h-[calc(100%+120px)] -top-[70px] -left-[50px] pointer-events-none max-w-none"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10 pointer-events-none">
                            <div className="relative flex items-center justify-center drop-shadow-2xl">
                                <MapPin size={34} color="white" fill={COLORS.neonPink} strokeWidth={1.5} />
                                <div className="absolute top-[9px] w-2.5 h-2.5 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS BUBBLE */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg py-2 px-3 flex flex-row justify-between items-center mb-2.5">
                        <span className="text-[10px] text-zinc-400 font-medium truncate pr-2 flex-1">
                            {eventData.address || 'ASDF 333, Vicuña, Coquimbo'}
                        </span>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                            <Copy size={9} className="text-purple-400" />
                            <span className="text-[8px] text-purple-400 font-bold uppercase tracking-wider">Copiar</span>
                        </div>
                    </div>

                    {/* BOTONES LLEGADA */}
                    <div className="flex flex-row gap-2">
                        <button className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors">
                            <div className="bg-black text-white text-[7px] font-black px-1 py-0.5 rounded">Uber</div>
                            <span className="text-[11px] font-bold text-white">Pedir Uber</span>
                        </button>
                        <button className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors">
                            <Navigation size={12} className="text-[#8A2BE2]" />
                            <span className="text-[11px] font-bold text-white">Navegar</span>
                        </button>
                    </div>
               </div>
               
               <p className="text-[8px] text-zinc-500 text-center mt-5 px-4 leading-relaxed font-medium">
                   La producción se reserva el derecho de admisión. Las personas que no cumplan con la edad mínima o el código de vestimenta establecido no podrán ingresar al recinto y sus entradas no serán reembolsadas.
               </p>
          </div>
      </div>

      {/* FOOTER FIXED TIPO IOS */}
      <div className="absolute bottom-0 w-full z-50">
           <div className="w-full bg-[#0a0014]/95 backdrop-blur-3xl border-t border-white/5 p-3.5 pb-5 flex items-center justify-between gap-3">
                <div className="flex flex-col pl-2">
                    <span className="text-[9px] text-zinc-400 font-bold mb-0.5">Desde</span>
                    <div className="text-[22px] font-black text-white tracking-tighter leading-none">
                        ${minPrice.toLocaleString('es-CL')}
                    </div>
                </div>
                <button 
                    className="flex-1 h-[46px] text-white rounded-[1rem] font-black text-[13px] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: accent, boxShadow: `0 0 15px ${accent}40` }}
                >
                    Obtener Tickets <ArrowRight size={16} strokeWidth={3}/>
                </button>
           </div>
           
           <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full pointer-events-none" />
      </div>

    </div>
  )
}

// COMPONENTE SECUNDARIO TIPADO (INTACTO)
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
                                        {/* REMOVIDO EL UPPERCASE AQUÍ */}
                                        <h4 className="font-black text-lg mb-0.5" style={isSelected ? { color: accent } : { color: 'white' }}>{tier.name}</h4>
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