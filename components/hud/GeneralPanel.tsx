'use client'
import { useEventStore } from '@/store/useEventStore'
import { Calendar, MapPin, Type, Clock, Tags, Navigation, Building2, Map as MapIcon, Hash, Loader2, Music } from 'lucide-react'
import { useState, forwardRef, useMemo, useEffect, useRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { es } from 'date-fns/locale/es'
import { supabase } from '@/lib/supabase'

registerLocale('es', es)

const CATEGORIES = ['Sunset', 'Rooftop', 'Afteroffice', 'Afterparty', 'Universitario', 'Nocturno']
const MUSIC_STYLES = ['Reggaetón', 'Techno', 'House', 'EDM', 'Trap']

// --- INTERFACES LOCALES PARA TIPADO SEGURO ---
interface Club {
  id: string
  name: string
}

interface CustomInputProps {
  value?: string
  onClick?: () => void
  placeholder?: string
  icon?: React.ReactNode
}

// Definimos la interfaz que ESPERAMOS del store para este componente
interface GeneralStoreState {
  eventData: {
    name?: string
    category?: string
    musicGenre?: string
    date?: string
    endDate?: string
    startTime?: string
    endTime?: string
    venue?: string
    region?: string
    commune?: string
    street?: string
    number?: string
    address?: string
    [key: string]: unknown
  }
  setEventName: (v: string) => void
  setEventVenue: (v: string) => void
  setEventDate: (v: string) => void
  setEventEndDate: (v: string) => void
  setEventTime: (start: string, end: string) => void
  setCategory: (v: string) => void
  setEventAddress: (v: string) => void
  setEventRegion?: (v: string) => void
  setEventCommune?: (v: string) => void
  setEventStreet?: (v: string) => void
  setEventNumber?: (v: string) => void
  setClubId?: (v: string) => void
  setMusicGenre?: (v: string) => void
}

// --- DATA CHILE COMPLETA ---
const CHILE_DATA = [
    {
        region: "Arica y Parinacota",
        comunas: ["Arica", "Camarones", "Putre", "General Lagos"]
    },
    {
        region: "Tarapacá",
        comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]
    },
    {
        region: "Antofagasta",
        comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"]
    },
    {
        region: "Atacama",
        comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
    },
    {
        region: "Coquimbo",
        comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]
    },
    {
        region: "Valparaíso",
        comunas: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"]
    },
    {
        region: "Metropolitana de Santiago",
        comunas: ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"]
    },
    {
        region: "Libertador General Bernardo O'Higgins",
        comunas: ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"]
    },
    {
        region: "Maule",
        comunas: ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"]
    },
    {
        region: "Ñuble",
        comunas: ["Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Quirihue", "Ránquil", "Trehuaco", "Bulnes", "Chillán Viejo", "Chillán", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Coihueco", "Ñiquén", "San Carlos", "San Fabián", "San Nicolás"]
    },
    {
        region: "Biobío",
        comunas: ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"]
    },
    {
        region: "La Araucanía",
        comunas: ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"]
    },
    {
        region: "Los Ríos",
        comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"]
    },
    {
        region: "Los Lagos",
        comunas: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"]
    },
    {
        region: "Aysén del General Carlos Ibáñez del Campo",
        comunas: ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"]
    },
    {
        region: "Magallanes y de la Antártica Chilena",
        comunas: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos (Ex Navarino)", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
    }
]



// --- NUEVO COMPONENTE CUSTOM SELECT ---
function CustomSelect({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    disabled = false,
    isLoading = false,
    icon,
    openUpwards = false,
    menuClassName = "w-full"
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    disabled?: boolean;
    isLoading?: boolean;
    icon?: React.ReactNode;
    openUpwards?: boolean;
    menuClassName?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectRef]);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative w-full" ref={selectRef}>
            <div
                onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
                className={`w-full bg-zinc-900 border ${isOpen ? 'border-purple-600 ring-2 ring-purple-600/20' : 'border-zinc-800'} rounded-xl px-4 py-3 text-sm focus:outline-none flex justify-between items-center cursor-pointer transition-all ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-zinc-700'}`}
            >
                <span className={`truncate mr-2 ${value ? 'text-white font-bold' : 'text-zinc-500 font-bold'}`}>
                    {isLoading ? placeholder : (selectedOption ? selectedOption.label : placeholder)}
                </span>
                <div className="text-zinc-500 flex items-center gap-2 shrink-0">
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        icon || <svg className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    )}
                </div>
            </div>
            {isOpen && !disabled && !isLoading && (
                <div className={`absolute z-50 ${menuClassName} ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'} bg-[#18181b] border border-[#27272a] rounded-xl shadow-[0_20px_25px_-5px_rgb(0,0,0,0.5)] max-h-60 overflow-y-auto custom-scrollbar-select py-2`}>
                    {options.length === 0 ? (
                         <div className="px-4 py-2 text-sm text-[#a1a1aa] italic">Sin opciones</div>
                    ) : (
                        options.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-1.5 text-sm truncate cursor-pointer transition-colors ${
                                    value === opt.value
                                        ? 'bg-[#9333ea] text-white font-bold'
                                        : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'
                                }`}
                            >
                                {opt.label}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default function GeneralPanel() {
  // Casting seguro para evitar errores si el store global no tiene los tipos actualizados
  const { 
    eventData, 
    setEventName, 
    setEventVenue, 
    setEventDate, 
    setEventEndDate, 
    setEventTime, 
    setCategory,
    setEventAddress, 
    setEventRegion,
    setEventCommune,
    setEventStreet,
    setEventNumber,
    setClubId,
    setMusicGenre
  } = useEventStore() as unknown as GeneralStoreState

  const [clubs, setClubs] = useState<Club[]>([])
  const [loadingClubs, setLoadingClubs] = useState(true)

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoadingClubs(true)
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name') 
          .order('name', { ascending: true })
        
        if (data) setClubs(data)
        if (error) console.error("Error cargando clubes:", error)
      } catch (e) {
        console.error("Error fetch:", e)
      } finally {
        setLoadingClubs(false)
      }
    }
    fetchClubs()
  }, [])

  // --- LÓGICA DE GÉNEROS MUSICALES ---
  const handleMusicToggle = (style: string) => {
    // Si la función no existe, salimos
    if (!setMusicGenre) return

    // Convertir string "Techno,House" a array ["Techno", "House"]
    const currentStr = eventData.musicGenre || ''
    const currentGenres = currentStr ? currentStr.split(',').map(s => s.trim()) : []
    
    let newGenres: string[]
    
    if (currentGenres.includes(style)) {
        // Si ya está, lo quitamos
        newGenres = currentGenres.filter(g => g !== style)
    } else {
        // Si no está, lo agregamos
        newGenres = [...currentGenres, style]
    }
    
    // Convertir de vuelta a string y actualizar el Store (y DB si existe ID)
    const finalString = newGenres.join(',')
    setMusicGenre(finalString)
  }

  const isMusicSelected = (style: string) => {
      const currentStr = eventData.musicGenre || ''
      // Aseguramos coincidencia exacta limpiando espacios
      return currentStr.split(',').map(s => s.trim()).includes(style)
  }

  const availableCommunes = useMemo(() => {
    if (!eventData.region) return []
    const regionData = CHILE_DATA.find(r => r.region === eventData.region)
    return regionData ? [...regionData.comunas].sort((a, b) => a.localeCompare(b, 'es')) : []
  }, [eventData.region])

  const lastComposedAddress = useRef('')

  useEffect(() => {
    const parts = [
        `${eventData.street || ''} ${eventData.number || ''}`.trim(),
        eventData.commune,
        eventData.region
    ].filter(Boolean)

    const fullAddress = parts.join(', ')
    
    // Solo llamamos setEventAddress si la dirección compuesta cambió realmente
    if (fullAddress !== lastComposedAddress.current) {
        lastComposedAddress.current = fullAddress
        setEventAddress(fullAddress)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventData.street, eventData.number, eventData.commune, eventData.region])


  const parseDate = (dateStr?: string) => {
      if (!dateStr) return null
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
  }

  const parseTime = (timeStr?: string) => {
      if (!timeStr) return null
      const [hours, minutes] = timeStr.split(':').map(Number)
      const date = new Date()
      date.setHours(hours)
      date.setMinutes(minutes)
      return date
  }

  const handleDateChange = (date: Date | null, type: 'start' | 'end') => {
      if (!date) return
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      if (type === 'start') setEventDate(dateString)
      else setEventEndDate(dateString)
  }

  const handleTimeChange = (date: Date | null, type: 'start' | 'end') => {
      if (!date) return
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const timeString = `${hours}:${minutes}`

      // Tipado seguro para valores opcionales
      if (type === 'start') setEventTime(timeString, eventData.endTime || '')
      else setEventTime(eventData.startTime || '', timeString)
  }

  // eslint-disable-next-line react/display-name
  const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(({ value, onClick, placeholder, icon }, ref) => (
    <div 
        onClick={onClick}
        ref={ref}
        className="relative w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 cursor-pointer hover:border-zinc-700 transition-colors group flex items-center justify-between gap-3"
    >
        <span className={`text-sm font-bold ${value ? 'text-white' : 'text-zinc-500'}`}>
            {value || placeholder}
        </span>
        <div className="text-white opacity-70 group-hover:opacity-100 transition-opacity">
            {icon}
        </div>
    </div>
  ))

  return (
    <div className="space-y-6 animate-in slide-in-from-left duration-300">
      
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Información Básica</h2>
        <p className="text-zinc-500 text-xs">Define la identidad y coordenadas de tu evento.</p>
      </div>

      <div className="space-y-5">
        
        <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                <Type size={14} /> Nombre del Evento
            </label>
            <input 
                type="text" 
                value={eventData.name || ''} 
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ej: Salvaje It's Miller Time"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all text-white font-bold placeholder:text-zinc-600"
            />
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                <Tags size={14} /> Categoría Principal
            </label>
            <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all uppercase ${
                            eventData.category === cat 
                            ? 'bg-purple-600 border-purple-400 text-white' 
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* SECCIÓN DE GÉNERO MUSICAL CORREGIDA */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                <Music size={14} /> Estilos Musicales (Selección Múltiple)
            </label>
            <div className="flex flex-wrap gap-2">
                {MUSIC_STYLES.map(style => {
                    const isSelected = isMusicSelected(style)
                    return (
                        <button
                            key={style}
                            type="button"
                            onClick={() => handleMusicToggle(style)}
                            className={`py-2 px-3 text-[10px] font-bold rounded-lg border transition-all uppercase ${
                                isSelected
                                ? 'bg-purple-600 border-purple-400 text-white' 
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                        >
                            {style}
                        </button>
                    )
                })}
            </div>
            {/* Texto de debug invisible para asegurar reactividad */}
            <p className="hidden">{eventData.musicGenre}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                    <Calendar size={14} className="text-white"/> Fecha Inicio
                </label>
                <DatePicker
                    selected={parseDate(eventData.date)}
                    onChange={(date: Date | null) => handleDateChange(date, 'start')}
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    placeholderText="Seleccionar"
                    wrapperClassName="w-full"
                    popperProps={{ strategy: 'fixed' }}
                    customInput={<CustomInput placeholder="Seleccionar" icon={<Calendar size={16}/>} />}
                />
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                    <Clock size={14} className="text-white"/> Hora Inicio
                </label>
                <DatePicker
                    selected={parseTime(eventData.startTime)}
                    onChange={(date: Date | null) => handleTimeChange(date, 'start')}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Hora"
                    dateFormat="HH:mm"
                    locale="es"
                    placeholderText="Seleccionar"
                    wrapperClassName="w-full"
                    popperProps={{ strategy: 'fixed' }}
                    customInput={<CustomInput placeholder="Seleccionar" icon={<Clock size={16}/>} />}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                    <Calendar size={14} className="text-white"/> Fecha Fin
                </label>
                <DatePicker
                    selected={parseDate(eventData.endDate)}
                    onChange={(date: Date | null) => handleDateChange(date, 'end')}
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    minDate={parseDate(eventData.date) || new Date()}
                    placeholderText="Seleccionar"
                    wrapperClassName="w-full"
                    popperProps={{ strategy: 'fixed' }}
                    customInput={<CustomInput placeholder="Seleccionar" icon={<Calendar size={16}/>} />}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                    <Clock size={14} className="text-white"/> Hora Fin
                </label>
                <DatePicker
                    selected={parseTime(eventData.endTime)}
                    onChange={(date: Date | null) => handleTimeChange(date, 'end')}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Hora"
                    dateFormat="HH:mm"
                    locale="es"
                    placeholderText="Seleccionar"
                    wrapperClassName="w-full"
                    popperProps={{ strategy: 'fixed' }}
                    customInput={<CustomInput placeholder="Seleccionar" icon={<Clock size={16}/>} />}
                />
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                <Building2 size={14} /> Lugar / Club
            </label>
            <CustomSelect 
                value={eventData.venue || ''}
                onChange={(val) => {
                    setEventVenue(val);
                    const selected = clubs.find(c => c.name === val);
                    if (selected && setClubId) setClubId(selected.id);
                }}
                options={clubs.map(c => ({ value: c.name, label: c.name }))}
                placeholder="Seleccionar Club de la lista"
                disabled={loadingClubs}
                isLoading={loadingClubs}
                icon={<Building2 size={16} />}
            />
        </div>

        <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
                <MapPin size={16} className="text-purple-500" />
                <h3 className="text-sm font-bold text-white uppercase">Dirección Exacta</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <MapIcon size={10} /> Región
                    </label>
                    <CustomSelect 
                        value={eventData.region || ''}
                        onChange={(val) => {
                            if (setEventRegion) {
                                setEventRegion(val);
                                if (setEventCommune) setEventCommune('');
                            }
                        }}
                        options={CHILE_DATA.map(item => ({ value: item.region, label: item.region }))}
                        placeholder="Seleccionar Región"
                        openUpwards={true}
                        menuClassName="w-[calc(200%+0.75rem)]"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <MapPin size={10} /> Comuna
                    </label>
                    <CustomSelect 
                        value={eventData.commune || ''}
                        onChange={(val) => {
                            if (setEventCommune) setEventCommune(val);
                        }}
                        options={availableCommunes.map(c => ({ value: c, label: c }))}
                        placeholder="Seleccionar Comuna"
                        disabled={!eventData.region}
                        openUpwards={true}
                        menuClassName="w-[calc(200%+0.75rem)] right-0"
                    />
                </div>
            </div>

            <div className="grid grid-cols-[70%_30%] gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <Navigation size={10} /> Calle / Avenida
                    </label>
                    <input 
                        type="text" 
                        value={eventData.street || ''} 
                        onChange={(e) => setEventStreet && setEventStreet(e.target.value)}
                        placeholder="Ej: Avenida Apoquindo"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-white font-bold placeholder:text-zinc-600"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <Hash size={10} /> Número
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={eventData.number || ''}
                        onChange={(e) => setEventNumber && setEventNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="4990"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-white font-bold placeholder:text-zinc-600 text-center"
                    />
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}