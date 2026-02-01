'use client'
import { useState, forwardRef } from 'react' 
import { 
  Plus, Trash2, UserCheck, 
  Calendar, Clock, Ghost, Eye, EyeOff, ChevronDown, ChevronUp, Save, X, AlertTriangle, Slash,
  Ticket as TicketIcon, Gift, Settings, Tag, Layers
} from 'lucide-react'
import { useEventStore, Ticket } from '@/store/useEventStore'
import DatePicker, { registerLocale } from 'react-datepicker' 
import "react-datepicker/dist/react-datepicker.css"
import { es } from 'date-fns/locale/es'

registerLocale('es', es)

const datePickerStyles = `
  .react-datepicker-wrapper { width: 100%; }
  .react-datepicker-popper { z-index: 9999 !important; }
  .react-datepicker { 
    font-family: inherit; 
    background-color: #09090b; 
    border: 1px solid #27272a; 
    color: white; 
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  }
  .react-datepicker__header { 
    background-color: #09090b; 
    border-bottom: 1px solid #27272a; 
    border-top-left-radius: 0.75rem;
    border-top-right-radius: 0.75rem;
  }
  .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker-time__header { 
    color: #a1a1aa !important; 
  }
  .react-datepicker__day { 
    color: #e4e4e7; 
  }
  .react-datepicker__day:hover { 
    background-color: #27272a !important; 
  }
  .react-datepicker__day--selected { 
    background-color: #9333ea !important; 
    color: white !important;
  }
  .react-datepicker__day--disabled {
    color: #3f3f46 !important;
  }
  
  /* Selector de Hora y Scrollbar Estética */
  .react-datepicker__time-container { 
    border-left: 1px solid #27272a !important;
    background-color: #09090b !important;
    width: 85px !important;
  }
  .react-datepicker__time {
    background-color: #09090b !important;
    border-bottom-right-radius: 0.75rem;
  }
  .react-datepicker__time-box {
    width: 100% !important;
    background-color: #09090b !important;
  }
  .react-datepicker__time-list {
    scrollbar-width: thin;
    scrollbar-color: #3f3f46 #09090b;
  }
  .react-datepicker__time-list::-webkit-scrollbar {
    width: 5px;
  }
  .react-datepicker__time-list::-webkit-scrollbar-track {
    background: #09090b;
  }
  .react-datepicker__time-list::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 10px;
  }
  .react-datepicker__time-list-item {
    background-color: #09090b !important;
    color: #e4e4e7 !important;
  }
  .react-datepicker__time-list-item:hover { 
    background-color: #27272a !important; 
  }
  .react-datepicker__time-list-item--selected { 
    background-color: #9333ea !important; 
    color: white !important;
  }

  /* Eliminar flechas de inputs numéricos */
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`

const INITIAL_TICKET_STATE: Omit<Ticket, 'id'> = {
  name: '', price: 0, quantity: 0, description: '', startDate: '', endDate: '', 
  isGhostSoldOut: false, isActive: true, isNominative: false, type: 'paid', color: 'purple',
  ticketsIncluded: 1
}

export default function TicketPanel() {
  const { eventData, addTicket, removeTicket, updateTicket } = useEventStore()
  const [isCreating, setIsCreating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false) 
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false) 
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null) 
  
  const [newTicketForm, setNewTicketForm] = useState({ ...INITIAL_TICKET_STATE, price: '', quantity: '' })

  const parseDate = (dateStr?: string) => {
      if (!dateStr) return null
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [year, month, day] = datePart.split('-').map(Number)
      return new Date(year, month - 1, day)
  }

  const parseTime = (dateStr?: string) => {
      if (!dateStr) return null
      const timePart = dateStr.includes('T') ? dateStr.split('T')[1]?.slice(0, 5) : '';
      if (!timePart) return null
      const [hours, minutes] = timePart.split(':').map(Number)
      const date = new Date(); date.setHours(hours); date.setMinutes(minutes)
      return date
  }

  const handleNewTicketDate = (type: 'start' | 'end', value: Date | null, mode: 'date' | 'time') => {
      if (!value) return
      const currentIso = type === 'start' ? newTicketForm.startDate : newTicketForm.endDate
      const baseDate = currentIso ? new Date(currentIso) : new Date()
      
      if (mode === 'date') baseDate.setFullYear(value.getFullYear(), value.getMonth(), value.getDate())
      else baseDate.setHours(value.getHours(), value.getMinutes())
      
      setNewTicketForm({
          ...newTicketForm,
          [type === 'start' ? 'startDate' : 'endDate']: baseDate.toISOString()
      })
  }

  const handleUpdateDateTime = (ticketId: string, type: 'start' | 'end', value: Date | null, mode: 'date' | 'time') => {
      if (!value) return
      const currentIso = type === 'start' ? eventData.tickets.find(t => t.id === ticketId)?.startDate : eventData.tickets.find(t => t.id === ticketId)?.endDate
      const baseDate = currentIso ? new Date(currentIso) : new Date()
      if (mode === 'date') baseDate.setFullYear(value.getFullYear(), value.getMonth(), value.getDate())
      else baseDate.setHours(value.getHours(), value.getMinutes())
      const newIso = baseDate.toISOString()
      updateTicket(ticketId, { [type === 'start' ? 'startDate' : 'endDate']: newIso })
  }

  const CustomInput = forwardRef(({ value, onClick, placeholder, icon }: any, ref: any) => (
    <div onClick={onClick} ref={ref} className="relative w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 cursor-pointer hover:border-zinc-600 transition-colors flex items-center justify-between gap-3 h-[38px]">
        <span className={`text-xs ${value ? 'text-zinc-300' : 'text-zinc-600'}`}>{value || placeholder}</span>
        <div className="text-zinc-500">{icon}</div>
    </div>
  ))
  CustomInput.displayName = 'CustomInput'

  const handleAdd = () => {
    if (!newTicketForm.name || (newTicketForm.type === 'paid' && !newTicketForm.price)) return
    
    // Validamos que sea al menos 1
    const finalTicketsIncluded = Math.max(1, Number(newTicketForm.ticketsIncluded) || 1);

    addTicket({
        ...newTicketForm,
        price: newTicketForm.type === 'courtesy' ? 0 : Number(newTicketForm.price),
        isActive: newTicketForm.type === 'paid' ? newTicketForm.isActive : false, 
        quantity: Number(newTicketForm.quantity) || 100,
        color: newTicketForm.type === 'courtesy' ? 'pink' : 'purple',
        startDate: newTicketForm.startDate || undefined,
        endDate: newTicketForm.endDate || undefined,
        type: newTicketForm.type,
        isGhostSoldOut: newTicketForm.type === 'courtesy' ? false : newTicketForm.isGhostSoldOut,
        ticketsIncluded: finalTicketsIncluded
    })
    setNewTicketForm({ ...INITIAL_TICKET_STATE, price: '', quantity: '' })
    setIsCreating(false)
    setShowAdvanced(false)
  }

  const confirmDelete = () => {
    if (ticketToDelete) {
        removeTicket(ticketToDelete)
        setTicketToDelete(null)
    }
  }

  return (
    <div className="space-y-6 pb-20 relative">
      <style>{datePickerStyles}</style>
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-white">Motor de Tickets</h2><p className="text-xs text-zinc-500">Gestiona precios, stock y reglas.</p></div>
      </div>

      {!isCreating ? (
          <button onClick={() => setIsCreating(true)} className="w-full py-3 bg-zinc-900 border border-zinc-800 border-dashed text-zinc-400 font-bold rounded-xl text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"><Plus size={16} /> Agregar Nuevo Ticket</button>
      ) : (
          <div className="bg-zinc-900/80 border border-zinc-700 p-4 rounded-xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-white">Nuevo Ticket</h3><button onClick={() => setIsCreating(false)}><X size={16} className="text-zinc-500 hover:text-white"/></button></div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-zinc-800/50">
                <button onClick={() => setNewTicketForm({...newTicketForm, type: 'paid', isActive: true})} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${newTicketForm.type === 'paid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}><TicketIcon size={14} /> Pagado</button>
                <button onClick={() => setNewTicketForm({...newTicketForm, type: 'courtesy', price: '0', isActive: false, isGhostSoldOut: false, ticketsIncluded: 1})} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${newTicketForm.type === 'courtesy' ? 'bg-pink-900/30 text-pink-400 border border-pink-500/20' : 'text-zinc-500'}`}><Gift size={14} /> Cortesía</button>
            </div>
            <div className="space-y-3">
                <input value={newTicketForm.name} onChange={(e) => setNewTicketForm({...newTicketForm, name: e.target.value})} placeholder="Nombre (ej: Promo 2x1)" className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-zinc-500 font-bold uppercase mb-1 block">Precio Total</label>{newTicketForm.type === 'paid' ? <input value={newTicketForm.price} onChange={(e) => setNewTicketForm({...newTicketForm, price: e.target.value})} type="number" placeholder="$ 0" className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none" /> : <div className="w-full bg-zinc-800/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-500 italic">Gratis (Cortesía)</div>}</div>
                    <div><label className="text-[10px] text-zinc-500 font-bold uppercase mb-1 block">Stock (Packs)</label><input value={newTicketForm.quantity} onChange={(e) => setNewTicketForm({...newTicketForm, quantity: e.target.value})} type="number" placeholder="100" className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none" /></div>
                </div>

                {/* CASILLA UNICA PARA CANTIDAD DE TICKETS */}
                {newTicketForm.type === 'paid' && (
                    <div className="bg-black/20 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                                <Layers size={12} /> Tickets por compra
                            </label>
                            <p className="text-[9px] text-zinc-600 mt-0.5 max-w-[180px]">
                                Cantidad de QRs que se generarán al comprar 1 unidad de este ticket.
                            </p>
                        </div>
                        <div className="w-20">
                            <input 
                                type="number" 
                                min="1"
                                value={newTicketForm.ticketsIncluded} 
                                onChange={(e) => setNewTicketForm({...newTicketForm, ticketsIncluded: Math.max(1, Number(e.target.value))})} 
                                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 text-center font-bold" 
                            />
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                        {showAdvanced ? <ChevronUp size={14}/> : <Settings size={14} />} Configuración Avanzada
                    </button>

                    {showAdvanced && (
                        <div className="mt-3 space-y-4 animate-in slide-in-from-top-2">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1 block">Descripción</label>
                                <textarea 
                                    value={newTicketForm.description} 
                                    onChange={(e) => setNewTicketForm({...newTicketForm, description: e.target.value})}
                                    placeholder="Detalles adicionales para este ticket..." 
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500 min-h-[80px] resize-none placeholder:text-zinc-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><Calendar size={10}/> Fecha Inicio</label>
                                    <DatePicker selected={parseDate(newTicketForm.startDate)} onChange={(d) => handleNewTicketDate('start', d, 'date')} dateFormat="dd/MM/yyyy" customInput={<CustomInput placeholder="Seleccionar Fecha" icon={<Calendar size={14}/>} />} locale="es" />
                                    <DatePicker selected={parseTime(newTicketForm.startDate)} onChange={(d) => handleNewTicketDate('start', d, 'time')} showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Hora" dateFormat="HH:mm" customInput={<CustomInput placeholder="Seleccionar Hora" icon={<Clock size={14}/>} />} locale="es" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><Calendar size={10}/> Fecha Fin</label>
                                    <DatePicker selected={parseDate(newTicketForm.endDate)} onChange={(d) => handleNewTicketDate('end', d, 'date')} dateFormat="dd/MM/yyyy" customInput={<CustomInput placeholder="Seleccionar Fecha" icon={<Calendar size={14}/>} />} locale="es" />
                                    <DatePicker selected={parseTime(newTicketForm.endDate)} onChange={(d) => handleNewTicketDate('end', d, 'time')} showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Hora" dateFormat="HH:mm" customInput={<CustomInput placeholder="Seleccionar Hora" icon={<Clock size={14}/>} />} locale="es" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2">
                                {newTicketForm.type === 'courtesy' ? (
                                    <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-zinc-800 bg-black/50 text-zinc-600 opacity-50 cursor-not-allowed"><EyeOff size={18} /><span className="text-[9px] font-bold">SIEMPRE OCULTO</span></div>
                                ) : (
                                    <button onClick={() => setNewTicketForm({...newTicketForm, isActive: !newTicketForm.isActive})} className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${newTicketForm.isActive ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-black border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>{newTicketForm.isActive ? <Eye size={18} /> : <EyeOff size={18} />} VISIBLE</button>
                                )}
                                
                                <button onClick={() => setNewTicketForm({...newTicketForm, isNominative: !newTicketForm.isNominative})} className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${newTicketForm.isNominative ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-black border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}><UserCheck size={18} /> NOMINATIVO</button>
                                
                                <button 
                                    disabled={newTicketForm.type === 'courtesy'}
                                    onClick={() => setNewTicketForm({...newTicketForm, isGhostSoldOut: !newTicketForm.isGhostSoldOut})} 
                                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${newTicketForm.type === 'courtesy' ? 'opacity-30 cursor-not-allowed border-zinc-800 text-zinc-600' : (newTicketForm.isGhostSoldOut ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-black border-zinc-800 text-zinc-600 hover:border-zinc-700')}`}
                                >
                                    <Ghost size={18} /> FAKE SOLD OUT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={handleAdd} className="w-full py-2.5 bg-white text-black font-bold rounded-lg text-sm hover:bg-zinc-200 flex items-center justify-center gap-2 mt-2"><Save size={16} /> Guardar Ticket</button>
          </div>
      )}

      <div className="space-y-3">
        {eventData.tickets.map((t) => {
            const isExpanded = expandedTicketId === t.id
            const isCourtesy = t.type === 'courtesy' || t.price === 0; 
            
            return (
                <div key={t.id} className={`bg-zinc-900 border transition-all duration-300 rounded-xl overflow-hidden ${isExpanded ? 'border-purple-500/50 shadow-lg shadow-purple-900/10' : 'border-zinc-800'}`}>
                    <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => { 
                        if (expandedTicketId === t.id) {
                            setExpandedTicketId(null); 
                        } else {
                            setExpandedTicketId(t.id);
                            setShowAdvancedEdit(false); 
                        }
                    }}>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-10 rounded-full ${isCourtesy ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : (t.isGhostSoldOut ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : (t.isActive ? 'bg-green-500' : 'bg-zinc-700'))}`}></div>
                            <div>
                                <h3 className={`font-bold text-sm text-white flex items-center gap-2`}>
                                    {t.name}
                                    {t.ticketsIncluded && t.ticketsIncluded > 1 && (
                                        <span className="bg-blue-500/20 text-blue-300 text-[9px] px-1.5 py-0.5 rounded border border-blue-500/30 uppercase font-black tracking-wider">
                                            Genera {t.ticketsIncluded} QRs
                                        </span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-2 text-xs">
                                    {isCourtesy ? <span className="text-pink-400 font-bold uppercase text-[10px] border border-pink-500/20 bg-pink-500/10 px-1.5 rounded flex items-center gap-1"><Gift size={10} /> Cortesía</span> : <span className="text-purple-400 font-mono font-bold">${t.price.toLocaleString()}</span>}
                                    <span className="text-zinc-600">•</span>
                                    {t.isGhostSoldOut ? (
                                        <span className="text-red-500 font-bold uppercase">SOLD OUT</span>
                                    ) : (
                                        <span className="text-zinc-400">{t.quantity} un.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={(e) => { e.stopPropagation(); setTicketToDelete(t.id); }} className="p-2 text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                            {isExpanded ? <ChevronUp size={16} className="text-zinc-500"/> : <ChevronDown size={16} className="text-zinc-500"/>}
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="p-4 pt-0 border-t border-zinc-800/50 bg-black/20 space-y-5">
                            
                            <div className="mt-4">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Nombre</label>
                                <input value={t.name} onChange={(e) => updateTicket(t.id, { name: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1 block">Precio Total</label>
                                    {t.type === 'courtesy' ? (
                                        <div className="w-full bg-zinc-800/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-500 italic">Gratis (Cortesía)</div>
                                    ) : (
                                        <input type="number" value={t.price} onChange={(e) => updateTicket(t.id, { price: Number(e.target.value) })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Stock</label>
                                    <input type="number" value={t.quantity} onChange={(e) => updateTicket(t.id, { quantity: parseInt(e.target.value) || 0 })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                </div>
                            </div>

                            {/* SECCIÓN DE EDICIÓN DE CANTIDAD DE TICKETS */}
                            {!isCourtesy && (
                                <div className="bg-black/20 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                                            <Layers size={12} /> Tickets por compra
                                        </label>
                                        <p className="text-[9px] text-zinc-600 mt-0.5 max-w-[180px]">
                                            Cantidad de QRs generados por unidad.
                                        </p>
                                    </div>
                                    <div className="w-20">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={t.ticketsIncluded || 1} 
                                            onChange={(e) => updateTicket(t.id, { ticketsIncluded: Math.max(1, Number(e.target.value)) })} 
                                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 text-center font-bold" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- CONFIGURACIÓN AVANZADA (EDICIÓN) --- */}
                            <div className="pt-2">
                                <button onClick={() => setShowAdvancedEdit(!showAdvancedEdit)} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                                    {showAdvancedEdit ? <ChevronUp size={14}/> : <Settings size={14} />} Configuración Avanzada
                                </button>

                                {showAdvancedEdit && (
                                    <div className="mt-3 space-y-4 animate-in slide-in-from-top-2">
                                            <div>
                                                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1 block">Descripción</label>
                                                <textarea 
                                                    value={t.description || ''} 
                                                    onChange={(e) => updateTicket(t.id, { description: e.target.value })}
                                                    placeholder="Detalles adicionales para este ticket..." 
                                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500 min-h-[80px] resize-none placeholder:text-zinc-600"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><Calendar size={10}/> Fecha Inicio</label>
                                                    <DatePicker selected={parseDate(t.startDate)} onChange={(d) => handleUpdateDateTime(t.id, 'start', d, 'date')} dateFormat="dd/MM/yyyy" customInput={<CustomInput placeholder="Seleccionar Fecha" icon={<Calendar size={14}/>} />} locale="es" />
                                                    <DatePicker selected={parseTime(t.startDate)} onChange={(d) => handleUpdateDateTime(t.id, 'start', d, 'time')} showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Hora" dateFormat="HH:mm" customInput={<CustomInput placeholder="Seleccionar Hora" icon={<Clock size={14}/>} />} locale="es" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><Calendar size={10}/> Fecha Fin</label>
                                                    <DatePicker selected={parseDate(t.endDate)} onChange={(d) => handleUpdateDateTime(t.id, 'end', d, 'date')} dateFormat="dd/MM/yyyy" customInput={<CustomInput placeholder="Seleccionar Fecha" icon={<Calendar size={14}/>} />} locale="es" />
                                                    <DatePicker selected={parseTime(t.endDate)} onChange={(d) => handleUpdateDateTime(t.id, 'end', d, 'time')} showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Hora" dateFormat="HH:mm" customInput={<CustomInput placeholder="Seleccionar Hora" icon={<Clock size={14}/>} />} locale="es" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 pt-2">
                                                {isCourtesy ? (
                                                    <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-zinc-800 bg-black/50 text-zinc-600 opacity-50 cursor-not-allowed"><EyeOff size={16} /><span className="text-[9px] font-bold">SIEMPRE OCULTO</span></div>
                                                ) : (
                                                    <button onClick={() => updateTicket(t.id, { isActive: !t.isActive })} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[10px] font-bold transition-all ${t.isActive ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-black border-zinc-800 text-zinc-600'}`}>{t.isActive ? <Eye size={16} /> : <EyeOff size={16} />} {t.isActive ? 'VISIBLE' : 'OCULTO'}</button>
                                                )}
                                                <button onClick={() => updateTicket(t.id, { isNominative: !t.isNominative })} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[10px] font-bold transition-all ${t.isNominative ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-black border-zinc-800 text-zinc-600'}`}><UserCheck size={16} /> NOMINATIVO</button>
                                                
                                                <button 
                                                    disabled={isCourtesy}
                                                    onClick={() => updateTicket(t.id, { isGhostSoldOut: !t.isGhostSoldOut })} 
                                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[10px] font-bold transition-all ${isCourtesy ? 'opacity-30 cursor-not-allowed border-zinc-800 text-zinc-600' : (t.isGhostSoldOut ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-black border-zinc-800 text-zinc-600')}`}
                                                >
                                                    <Ghost size={16} /> FAKE SOLD OUT
                                                </button>
                                            </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
        })}
      </div>
      {ticketToDelete && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full"><div className="flex flex-col items-center text-center gap-4"><div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20"><AlertTriangle className="text-red-500" size={24} /></div><div><h3 className="text-lg font-bold text-white mb-2">¿Eliminar Ticket?</h3><p className="text-sm text-zinc-400">Esta acción no se puede deshacer.</p></div><div className="flex gap-3 w-full"><button onClick={() => setTicketToDelete(null)} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold">Cancelar</button><button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold">Sí, Eliminar</button></div></div></div></div>}
    </div>
  )
}