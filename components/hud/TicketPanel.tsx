'use client'
import { useState, forwardRef, useEffect } from 'react' 
import { 
  Plus, Trash2, UserCheck, 
  Calendar, Clock, Ghost, Eye, EyeOff, ChevronDown, ChevronUp, Save, X, AlertTriangle,
  Ticket as TicketIcon, Gift, Settings, Layers, GripVertical, Timer, Flag
} from 'lucide-react'
import { useEventStore } from '@/store/useEventStore'
import DatePicker, { registerLocale } from 'react-datepicker' 
import "react-datepicker/dist/react-datepicker.css"
import { es } from 'date-fns/locale/es'

registerLocale('es', es)

// --- COMPONENTE MEJORADO PARA SOLUCIONAR EL BACKSPACE Y LOS CEROS A LA IZQUIERDA ---
function NumericInput({ value, min = 1, placeholder, onChange, className, centerText = false }: {
    value: number | string
    min?: number
    placeholder?: string
    onChange: (n: number) => void
    className?: string
    centerText?: boolean
}) {
    const [local, setLocal] = useState(String(value))

    useEffect(() => {
        setLocal((prev) => {
            // Permite que el input esté visualmente vacío si el valor actual coincide con el mínimo
            if (prev === '' && value === min) return prev;
            if (parseInt(prev) === value) return prev;
            return String(value);
        })
    }, [value, min])

    return (
        <input
            type="text"
            inputMode="numeric"
            value={local}
            placeholder={placeholder}
            onFocus={(e) => e.target.select()} // Selecciona el 0 automáticamente al hacer clic
            onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '')
                
                // Evitar múltiples ceros a la izquierda (ej: 030 -> 30)
                if (digits.length > 1 && digits.startsWith('0')) {
                    digits = digits.replace(/^0+/, '');
                    if (digits === '') digits = '0';
                }
                
                setLocal(digits)
                
                if (digits === '') {
                    onChange(min) // Si borran todo, enviamos el mínimo silenciosamente
                } else {
                    const n = parseInt(digits)
                    if (!isNaN(n)) onChange(n)
                }
            }}
            onBlur={() => {
                const n = parseInt(local)
                if (isNaN(n) || n < min) {
                    setLocal(String(min))
                    onChange(min)
                } else {
                    setLocal(String(n))
                }
            }}
            className={`${className ?? ''} ${centerText ? 'text-center' : ''}`}
        />
    )
}

// --- INTERFACES LOCALES PARA TIPADO ---
interface Ticket {
  id: string
  name: string
  price: number
  quantity: number
  description?: string
  startDate?: string
  endDate?: string
  isGhostSoldOut: boolean
  isActive: boolean
  isNominative: boolean
  type: 'paid' | 'courtesy'
  color: string
  ticketsIncluded?: number
  sold?: number
}

interface TicketStoreState {
  eventData: {
    tickets: Ticket[]
    [key: string]: unknown
  }
  addTicket: (t: Omit<Ticket, 'id'>) => void
  removeTicket: (id: string) => void
  updateTicket: (id: string, data: Partial<Ticket>) => void
}

interface CustomInputProps {
  value?: string
  onClick?: () => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  icon?: React.ReactNode
  isTime?: boolean
}

// Estado inicial para el formulario
const INITIAL_TICKET_STATE = {
  name: '', 
  price: 0, 
  quantity: 0, 
  description: '', 
  startDate: '', 
  endDate: '', 
  isGhostSoldOut: false, 
  isActive: true, 
  isNominative: false, 
  type: 'paid' as const, 
  color: 'purple',
  ticketsIncluded: 1 as string | number 
}

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
  .react-datepicker__day { color: #e4e4e7; }
  .react-datepicker__day:hover { background-color: #27272a !important; }
  .react-datepicker__day--selected { background-color: #9333ea !important; color: white !important; }
  .react-datepicker__day--disabled { color: #3f3f46 !important; }
  .react-datepicker__time-container { border-left: 1px solid #27272a !important; background-color: #09090b !important; width: 85px !important; }
  .react-datepicker__time { background-color: #09090b !important; border-bottom-right-radius: 0.75rem; }
  .react-datepicker__time-box { width: 100% !important; background-color: #09090b !important; }
  .react-datepicker__time-list { scrollbar-width: thin; scrollbar-color: #3f3f46 #09090b; }
  .react-datepicker__time-list::-webkit-scrollbar { width: 5px; }
  .react-datepicker__time-list::-webkit-scrollbar-track { background: #09090b; }
  .react-datepicker__time-list::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
  .react-datepicker__time-list-item { background-color: #09090b !important; color: #e4e4e7 !important; }
  .react-datepicker__time-list-item:hover { background-color: #27272a !important; }
  .react-datepicker__time-list-item--selected { background-color: #9333ea !important; color: white !important; }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`

export default function TicketPanel() {
  const { eventData, addTicket, removeTicket, updateTicket } = useEventStore() as unknown as TicketStoreState
  
  const [isCreating, setIsCreating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false) 
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false) 
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null) 
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [newTicketForm, setNewTicketForm] = useState({ ...INITIAL_TICKET_STATE, price: '' as string | number, quantity: '' as string | number })
  
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const parseDate = (dateStr?: string) => {
      if (!dateStr) return null
      return new Date(dateStr)
  }

  const parseTime = (dateStr?: string) => {
      if (!dateStr) return null
      return new Date(dateStr)
  }

  const handleNewTicketDate = (type: 'start' | 'end', value: Date | null, mode: 'date' | 'time') => {
      if (!value) return
      const currentIso = type === 'start' ? newTicketForm.startDate : newTicketForm.endDate
      const baseDate = currentIso ? new Date(currentIso) : new Date()
      
      if (mode === 'date') {
          baseDate.setFullYear(value.getFullYear(), value.getMonth(), value.getDate())
          if (!currentIso) {
              baseDate.setHours(0, 0, 0, 0)
          }
      } else {
          baseDate.setHours(value.getHours(), value.getMinutes(), 0, 0)
      }
      
      setNewTicketForm({
          ...newTicketForm,
          [type === 'start' ? 'startDate' : 'endDate']: baseDate.toISOString()
      })
  }

  const handleUpdateDateTime = (ticketId: string, type: 'start' | 'end', value: Date | null, mode: 'date' | 'time') => {
      if (!value) return
      const currentIso = type === 'start' ? eventData.tickets.find(t => t.id === ticketId)?.startDate : eventData.tickets.find(t => t.id === ticketId)?.endDate
      const baseDate = currentIso ? new Date(currentIso) : new Date()
      
      if (mode === 'date') {
          baseDate.setFullYear(value.getFullYear(), value.getMonth(), value.getDate())
          if (!currentIso) {
              baseDate.setHours(0, 0, 0, 0)
          }
      } else {
          baseDate.setHours(value.getHours(), value.getMinutes(), 0, 0)
      }
      
      const newIso = baseDate.toISOString()
      updateTicket(ticketId, { [type === 'start' ? 'startDate' : 'endDate']: newIso })
  }

  // eslint-disable-next-line react/display-name
  const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(({ value, onClick, onChange, onBlur, onKeyDown, placeholder, icon, isTime }, ref) => {
    
    const [localValue, setLocalValue] = useState(value || '');

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isTime) {
            let val = e.target.value;
            
            if (localValue.endsWith(':') && val === localValue.slice(0, -1)) {
                val = val.slice(0, -1);
            } else {
                let digits = val.replace(/\D/g, ''); 
                if (digits.length > 4) digits = digits.substring(0, 4); 
                
                if (digits.length >= 3) {
                    val = digits.substring(0, 2) + ':' + digits.substring(2);
                } else if (digits.length === 2) {
                    val = digits + ':';
                } else {
                    val = digits;
                }
            }
            
            setLocalValue(val);
            
            if (val.length === 5 || val.length === 0) {
                e.target.value = val;
                if (onChange) onChange(e);
            }
        } else {
            if (onChange) onChange(e);
        }
    };

    return (
      <div onClick={!isTime ? onClick : undefined} className={`relative w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 hover:border-zinc-600 focus-within:border-purple-500 transition-colors flex items-center justify-between gap-3 h-[38px] ${isTime ? 'cursor-text' : 'cursor-pointer'}`}>
          <input
              ref={ref}
              type="text"
              value={isTime ? localValue : (value || '')}
              onClick={onClick}
              onChange={handleChange}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              placeholder={isTime ? '00:00' : (placeholder || 'Seleccionar')}
              maxLength={isTime ? 5 : undefined}
              readOnly={!isTime}
              className={`bg-transparent border-none outline-none text-xs w-full ${isTime ? (localValue ? 'text-zinc-300' : 'text-zinc-400') : (value ? 'text-zinc-300' : 'text-zinc-400')} ${!isTime ? 'cursor-pointer' : ''}`}
          />
          <div className="text-zinc-400 pointer-events-none">{icon}</div>
      </div>
    );
  })

  const handleAdd = () => {
    // Si es pagado, permite $0 porque el productor puede vender a $0, pero no debe estar vacío el campo "name".
    // Evaluamos el length de String(price) por si acaso.
    if (!newTicketForm.name || (newTicketForm.type === 'paid' && newTicketForm.price === '')) return
    
    const finalTicketsIncluded = Number(newTicketForm.ticketsIncluded);
    
    if (newTicketForm.type === 'paid' && finalTicketsIncluded < 1) {
        alert("No se pueden mandar 0 entradas por compra.");
        return;
    }

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index)
      e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, targetIndex: number) => {
      if (draggedIndex === null || draggedIndex === targetIndex) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useEventStore.setState((state: any) => {
          const newTickets = [...state.eventData.tickets]
          const draggedTicket = newTickets[draggedIndex]
          newTickets.splice(draggedIndex, 1)
          newTickets.splice(targetIndex, 0, draggedTicket)
          return { ...state, eventData: { ...state.eventData, tickets: newTickets } }
      })
      setDraggedIndex(targetIndex)
  }

  const handleDragEnd = () => {
      setDraggedIndex(null)
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
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1 block">Precio Total</label>
                        {newTicketForm.type === 'paid' ? (
                            <NumericInput 
                                value={newTicketForm.price} 
                                min={0}
                                placeholder="$ 0" 
                                onChange={(n) => setNewTicketForm({...newTicketForm, price: n})} 
                                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500" 
                            />
                        ) : (
                            <div className="w-full bg-zinc-800/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-500 italic">Gratis (Cortesía)</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1 block">Stock (Packs)</label>
                        <NumericInput value={newTicketForm.quantity} placeholder="100" onChange={(n) => setNewTicketForm({...newTicketForm, quantity: n})} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                    </div>
                </div>

                {newTicketForm.type === 'paid' && (
                    <div className="bg-black/20 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                                <Layers size={12} /> Tickets por compra
                            </label>
                            <p className="text-[9px] text-zinc-600 mt-0.5 max-w-[180px]">
                                Cantidad de QRs que se generarán al comprar 1 unidad.
                            </p>
                        </div>
                        <div className="w-20">
                            <NumericInput
                                value={newTicketForm.ticketsIncluded}
                                min={1}
                                placeholder="1"
                                onChange={(n) => setNewTicketForm({...newTicketForm, ticketsIncluded: n})}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 font-bold"
                                centerText
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
                                    <DatePicker selected={parseDate(newTicketForm.startDate)} onChange={(d) => handleNewTicketDate('start', d, 'date')} dateFormat="dd/MM/yyyy" popperPlacement="top-start" popperProps={{ strategy: 'fixed' }} customInput={<CustomInput placeholder="Seleccionar Fecha" icon={<Calendar size={14}/>} />} locale="es" />
                                    <DatePicker selected={parseTime(newTicketForm.startDate)} onChange={(d) => handleNewTicketDate('start', d, 'time')} showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Hora" dateFormat="HH:mm" timeFormat="HH:mm" popperPlacement="top-start" popperProps={{ strategy: 'fixed' }} customInput={<CustomInput placeholder="Seleccionar Hora" icon={<Clock size={14}/>} isTime />} locale="es" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><Calendar size={10}/> Fecha Fin</label>
                                    <DatePicker selected={parseDate(newTicketForm.endDate)} onChange={(d) => handleNewTicketDate('end', d, 'date')} dateFormat="dd/MM/yyyy" popperPlacement="top-start" popperProps={{ strategy: 'fixed' }} customInput={<CustomInput placeholder="Seleccionar Fecha" icon={<Calendar size={14}/>} />} locale="es" />
                                    <DatePicker selected={parseTime(newTicketForm.endDate)} onChange={(d) => handleNewTicketDate('end', d, 'time')} showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Hora" dateFormat="HH:mm" timeFormat="HH:mm" popperPlacement="top-start" popperProps={{ strategy: 'fixed' }} customInput={<CustomInput placeholder="Seleccionar Hora" icon={<Clock size={14}/>} isTime />} locale="es" />
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
        {eventData.tickets.map((t, index) => {
            const isExpanded = expandedTicketId === t.id
            // ¡ELIMINADA LA CONDICIÓN || t.price === 0!
            // Ahora la cortesía es estricta solo si fue creada como cortesía
            const isCourtesy = t.type === 'courtesy'; 
            
            const isScheduled = t.startDate ? currentTime < new Date(t.startDate) : false;
            const isExpired = t.endDate ? currentTime >= new Date(t.endDate) : false;
            const isRealSoldOut = typeof t.sold === 'number' && t.quantity > 0 && t.sold >= t.quantity;
            
            return (
                <div 
                    key={t.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`bg-zinc-900 border transition-all duration-300 rounded-xl overflow-hidden ${isExpanded ? 'border-purple-500/50' : 'border-zinc-800'} ${draggedIndex === index ? 'opacity-50' : 'opacity-100'} ${!isCourtesy && !t.isActive ? 'opacity-40 grayscale' : ''}`}
                >
                    <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => { 
                        if (expandedTicketId === t.id) {
                            setExpandedTicketId(null); 
                        } else {
                            setExpandedTicketId(t.id);
                            setShowAdvancedEdit(false); 
                        }
                    }}>
                        <div className="flex items-center gap-3">
                            <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-white transition-colors" title="Arrastrar para ordenar" onClick={(e) => e.stopPropagation()}>
                                <GripVertical size={16} />
                            </div>
                            <div className={`w-2 h-10 rounded-full ${isCourtesy ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : isRealSoldOut ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)]' : t.isGhostSoldOut ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : isExpired ? 'bg-zinc-600' : isScheduled ? 'bg-orange-500' : t.isActive ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                            <div>
                                <h3 className={`font-bold text-sm text-white flex flex-wrap items-center gap-2`}>
                                    {t.name}
                                    {isScheduled && !isCourtesy && (
                                        <span className="bg-orange-500/20 text-orange-400 text-[9px] px-1.5 py-0.5 rounded border border-orange-500/30 flex items-center gap-1">
                                            <Timer size={10} /> PROGRAMADO
                                        </span>
                                    )}
                                    {isExpired && !isCourtesy && (
                                        <span className="bg-zinc-800 text-zinc-400 text-[9px] px-1.5 py-0.5 rounded border border-zinc-700 flex items-center gap-1">
                                            <Flag size={10} /> FINALIZADO
                                        </span>
                                    )}
                                    {t.ticketsIncluded && t.ticketsIncluded > 1 && (
                                        <span className="bg-blue-500/20 text-blue-300 text-[9px] px-1.5 py-0.5 rounded border border-blue-500/30 uppercase font-black tracking-wider">
                                            Genera {t.ticketsIncluded} QRs
                                        </span>
                                    )}
                                    {isRealSoldOut && (
                                        <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded border border-red-500/30 uppercase font-black tracking-wider flex items-center gap-1">
                                            <TicketIcon size={10} /> AGOTADO
                                        </span>
                                    )}
                                    {t.isNominative && (
                                        <span className="bg-blue-500/20 text-blue-300 text-[9px] px-1.5 py-0.5 rounded border border-blue-500/30 uppercase font-black tracking-wider flex items-center gap-1">
                                            <UserCheck size={10} /> Nominativo
                                        </span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-2 text-xs mt-1">
                                    {isCourtesy ? <span className="text-pink-400 font-bold uppercase text-[10px] border border-pink-500/20 bg-pink-500/10 px-1.5 rounded flex items-center gap-1"><Gift size={10} /> Cortesía</span> : <span className="text-purple-400 font-mono font-bold">${t.price.toLocaleString()}</span>}
                                    <span className="text-zinc-600">•</span>
                                    {isRealSoldOut ? (
                                        <span className="text-red-500 font-bold uppercase text-[10px]">SOLD OUT</span>
                                    ) : t.isGhostSoldOut ? (
                                        <span className="inline-flex flex-row items-center gap-1">
                                            <Ghost size={12} className="text-red-500"/>
                                            <span className="text-red-500 text-[9px] font-black uppercase">fake</span>
                                        </span>
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
                                        <NumericInput 
                                            value={t.price} 
                                            min={0}
                                            onChange={(n) => updateTicket(t.id, { price: n })} 
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500" 
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Stock</label>
                                    <NumericInput value={t.quantity} placeholder="100" onChange={(n) => updateTicket(t.id, { quantity: n })} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                </div>
                            </div>

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
                                        <NumericInput
                                            value={t.ticketsIncluded ?? 1}
                                            min={1}
                                            placeholder="1"
                                            onChange={(n) => updateTicket(t.id, { ticketsIncluded: n })}
                                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 font-bold"
                                            centerText
                                        />
                                    </div>
                                </div>
                            )}

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
                                                    <DatePicker selected={parseDate(t.startDate)} onChange={(d) => handleUpdateDateTime(t.id, 'start', d, 'date')} dateFormat="dd/MM/yyyy" popperPlacement="top-start" popperProps={{ strategy: 'fixed' }} customInput={<CustomInput placeholder="Seleccionar Fecha" icon={<Calendar size={14}/>} />} locale="es" />
                                                    <DatePicker selected={parseTime(t.startDate)} onChange={(d) => handleUpdateDateTime(t.id, 'start', d, 'time')} showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Hora" dateFormat="HH:mm" timeFormat="HH:mm" popperPlacement="top-start" popperProps={{ strategy: 'fixed' }} customInput={<CustomInput placeholder="Seleccionar Hora" icon={<Clock size={14}/>} isTime />} locale="es" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><Calendar size={10}/> Fecha Fin</label>
                                                    <DatePicker selected={parseDate(t.endDate)} onChange={(d) => handleUpdateDateTime(t.id, 'end', d, 'date')} dateFormat="dd/MM/yyyy" popperPlacement="top-start" popperProps={{ strategy: 'fixed' }} customInput={<CustomInput placeholder="Seleccionar Fecha" icon={<Calendar size={14}/>} />} locale="es" />
                                                    <DatePicker selected={parseTime(t.endDate)} onChange={(d) => handleUpdateDateTime(t.id, 'end', d, 'time')} showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Hora" dateFormat="HH:mm" timeFormat="HH:mm" popperPlacement="top-start" popperProps={{ strategy: 'fixed' }} customInput={<CustomInput placeholder="Seleccionar Hora" icon={<Clock size={14}/>} isTime />} locale="es" />
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
      {ticketToDelete && <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full"><div className="flex flex-col items-center text-center gap-4"><div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20"><AlertTriangle className="text-red-500" size={24} /></div><div><h3 className="text-lg font-bold text-white mb-2">¿Eliminar Ticket?</h3><p className="text-sm text-zinc-400">Esta acción no se puede deshacer.</p></div><div className="flex gap-3 w-full"><button onClick={() => setTicketToDelete(null)} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold">Cancelar</button><button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold">Sí, Eliminar</button></div></div></div></div>}
    </div>
  )
}