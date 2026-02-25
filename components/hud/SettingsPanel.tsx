'use client'
import { useEventStore } from '@/store/useEventStore'
import { supabase } from '@/lib/supabase' 
import { DollarSign, Eye, ShieldCheck, FileText, Ticket } from 'lucide-react'
import { useState, useEffect } from 'react'

// --- INTERFACES PARA TIPADO STRICT ---
interface TicketData {
  price: number
  quantity: number
}

interface EventSettings {
  allowMarketplace: boolean
  allowOverprice: boolean
  [key: string]: unknown
}

interface EventData {
  id?: string
  status?: string
  tickets?: TicketData[]
  settings: EventSettings
  [key: string]: unknown
}

interface StoreState {
  eventData: EventData
  // updateSettings acepta un parcial de settings o propiedades directas como isPrivate
  updateSettings: (settings: Partial<EventSettings> | { isPrivate?: boolean }) => void
}

interface ToggleButtonProps {
  active: boolean
  onClick: () => void
}

interface VisibilityBtnProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  desc: string
  disabled: boolean
  variant: 'green' | 'purple'
}

export default function SettingsPanel() {
  // Casting seguro para evitar errores de tipo con el store global
  const { eventData, updateSettings } = useEventStore() as unknown as StoreState
  
  const [updating, setUpdating] = useState(false)
  
  // ESTADO LOCAL
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)

  // 1. EFECTO DE VERDAD ABSOLUTA
  useEffect(() => {
    const fetchRealStatus = async () => {
        if (!eventData?.id) return

        const { data, error } = await supabase
            .from('events')
            .select('status')
            .eq('id', eventData.id)
            .single()

        if (data && !error) {
            setCurrentStatus(data.status)
        } else {
            // Fallback
            setCurrentStatus(eventData.status || 'draft')
        }
    }

    fetchRealStatus()
  }, [eventData?.id, eventData.status]) 

  const totalRevenue = eventData.tickets?.reduce((acc, ticket) => acc + (ticket.price * ticket.quantity), 0) || 0
  const totalTickets = eventData.tickets?.reduce((acc, ticket) => acc + ticket.quantity, 0) || 0
  const totalCourtesy = eventData.tickets?.filter(t => t.price === 0).reduce((acc, ticket) => acc + ticket.quantity, 0) || 0

  const handleStatusChange = async (targetStatus: 'active' | 'draft') => {
    if (updating || !eventData.id) return
    setUpdating(true)
    
    // UI Optimista
    setCurrentStatus(targetStatus)

    const isPrivate = targetStatus === 'draft'

    try {
        // 1. Actualizamos Store
        updateSettings({ isPrivate })

        // 2. Actualizamos Base de Datos
        const { error } = await supabase
            .from('events')
            .update({ status: targetStatus })
            .eq('id', eventData.id)

        if (error) {
            console.error('Error actualizando:', error)
            // Revertimos si hubo error
            setCurrentStatus(targetStatus === 'active' ? 'draft' : 'active')
        }
    } catch (err) {
        console.error("Error:", err)
    } finally {
        setUpdating(false)
    }
  }

  // Lógica de visualización
  const isPublic = currentStatus === 'active' || currentStatus === 'published'

  return (
    <div className="space-y-8 animate-in slide-in-from-left duration-300 pb-10">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Configuración Final</h2>
        <p className="text-zinc-500 text-xs">Ajusta la visibilidad y reglas de tu evento.</p>
      </div>

      {/* ESTADO DEL EVENTO - AHORA ARRIBA Y LLAMATIVO */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
           Visibilidad del Evento
        </label>
        <div className="grid grid-cols-2 gap-3">
            <VisibilityBtn 
                active={isPublic} 
                onClick={() => handleStatusChange('active')} 
                icon={<Eye size={20}/>} 
                label="Público" 
                desc="Visible en la App" 
                disabled={updating}
                variant="green"
            />
            <VisibilityBtn 
                active={!isPublic} 
                onClick={() => handleStatusChange('draft')} 
                icon={<FileText size={20}/>} 
                label="Borrador" 
                desc="Solo visible por ti" 
                disabled={updating}
                variant="purple"
            />
        </div>
      </div>

      {/* CAPACIDAD Y RESUMEN (MODIFICADO) */}
      <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
             Resumen Financiero
          </label>
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <DollarSign size={120} className="text-green-500" />
             </div>
             <h3 className="text-zinc-500 text-[10px] uppercase font-black mb-1 tracking-widest">Capacidad de Recaudación</h3>
             <div className="text-3xl font-black text-white">${totalRevenue.toLocaleString('es-CL')}</div>
             
             {/* Nueva info útil agregada */}
             <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-2 gap-4 relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><Ticket size={12}/> Tickets Totales</span>
                    <span className="text-sm font-bold text-white">{totalTickets} unds.</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><Eye size={12}/> Cortesías</span>
                    <span className="text-sm font-bold text-white">{totalCourtesy} unds.</span>
                </div>
             </div>
          </div>
      </div>

      {/* REVENTA Y MARKETPLACE - AHORA ABAJO */}
      <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
             Reglas Comerciales
          </label>
          <div className="space-y-4 p-5 bg-purple-600/5 border border-purple-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white">DyzGO Marketplace</h3>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">Permitir Reventa (Safe-Swap)</span>
                <ToggleButton active={eventData.settings.allowMarketplace} onClick={() => updateSettings({ allowMarketplace: !eventData.settings.allowMarketplace })} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">Permitir Reventa con Sobreprecio</span>
                <ToggleButton active={eventData.settings.allowOverprice} onClick={() => updateSettings({ allowOverprice: !eventData.settings.allowOverprice })} />
              </div>
          </div>
      </div>
    </div>
  )
}

function ToggleButton({ active, onClick }: ToggleButtonProps) {
    return (
        <button onClick={onClick} className={`w-10 h-5 rounded-full transition-all relative ${active ? 'bg-purple-600' : 'bg-zinc-800'}`}>
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`} />
        </button>
    )
}

function VisibilityBtn({ active, onClick, icon, label, desc, disabled, variant }: VisibilityBtnProps) {
    const isGreen = variant === 'green'
    
    // Estilos dinámicos basados en la variante y el estado activo
    const activeClass = isGreen 
        ? 'bg-[#00D15B]/10 border-[#00D15B] text-white shadow-[0_0_20px_rgba(0,209,91,0.1)]' 
        : 'bg-[#8A2BE2]/10 border-[#8A2BE2] text-white shadow-[0_0_20px_rgba(138,43,226,0.1)]'
        
    const inactiveClass = 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800/80 hover:border-zinc-700'
    const iconColor = active ? (isGreen ? 'text-[#00D15B]' : 'text-[#8A2BE2]') : 'text-zinc-500'

    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all duration-300 ${
                active ? activeClass : inactiveClass
            } ${disabled ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
        >
            <div className={iconColor}>{icon}</div>
            <div>
                <div className="font-black text-sm tracking-wide">{label}</div>
                <div className="text-[10px] opacity-70 mt-0.5 font-medium">{desc}</div>
            </div>
        </button>
    )
}
