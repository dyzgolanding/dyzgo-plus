'use client'
import { useState, useEffect, useRef } from 'react'
import { 
  Camera, Building2, Globe, Instagram, CreditCard, Save, History, 
  CheckCircle2, Clock, FileText, Loader2, AlertCircle, ChevronDown, Trash2, AlertTriangle, Image as ImageIcon,
  Facebook, Palette, LayoutTemplate, Check, Sparkles, Settings
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrg } from '@/components/providers/org-provider'

const BANKS_CHILE = ["Banco de Chile", "Banco Santander", "Banco Estado", "Scotiabank", "Bci", "Itaú", "Banco Bice", "Banco Security", "Banco Consorcio", "Banco Falabella", "Banco Ripley", "Tenpo", "Mach", "Coopeuch", "Mercado Pago"]
const ACCOUNT_TYPES = ["Cuenta Corriente", "Cuenta Vista / RUT", "Cuenta de Ahorro", "Chequera Electrónica"]
const REGIONES_CHILE: Record<string, string[]> = {
  "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
  "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
  "Antofagasta": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"],
  "Atacama": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"],
  "Coquimbo": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"],
  "Valparaíso": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"],
  "Metropolitana de Santiago": ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Til Til", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"],
  "Libertador Gral. Bernardo O'Higgins": ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"],
  "Maule": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"],
  "Ñuble": ["Chillán", "Bulnes", "Cobquecura", "Coelemu", "Coihueco", "Chillán Viejo", "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián", "San Ignacio", "San Nicolás", "Treguaco", "Yungay"],
  "Biobío": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"],
  "La Araucanía": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"],
  "Los Ríos": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
  "Los Lagos": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"],
  "Aysén": ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"],
  "Magallanes y Antártica Chilena": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
}

const formatRut = (rut: string) => {
  if (!rut) return ''
  let cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (cleanRut.length <= 1) return cleanRut
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedBody}-${dv}`
}

export default function SettingsPage() {
  const { currentOrgId, currentRole, refreshOrgs, deleteOrg } = useOrg()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'data' | 'payments'>('profile')
  const [billingRegionFilter, setBillingRegionFilter] = useState<string>("")

  const isCreating = !currentOrgId
  const isEditable = isCreating || currentRole === 'owner' || currentRole === 'admin'
  const isOwner = currentRole === 'owner'

  const [profile, setProfile] = useState({
    name: '', website_url: '', instagram_handle: '', description: '', primary_color: '#8B5CF6', 
    logo_url: '', banner_url: '' 
  })

  const [financialData, setFinancialData] = useState({
    bank_name: '', account_type: '', account_number: '', bank_rut: '', bank_holder_name: '', bank_email: '',
    billing_name: '', billing_rut: '', billing_address: '', billing_city: '', billing_email: ''
  })

  const [payouts, setPayouts] = useState<any[]>([])

  useEffect(() => {
      if (isCreating) {
          setProfile({ name: '', website_url: '', instagram_handle: '', description: '', primary_color: '#8B5CF6', logo_url: '', banner_url: '' })
          setFinancialData({ bank_name: '', account_type: '', account_number: '', bank_rut: '', bank_holder_name: '', bank_email: '', billing_name: '', billing_rut: '', billing_address: '', billing_city: '', billing_email: '' })
          setPayouts([])
          setLoading(false)
      }
  }, [isCreating])

  useEffect(() => {
    async function fetchData() {
      if (!currentOrgId) return

      try {
        setLoading(true)
        const { data: expData, error } = await supabase
          .from('experiences')
          .select('*')
          .eq('id', currentOrgId)
          .single()

        if (error) throw error

        if (expData) {
          setProfile({
            name: expData.name || '',
            website_url: expData.website_url || '',
            instagram_handle: expData.instagram_handle || '',
            description: expData.description || '',
            primary_color: expData.primary_color || '#8B5CF6',
            logo_url: expData.logo_url || '',
            banner_url: expData.banner_url || ''
          })

          let detectedRegion = ""
          if (expData.billing_city) {
             for (const [region, communes] of Object.entries(REGIONES_CHILE)) {
                if (communes.includes(expData.billing_city)) {
                    detectedRegion = region
                    break
                }
             }
          }
          setBillingRegionFilter(detectedRegion)

          setFinancialData({
            bank_name: expData.bank_name || '',
            account_type: expData.account_type || '',
            account_number: expData.account_number || '',
            bank_rut: formatRut(expData.bank_rut || ''),
            bank_holder_name: expData.bank_holder_name || '',
            bank_email: expData.bank_email || '',
            billing_name: expData.billing_name || '',
            billing_rut: formatRut(expData.billing_rut || ''),
            billing_address: expData.billing_address || '',
            billing_city: expData.billing_city || '',
            billing_email: expData.billing_email || ''
          })

          const { data: paymentsData } = await supabase
            .from('payouts')
            .select('*')
            .eq('experience_id', currentOrgId)
            .order('created_at', { ascending: false })
          
          if (paymentsData) setPayouts(paymentsData)
        }

      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentOrgId])

  const handleImageUpload = (field: 'logo_url' | 'banner_url') => async (event: any) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) return
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentOrgId || 'new'}-${field}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(filePath)
      
      setProfile(prev => ({ ...prev, [field]: publicUrl }))
      alert('Imagen subida correctamente. No olvides "Guardar Cambios".')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const updatePayload = {
            name: profile.name,
            website_url: profile.website_url,
            instagram_handle: profile.instagram_handle,
            description: profile.description,
            primary_color: profile.primary_color,
            logo_url: profile.logo_url,
            banner_url: profile.banner_url,
            bank_name: financialData.bank_name,
            account_type: financialData.account_type,
            account_number: financialData.account_number,
            bank_rut: financialData.bank_rut,
            bank_holder_name: financialData.bank_holder_name,
            bank_email: financialData.bank_email,
            billing_name: financialData.billing_name,
            billing_rut: financialData.billing_rut,
            billing_address: financialData.billing_address,
            billing_city: financialData.billing_city,
            billing_email: financialData.billing_email
        }

        if (currentOrgId) {
            const { error } = await supabase
                .from('experiences')
                .update(updatePayload)
                .eq('id', currentOrgId)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from('experiences')
                .insert({ ...updatePayload, producer_id: user.id })
            
            if (error) throw error
            await refreshOrgs()
        }

        alert(isCreating ? 'Productora creada correctamente ✅' : 'Configuración guardada correctamente ✅')
    } catch (error: any) {
        alert('Error al guardar: ' + error.message)
    } finally {
        setSaving(false)
    }
  }

  const handleDelete = async () => {
      if (!currentOrgId) return
      
      const confirmText = prompt(`Para eliminar, escribe el nombre de la productora: "${profile.name}"`)
      if (confirmText !== profile.name) {
          return alert("El nombre no coincide. Operación cancelada.")
      }

      try {
          setDeleting(true)
          await deleteOrg(currentOrgId)
          alert("Productora eliminada correctamente.")
      } catch (error: any) {
          alert("Error al eliminar: " + error.message)
          setDeleting(false)
      }
  }

  const handleRutChange = (key: 'bank_rut' | 'billing_rut', value: string) => {
    const rawValue = value.replace(/[^0-9kK]/g, '')
    if (rawValue.length > 9) return 
    const formatted = formatRut(value)
    setFinancialData(prev => ({ ...prev, [key]: formatted }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full pt-40">
        <Loader2 className="animate-spin text-[#8A2BE2]" size={40} />
    </div>
  )

  return (
    // CONTENEDOR LIMPIO (Sin fondo, ya está en el Layout)
    <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-in fade-in pt-0">
        
        {/* --- HEADER MODIFICADO (Sin "Configuration" y menos padding) --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-1">
                    Configuración <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]">Global</span>
                </h1>
                <p className="text-white/40 text-sm font-medium mt-2 max-w-lg">
                    {isCreating ? 'Configura tu nueva productora para comenzar.' : `Administra el perfil, datos y facturación de ${profile.name || 'la productora'}.`}
                </p>
            </div>
            
            {(isEditable || isCreating) && (
                <button 
                    onClick={handleSave}
                    disabled={loading || saving}
                    className="h-12 px-8 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] uppercase text-xs tracking-wider disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} 
                    {isCreating ? 'Crear' : 'Guardar Cambios'}
                </button>
            )}
        </div>

        {/* --- CONTENIDO PRINCIPAL (GRID) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* SIDEBAR DE NAVEGACIÓN */}
            <div className="lg:col-span-3 space-y-2">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4 px-2">Secciones</h3>
                <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<Building2 size={16} />} label="Perfil Productora" />
                <NavButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<CreditCard size={16} />} label="Datos & Facturación" />
                <NavButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<History size={16} />} label="Historial de Pagos" />
            </div>

            {/* ÁREA DE FORMULARIOS */}
            <div className="lg:col-span-9 space-y-8">
                
                {/* SECCIÓN PERFIL */}
                {activeTab === 'profile' && (
                    <section className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Preview Card ACHICADA (h-40 banner, h-24 logo, pb-6 padding, rounded-2rem) */}
                        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl shadow-purple-900/10 overflow-hidden pb-6"> 
                            
                            {/* Banner MÁS CHICO (h-40) */}
                            <div className="h-40 w-full bg-black/40 border-b border-white/5 relative overflow-hidden group">
                                {profile.banner_url ? (
                                    <img src={profile.banner_url} alt="Banner" className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
                                        <ImageIcon size={48} className="text-white/20" />
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-[#030005] via-transparent to-transparent pointer-events-none" />

                                {(isEditable || isCreating) && (
                                    <>
                                        <label 
                                            htmlFor="banner-upload" 
                                            className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-lg cursor-pointer flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 hover:border-white/30"
                                        >
                                            <Camera size={12} /> Cambiar
                                        </label>
                                        <input type="file" accept="image/*" id="banner-upload" className="hidden" onChange={handleImageUpload('banner_url')} disabled={uploading} />
                                    </>
                                )}
                            </div>

                            {/* Logo & Info MÁS CHICOS (h-24 w-24, -mt-12) */}
                            <div className="px-8 relative -mt-12 flex flex-col items-center text-center">
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-2xl bg-[#030005] border-[3px] border-[#030005] flex items-center justify-center overflow-hidden shadow-2xl relative">
                                        {profile.logo_url ? (
                                            <img src={profile.logo_url} alt="Logo" className="h-full w-full object-cover" />
                                        ) : (
                                            <Building2 size={24} className="text-white/20" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                                                <Loader2 size={20} className="text-[#8A2BE2] animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {(isEditable || isCreating) && (
                                        <>
                                            <label htmlFor="logo-upload" 
                                                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl cursor-pointer shadow-lg transition-all active:scale-90 border-2 border-[#030005] z-20 hover:scale-110"
                                                style={{ backgroundColor: profile.primary_color || '#8B5CF6' }}
                                            >
                                                <Camera size={12} className="text-white" />
                                            </label>
                                            <input type="file" accept="image/*" id="logo-upload" className="hidden" onChange={handleImageUpload('logo_url')} disabled={uploading} />
                                        </>
                                    )}
                                </div>

                                <div className="mt-4 space-y-1 max-w-lg">
                                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                                        {profile.name || "Tu Productora"}
                                    </h2>
                                    {profile.description && (
                                        <p className="text-xs font-medium text-white/40 leading-relaxed line-clamp-2">
                                            {profile.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    {profile.instagram_handle && (
                                        <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="h-8 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center gap-1.5 text-[10px] font-bold text-white transition-all">
                                            <Instagram size={12} className="text-[#E1306C]" /> Instagram
                                        </a>
                                    )}
                                    {profile.website_url && (
                                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="h-8 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center gap-1.5 text-[10px] font-bold text-white transition-all">
                                            <Globe size={12} className="text-[#3b82f6]" /> Web
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Formularios */}
                        <div className="grid grid-cols-1 gap-6">
                            
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-xl">
                                <h3 className="text-xs font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest mb-4">
                                    <LayoutTemplate size={14} className="text-[#8A2BE2]"/> Identidad de Marca
                                </h3>
                                <InputGroup 
                                    label="Nombre Fantasía" 
                                    icon={<Building2 size={14} />} 
                                    placeholder="Ej: DyzGO Producciones" 
                                    value={profile.name} 
                                    onChange={(e: any) => setProfile({...profile, name: e.target.value})} 
                                    disabled={!isEditable && !isCreating} 
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Descripción Pública</label>
                                    <textarea 
                                        value={profile.description} 
                                        onChange={(e) => setProfile({...profile, description: e.target.value})} 
                                        disabled={!isEditable && !isCreating} 
                                        placeholder="Breve reseña sobre la productora..." 
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2]/50 focus:bg-black/60 h-28 resize-none disabled:opacity-50 transition-all placeholder:text-white/20" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-xl">
                                    <h3 className="text-xs font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest mb-4">
                                        <Globe size={14} className="text-[#06b6d4]"/> Digital
                                    </h3>
                                    <InputGroup 
                                        label="Sitio Web" 
                                        icon={<Globe size={14} />} 
                                        placeholder="https://tuweb.cl" 
                                        value={profile.website_url} 
                                        onChange={(e: any) => setProfile({...profile, website_url: e.target.value})} 
                                        disabled={!isEditable && !isCreating} 
                                    />
                                    <InputGroup 
                                        label="Instagram" 
                                        icon={<Instagram size={14} />} 
                                        placeholder="@tu_productora" 
                                        value={profile.instagram_handle} 
                                        onChange={(e: any) => setProfile({...profile, instagram_handle: e.target.value})} 
                                        disabled={!isEditable && !isCreating} 
                                    />
                                </div>

                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-xl">
                                    <h3 className="text-xs font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest mb-4">
                                        <Palette size={14} className="text-[#FF007F]"/> Estilo
                                    </h3>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Color Principal</label>
                                        <div className="flex gap-3 items-center bg-black/40 border border-white/10 p-2 rounded-2xl">
                                            <div className="h-10 w-10 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10" style={{ backgroundColor: profile.primary_color }} />
                                            <div className="flex-1 relative">
                                                <input 
                                                    type="color" 
                                                    value={profile.primary_color} 
                                                    onChange={(e) => setProfile({...profile, primary_color: e.target.value})} 
                                                    disabled={!isEditable && !isCreating} 
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                                                />
                                                <input 
                                                    type="text" 
                                                    value={profile.primary_color} 
                                                    onChange={(e) => setProfile({...profile, primary_color: e.target.value})} 
                                                    disabled={!isEditable && !isCreating} 
                                                    className="w-full bg-transparent text-sm font-mono text-white focus:outline-none uppercase" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* SECCIÓN DATOS */}
                {activeTab === 'data' && (
                    <section className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-xl">
                            <h3 className="text-xs font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest mb-2">
                                <CreditCard size={14} className="text-[#00D15B]" /> Datos Bancarios
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <CustomSelect label="Banco" options={BANKS_CHILE} placeholder="Seleccionar Banco" value={financialData.bank_name} onChange={(val: string) => setFinancialData({...financialData, bank_name: val})} disabled={!isEditable && !isCreating} />
                                <CustomSelect label="Tipo de Cuenta" options={ACCOUNT_TYPES} placeholder="Seleccionar Tipo" value={financialData.account_type} onChange={(val: string) => setFinancialData({...financialData, account_type: val})} disabled={!isEditable && !isCreating} />
                            </div>
                            <InputGroup label="Número de Cuenta" placeholder="Ej: 12345678" value={financialData.account_number} onChange={(e: any) => setFinancialData({...financialData, account_number: e.target.value.replace(/\D/g, '').slice(0, 20)})} disabled={!isEditable && !isCreating} />
                            <div className="grid grid-cols-2 gap-6">
                                <InputGroup label="RUT Titular" placeholder="12.345.678-9" value={financialData.bank_rut} onChange={(e: any) => handleRutChange('bank_rut', e.target.value)} disabled={!isEditable && !isCreating} />
                                <InputGroup label="Nombre Titular" placeholder="Razón Social o Nombre" value={financialData.bank_holder_name} onChange={(e: any) => setFinancialData({...financialData, bank_holder_name: e.target.value})} disabled={!isEditable && !isCreating} />
                            </div>
                            <InputGroup label="Email Comprobantes" placeholder="finanzas@productora.cl" value={financialData.bank_email} onChange={(e: any) => setFinancialData({...financialData, bank_email: e.target.value})} disabled={!isEditable && !isCreating} />
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-xl">
                            <h3 className="text-xs font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest mb-2">
                                <FileText size={14} className="text-[#3b82f6]" /> Datos de Facturación
                            </h3>
                            <InputGroup label="Razón Social" placeholder="Nombre de la empresa" value={financialData.billing_name} onChange={(e: any) => setFinancialData({...financialData, billing_name: e.target.value})} disabled={!isEditable && !isCreating} />
                            <div className="grid grid-cols-2 gap-6">
                                <CustomSelect label="Región" options={Object.keys(REGIONES_CHILE)} placeholder="Seleccionar Región" value={billingRegionFilter} onChange={(val: string) => { setBillingRegionFilter(val); setFinancialData({...financialData, billing_city: ''}) }} disabled={!isEditable && !isCreating} />
                                <CustomSelect label="Comuna" options={billingRegionFilter ? REGIONES_CHILE[billingRegionFilter] : []} placeholder={billingRegionFilter ? "Seleccionar Comuna" : "Seleccione Región"} value={financialData.billing_city} disabled={(!billingRegionFilter || (!isEditable && !isCreating))} onChange={(val: string) => setFinancialData({...financialData, billing_city: val})} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <InputGroup label="RUT Empresa" placeholder="76.xxx.xxx-x" value={financialData.billing_rut} onChange={(e: any) => handleRutChange('billing_rut', e.target.value)} disabled={!isEditable && !isCreating} />
                                <InputGroup label="Email Facturación" placeholder="dte@empresa.cl" value={financialData.billing_email} onChange={(e: any) => setFinancialData({...financialData, billing_email: e.target.value})} disabled={!isEditable && !isCreating} />
                            </div>
                            <InputGroup label="Dirección Tributaria" placeholder="Av. Providencia 1234" value={financialData.billing_address} onChange={(e: any) => setFinancialData({...financialData, billing_address: e.target.value})} disabled={!isEditable && !isCreating} />
                        </div>
                    </section>
                )}

                {/* SECCIÓN PAGOS */}
                {activeTab === 'payments' && (
                    <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 min-h-[400px]">
                            <h3 className="text-xs font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest mb-6">
                                <History size={14} className="text-[#8A2BE2]" /> Historial de Pagos
                            </h3>
                            <div className="space-y-3">
                                {payouts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 text-white/30">
                                        <AlertCircle size={40} className="mb-4 opacity-50 text-[#8A2BE2]" />
                                        <p className="text-sm font-medium">Aún no hay pagos registrados.</p>
                                    </div>
                                ) : (
                                    payouts.map((payment) => (
                                        <div key={payment.id} className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-3 rounded-xl border border-white/5 ${payment.status === 'completed' ? 'bg-[#00D15B]/10 text-[#00D15B]' : 'bg-[#eab308]/10 text-[#eab308]'}`}>
                                                    {payment.status === 'completed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold group-hover:text-[#FF007F] transition-colors">{payment.concept || `Pago #${payment.id.slice(0,6)}`}</h4>
                                                    <p className="text-xs text-white/40 font-medium">{new Date(payment.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-bold font-mono text-lg">${Number(payment.amount).toLocaleString('es-CL')}</p>
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${payment.status === 'completed' ? 'bg-[#00D15B]/10 text-[#00D15B]' : 'bg-[#eab308]/10 text-[#eab308]'}`}>
                                                    {payment.status === 'completed' ? 'Pagado' : 'Pendiente'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>

        {/* ZONA PELIGROSA */}
        {isOwner && !isCreating && (
            <div className="mt-16 pt-8 border-t border-white/5">
                <div className="bg-[#FF007F]/5 border border-[#FF007F]/20 rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md">
                    <div>
                        <h4 className="text-[#FF007F] font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-widest">
                            <AlertTriangle size={16} /> Zona de Peligro
                        </h4>
                        <p className="text-xs text-[#FF007F]/60 max-w-md font-medium">
                            Esta acción es irreversible. Se eliminará permanentemente la productora y todos sus eventos asociados.
                        </p>
                    </div>
                    <button 
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-6 py-3 bg-[#FF007F]/10 hover:bg-[#FF007F]/20 text-[#FF007F] text-xs font-bold rounded-xl border border-[#FF007F]/30 transition-all flex items-center gap-2 whitespace-nowrap uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,127,0.1)]"
                    >
                        {deleting ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />}
                        Eliminar Productora
                    </button>
                </div>
            </div>
        )}

    </div>
  )
}

// --- SUB-COMPONENTES ESTILIZADOS ---

function NavButton({ active, onClick, icon, label }: any) {
    return (
        <button 
            onClick={onClick} 
            className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all font-bold flex items-center gap-3 text-xs uppercase tracking-wider ${
                active 
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
        >
            {icon} {label}
        </button>
    )
}

function InputGroup({ label, icon, placeholder, value, onChange, disabled }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                {icon} {label}
            </label>
            <input 
                type="text" 
                placeholder={placeholder} 
                value={value || ''} 
                onChange={onChange} 
                disabled={disabled} 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#8A2BE2]/50 focus:bg-black/60 transition-all placeholder:text-white/20 disabled:opacity-50" 
            />
        </div>
    )
}

function CustomSelect({ label, options, placeholder, value, onChange, disabled }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        if (!disabled) {
            onChange(option);
            setIsOpen(false);
        }
    };

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1 flex items-center gap-2">{label}</label>
            <div 
                className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white flex items-center justify-between cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/60 hover:border-white/20'} ${isOpen ? 'border-[#8A2BE2]/50' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={!value ? 'text-white/20' : ''}>
                    {value || placeholder}
                </span>
                <ChevronDown size={16} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-2 bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 p-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                    {options.length > 0 ? (
                        <ul className="py-1">
                            {options.map((opt: string) => (
                                <li 
                                    key={opt}
                                    className={`px-4 py-2.5 text-xs font-medium cursor-pointer transition-all rounded-xl flex items-center justify-between ${value === opt ? 'bg-[#8A2BE2]/10 text-[#8A2BE2]' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt}
                                    {value === opt && <Check size={14} />}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-xs text-white/40 text-center">No hay opciones disponibles</div>
                    )}
                </div>
            )}
        </div>
    );
}