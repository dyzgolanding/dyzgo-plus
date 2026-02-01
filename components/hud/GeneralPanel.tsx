'use client'
import { useEventStore } from '@/store/useEventStore'
import { Calendar, MapPin, Type, Clock, Tags, Navigation, Building2, Map as MapIcon, Hash, Loader2, Music } from 'lucide-react'
import { useState, forwardRef, useMemo, useEffect } from 'react'
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

const datePickerStyles = `
  .react-datepicker-wrapper { width: 100%; }
  .react-datepicker-popper { z-index: 9999 !important; }
  .react-datepicker {
    font-family: inherit; background-color: #18181b; border: 1px solid #27272a; color: white; border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }
  .react-datepicker__header { background-color: #18181b; border-bottom: 1px solid #27272a; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; }
  .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker__day-name { color: white !important; font-weight: 700; }
  .react-datepicker__day { color: #a1a1aa; }
  .react-datepicker__day:hover { background-color: #27272a; color: white; border-radius: 0.375rem; }
  .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background-color: #9333ea !important; color: white !important; font-weight: bold; }
  .react-datepicker__time-container { border-left: 1px solid #27272a; width: 100px !important; }
  .react-datepicker__time-container .react-datepicker__time { background-color: #18181b; border-radius: 0.75rem; }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item { color: #a1a1aa; height: auto; padding: 8px; }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover { background-color: #27272a; color: white; }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected { background-color: #9333ea !important; color: white !important; }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list::-webkit-scrollbar { display: none; }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list { -ms-overflow-style: none; scrollbar-width: none; }
`

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

  const handleClubSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEventVenue(e.target.value)
    // Opcional: si tienes el ID, búscalo y setéalo también
    const selected = clubs.find(c => c.name === e.target.value)
    if (selected && setClubId) setClubId(selected.id) 
  }

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
    return regionData ? regionData.comunas : []
  }, [eventData.region])

  useEffect(() => {
    const parts = [
        `${eventData.street || ''} ${eventData.number || ''}`.trim(),
        eventData.commune,
        eventData.region
    ].filter(Boolean)

    const fullAddress = parts.join(', ')
    
    if (fullAddress !== eventData.address) {
        setEventAddress(fullAddress)
    }
  }, [eventData.street, eventData.number, eventData.commune, eventData.region, setEventAddress, eventData.address])


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
      <style>{datePickerStyles}</style>
      
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
                    onChange={(date) => handleDateChange(date, 'start')}
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    placeholderText="Seleccionar" 
                    wrapperClassName="w-full"
                    customInput={<CustomInput placeholder="Seleccionar" icon={<Calendar size={16}/>} />}
                />
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                    <Clock size={14} className="text-white"/> Hora Inicio
                </label>
                <DatePicker 
                    selected={parseTime(eventData.startTime)}
                    onChange={(date) => handleTimeChange(date, 'start')}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Hora"
                    dateFormat="HH:mm"
                    locale="es"
                    placeholderText="Seleccionar" 
                    wrapperClassName="w-full"
                    customInput={<CustomInput placeholder="Seleccionar" icon={<Clock size={16}/>} />}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                    <Calendar size={14} className="text-white"/> Fecha Fin
                </label>
                <DatePicker 
                    selected={parseDate(eventData.endDate)}
                    onChange={(date) => handleDateChange(date, 'end')}
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    minDate={parseDate(eventData.date) || new Date()}
                    placeholderText="Seleccionar" 
                    wrapperClassName="w-full"
                    customInput={<CustomInput placeholder="Seleccionar" icon={<Calendar size={16}/>} />}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                    <Clock size={14} className="text-white"/> Hora Fin
                </label>
                <DatePicker 
                    selected={parseTime(eventData.endTime)}
                    onChange={(date) => handleTimeChange(date, 'end')}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Hora"
                    dateFormat="HH:mm"
                    locale="es"
                    placeholderText="Seleccionar" 
                    wrapperClassName="w-full"
                    customInput={<CustomInput placeholder="Seleccionar" icon={<Clock size={16}/>} />}
                />
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
                <Building2 size={14} /> Lugar / Club
            </label>
            <div className="relative">
                <select
                    value={eventData.venue || ''} 
                    onChange={handleClubSelect}
                    disabled={loadingClubs}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-white font-bold appearance-none cursor-pointer disabled:opacity-50"
                >
                    <option value="" disabled>
                        {loadingClubs ? 'Cargando clubes...' : 'Seleccionar Club de la lista'}
                    </option>
                    {clubs.map((club) => (
                        <option key={club.id} value={club.name}>
                            {club.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    {loadingClubs ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                </div>
            </div>
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
                    <select
                        value={eventData.region || ''}
                        onChange={(e) => {
                            if (setEventRegion) {
                                setEventRegion(e.target.value)
                                if (setEventCommune) setEventCommune('') 
                            }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-white font-medium appearance-none cursor-pointer"
                    >
                        <option value="" disabled>Seleccionar Región</option>
                        {CHILE_DATA.map((item) => (
                            <option key={item.region} value={item.region}>{item.region}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <MapPin size={10} /> Comuna
                    </label>
                    <select
                        value={eventData.commune || ''}
                        onChange={(e) => setEventCommune && setEventCommune(e.target.value)}
                        disabled={!eventData.region}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-white font-medium appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="" disabled>Seleccionar Comuna</option>
                        {availableCommunes.map((comuna) => (
                            <option key={comuna} value={comuna}>{comuna}</option>
                        ))}
                    </select>
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
                        value={eventData.number || ''} 
                        onChange={(e) => setEventNumber && setEventNumber(e.target.value)}
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