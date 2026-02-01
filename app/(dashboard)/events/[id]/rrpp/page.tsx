'use client'

import { useEffect, useState, use, forwardRef, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    Loader2, Plus, Ticket, Gift, Search,
    Layers, PlusCircle, FileSpreadsheet, Download, Upload, CheckCircle2, Trash2,
    X, Calendar, Clock, User, ChevronDown, Send
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useEventStore } from '@/store/useEventStore'

// --- IMPORTS PARA EL DATEPICKER ---
import DatePicker, { registerLocale } from 'react-datepicker' 
import "react-datepicker/dist/react-datepicker.css"
import { es } from 'date-fns/locale/es'

registerLocale('es', es)

// --- ESTILOS CSS PERSONALIZADOS PARA EL DATEPICKER (DARK THEME) ---
const datePickerStyles = `
  .react-datepicker-wrapper { width: 100%; }
  .react-datepicker-popper { z-index: 9999 !important; }
  .react-datepicker {
    font-family: inherit;
    background-color: #09090b; 
    border: 1px solid rgba(255,255,255,0.1); 
    color: white;
    border-radius: 1.5rem;
    padding: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
  }
  .react-datepicker__header {
    background-color: transparent;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-top: 0.5rem;
  }
  .react-datepicker__current-month {
    color: white !important;
    font-weight: 800;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
  }
  .react-datepicker__day-name {
    color: rgba(255,255,255,0.3) !important;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.7rem;
    margin: 0.3rem;
  }
  .react-datepicker__day { 
    color: rgba(255,255,255,0.8); 
    font-weight: 500;
    margin: 0.3rem;
    width: 2rem;
    height: 2rem;
    line-height: 2rem;
    border-radius: 0.75rem;
    transition: all 0.2s;
  }
  .react-datepicker__day:hover {
    background-color: rgba(255,255,255,0.1) !important;
    color: white !important;
  }
  /* Día seleccionado */
  .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
    background-color: #00D15B !important;
    color: black !important;
    font-weight: 900;
    box-shadow: 0 0 20px rgba(0, 209, 91, 0.3);
  }
  .react-datepicker__day--today {
    border: 1px solid #00D15B;
    font-weight: bold;
    color: #00D15B;
    background-color: transparent;
  }
  .react-datepicker__day--outside-month { color: rgba(255,255,255,0.1) !important; }
  .react-datepicker__navigation-icon::before {
    border-color: rgba(255,255,255,0.5); border-width: 2px 2px 0 0; height: 6px; width: 6px;
  }
`

// --- INPUT PERSONALIZADO DATEPICKER ---
interface CustomDateInputProps {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
}

// eslint-disable-next-line react/display-name
const CustomDateInput = forwardRef<HTMLDivElement, CustomDateInputProps>(({ value, onClick, placeholder }, ref) => (
  <div onClick={onClick} ref={ref} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none hover:border-[#00D15B]/50 focus:border-[#00D15B] cursor-pointer transition-all font-medium flex justify-between items-center group shadow-sm text-white">
      <span className={value ? 'text-white' : 'text-white/30'}>{value || placeholder}</span>
      <Calendar className="text-white/30 group-hover:text-[#00D15B] transition-colors" size={18}/>
  </div>
))

// --- COMPONENTE SELECT PERSONALIZADO ---
const CustomSelect = ({ options, value, onChange, placeholder, variant = 'green' }: { options: { label: string, value: string }[], value: string, onChange: (val: string) => void, placeholder: string, variant?: 'green' | 'purple' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeColor = variant === 'purple' ? 'border-[#8A2BE2]' : 'border-[#00D15B]';
    const hoverColor = variant === 'purple' ? 'hover:border-[#8A2BE2]/50' : 'hover:border-[#00D15B]/50';
    const textHover = variant === 'purple' ? 'group-hover:text-[#8A2BE2]' : 'group-hover:text-[#00D15B]';
    const optionSelected = variant === 'purple' ? 'bg-[#8A2BE2]/10 text-[#8A2BE2]' : 'bg-[#00D15B]/10 text-[#00D15B]';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label;

    return (
        <div className="relative w-full" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className={`w-full bg-black/40 border ${isOpen ? activeColor : 'border-white/10'} rounded-2xl px-5 py-4 text-sm outline-none ${hoverColor} cursor-pointer transition-all font-medium flex justify-between items-center group shadow-sm`}>
                <span className={selectedLabel ? 'text-white' : 'text-white/30'}>{selectedLabel || placeholder}</span>
                <ChevronDown className={`text-white/30 ${textHover} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={18}/>
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-[#050505]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <div key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`px-5 py-3 text-xs cursor-pointer transition-colors border-b border-white/5 last:border-0 font-medium tracking-wide ${value === option.value ? optionSelected : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-5 py-4 text-xs text-white/30 italic text-center">No hay opciones disponibles</div>
                    )}
                </div>
            )}
        </div>
    );
};

interface CourtesyTicket {
  id: string; guest_name: string; guest_email: string; ticket_name: string; created_at: string; status: string
}

// Interface auxiliar para evitar errores de tipo en uploadedGroups
interface UploadedGroup {
    name: string;
    data: unknown[];
    date: string;
}

export default function RRPPPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id
  const { eventData, loadEvent } = useEventStore()

  const [loading, setLoading] = useState(true)
  const [courtesyList, setCourtesyList] = useState<CourtesyTicket[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // --- ESTADOS DE SETTINGS ---
  const [uploadedGroups, setUploadedGroups] = useState<UploadedGroup[]>([])
  const [dbName, setDbName] = useState('')
  const [previewData, setPreviewData] = useState<unknown[] | null>(null)
  const [isIndividualCourtesyOpen, setIsIndividualCourtesyOpen] = useState(false)
  const [isGroupCourtesyOpen, setIsGroupCourtesyOpen] = useState(false)
  const [recipients, setRecipients] = useState([{ email: '', nombre: '', apellido: '', rut: '', cantidad: 1 }])
  
  // ESTADOS MODALES
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDb, setSelectedDb] = useState('')
  const [selectedTicket, setSelectedTicket] = useState('')
  const [selectedIndividualTicket, setSelectedIndividualTicket] = useState('') 

  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true)
        await loadEvent(eventId)
        const { data: eventDataDB, error: eventError } = await supabase.from('events').select('uploaded_dbs').eq('id', eventId).single()
        
        if (!eventError && eventDataDB?.uploaded_dbs) {
            setUploadedGroups(eventDataDB.uploaded_dbs as UploadedGroup[])
        }
        
        const { data: ticketsData, error: ticketsError } = await supabase.from('tickets').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
        if (ticketsError) throw ticketsError
        if (ticketsData) setCourtesyList(ticketsData as unknown as CourtesyTicket[])
      } catch (error) { console.error('Error fetching data:', error) } finally { setLoading(false) }
    }
    fetchAllData()
  }, [eventId, loadEvent])

  // --- LOGICA ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result; const wb = XLSX.read(bstr, { type: 'binary' }); const wsname = wb.SheetNames[0]; const ws = wb.Sheets[wsname]; const data = XLSX.utils.sheet_to_json(ws); setPreviewData(data);
    }
    reader.readAsBinaryString(file)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveDatabase = async () => {
    if (!dbName || !previewData) return; const newGroup = { name: dbName, data: previewData, date: new Date().toLocaleDateString('es-CL') }; const updatedGroups = [...uploadedGroups, newGroup];
    const { error } = await supabase.from('events').update({ uploaded_dbs: updatedGroups }).eq('id', eventId); if (error) alert("Error"); else { setUploadedGroups(updatedGroups); setPreviewData(null); setDbName('') }
  }

  const removeGroup = async (idx: number) => {
    if(!confirm("¿Eliminar?")) return; const updatedGroups = uploadedGroups.filter((_, i) => i !== idx);
    const { error } = await supabase.from('events').update({ uploaded_dbs: updatedGroups }).eq('id', eventId); if(error) alert("Error"); else setUploadedGroups(updatedGroups)
  }

  const addRecipient = () => setRecipients([...recipients, { email: '', nombre: '', apellido: '', rut: '', cantidad: 1 }])

  const filteredList = courtesyList.filter(ticket => ticket.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.ticket_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  // Tipado seguro para evitar error "Property 'tickets' does not exist on type 'unknown'"
  const courtesyTicketsOnly = (eventData as any)?.tickets?.filter((t: any) => t.type === 'courtesy') || []

  if (loading) return (
    <div className="flex items-center justify-center h-full pt-40">
        <Loader2 className="animate-spin text-[#8A2BE2]" size={40} />
    </div>
  )

  return (
    // CONTENEDOR LIMPIO (Sin fondo, ya está en el Layout)
    <div className="relative z-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in pt-4">
        <style>{datePickerStyles}</style>
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">
                    RRPP & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]">Cortesías</span>
                </h1>
                <p className="text-white/40 text-sm font-medium">Gestiona el envío de entradas de cortesía y bases de datos.</p>
            </div>
        </div>

        {/* TERMINAL DE CORTESÍAS */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl group transition-all">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#3b82f6]/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center gap-5 border-b border-white/5 pb-8 mb-8 relative z-10">
                <div className="p-3.5 bg-[#3b82f6]/10 rounded-2xl text-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.2)] border border-[#3b82f6]/20">
                    <Ticket size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Terminal de Cortesías</h3>
                    <p className="text-white/40 text-xs font-medium tracking-wide mt-1">Gestión de invitaciones y accesos directos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <button onClick={() => setIsIndividualCourtesyOpen(true)} className="flex flex-col items-start gap-5 p-8 bg-black/40 border border-white/5 rounded-[2rem] hover:border-[#8A2BE2]/50 hover:bg-[#8A2BE2]/5 transition-all group/card shadow-lg hover:shadow-[#8A2BE2]/20">
                    <div className="p-3 bg-white/5 rounded-2xl text-[#8A2BE2] group-hover/card:scale-110 transition-transform border border-white/5">
                        <PlusCircle size={32}/>
                    </div>
                    <div className="text-left space-y-1">
                        <span className="text-sm font-black text-white block uppercase tracking-wider">Invitación Directa</span>
                        <span className="text-[10px] text-white/40 font-medium block">Envía tickets personalizados a clientes VIP.</span>
                    </div>
                </button>
                
                <button onClick={() => setIsGroupCourtesyOpen(true)} className="flex flex-col items-start gap-5 p-8 bg-black/40 border border-white/5 rounded-[2rem] hover:border-[#00D15B]/50 hover:bg-[#00D15B]/5 transition-all group/card shadow-lg hover:shadow-[#00D15B]/20">
                    <div className="p-3 bg-white/5 rounded-2xl text-[#00D15B] group-hover/card:scale-110 transition-transform border border-white/5">
                        <Layers size={32}/>
                    </div>
                    <div className="text-left space-y-1">
                        <span className="text-sm font-black text-white block uppercase tracking-wider">Despacho Masivo</span>
                        <span className="text-[10px] text-white/40 font-medium block">Usa tus grupos de base de datos importados.</span>
                    </div>
                </button>
            </div>
        </section>

        {/* DATA IMPORTADA */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8 mb-8">
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-[#00D15B]/10 rounded-2xl text-[#00D15B] shadow-[0_0_20px_rgba(34,197,94,0.2)] border border-[#00D15B]/20">
                        <FileSpreadsheet size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Data Importada</h3>
                        <p className="text-white/40 text-xs font-medium tracking-wide mt-1">Sincronización con Supabase.</p>
                    </div>
                </div>
                <a href="/plantilla-clientes.xlsx" download className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black rounded-xl transition-all border border-white/5 hover:border-white/20 uppercase tracking-widest shadow-lg">
                    <Download size={14} /> Plantilla
                </a>
            </div>

            <label className="border-2 border-dashed border-white/10 hover:border-[#8A2BE2]/40 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all bg-black/20 hover:bg-black/40 group">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                <div className="p-5 bg-white/5 rounded-2xl text-white/30 group-hover:text-[#8A2BE2] group-hover:scale-110 transition-all shadow-lg border border-white/5">
                    <Upload size={32} />
                </div>
                <p className="text-xs font-bold text-white/40 group-hover:text-white uppercase tracking-widest transition-colors">Subir archivo Excel</p>
            </label>

            {uploadedGroups.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
                    {uploadedGroups.map((group, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-3xl group hover:border-[#00D15B]/30 transition-all shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-[#00D15B]/10 rounded-xl text-[#00D15B] border border-[#00D15B]/20">
                                    <CheckCircle2 size={20}/>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase mb-1 leading-none tracking-wide">{group.name}</p>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{group.data.length} Clientes • {group.date}</p>
                                </div>
                            </div>
                            <button onClick={() => removeGroup(idx)} className="p-3 text-white/20 hover:text-[#FF007F] opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 hover:bg-white/5 rounded-xl">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* REGISTRO DE CORTESÍAS */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#FF007F]/10 rounded-xl text-[#FF007F] border border-[#FF007F]/20">
                        <Gift size={20}/>
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wide">Registro de Cortesías</h3>
                </div>
                
                <div className="bg-black/40 border border-white/10 rounded-xl p-1 flex items-center gap-2 w-full max-w-sm backdrop-blur-md focus-within:border-[#FF007F]/50 transition-colors">
                    <Search size={16} className="text-white/30 ml-3" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, email o ticket..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="bg-transparent border-none outline-none text-xs text-white flex-1 p-2 placeholder:text-white/20 font-medium" 
                    />
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 bg-black/40 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <div className="col-span-4">Invitado</div>
                    <div className="col-span-3">Ticket Enviado</div>
                    <div className="col-span-3">Fecha de Envío</div>
                    <div className="col-span-2 text-right">Estado</div>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {filteredList.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="p-5 bg-white/5 rounded-full mb-4 border border-white/5">
                                <Gift size={32} className="text-white/20"/>
                            </div>
                            <p className="text-white/30 text-xs font-bold uppercase tracking-wide">No se encontraron cortesías enviadas.</p>
                        </div>
                    ) : (
                        filteredList.map((ticket) => (
                            <div key={ticket.id} className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 items-center hover:bg-white/5 transition-colors text-xs group">
                                <div className="col-span-4">
                                    <p className="font-bold text-white flex items-center gap-2 mb-1">
                                        <User size={12} className="text-[#8A2BE2]"/> {ticket.guest_name || 'Sin Nombre'}
                                    </p>
                                    <p className="text-white/40 flex items-center gap-2 ml-5 truncate text-[10px] font-medium">{ticket.guest_email}</p>
                                </div>
                                <div className="col-span-3">
                                    <span className="bg-[#8A2BE2]/10 text-[#8A2BE2] border border-[#8A2BE2]/20 px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide shadow-sm">
                                        {ticket.ticket_name}
                                    </span>
                                </div>
                                <div className="col-span-3 text-white/50 font-medium flex items-center gap-2">
                                    <Clock size={12} className="text-white/30"/>
                                    {new Date(ticket.created_at).toLocaleDateString()} <span className="text-white/20">•</span> {new Date(ticket.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-[#00D15B] font-bold flex items-center justify-end gap-1.5 uppercase text-[10px] tracking-wide bg-[#00D15B]/5 px-2 py-1 rounded-lg w-fit ml-auto border border-[#00D15B]/10">
                                        <CheckCircle2 size={12}/> Enviado
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* --- MODAL INVITACIÓN INDIVIDUAL REDISEÑADO --- */}
        {isIndividualCourtesyOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-3xl" onClick={() => setIsIndividualCourtesyOpen(false)} />
                <div className="relative w-full max-w-6xl bg-[#09090b] border border-white/10 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 overflow-hidden">
                    
                    {/* Glow Ambiental Morado */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8A2BE2] to-[#FF007F] opacity-80" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8A2BE2]/10 rounded-full blur-[120px] pointer-events-none" />

                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-[#8A2BE2]/10 rounded-2xl text-[#8A2BE2] shadow-[0_0_20px_rgba(138,43,226,0.3)] border border-[#8A2BE2]/30">
                                <PlusCircle size={32}/>
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tighter leading-none uppercase">Invitación Directa</h3>
                        </div>
                        <button onClick={() => setIsIndividualCourtesyOpen(false)} className="p-3 bg-white/5 rounded-full text-white/40 hover:text-white transition-all hover:bg-white/10 hover:scale-110 border border-white/5"><X size={24}/></button>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="mb-8 w-full max-w-md">
                            <label className="text-[10px] font-black text-[#8A2BE2] uppercase tracking-[0.2em] ml-2 mb-3 block">Seleccionar Ticket</label>
                            <CustomSelect 
                                value={selectedIndividualTicket}
                                onChange={setSelectedIndividualTicket}
                                placeholder="Seleccionar Ticket..."
                                variant="purple"
                                options={courtesyTicketsOnly.map((t: any) => ({ label: t.name, value: t.name }))}
                            />
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {recipients.map((r, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-5 items-end bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-[#8A2BE2]/40 transition-all shadow-lg hover:shadow-[#8A2BE2]/10 group">
                                    <div className="space-y-2 col-span-1.5"><label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1 group-hover:text-[#8A2BE2] transition-colors">Email</label><input placeholder="ej@mail.com" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-xs text-white focus:border-[#8A2BE2] focus:bg-black/60 outline-none font-medium placeholder:text-white/20 transition-all shadow-inner" /></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Nombre</label><input placeholder="Nombre" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-xs text-white focus:border-[#8A2BE2] focus:bg-black/60 outline-none font-medium placeholder:text-white/20 transition-all shadow-inner" /></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Apellido</label><input placeholder="Apellido" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-xs text-white focus:border-[#8A2BE2] focus:bg-black/60 outline-none font-medium placeholder:text-white/20 transition-all shadow-inner" /></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">RUT</label><input placeholder="Opcional" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-xs text-white focus:border-[#8A2BE2] focus:bg-black/60 outline-none font-medium placeholder:text-white/20 transition-all shadow-inner" /></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Cant.</label><input type="number" defaultValue={1} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-xs text-white focus:border-[#8A2BE2] focus:bg-black/60 outline-none font-medium placeholder:text-white/20 transition-all shadow-inner text-center" /></div>
                                    <button onClick={() => setRecipients(recipients.filter((_, idx) => idx !== i))} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all mb-0.5 border border-red-500/20 hover:border-transparent hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]"><X size={18} /></button>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex gap-4 pt-10">
                            <button onClick={addRecipient} className="flex-1 py-5 bg-white/5 border border-white/10 text-white/50 font-bold rounded-[1.5rem] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                <Plus size={16}/> Añadir Persona
                            </button>
                            <button className="flex-[2.5] py-5 bg-gradient-to-r from-[#8A2BE2] to-[#7c3aed] text-white font-black rounded-[1.5rem] shadow-[0_0_40px_rgba(138,43,226,0.3)] uppercase tracking-[0.25em] transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                                <Send size={16} /> Despachar Cortesías
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL DESPACHO MASIVO REDISEÑADO --- */}
        {isGroupCourtesyOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-3xl" onClick={() => setIsGroupCourtesyOpen(false)} />
                <div className="relative w-full max-w-4xl bg-[#09090b] border border-white/10 rounded-[3.5rem] p-16 shadow-2xl animate-in zoom-in-95 overflow-hidden">
                    
                    {/* Glow Ambiental Verde */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00D15B] to-[#10b981] opacity-80" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#00D15B]/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="flex justify-between items-center mb-14 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-[#00D15B]/10 rounded-3xl text-[#00D15B] shadow-[0_0_25px_rgba(34,197,94,0.25)] border border-[#00D15B]/30"><Layers size={36}/></div>
                            <div>
                                <h3 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">Envío Masivo</h3>
                                <p className="text-white/40 text-xs font-medium tracking-wide mt-1">Despacho automatizado a bases de datos.</p>
                            </div>
                        </div>
                        <button onClick={() => setIsGroupCourtesyOpen(false)} className="p-4 bg-white/5 rounded-full text-white/40 hover:text-white transition-all hover:bg-white/10 hover:scale-110 border border-white/5"><X size={24}/></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14 relative z-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-[#00D15B] uppercase tracking-[0.2em] ml-2">Base de Datos</label>
                            <CustomSelect value={selectedDb} onChange={setSelectedDb} placeholder="Seleccionar..." variant="green" options={uploadedGroups.map(g => ({ label: `${g.name} (${g.data.length})`, value: g.name }))} />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-[#00D15B] uppercase tracking-[0.2em] ml-2">Ticket (Cortesía)</label>
                            <CustomSelect value={selectedTicket} onChange={setSelectedTicket} placeholder="Seleccionar..." variant="green" options={courtesyTicketsOnly.map((t: any) => ({ label: t.name, value: t.name }))} />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-[#00D15B] uppercase tracking-[0.2em] ml-2">Vencimiento</label>
                            <div className="relative z-50"><DatePicker selected={selectedDate} onChange={(date) => setSelectedDate(date)} locale="es" dateFormat="dd/MM/yyyy" placeholderText="dd-mm-aaaa" customInput={<CustomDateInput placeholder="dd-mm-aaaa" />} wrapperClassName="w-full" /></div>
                        </div>
                    </div>

                    <button className="w-full py-6 bg-gradient-to-r from-[#00D15B] to-[#10b981] text-black font-black rounded-[2rem] shadow-[0_0_50px_rgba(34,197,94,0.3)] uppercase tracking-[0.3em] transition-all hover:scale-[1.01] active:scale-95 text-xs flex items-center justify-center gap-3 relative z-10 group">
                        <Send size={18} className="group-hover:translate-x-1 transition-transform"/> Iniciar Despacho
                    </button>
                </div>
            </div>
        )}
    </div>
  )
}