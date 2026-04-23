'use client'
import React from 'react'
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  ChevronRight,
  Clock,
  Copy,
  Info,
  Instagram,
  MapPin,
  Navigation,
  Plus,
  Share2,
  Shirt,
  Signal,
  User,
  Wifi,
  Zap,
} from 'lucide-react'
import { useEventStore } from '@/store/useEventStore'

// --- INTERFACES ---
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
  accentColor?: string
  borderRadius?: string
  fontStyle?: string
  cardBackgroundColor?: string
  borderColor?: string
  coverImage?: string
  name?: string
  venue?: string
  date?: string
  endDate?: string
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
  status?: string
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

// Hex → hex + alpha
const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.startsWith('#') ? hex : `#${hex}`
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return `${clean}${a}`
}

const getDay = (dateStr?: string) => {
  if (!dateStr) return '2'
  return new Date(dateStr).getUTCDate()
}

const getMonth = (dateStr?: string) => {
  if (!dateStr) return 'MAR'
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  return months[new Date(dateStr).getUTCMonth()]
}

const getEndDay = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = d.getUTCDate()
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `el ${day} de ${months[d.getUTCMonth()]}`
}

export default function LivePreview() {
  const { eventData, activeSection } = useEventStore() as unknown as StoreState
  const [showMap, setShowMap] = useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setShowMap(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const accent = eventData.accentColor || '#FF31D8'
  const radius = eventData.borderRadius || 'rounded-[2rem]'
  const font = eventData.fontStyle || 'font-sans'
  const cardBg = eventData.cardBackgroundColor || '#1a0b2e'
  const borderCol = eventData.borderColor || '#8A2BE2'

  if (activeSection === 'tickets') {
    return <TicketSelectionPreview eventData={eventData} accent={accent} radius={radius} font={font} cardBg={cardBg} borderCol={borderCol} />
  }

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const mapQuery = encodeURIComponent(eventData.address || 'Santiago, Chile')
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_API_KEY}&q=${mapQuery}&maptype=satellite&zoom=15&language=es`

  const minPrice = eventData.tickets.length > 0
    ? Math.min(...eventData.tickets.map(t => t.price))
    : 0

  const displayEndTime = eventData.endTime ? eventData.endTime.substring(0, 5) : '05:00'
  const displayEndDay = getEndDay(eventData.endDate || eventData.date)
  const isInfo = eventData.status === 'info'

  // glass card base styles
  const glassCard = "bg-white/5 rounded-3xl border border-white/10"

  return (
    <div className={`w-[390px] h-[820px] bg-[#030303] rounded-[55px] border-[6px] border-black shadow-[0_0_0_4px_#27272a,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col select-none ring-1 ring-white/10 ${font}`}>

      {/* 3 AMBIENT GRADIENTS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${withAlpha(accent, 0.2)} 0%, transparent 55%)` }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(315deg, transparent 45%, ${withAlpha(accent, 0.15)} 100%)` }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(225deg, transparent 30%, ${withAlpha(accent, 0.05)} 65%, transparent 100%)` }} />
      </div>

      {/* STATUS BAR */}
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

      {/* FIXED HEADER */}
      <div className="absolute top-14 left-4 right-4 z-50 flex justify-between items-center h-[50px] px-1.5">
        <button className="w-[38px] h-[38px] rounded-full flex items-center justify-center">
          <ArrowLeft color="#FBFBFB" size={20} />
        </button>
        <div className="flex items-center gap-1">
          <button className="w-[38px] h-[38px] rounded-full flex items-center justify-center">
            <Share2 color="#FBFBFB" size={20} />
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="no-scrollbar flex-1 overflow-y-auto relative z-10 pb-[120px]" style={{ paddingTop: '120px' }}>

        {/* IMAGEN */}
        <div className="px-5 mb-2">
          <div className="w-full rounded-[32px] overflow-hidden border border-white/[0.08] bg-[#0A0A0A]" style={{ aspectRatio: '1/1' }}>
            {eventData.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={eventData.coverImage} className="w-full h-full object-cover" alt="Cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <span className="text-zinc-600 font-bold text-sm">Sin Imagen</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT CARD */}
        <div className="px-6">

          {/* CATEGORIA + TITULO + FECHA */}
          <div className="mb-[25px] pt-2">
            {eventData.category && (
              <div className="inline-block bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 mb-2">
                <span className="text-[12px] font-black text-white uppercase tracking-[0.5px]">{eventData.category}</span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <h1 className="text-[28px] leading-[1.1] font-black text-white italic tracking-[-1px] flex-1 pr-4">
                {eventData.name || 'NOMBRE DEL EVENTO'}
              </h1>
              <div className="bg-white/5 border border-white/10 rounded-[18px] py-2.5 px-3.5 flex flex-col items-center justify-center shrink-0">
                <span className="text-[13.5px] font-black uppercase mb-0.5" style={{ color: accent }}>{getMonth(eventData.date)}</span>
                <span className="text-[29px] font-black text-white leading-none">{getDay(eventData.date)}</span>
              </div>
            </div>
          </div>

          {/* PRODUCTORA + INSTAGRAM */}
          <div className="flex items-center gap-2 mb-[25px]">
            <div className="flex flex-row items-center px-2.5 py-1 rounded-[18px] bg-white/5 border border-white/10 gap-2">
              <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                <User size={14} className="text-zinc-400" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[9px] text-white/60 font-bold uppercase tracking-wide">PRODUCE</span>
                <span className="text-[13px] text-white font-black">DyzGO</span>
              </div>
              <ChevronRight size={14} style={{ color: accent }} />
            </div>
            {eventData.settings?.showInstagram && (
              <div className="w-[38px] h-[38px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Instagram size={20} color="#FBFBFB" />
              </div>
            )}
          </div>

          {/* CLUB + HORA */}
          <div className={`${glassCard} p-6 mb-[25px]`}>
            <div className="flex items-start justify-center">
              {/* Club half */}
              <div className="flex-1 flex flex-col items-center justify-start px-1">
                <div
                  className="w-11 h-11 rounded-[13px] flex items-center justify-center mb-2 shrink-0 overflow-hidden"
                  style={{
                    padding: '1.5px',
                    background: withAlpha(accent, 0.45),
                    boxShadow: `0 0 10px ${withAlpha(accent, 0.65)}`
                  }}
                >
                  <div className="w-full h-full rounded-[11px] bg-zinc-800 flex items-center justify-center overflow-hidden">
                    <MapPin size={16} className="text-zinc-500" />
                  </div>
                </div>
                <span className="text-[14px] text-white font-black text-center truncate w-full mb-1">{eventData.venue || 'BOSQUE LUZ'}</span>
                <div className="flex items-center gap-0.5">
                  <span className="text-[11px] text-white/60 font-medium">Ver más del club</span>
                  <ChevronRight size={10} className="text-white/60" />
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-white/[0.08] self-stretch mx-2.5" style={{ minHeight: '85px' }} />

              {/* Hora half */}
              <div className="flex-1 flex flex-col items-center justify-start px-1">
                <div className="w-11 h-11 rounded-xl bg-black/60 flex items-center justify-center mb-2 shrink-0">
                  <Clock size={20} style={{ color: accent }} />
                </div>
                <span className="text-[14px] text-white font-black text-center mb-1">
                  {eventData.startTime ? eventData.startTime.substring(0, 5) : '22:00'} HRS
                </span>
                <span className="text-[11px] text-white/60 font-medium text-center">Hora de inicio</span>
              </div>
            </div>
          </div>

          {/* QUEUE STATUS (sin datos — static) */}
          <div className={`${glassCard} p-4 mb-[25px]`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className="text-zinc-400" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">SIN DATOS</span>
            </div>
            <p className="text-zinc-300 text-[13px] font-medium">Acceso tranquilo por ahora.</p>
          </div>

          {/* TAGS */}
          {eventData.musicGenre && (
            <div className="mb-[25px]">
              <h3 className="text-[18px] font-black text-white mb-[15px]">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {eventData.musicGenre.split(',').map((tag, idx) => (
                  <div key={idx} className="flex items-center px-3 py-1.5 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[12px] font-bold text-white">{tag.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DESCRIPCIÓN */}
          {eventData.description && eventData.description.length > 0 && (
            <div className="mb-[25px]">
              <h3 className="text-[18px] font-black text-white mb-[15px]">Acerca del evento</h3>
              <div
                className="text-white/60 text-[14px] leading-6"
                dangerouslySetInnerHTML={{ __html: eventData.description }}
              />
            </div>
          )}

          {/* INFORMACIÓN IMPORTANTE */}
          <div className="mb-[25px]">
            <h3 className="text-[18px] font-black text-white mb-[15px]">Información Importante</h3>
            <div className={`${glassCard} py-5 px-6`}>
              <div className="flex items-center">
                {/* Edad */}
                <div className="flex-1 flex flex-col items-center px-1">
                  <div className="w-9 h-9 rounded-[10px] bg-black/60 flex items-center justify-center mb-2.5">
                    <User size={18} style={{ color: accent }} />
                  </div>
                  <span className="text-[11px] text-white/60 font-bold uppercase tracking-[0.5px] mb-1 text-center">Edad Mínima</span>
                  <span className="text-[14px] text-white font-black text-center">
                    +{eventData.minAgeWomen || 18} M{'   '}+{eventData.minAgeMen || 18} H
                  </span>
                </div>

                {/* Divider */}
                <div className="w-px h-[60px] bg-white/[0.08] mx-2.5" />

                {/* Dress Code */}
                <div className="flex-1 flex flex-col items-center px-1">
                  <div className="w-9 h-9 rounded-[10px] bg-black/60 flex items-center justify-center mb-2.5">
                    <Shirt size={18} style={{ color: accent }} />
                  </div>
                  <span className="text-[11px] text-white/60 font-bold uppercase tracking-[0.5px] mb-1 text-center">Dress Code</span>
                  <span className="text-[14px] text-white font-black text-center truncate w-full">
                    {eventData.dressCode || 'Casual'}
                  </span>
                </div>
              </div>

              {/* Artículos prohibidos */}
              {eventData.prohibitedItems && eventData.prohibitedItems.length > 0 && (
                <>
                  <div className="h-px bg-white/[0.08] my-5" />
                  <p className="text-[12px] text-white/60 font-black text-center mb-2.5">Artículos Prohibidos:</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {eventData.prohibitedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-red-950/40 border border-red-500/[0.1] px-2 py-1 rounded-lg">
                        <Ban size={10} className="text-[#ff5959]" />
                        <span className="text-[10px] font-black text-[#ff5959] uppercase">{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* UBICACIÓN */}
          <div className="mb-[25px]">
            <h3 className="text-[18px] font-black text-white mb-[15px]">Ubicación y Llegada</h3>
            <div className={`${glassCard} p-6`}>
              {/* Mapa */}
              <div className="w-full h-[160px] rounded-[32px] overflow-hidden border border-white/[0.08] mb-2.5 relative">
                {showMap ? (
                  <iframe
                    style={{ border: 0, filter: 'brightness(0.7) contrast(1.2)' }}
                    loading="lazy"
                    allowFullScreen
                    src={mapUrl}
                    className="absolute w-[calc(100%+100px)] h-[calc(100%+120px)] -top-[60px] -left-[50px] pointer-events-none max-w-none"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
                )}
              </div>

              {/* Dirección */}
              <div className="flex flex-row items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 mb-4">
                <span className="text-[11px] text-white/60 font-medium flex-1 truncate pr-2">
                  {eventData.address || 'Santiago, Chile'}
                </span>
                <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                  <Copy size={9} style={{ color: accent }} />
                  <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: accent }}>Copiar</span>
                </div>
              </div>

              {/* Uber + Navegar */}
              <div className="flex gap-3">
                <button className="flex-1 py-3.5 px-2 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2.5">
                  <div className="bg-black/60 w-7 h-7 rounded-lg flex items-center justify-center">
                    <span className="text-white font-black text-[9px]">Uber</span>
                  </div>
                  <span className="text-[13px] font-black text-white">Pedir Uber</span>
                </button>
                <button className="flex-1 py-3.5 px-2 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2.5">
                  <div className="bg-black/60 w-7 h-7 rounded-lg flex items-center justify-center">
                    <Navigation size={14} color="#FBFBFB" />
                  </div>
                  <span className="text-[13px] font-black text-white">Navegar</span>
                </button>
              </div>
            </div>
          </div>

          {/* LEGAL */}
          <div className="mt-2.5 mb-8 px-2.5 text-center">
            {!isInfo && (
              <p className="text-[11px] text-white/60 text-center leading-4 mb-2">
                La producción se reserva el derecho de admisión. Las personas que no cumplan con la edad mínima o el código de vestimenta establecido no podrán ingresar al recinto y sus entradas no serán reembolsadas.
              </p>
            )}
            <p className="text-[11px] text-white/60 text-center font-black">
              Este evento tiene como hora de finalización aproximada las {displayEndTime} HRS {displayEndDay}.
            </p>
            {isInfo && (
              <p className="text-[11px] text-center leading-4 mt-2.5" style={{ color: 'rgba(251,251,251,0.5)' }}>
                Este es un evento informativo. No existe venta de tickets ni sistema de compra asociado. Toda la información publicada es de carácter referencial.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-0 w-full z-50">
        <div
          className="w-full backdrop-blur-3xl border-t border-white/[0.15] px-6 py-6 pb-9 flex items-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          {isInfo ? (
            <span className="flex-1 text-center text-[16px] font-black" style={{ color: 'rgba(251,251,251,0.35)' }}>
              EVENTO INFORMATIVO
            </span>
          ) : (
            <>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] text-white/60 font-black mb-0.5">Desde</span>
                <span className="text-[28px] font-black text-white italic tracking-tight leading-none">
                  ${minPrice.toLocaleString('es-CL')}
                </span>
              </div>
              <button
                className="flex-[1.4] h-[58px] rounded-[20px] flex flex-row items-center justify-center gap-2.5 font-black text-[16px]"
                style={{
                  backgroundColor: withAlpha(accent, 0.15),
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: withAlpha(accent, 0.35),
                  color: accent,
                }}
              >
                OBTENER TICKETS
                <ArrowRight size={18} style={{ color: accent }} strokeWidth={3} />
              </button>
            </>
          )}
        </div>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full pointer-events-none" />
      </div>

    </div>
  )
}

// TICKET SELECTION PREVIEW — replicando exactamente select-tickets.tsx
function TicketSelectionPreview({ eventData, accent, font }: TicketPreviewProps) {
    const visibleTickets = eventData.tickets.filter(t => t.isActive !== false)
    const [quantities, setQuantities] = useState<Record<string, number>>({})

    const handleAdd = (id: string) => setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
    const handleSub = (id: string) => setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }))

    const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0)
    const subtotal = visibleTickets.reduce((sum, t) => sum + (t.price * (quantities[t.id] || 0)), 0)
    const serviceFee = Math.round(subtotal * 0.10)
    const total = subtotal + serviceFee

    return (
        <div className={`w-[390px] h-[820px] bg-[#030303] rounded-[55px] border-[6px] border-black shadow-[0_0_0_4px_#27272a,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col select-none ring-1 ring-white/10 ${font}`}>

            {/* 3 AMBIENT GRADIENTS */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${withAlpha(accent, 0.2)} 0%, transparent 55%)` }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(315deg, transparent 45%, ${withAlpha(accent, 0.15)} 100%)` }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(225deg, transparent 30%, ${withAlpha(accent, 0.05)} 65%, transparent 100%)` }} />
            </div>

            {/* STATUS BAR */}
            <div className="h-14 w-full flex justify-between items-start px-7 pt-4 absolute top-0 z-50 pointer-events-none">
                <span className="text-white text-[13px] font-semibold tracking-wide w-12 text-center">18:06</span>
                <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[110px] h-[32px] bg-black rounded-full flex items-center justify-center z-50">
                    <div className="w-16 h-full flex items-center justify-end pr-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shadow-inner" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 w-12 justify-end text-white">
                    <Signal size={14} strokeWidth={2.5} />
                    <Wifi size={14} strokeWidth={2.5} />
                    <div className="flex items-center justify-center bg-white/20 px-1 rounded-sm">
                        <span className="text-[9px] font-bold mr-0.5">69</span>
                    </div>
                </div>
            </div>

            {/* NAVBAR — igual al NavBar de la app */}
            <div className="absolute top-14 left-0 right-0 z-50 flex items-center justify-between px-5 h-[50px]">
                <button className="w-[38px] h-[38px] rounded-full flex items-center justify-center">
                    <ArrowLeft color="#FBFBFB" size={20} />
                </button>
                <span className="text-white font-black text-[13px] tracking-widest uppercase">SELECCIONAR ENTRADAS</span>
                <div className="w-[38px]" />
            </div>

            {/* SCROLL CONTENT */}
            <div
                className="no-scrollbar flex-1 overflow-y-auto relative z-10"
                style={{ paddingTop: '110px', paddingBottom: '120px', paddingLeft: '25px', paddingRight: '25px' }}
            >
                {/* EVENT HEADER ROW — imagen cuadrada + título/fecha/productor */}
                <div className="flex flex-row items-center gap-[15px] mb-[25px] w-full">
                    {/* Thumbnail 80×80 */}
                    <div
                        className="shrink-0 rounded-[14px] overflow-hidden bg-[#111]"
                        style={{
                            width: 80, height: 80,
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: withAlpha(accent, 0.5),
                            boxShadow: `0 0 10px ${withAlpha(accent, 0.5)}`
                        }}
                    >
                        {eventData.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={eventData.coverImage} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-zinc-800" />
                        )}
                    </div>

                    {/* Texto */}
                    <div className="flex-1 flex flex-col justify-center">
                        <h1
                            className="text-white font-black italic mb-2 leading-[24px]"
                            style={{ fontSize: 20, letterSpacing: -1 }}
                        >
                            {eventData.name || 'NOMBRE DEL EVENTO'}
                        </h1>
                        {eventData.date && (
                            <p className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(251,251,251,0.45)' }}>
                                {eventData.date}
                            </p>
                        )}
                    </div>
                </div>

                {/* SECTION LABEL */}
                <p className="text-white font-black text-[12px] uppercase mb-[15px]" style={{ letterSpacing: 1.5 }}>
                    Tipos de Entrada
                </p>

                {/* TIER LIST */}
                <div className="flex flex-col gap-3 mb-[30px]">
                    {visibleTickets.length === 0 ? (
                        <div className="flex flex-col items-center py-8 opacity-70 bg-white/5 border border-white/10 rounded-[20px]">
                            <Info className="text-zinc-500 mb-2" size={32} />
                            <p className="text-zinc-500 text-sm font-medium text-center">No hay entradas disponibles en este momento.</p>
                        </div>
                    ) : (
                        visibleTickets.map(tier => {
                            const qty = quantities[tier.id] || 0
                            const isSelected = qty > 0
                            return (
                                <div
                                    key={tier.id}
                                    className="flex flex-row items-center justify-between p-4 rounded-[20px] border"
                                    style={{
                                        backgroundColor: isSelected ? withAlpha(accent, 0.07) : 'rgba(255,255,255,0.05)',
                                        borderColor: isSelected ? withAlpha(accent, 0.55) : 'rgba(255,255,255,0.1)',
                                        boxShadow: isSelected ? `0 0 10px ${withAlpha(accent, 0.25)}` : 'none',
                                    }}
                                >
                                    {/* Left */}
                                    <div className="flex-1 pr-2.5 flex flex-col justify-center">
                                        <span
                                            className="font-black mb-1"
                                            style={{ fontSize: 16, letterSpacing: -1, color: isSelected ? accent : '#FBFBFB' }}
                                        >
                                            {tier.name}
                                        </span>
                                        {tier.description && (
                                            <span className="text-[12px] font-semibold italic mb-1.5" style={{ color: 'rgba(251,251,251,0.45)' }}>
                                                {tier.description}
                                            </span>
                                        )}
                                        <span className="font-bold text-[14px] text-white">${tier.price?.toLocaleString('es-CL')}</span>
                                    </div>

                                    {/* Counter */}
                                    <div
                                        className="flex flex-row items-center gap-3 rounded-[14px]"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 6 }}
                                    >
                                        <button
                                            onClick={() => handleSub(tier.id)}
                                            className="w-8 h-8 rounded-[10px] flex items-center justify-center border"
                                            style={{
                                                backgroundColor: qty === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.05)',
                                                borderColor: qty === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)',
                                            }}
                                        >
                                            <span style={{ color: qty === 0 ? 'rgba(255,255,255,0.25)' : 'white', fontSize: 18, lineHeight: 1, fontWeight: 500 }}>−</span>
                                        </button>

                                        <span className="font-black text-white text-center" style={{ fontSize: 16, minWidth: 20 }}>{qty}</span>

                                        <button
                                            onClick={() => handleAdd(tier.id)}
                                            className="w-8 h-8 rounded-[10px] flex items-center justify-center border"
                                            style={{
                                                backgroundColor: withAlpha(accent, 0.15),
                                                borderColor: withAlpha(accent, 0.35),
                                            }}
                                        >
                                            <Plus size={16} style={{ color: accent }} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* SUMMARY */}
                {totalItems > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-[24px] p-5">
                        <p className="text-white font-black mb-[15px]">Resumen</p>
                        <div className="flex justify-between mb-2">
                            <span className="font-semibold" style={{ color: 'rgba(251,251,251,0.45)' }}>Subtotal</span>
                            <span className="text-white font-medium">${subtotal.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="font-semibold" style={{ color: 'rgba(251,251,251,0.45)' }}>Cargo por servicio</span>
                            <span className="text-white font-medium">${serviceFee.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="h-px bg-white/10 my-3" />
                        <div className="flex justify-between">
                            <span className="text-white font-black text-[16px]">Total</span>
                            <span className="font-black text-[20px]" style={{ color: accent }}>${total.toLocaleString('es-CL')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER — igual al de select-tickets */}
            <div className="absolute bottom-0 w-full z-50">
                <div
                    className="w-full backdrop-blur-3xl border-t border-white/[0.15] px-6 pb-9 pt-6"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                    <button
                        className="w-full flex flex-row items-center justify-center gap-2.5 rounded-[20px] font-black"
                        style={{
                            height: 58,
                            backgroundColor: totalItems === 0 ? 'rgba(255,255,255,0.05)' : withAlpha(accent, 0.15),
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: totalItems === 0 ? '#333' : withAlpha(accent, 0.35),
                            color: totalItems === 0 ? 'rgba(251,251,251,0.4)' : accent,
                            fontSize: 16,
                        }}
                    >
                        {totalItems > 0 ? 'IR A PAGAR' : 'SELECCIONA'}
                        {totalItems > 0 && <ArrowRight size={18} style={{ color: accent }} />}
                    </button>
                </div>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full pointer-events-none" />
            </div>
        </div>
    )
}
