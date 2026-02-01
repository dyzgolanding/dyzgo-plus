'use client'
import { useEventStore } from '@/store/useEventStore'
import { supabase } from '@/lib/supabase' 
import { DollarSign, Eye, ShieldCheck, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'

// --- INTERFACES PARA TIPADO STRICT ---
interface Ticket {
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
  tickets?: Ticket[]
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
        <p className="text-zinc-500 text-xs">Reglas de negocio y economía del evento.</p>
      </div>

      <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
         <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={120} className="text-green-500" />
         </div>
         <h3 className="text-zinc-500 text-[10px] uppercase font-black mb-1 tracking-widest">Capacidad de Recaudación</h3>
         <div className="text-3xl font-black text-white">${totalRevenue.toLocaleString('es-CL')}</div>
         <div className="mt-4 flex gap-4">
            <div className="text-[10px] text-zinc-400 font-bold">FEES: <span className="text-white">DyzGO 7%</span></div>
            <div className="text-[10px] text-zinc-400 font-bold">NETO EST: <span className="text-green-400">${(totalRevenue * 0.93).toLocaleString('es-CL')}</span></div>
         </div>
      </div>

      {/* REVENTA Y MARKETPLACE */}
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

      {/* ESTADO DEL EVENTO */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Estado del Evento</label>
        <div className="grid grid-cols-2 gap-3">
            <VisibilityBtn 
                active={isPublic} 
                onClick={() => handleStatusChange('active')} 
                icon={<Eye size={18}/>} 
                label="Público" 
                desc="Visible en App y SEO" 
                disabled={updating}
            />
            <VisibilityBtn 
                active={!isPublic} 
                onClick={() => handleStatusChange('draft')} 
                icon={<FileText size={18}/>} 
                label="Borrador" 
                desc="Solo visible por ti" 
                disabled={updating}
            />
        </div>
      </div>
    </div>
  )
}

function ToggleButton({ active, onClick }: ToggleButtonProps) {
    return (
        <button onClick={onClick} className={`w-10 h-5 rounded-full transition-all relative ${active ? 'bg-purple-600' : 'bg-zinc-800'}`}>
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-6' : 'left-1'}`} />
        </button>
    )
}

function VisibilityBtn({ active, onClick, icon, label, desc, disabled }: VisibilityBtnProps) {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                active 
                ? 'bg-purple-900/20 border-purple-500 text-white' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
            } ${disabled ? 'opacity-50 cursor-wait' : ''}`}
        >
            {icon}
            <div>
                <div className="font-bold text-xs">{label}</div>
                <div className="text-[9px] opacity-70">{desc}</div>
            </div>
        </button>
    )
}