'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
// Importamos el cliente ya inicializado desde tu librería
import { supabase } from '@/lib/supabase'
import { Sparkles, ArrowRight, Loader2, Building2, Globe, Instagram, Palette, Upload, Image as ImageIcon, Camera } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Referencias para los inputs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Estados de Texto
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [color, setColor] = useState('#8B5CF6')

  // Estados de Imágenes
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)

    if (type === 'logo') {
        setLogoFile(file)
        setLogoPreview(previewUrl)
    } else {
        setBannerFile(file)
        setBannerPreview(previewUrl)
    }
  }

  // --- FUNCIÓN DE CREACIÓN ---
  const handleCreateExperience = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return alert("El nombre de la productora es obligatorio.")
    if (!description.trim()) return alert("La descripción es obligatoria.")
    if (!logoFile) return alert("Debes subir un Logo para tu productora.")

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay usuario autenticado")

      let finalLogoUrl = null
      let finalBannerUrl = null

      // 1. Subir Logo
      const logoExt = logoFile.name.split('.').pop()
      const logoPath = `${user.id}/${Date.now()}_logo.${logoExt}`
      
      // Asegúrate de que el bucket 'logos' exista en Supabase Storage y sea público
      const { error: logoError } = await supabase.storage.from('logos').upload(logoPath, logoFile)
      if (logoError) throw logoError
      
      const { data: logoUrlData } = supabase.storage.from('logos').getPublicUrl(logoPath)
      finalLogoUrl = logoUrlData.publicUrl

      // 2. Subir Banner (Opcional)
      if (bannerFile) {
          const bannerExt = bannerFile.name.split('.').pop()
          const bannerPath = `${user.id}/${Date.now()}_banner.${bannerExt}`
          
          // Asegúrate de que el bucket 'flyers' (o 'banners') exista
          const { error: bannerError } = await supabase.storage.from('flyers').upload(bannerPath, bannerFile)
          if (!bannerError) {
              const { data: bannerUrlData } = supabase.storage.from('flyers').getPublicUrl(bannerPath)
              finalBannerUrl = bannerUrlData.publicUrl
          }
      }

      // 3. Insertar Experience
      const { error: expError } = await supabase
        .from('experiences')
        .insert([{
          name: name,
          description: description,
          website_url: website || null,
          instagram_handle: instagram || null,
          primary_color: color,
          producer_id: user.id,
          logo_url: finalLogoUrl,
          banner_url: finalBannerUrl
        }])

      if (expError) throw expError

      // 4. Redirección y Refresco
      router.refresh()
      // Forzamos recarga completa para que el OrgProvider detecte la nueva productora
      window.location.href = '/'

    } catch (error: unknown) {
      // Manejo de error tipado para evitar 'no-explicit-any'
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error(error)
      alert("Error: " + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#030005] font-sans text-white relative overflow-hidden selection:bg-[#FF007F]/30 p-6">
      
      {/* FONDO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#030005]" />
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#8A2BE2]/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#FF007F]/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 bg-white/10 rounded-2xl items-center justify-center mb-4 border border-white/10 shadow-lg shadow-purple-500/20">
                <Sparkles size={24} className="text-[#FF007F]" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Tu Productora</h1>
            <p className="text-white/40 text-sm font-medium">Configura la identidad pública de tu organización.</p>
        </div>

        <form onSubmit={handleCreateExperience} className="space-y-6">
            
            {/* SECCIÓN VISUAL HEADER */}
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-visible relative group shadow-2xl mb-8 flex flex-col items-center">
                
                {/* BANNER */}
                <div 
                    className="h-32 w-full bg-black/40 relative cursor-pointer hover:bg-white/5 transition-all group/banner rounded-t-[2rem] overflow-hidden"
                    onClick={() => bannerInputRef.current?.click()}
                >
                    {bannerPreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={bannerPreview} className="w-full h-full object-cover opacity-80" alt="Banner Preview" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/30 gap-2 group-hover/banner:text-white transition-colors">
                            <ImageIcon size={24} /> 
                            <span className="text-xs font-bold uppercase tracking-widest">Subir Banner (Opcional)</span>
                        </div>
                    )}
                    <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" accept="image/*" />
                </div>

                {/* LOGO */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
                    <div 
                        className={`h-24 w-24 rounded-3xl bg-[#1a1a1a] border-4 border-[#030005] shadow-2xl flex items-center justify-center cursor-pointer hover:border-[#8A2BE2] transition-all relative group/logo ${!logoPreview ? 'animate-pulse' : ''}`}
                        onClick={() => logoInputRef.current?.click()}
                    >
                        {logoPreview ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={logoPreview} className="w-full h-full object-cover rounded-[1.3rem]" alt="Logo Preview" />
                        ) : (
                            <div className="text-white/40 flex flex-col items-center gap-1 group-hover/logo:text-white transition-colors">
                                <Upload size={20} />
                                <span className="text-[8px] font-black uppercase text-[#8A2BE2]">Logo</span>
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-[#8A2BE2] p-1.5 rounded-full border-4 border-[#030005] shadow-sm">
                           <Camera size={14} className="text-white" />
                        </div>
                        <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} className="hidden" accept="image/*" />
                    </div>
                </div>

                {/* NOMBRE */}
                <div className="mt-14 mb-6 text-center px-6">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight line-clamp-1">
                        {name || 'TU PRODUCTORA'}
                    </h3>
                </div>
            </div>

            {/* SECCIÓN DATOS */}
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8">
                <h3 className="text-xs font-black text-[#8A2BE2] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Building2 size={14}/> Identidad (Obligatorio)
                </h3>
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Nombre Fantasía <span className="text-[#FF007F]">*</span></label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: DyzGO Producciones"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white placeholder:text-white/10 focus:outline-none focus:border-[#FF007F]/50 transition-all font-bold"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Descripción <span className="text-[#FF007F]">*</span></label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve reseña sobre la productora..."
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:border-[#FF007F]/50 transition-all font-medium resize-none"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* SECCIONES DIGITAL Y ESTILO */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8">
                    <h3 className="text-xs font-black text-[#3b82f6] uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Globe size={14}/> Digital (Opcional)
                    </h3>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Sitio Web</label>
                            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://tuweb.cl" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-[#3b82f6]/50 transition-all"/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Instagram (@)</label>
                            <div className="relative">
                                <Instagram size={16} className="absolute left-4 top-3.5 text-white/20" />
                                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="tu_productora" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-[#3b82f6]/50 transition-all"/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8">
                    <h3 className="text-xs font-black text-[#FF007F] uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Palette size={14}/> Estilo (Opcional)
                    </h3>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Color Principal</label>
                        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-2 pr-4">
                            <div className="h-10 w-10 rounded-lg shadow-inner transition-colors duration-300 cursor-pointer border border-white/10 hover:scale-105 relative overflow-hidden" style={{ backgroundColor: color }} onClick={() => colorInputRef.current?.click()}>
                                <input type="color" ref={colorInputRef} value={color} onChange={(e) => setColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"/>
                            </div>
                            <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#8B5CF6" className="flex-1 bg-transparent border-none text-white font-mono font-bold focus:outline-none uppercase" maxLength={7}/>
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-white relative group overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-2xl shadow-purple-900/40">
                <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="relative flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Crear y Comenzar <ArrowRight size={20} /></>}
                </div>
            </button>

        </form>
      </div>
    </div>
  )
}